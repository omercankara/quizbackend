const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const QuestTemplate = sequelize.define('QuestTemplate', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  questKey: { type: DataTypes.STRING(50), allowNull: false },
  questType: { type: DataTypes.ENUM('daily', 'weekly'), allowNull: false },
  title: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(200), allowNull: true },
  target: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  xpReward: { type: DataTypes.INTEGER, defaultValue: 50 },
  event: { type: DataTypes.STRING(30), allowNull: false }, // win, match, correct, streak, perfect
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'quest_templates',
  timestamps: true,
});

module.exports = QuestTemplate;
