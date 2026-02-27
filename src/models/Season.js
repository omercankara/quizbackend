const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Season = sequelize.define('Season', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  seasonNumber: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'seasons',
  timestamps: true,
});

module.exports = Season;
