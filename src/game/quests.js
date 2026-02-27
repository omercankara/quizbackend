const QuestModel = require('../models/Quest');
const QuestTemplateModel = require('../models/QuestTemplate');
const UserModel = require('../models/User');
const { Op } = require('sequelize');
const { createNotification } = require('./notifications');

const FALLBACK_DAILY = [{ key: 'play_3', title: '3 Maç Oyna', description: 'Üç maç tamamla', target: 3, xpReward: 40, event: 'match' }];
const FALLBACK_WEEKLY = [{ key: 'play_15', title: '15 Maç Oyna', description: 'Bu hafta 15 maç tamamla', target: 15, xpReward: 150, event: 'match' }];

async function getTemplates(questType) {
  try {
    const rows = await QuestTemplateModel.findAll({
      where: { questType, isActive: true },
      order: [['sortOrder', 'ASC'], ['id', 'ASC']],
    });
    return rows.map((r) => ({ key: r.questKey, title: r.title, description: r.description, target: r.target, xpReward: r.xpReward, event: r.event }));
  } catch (e) {
    return questType === 'daily' ? FALLBACK_DAILY : FALLBACK_WEEKLY;
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function getEndOfDay() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function getEndOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function generateDailyQuests(userId) {
  const user = await UserModel.findOne({ where: { oduserId: userId } });
  if (!user) return [];

  const now = new Date();
  const existing = await QuestModel.findAll({
    where: { userId: user.id, questType: 'daily', expiresAt: { [Op.gt]: now } },
  });
  if (existing.length >= 3) return existing;

  const DAILY_TEMPLATES = await getTemplates('daily');
  const templates = shuffle(DAILY_TEMPLATES).slice(0, 3);
  const quests = [];
  for (const t of templates) {
    const q = await QuestModel.create({
      userId: user.id,
      questKey: `daily_${t.key}_${Date.now()}`,
      questType: 'daily',
      title: t.title,
      description: t.description,
      target: t.target,
      xpReward: t.xpReward,
      expiresAt: getEndOfDay(),
    });
    quests.push(q);
  }
  return quests;
}

async function generateWeeklyQuests(userId) {
  const user = await UserModel.findOne({ where: { oduserId: userId } });
  if (!user) return [];

  const now = new Date();
  const existing = await QuestModel.findAll({
    where: { userId: user.id, questType: 'weekly', expiresAt: { [Op.gt]: now } },
  });
  if (existing.length >= 2) return existing;

  const WEEKLY_TEMPLATES = await getTemplates('weekly');
  const templates = shuffle(WEEKLY_TEMPLATES).slice(0, 2);
  const quests = [];
  for (const t of templates) {
    const q = await QuestModel.create({
      userId: user.id,
      questKey: `weekly_${t.key}_${Date.now()}`,
      questType: 'weekly',
      title: t.title,
      description: t.description,
      target: t.target,
      xpReward: t.xpReward,
      expiresAt: getEndOfWeek(),
    });
    quests.push(q);
  }
  return quests;
}

async function checkAndCompleteQuests(userId, eventType, data = {}) {
  const user = await UserModel.findOne({ where: { oduserId: userId } });
  if (!user) return [];

  const now = new Date();
  const activeQuests = await QuestModel.findAll({
    where: { userId: user.id, completed: false, expiresAt: { [Op.gt]: now } },
  });

  const completed = [];

  for (const quest of activeQuests) {
    const tpl = await findTemplate(quest);
    if (!tpl) continue;

    let increment = 0;
    if (tpl.event === 'match' && eventType === 'match') increment = 1;
    if (tpl.event === 'win' && eventType === 'win') increment = 1;
    if (tpl.event === 'correct' && eventType === 'correct') increment = data.count || 0;
    if (tpl.event === 'perfect' && eventType === 'perfect') increment = 1;
    if (tpl.event === 'streak' && eventType === 'streak') {
      quest.progress = Math.max(quest.progress, data.streak || 0);
      if (quest.progress >= quest.target) {
        quest.completed = true;
        completed.push(quest);
      }
      await quest.save();
      continue;
    }

    if (increment > 0) {
      quest.progress += increment;
      if (quest.progress >= quest.target) {
        quest.completed = true;
        completed.push(quest);
      }
      await quest.save();
    }
  }

  for (const cq of completed) {
    createNotification(userId, 'quest_complete', 'Görev Tamamlandı!', `"${cq.title}" görevini tamamladın. ${cq.xpReward} XP ödülünü al!`);
  }

  return completed;
}

async function findTemplate(quest) {
  const keyPart = quest.questKey.replace(/^(daily|weekly)_/, '').replace(/_\d+$/, '');
  try {
    const tpl = await QuestTemplateModel.findOne({ where: { questKey: keyPart } });
    if (tpl) return { event: tpl.event };
  } catch (e) {}
  return { event: 'match' };
}

async function getQuests(userId) {
  const user = await UserModel.findOne({ where: { oduserId: userId } });
  if (!user) return { daily: [], weekly: [] };

  const now = new Date();
  const all = await QuestModel.findAll({
    where: { userId: user.id, expiresAt: { [Op.gt]: now } },
    order: [['questType', 'ASC'], ['createdAt', 'ASC']],
  });

  const daily = all.filter((q) => q.questType === 'daily');
  const weekly = all.filter((q) => q.questType === 'weekly');

  return {
    daily: daily.map(formatQuest),
    weekly: weekly.map(formatQuest),
  };
}

async function claimQuestReward(userId, questId) {
  const user = await UserModel.findOne({ where: { oduserId: userId } });
  if (!user) return null;

  const quest = await QuestModel.findOne({ where: { id: questId, userId: user.id } });
  if (!quest || !quest.completed || quest.claimed) return null;

  quest.claimed = true;
  await quest.save();

  user.xp += quest.xpReward;
  const { calculateXpForLevel } = require('./leaderboard');
  let levelsGained = 0;
  while (user.xp >= calculateXpForLevel(user.level)) {
    user.xp -= calculateXpForLevel(user.level);
    user.level += 1;
    levelsGained++;
  }
  await user.save();

  return { xpReward: quest.xpReward, levelsGained, newLevel: user.level, newXp: user.xp };
}

function formatQuest(q) {
  return {
    id: q.id,
    questKey: q.questKey,
    questType: q.questType,
    title: q.title,
    description: q.description,
    target: q.target,
    progress: Math.min(q.progress, q.target),
    completed: q.completed,
    claimed: q.claimed,
    xpReward: q.xpReward,
    expiresAt: q.expiresAt,
  };
}

module.exports = { generateDailyQuests, generateWeeklyQuests, checkAndCompleteQuests, getQuests, claimQuestReward };
