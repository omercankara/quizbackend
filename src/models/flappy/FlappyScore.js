const { DataTypes } = require('sequelize');
const { flappySequelize } = require('../../database/flappyConfig');

const FlappyScore = flappySequelize.define(
  'FlappyScore',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    matchId: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'flappy_scores',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  }
);

module.exports = FlappyScore;
