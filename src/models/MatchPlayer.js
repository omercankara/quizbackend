const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const MatchPlayer = sequelize.define('MatchPlayer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  matchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  correctCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'match_players',
  timestamps: true,
});

module.exports = MatchPlayer;
