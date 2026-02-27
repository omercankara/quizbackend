const NotificationModel = require('../models/Notification');
const UserModel = require('../models/User');

async function createNotification(userId, type, title, message, data = null) {
  try {
    const user = await UserModel.findOne({ where: { oduserId: userId } });
    if (!user) return null;
    return await NotificationModel.create({
      userId: user.id,
      type,
      title,
      message,
      data,
    });
  } catch (e) {
    console.error('Bildirim oluşturma hatası:', e.message);
    return null;
  }
}

async function getNotifications(oduserId, limit = 50, unreadOnly = false) {
  const user = await UserModel.findOne({ where: { oduserId } });
  if (!user) return [];
  const where = { userId: user.id };
  if (unreadOnly) where.read = false;
  const notifs = await NotificationModel.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
  });
  return notifs.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    data: n.data,
    read: n.read,
    createdAt: n.createdAt,
  }));
}

async function getUnreadCount(oduserId) {
  const user = await UserModel.findOne({ where: { oduserId } });
  if (!user) return 0;
  return await NotificationModel.count({ where: { userId: user.id, read: false } });
}

async function markRead(oduserId, notificationId) {
  const user = await UserModel.findOne({ where: { oduserId } });
  if (!user) return;
  await NotificationModel.update({ read: true }, { where: { id: notificationId, userId: user.id } });
}

async function markAllRead(oduserId) {
  const user = await UserModel.findOne({ where: { oduserId } });
  if (!user) return;
  await NotificationModel.update({ read: true }, { where: { userId: user.id, read: false } });
}

module.exports = { createNotification, getNotifications, getUnreadCount, markRead, markAllRead };
