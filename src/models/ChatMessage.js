const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  oduserId: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  room: {
    type: DataTypes.STRING(80),
    defaultValue: 'lobby',
  },
}, {
  tableName: 'chat_messages',
  timestamps: true,
});

module.exports = ChatMessage;
