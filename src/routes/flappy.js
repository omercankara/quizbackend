const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { FlappyUser, FlappyScore, FlappyQuest, FlappySeason, FlappyFriend, FlappyNotification, FlappyWeeklyChallenge } = require('../models/flappy');

const BIRDS = [
  { key: 'default', name: 'Klasik Kuş', price: 0, colors: { body: '#F7DC14', beak: '#E67E22', wing: '#E6B800' } },
  { key: 'red', name: 'Kızgın Kuş', price: 200, colors: { body: '#FF5252', beak: '#D32F2F', wing: '#C62828' } },
  { key: 'blue', name: 'Buz Kuşu', price: 200, colors: { body: '#42A5F5', beak: '#1565C0', wing: '#0D47A1' } },
  { key: 'green', name: 'Doğa Kuşu', price: 300, colors: { body: '#66BB6A', beak: '#2E7D32', wing: '#1B5E20' } },
  { key: 'purple', name: 'Mistik Kuş', price: 400, colors: { body: '#AB47BC', beak: '#7B1FA2', wing: '#4A148C' } },
  { key: 'gold', name: 'Altın Kuş', price: 800, colors: { body: '#FFD700', beak: '#FF8F00', wing: '#F57F17' } },
  { key: 'rainbow', name: 'Gökkuşağı', price: 1500, colors: { body: '#FF6D00', beak: '#D500F9', wing: '#00E5FF' } },
  { key: 'ghost', name: 'Hayalet Kuş', price: 1000, colors: { body: 'rgba(255,255,255,0.7)', beak: '#B0BEC5', wing: '#78909C' } },
];

const THEMES = [
  { key: 'day', name: 'Gündüz', price: 0, sky: '#4EC0CA', ground: '#DEB887' },
  { key: 'night', name: 'Gece', price: 300, sky: '#1A237E', ground: '#3E2723' },
  { key: 'sunset', name: 'Gün Batımı', price: 300, sky: '#FF6F00', ground: '#5D4037' },
  { key: 'winter', name: 'Kış', price: 500, sky: '#B3E5FC', ground: '#ECEFF1' },
  { key: 'autumn', name: 'Sonbahar', price: 500, sky: '#FF8A65', ground: '#8D6E63' },
  { key: 'space', name: 'Uzay', price: 1000, sky: '#0D0D2B', ground: '#37474F' },
];

const POWERUPS = [
  { key: 'shield', name: 'Kalkan', desc: '1 boruya çarpmayı affet', price: 100, field: 'shieldCount' },
  { key: 'slow', name: 'Yavaşlatma', desc: 'Borular yavaşlar', price: 80, field: 'slowCount' },
  { key: 'magnet', name: 'Manyetik', desc: 'Boşluğa çekilirsin', price: 120, field: 'magnetCount' },
  { key: 'double', name: 'Çift Skor', desc: '2x puan', price: 100, field: 'doubleCount' },
];

const DAILY_QUEST_POOL = [
  { key: 'play_3', desc: '3 oyun oyna', target: 3, reward: 30, type: 'games' },
  { key: 'play_5', desc: '5 oyun oyna', target: 5, reward: 60, type: 'games' },
  { key: 'play_10', desc: '10 oyun oyna', target: 10, reward: 120, type: 'games' },
  { key: 'score_10', desc: '10 boru geç', target: 10, reward: 40, type: 'score' },
  { key: 'score_25', desc: '25 boru geç', target: 25, reward: 80, type: 'score' },
  { key: 'score_50', desc: '50 boru geç', target: 50, reward: 150, type: 'score' },
  { key: 'win_1', desc: '1 maç kazan', target: 1, reward: 50, type: 'wins' },
  { key: 'win_3', desc: '3 maç kazan', target: 3, reward: 120, type: 'wins' },
];

const DAILY_REWARDS = [20, 30, 40, 60, 80, 100, 200];

async function getOrCreateFlappyUser(userId, username) {
  let user = await FlappyUser.findByPk(userId);
  if (!user) {
    user = await FlappyUser.create({ userId, username });
  } else if (username && user.username !== username) {
    user.username = username;
    await user.save();
  }
  return user;
}

// ── PROFIL ──
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await FlappyUser.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/profile/init', async (req, res) => {
  try {
    const { userId, username } = req.body;
    if (!userId || !username) return res.status(400).json({ error: 'userId ve username gerekli' });
    const user = await getOrCreateFlappyUser(userId, username);
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── MAĞAZA ──
router.get('/shop', (_req, res) => {
  res.json({ birds: BIRDS, themes: THEMES, powerups: POWERUPS });
});

router.post('/shop/buy', async (req, res) => {
  try {
    const { userId, itemType, itemKey } = req.body;
    const user = await FlappyUser.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    if (itemType === 'bird') {
      const bird = BIRDS.find((b) => b.key === itemKey);
      if (!bird) return res.status(400).json({ error: 'Kuş bulunamadı' });
      const owned = user.ownedBirds || [];
      if (owned.includes(itemKey)) return res.status(400).json({ error: 'Zaten sahipsin' });
      if (user.coins < bird.price) return res.status(400).json({ error: 'Yeterli coin yok' });
      user.coins -= bird.price;
      user.ownedBirds = [...owned, itemKey];
      await user.save();
    } else if (itemType === 'theme') {
      const theme = THEMES.find((t) => t.key === itemKey);
      if (!theme) return res.status(400).json({ error: 'Tema bulunamadı' });
      const owned = user.ownedThemes || [];
      if (owned.includes(itemKey)) return res.status(400).json({ error: 'Zaten sahipsin' });
      if (user.coins < theme.price) return res.status(400).json({ error: 'Yeterli coin yok' });
      user.coins -= theme.price;
      user.ownedThemes = [...owned, itemKey];
      await user.save();
    } else if (itemType === 'powerup') {
      const pu = POWERUPS.find((p) => p.key === itemKey);
      if (!pu) return res.status(400).json({ error: 'Power-up bulunamadı' });
      if (user.coins < pu.price) return res.status(400).json({ error: 'Yeterli coin yok' });
      user.coins -= pu.price;
      user[pu.field] = (user[pu.field] || 0) + 1;
      await user.save();
    } else {
      return res.status(400).json({ error: 'Geçersiz item tipi' });
    }

    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/shop/equip', async (req, res) => {
  try {
    const { userId, itemType, itemKey } = req.body;
    const user = await FlappyUser.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    if (itemType === 'bird') {
      if (!(user.ownedBirds || []).includes(itemKey)) return res.status(400).json({ error: 'Bu kuşa sahip değilsin' });
      user.activeBird = itemKey;
    } else if (itemType === 'theme') {
      if (!(user.ownedThemes || []).includes(itemKey)) return res.status(400).json({ error: 'Bu temaya sahip değilsin' });
      user.activeTheme = itemKey;
    } else {
      return res.status(400).json({ error: 'Geçersiz item tipi' });
    }
    await user.save();
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── LİDERLİK TABLOSU ──
router.get('/leaderboard/:period', async (req, res) => {
  try {
    const { period } = req.params;
    let where = {};
    const now = new Date();

    if (period === 'daily') {
      const today = now.toISOString().slice(0, 10);
      where.createdAt = { [Op.gte]: new Date(today) };
    } else if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      where.createdAt = { [Op.gte]: weekAgo };
    }

    if (period === 'alltime') {
      const users = await FlappyUser.findAll({
        order: [['bestScore', 'DESC']],
        limit: 50,
        attributes: ['userId', 'username', 'bestScore', 'totalGames', 'wins'],
      });
      return res.json({ leaderboard: users });
    }

    const scores = await FlappyScore.findAll({
      where,
      attributes: ['userId', 'username', 'score'],
      order: [['score', 'DESC']],
      limit: 50,
    });
    res.json({ leaderboard: scores });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GÜNLÜK GÖREVLER ──
router.get('/quests/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().slice(0, 10);
    let quests = await FlappyQuest.findAll({ where: { userId, questDate: today } });

    if (quests.length === 0) {
      const shuffled = [...DAILY_QUEST_POOL].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 3);
      quests = await Promise.all(
        selected.map((q) =>
          FlappyQuest.create({
            userId,
            questKey: q.key,
            target: q.target,
            reward: q.reward,
            rewardType: 'coin',
            questDate: today,
          })
        )
      );
    }

    const questDefs = {};
    DAILY_QUEST_POOL.forEach((q) => { questDefs[q.key] = q; });
    const result = quests.map((q) => ({
      ...q.toJSON(),
      desc: questDefs[q.questKey]?.desc || q.questKey,
      type: questDefs[q.questKey]?.type || 'games',
    }));

    res.json({ quests: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/quests/claim', async (req, res) => {
  try {
    const { userId, questId } = req.body;
    const quest = await FlappyQuest.findByPk(questId);
    if (!quest || quest.userId !== userId) return res.status(404).json({ error: 'Görev bulunamadı' });
    if (!quest.completed) return res.status(400).json({ error: 'Görev tamamlanmadı' });
    if (quest.claimed) return res.status(400).json({ error: 'Ödül zaten alındı' });

    quest.claimed = true;
    await quest.save();

    const user = await FlappyUser.findByPk(userId);
    if (user) {
      user.coins += quest.reward;
      await user.save();
    }

    res.json({ success: true, reward: quest.reward, coins: user?.coins || 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GÜNLÜK ÖDÜL ──
router.post('/daily-reward', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await FlappyUser.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    const today = new Date().toISOString().slice(0, 10);
    if (user.lastDailyClaim === today) {
      return res.status(400).json({ error: 'Bugünkü ödül zaten alındı', streak: user.dailyStreak });
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (user.lastDailyClaim === yesterday) {
      user.dailyStreak = Math.min(user.dailyStreak + 1, 7);
    } else {
      user.dailyStreak = 1;
    }

    const reward = DAILY_REWARDS[user.dailyStreak - 1] || 20;
    user.coins += reward;
    user.lastDailyClaim = today;
    await user.save();

    res.json({ success: true, reward, streak: user.dailyStreak, coins: user.coins });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SEZON ──
router.get('/season', async (_req, res) => {
  try {
    let season = await FlappySeason.findOne({ where: { active: true } });
    if (!season) {
      const now = new Date();
      const end = new Date(now.getTime() + 14 * 86400000);
      season = await FlappySeason.create({
        name: 'Sezon 1',
        startDate: now.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        active: true,
      });
    }
    res.json({ season });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/season/leaderboard', async (req, res) => {
  try {
    const users = await FlappyUser.findAll({
      order: [['seasonXp', 'DESC']],
      limit: 50,
      attributes: ['userId', 'username', 'seasonXp', 'bestScore'],
    });
    res.json({ leaderboard: users });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ARKADAŞLAR ──
router.get('/friends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const friends = await FlappyFriend.findAll({
      where: {
        [Op.or]: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' },
        ],
      },
    });
    const friendIds = friends.map((f) => (f.userId === userId ? f.friendId : f.userId));
    const friendUsers = friendIds.length > 0 ? await FlappyUser.findAll({ where: { userId: friendIds } }) : [];
    res.json({ friends: friendUsers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/friends/add', async (req, res) => {
  try {
    const { userId, friendUsername } = req.body;
    const friend = await FlappyUser.findOne({ where: { username: friendUsername } });
    if (!friend) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    if (friend.userId === userId) return res.status(400).json({ error: 'Kendini ekleyemezsin' });

    const existing = await FlappyFriend.findOne({
      where: {
        [Op.or]: [
          { userId, friendId: friend.userId },
          { userId: friend.userId, friendId: userId },
        ],
      },
    });
    if (existing) return res.status(400).json({ error: 'Zaten arkadaşsınız veya istek gönderilmiş' });

    await FlappyFriend.create({ userId, friendId: friend.userId, status: 'accepted' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── BAŞARIMLAR ──
const ACHIEVEMENTS = [
  { key: 'first_game', name: 'İlk Adım', desc: 'İlk oyununu oyna', icon: 'game-controller', check: (u) => u.totalGames >= 1, reward: 20 },
  { key: 'score_10', name: '10 Boru', desc: 'Tek oyunda 10 boru geç', icon: 'flag', check: (u) => u.bestScore >= 10, reward: 30 },
  { key: 'score_25', name: '25 Boru', desc: 'Tek oyunda 25 boru geç', icon: 'flag', check: (u) => u.bestScore >= 25, reward: 50 },
  { key: 'score_50', name: '50 Boru', desc: 'Tek oyunda 50 boru geç', icon: 'flag', check: (u) => u.bestScore >= 50, reward: 100 },
  { key: 'score_100', name: 'Yüzlük', desc: 'Tek oyunda 100 boru geç', icon: 'trophy', check: (u) => u.bestScore >= 100, reward: 300 },
  { key: 'win_1', name: 'İlk Zafer', desc: 'İlk maçını kazan', icon: 'ribbon', check: (u) => u.wins >= 1, reward: 30 },
  { key: 'win_5', name: '5 Galibiyet', desc: '5 maç kazan', icon: 'ribbon', check: (u) => u.wins >= 5, reward: 80 },
  { key: 'win_10', name: '10 Galibiyet', desc: '10 maç kazan', icon: 'ribbon', check: (u) => u.wins >= 10, reward: 150 },
  { key: 'win_25', name: 'Şampiyon', desc: '25 maç kazan', icon: 'ribbon', check: (u) => u.wins >= 25, reward: 300 },
  { key: 'games_10', name: 'Deneyimli', desc: '10 oyun oyna', icon: 'game-controller', check: (u) => u.totalGames >= 10, reward: 40 },
  { key: 'games_50', name: 'Veteran', desc: '50 oyun oyna', icon: 'game-controller', check: (u) => u.totalGames >= 50, reward: 120 },
  { key: 'games_100', name: 'Efsane', desc: '100 oyun oyna', icon: 'game-controller', check: (u) => u.totalGames >= 100, reward: 250 },
  { key: 'coins_500', name: 'Zengin', desc: '500 coin biriktir', icon: 'logo-bitcoin', check: (u) => u.coins >= 500, reward: 50 },
  { key: 'coins_2000', name: 'Milyoner', desc: '2000 coin biriktir', icon: 'logo-bitcoin', check: (u) => u.coins >= 2000, reward: 100 },
  { key: 'level_5', name: 'Seviye 5', desc: 'Seviye 5\'e ulaş', icon: 'star', check: (u) => u.level >= 5, reward: 60 },
  { key: 'level_10', name: 'Seviye 10', desc: 'Seviye 10\'a ulaş', icon: 'star', check: (u) => u.level >= 10, reward: 150 },
  { key: 'level_20', name: 'Seviye 20', desc: 'Seviye 20\'ye ulaş', icon: 'star', check: (u) => u.level >= 20, reward: 400 },
  { key: 'no_powerup_20', name: 'Doğal Yetenek', desc: 'Power-up kullanmadan 20 boru geç', icon: 'leaf', check: () => false, reward: 100 },
];

function xpForLevel(level) {
  return Math.floor(50 + level * level * 3 + level * 15);
}

function addXp(user, amount) {
  user.xp += amount;
  let leveledUp = false;
  while (user.xp >= xpForLevel(user.level)) {
    user.xp -= xpForLevel(user.level);
    user.level += 1;
    leveledUp = true;
  }
  return leveledUp;
}

async function checkAchievements(user) {
  const owned = user.achievements || [];
  const newlyUnlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (owned.includes(a.key)) continue;
    if (a.check(user)) {
      owned.push(a.key);
      newlyUnlocked.push(a);
      user.coins += a.reward;
    }
  }
  if (newlyUnlocked.length > 0) {
    user.achievements = owned;
    await user.save();
    for (const a of newlyUnlocked) {
      await FlappyNotification.create({
        userId: user.userId,
        type: 'achievement',
        message: `Başarım açıldı: ${a.name} (+${a.reward} coin)`,
        data: { key: a.key },
      });
    }
  }
  return newlyUnlocked;
}

router.get('/achievements', (_req, res) => {
  res.json({ achievements: ACHIEVEMENTS.map(({ check, ...rest }) => rest) });
});

router.get('/achievements/:userId', async (req, res) => {
  try {
    const user = await FlappyUser.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    const owned = user.achievements || [];
    const list = ACHIEVEMENTS.map(({ check, ...rest }) => ({ ...rest, unlocked: owned.includes(rest.key) }));
    res.json({ achievements: list, level: user.level, xp: user.xp, xpToNext: xpForLevel(user.level) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── BİLDİRİMLER ──
router.get('/notifications/:userId', async (req, res) => {
  try {
    const notifs = await FlappyNotification.findAll({
      where: { userId: req.params.userId },
      order: [['createdAt', 'DESC']],
      limit: 30,
    });
    res.json({ notifications: notifs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/notifications/read', async (req, res) => {
  try {
    await FlappyNotification.update({ read: true }, { where: { userId: req.body.userId, read: false } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── HAFTALIK CHALLENGE ──
router.get('/weekly-challenge', async (_req, res) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now.getTime() - dayOfWeek * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
    const wsStr = weekStart.toISOString().slice(0, 10);
    const weStr = weekEnd.toISOString().slice(0, 10);

    let challenge = await FlappyWeeklyChallenge.findOne({ where: { weekStart: wsStr } });
    if (!challenge) {
      const templates = [
        { name: 'Boru Maratonu', description: 'Topluluk olarak 10.000 boru geçin', targetType: 'total_score', targetValue: 10000, reward: 100 },
        { name: 'Oyun Fırtınası', description: 'Topluluk olarak 500 oyun oynayın', targetType: 'total_games', targetValue: 500, reward: 80 },
        { name: 'Zafer Yolu', description: 'Topluluk olarak 200 galibiyet kazanın', targetType: 'total_wins', targetValue: 200, reward: 120 },
      ];
      const tmpl = templates[Math.floor(Math.random() * templates.length)];
      challenge = await FlappyWeeklyChallenge.create({ ...tmpl, weekStart: wsStr, weekEnd: weStr });
    }
    res.json({ challenge });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PROFİL GÜNCELLEME ──
router.post('/profile/update', async (req, res) => {
  try {
    const { userId, bio } = req.body;
    const user = await FlappyUser.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    if (bio !== undefined) user.username = user.username;
    await user.save();
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
module.exports.getOrCreateFlappyUser = getOrCreateFlappyUser;
module.exports.DAILY_QUEST_POOL = DAILY_QUEST_POOL;
module.exports.BIRDS = BIRDS;
module.exports.THEMES = THEMES;
module.exports.POWERUPS = POWERUPS;
module.exports.DAILY_REWARDS = DAILY_REWARDS;
module.exports.ACHIEVEMENTS = ACHIEVEMENTS;
module.exports.addXp = addXp;
module.exports.checkAchievements = checkAchievements;
module.exports.xpForLevel = xpForLevel;
