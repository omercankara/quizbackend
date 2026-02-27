const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Achievement = sequelize.define('Achievement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  achievementKey: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
}, {
  tableName: 'achievements',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'achievementKey'] },
  ],
});

module.exports = Achievement;
