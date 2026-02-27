const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  oduserId: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: null,
  },
  bio: {
    type: DataTypes.STRING(200),
    allowNull: true,
    defaultValue: null,
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
  },
  favoriteCategory: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: null,
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  xp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  draws: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalMatches: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalCorrect: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  bestStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  abandons: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  activeFrame: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
  },
  activeBadge: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
  },
  coins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  ownedFiftyFifty: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  ownedTimeFreeze: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  ownedDoublePoints: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  ownedHint: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
