const { DataTypes } = require('sequelize');
const { flappySequelize } = require('../../database/flappyConfig');

const FlappyNotification = flappySequelize.define(
  'FlappyNotification',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.STRING(128), allowNull: false },
    type: { type: DataTypes.STRING(32), allowNull: false },
    message: { type: DataTypes.STRING(256), allowNull: false },
    read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    data: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'flappy_notifications', timestamps: true }
);

module.exports = FlappyNotification;
