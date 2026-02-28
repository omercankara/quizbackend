const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const CosmeticFrame = sequelize.define('CosmeticFrame', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  key: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  unlockLevel: { type: DataTypes.INTEGER, defaultValue: 1 },
  colors: { type: DataTypes.JSON, defaultValue: ['#7C4DFF', '#00E5FF'] },
  style: { type: DataTypes.STRING(20), defaultValue: 'gradient' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'cosmetic_frames',
  timestamps: true,
});

module.exports = CosmeticFrame;
