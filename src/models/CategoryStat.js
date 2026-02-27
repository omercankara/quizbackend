const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const CategoryStat = sequelize.define('CategoryStat', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  category: { type: DataTypes.STRING(30), allowNull: false },
  totalAnswered: { type: DataTypes.INTEGER, defaultValue: 0 },
  correctAnswered: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalMatches: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'category_stats',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'category'] },
  ],
});

module.exports = CategoryStat;
