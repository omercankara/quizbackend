const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const DirectMessage = sequelize.define('DirectMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fromUserId: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  toUserId: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  fromUsername: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'direct_messages',
  timestamps: true,
  indexes: [
    { fields: ['fromUserId', 'toUserId'] },
    { fields: ['toUserId', 'read'] },
  ],
});

module.exports = DirectMessage;
