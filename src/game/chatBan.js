const ChatBanModel = require('../models/ChatBan');

async function isChatBanned(oduserId) {
  const ban = await ChatBanModel.findOne({
    where: { oduserId },
    order: [['bannedUntil', 'DESC']],
  });
  if (!ban) return false;
  return new Date(ban.bannedUntil) > new Date();
}

module.exports = { isChatBanned };
