const { DataTypes } = require('sequelize');
const { flappySequelize } = require('../../database/flappyConfig');

const FlappyWeeklyChallenge = flappySequelize.define(
  'FlappyWeeklyChallenge',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(128), allowNull: false },
    description: { type: DataTypes.STRING(256), allowNull: false },
    targetType: { type: DataTypes.STRING(32), allowNull: false },
    targetValue: { type: DataTypes.INTEGER, allowNull: false },
    currentValue: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    reward: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
    completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    weekStart: { type: DataTypes.DATEONLY, allowNull: false },
    weekEnd: { type: DataTypes.DATEONLY, allowNull: false },
  },
  { tableName: 'flappy_weekly_challenges', timestamps: true }
);

module.exports = FlappyWeeklyChallenge;
