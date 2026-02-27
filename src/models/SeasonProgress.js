const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const SeasonProgress = sequelize.define('SeasonProgress', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  seasonId: { type: DataTypes.INTEGER, allowNull: false },
  seasonXp: { type: DataTypes.INTEGER, defaultValue: 0 },
  tier: { type: DataTypes.INTEGER, defaultValue: 1 },
  claimedRewards: { type: DataTypes.JSON, defaultValue: [] },
}, {
  tableName: 'season_progress',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'seasonId'] },
  ],
});

module.exports = SeasonProgress;
