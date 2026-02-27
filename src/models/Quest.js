const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Quest = sequelize.define('Quest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  questKey: { type: DataTypes.STRING(50), allowNull: false },
  questType: { type: DataTypes.ENUM('daily', 'weekly'), allowNull: false },
  title: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(200), allowNull: true },
  target: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  claimed: { type: DataTypes.BOOLEAN, defaultValue: false },
  xpReward: { type: DataTypes.INTEGER, defaultValue: 50 },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
}, {
  tableName: 'quests',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'questType', 'expiresAt'] },
  ],
});

module.exports = Quest;
