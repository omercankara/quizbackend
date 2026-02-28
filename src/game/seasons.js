const SeasonModel = require('../models/Season');
const SeasonProgressModel = require('../models/SeasonProgress');
const UserModel = require('../models/User');
const { sequelize } = require('../database/config');
const { createNotification } = require('./notifications');

const XP_PER_TIER = 200;
const MAX_TIER = 30;

const SEASON_REWARDS = [
  { tier: 1, type: 'xp', label: '+100 XP Bonus', value: 100 },
  { tier: 2, type: 'title', label: 'Unvan: Sezon Savaşçısı', value: 'Sezon Savaşçısı' },
  { tier: 3, type: 'xp', label: '+150 XP Bonus', value: 150 },
  { tier: 5, type: 'frame', label: 'Bronz Sezon Çerçevesi', value: 'frame_bronze' },
  { tier: 7, type: 'xp', label: '+200 XP Bonus', value: 200 },
  { tier: 8, type: 'badge', label: 'Sezon Rozeti', value: 'badge_season' },
  { tier: 10, type: 'frame', label: 'Gümüş Sezon Çerçevesi', value: 'frame_silver' },
  { tier: 12, type: 'xp', label: '+300 XP Bonus', value: 300 },
  { tier: 15, type: 'frame', label: 'Altın Sezon Çerçevesi', value: 'frame_gold' },
  { tier: 17, type: 'xp', label: '+400 XP Bonus', value: 400 },
  { tier: 20, type: 'frame', label: 'Elmas Sezon Çerçevesi', value: 'frame_diamond' },
  { tier: 22, type: 'xp', label: '+500 XP Bonus', value: 500 },
  { tier: 25, type: 'title', label: 'Unvan: Sezon Efsanesi', value: 'Sezon Efsanesi' },
  { tier: 27, type: 'xp', label: '+700 XP Bonus', value: 700 },
  { tier: 30, type: 'frame', label: 'Efsanevi Sezon Çerçevesi', value: 'frame_legendary' },
];

async function ensureActiveSeason() {
  let season = await SeasonModel.findOne({ where: { isActive: true } });
  if (!season) {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    season = await SeasonModel.create({
      name: 'Sezon 1 - Bilgi Savaşçıları',
      seasonNumber: 1,
      startDate: now,
      endDate: end,
      isActive: true,
    });
  }
  return season;
}

async function getOrCreateProgress(userId, seasonId) {
  const user = await UserModel.findOne({ where: { oduserId: userId } });
  if (!user) return null;

  const [progress] = await SeasonProgressModel.findOrCreate({
    where: { userId: user.id, seasonId },
    defaults: { seasonXp: 0, tier: 1, claimedRewards: [] },
  });
  return progress;
}

async function addSeasonXp(oduserId, amount) {
  const season = await ensureActiveSeason();
  const user = await UserModel.findOne({ where: { oduserId } });
  if (!user || !season) return null;

  const progress = await getOrCreateProgress(oduserId, season.id);
  if (!progress) return null;

  progress.seasonXp += amount;

  let tierBefore = progress.tier;
  while (progress.tier < MAX_TIER && progress.seasonXp >= XP_PER_TIER) {
    progress.seasonXp -= XP_PER_TIER;
    progress.tier += 1;
  }
  if (progress.tier > MAX_TIER) progress.tier = MAX_TIER;

  await progress.save();

  if (progress.tier > tierBefore) {
    createNotification(oduserId, 'season_reward', 'Sezon Tier Atladın!', `Tier ${progress.tier} oldun! Ödüllerini kontrol et.`);
  }

  return { tier: progress.tier, seasonXp: progress.seasonXp, xpNeeded: XP_PER_TIER };
}

async function getSeasonInfo(oduserId) {
  const season = await ensureActiveSeason();
  const progress = await getOrCreateProgress(oduserId, season.id);

  const daysLeft = Math.max(0, Math.ceil((new Date(season.endDate).getTime() - Date.now()) / 86400000));

  return {
    season: {
      id: season.id,
      name: season.name,
      seasonNumber: season.seasonNumber,
      startDate: season.startDate,
      endDate: season.endDate,
      daysLeft,
    },
    progress: progress ? {
      tier: progress.tier,
      seasonXp: progress.seasonXp,
      xpNeeded: XP_PER_TIER,
      claimedRewards: progress.claimedRewards || [],
    } : { tier: 1, seasonXp: 0, xpNeeded: XP_PER_TIER, claimedRewards: [] },
    rewards: SEASON_REWARDS,
    maxTier: MAX_TIER,
  };
}

async function claimSeasonReward(oduserId, tier) {
  const reward = SEASON_REWARDS.find((r) => r.tier === tier);
  if (!reward) return { success: false, error: 'Geçersiz ödül', tier: tier ?? null };

  const season = await ensureActiveSeason();
  const user = await UserModel.findOne({ where: { oduserId } });
  if (!user) return { success: false, error: 'Kullanıcı bulunamadı', tier: null };

  try {
    return await sequelize.transaction(async (t) => {
      let row = await SeasonProgressModel.findOne({
        where: { userId: user.id, seasonId: season.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!row) {
        await SeasonProgressModel.create({
          userId: user.id,
          seasonId: season.id,
          seasonXp: 0,
          tier: 1,
          claimedRewards: [],
        }, { transaction: t });
        row = await SeasonProgressModel.findOne({
          where: { userId: user.id, seasonId: season.id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
      }
      if (!row) return { success: false, error: 'İlerleme bulunamadı', tier };
      if (row.tier < tier) return { success: false, error: 'Henüz bu tier seviyesine ulaşmadınız', tier: row.tier };

      const claimed = Array.isArray(row.claimedRewards) ? [...row.claimedRewards] : [];
      if (claimed.includes(tier)) return { success: false, error: 'Bu ödül zaten alınmış', tier: row.tier };

      claimed.push(tier);
      row.claimedRewards = claimed;
      await row.save({ transaction: t });

      if (reward.type === 'xp') {
        const u = await UserModel.findOne({ where: { id: user.id }, transaction: t, lock: t.LOCK.UPDATE });
        if (u) {
          u.xp = (u.xp || 0) + reward.value;
          const { calculateXpForLevel } = require('./leaderboard');
          while (u.xp >= calculateXpForLevel(u.level)) {
            u.xp -= calculateXpForLevel(u.level);
            u.level += 1;
          }
          await u.save({ transaction: t });
        }
      }

      return { success: true, reward, tier: row.tier };
    });
  } catch (err) {
    return { success: false, error: err?.message || 'Ödül alınamadı', tier: null };
  }
}

module.exports = { ensureActiveSeason, addSeasonXp, getSeasonInfo, claimSeasonReward, SEASON_REWARDS };
