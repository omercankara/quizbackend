const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING(30), allowNull: false },
  title: { type: DataTypes.STRING(100), allowNull: false },
  message: { type: DataTypes.STRING(500), allowNull: false },
  data: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'read'] },
    { fields: ['userId', 'createdAt'] },
  ],
});

module.exports = Notification;
