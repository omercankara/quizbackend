const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Match = sequelize.define('Match', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  matchKey: {
    type: DataTypes.STRING(60),
    unique: true,
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(30),
    defaultValue: 'all',
  },
  mode: {
    type: DataTypes.STRING(20),
    defaultValue: '1v1',
  },
  winnerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  draw: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('playing', 'finished'),
    defaultValue: 'finished',
  },
}, {
  tableName: 'matches',
  timestamps: true,
});

module.exports = Match;
