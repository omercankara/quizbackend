const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Friend = sequelize.define('Friend', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  friendId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'friends',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'friendId'] },
  ],
});

module.exports = Friend;
