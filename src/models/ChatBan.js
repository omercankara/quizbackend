const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const ChatBan = sequelize.define('ChatBan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  oduserId: { type: DataTypes.STRING(100), allowNull: false },
  bannedUntil: { type: DataTypes.DATE, allowNull: false },
  reason: { type: DataTypes.STRING(200), allowNull: true },
}, {
  tableName: 'chat_bans',
  timestamps: true,
  indexes: [{ fields: ['oduserId'] }, { fields: ['bannedUntil'] }],
});

module.exports = ChatBan;
