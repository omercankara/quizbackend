const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const ShopItem = sequelize.define('ShopItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  itemKey: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(200), allowNull: true },
  price: { type: DataTypes.INTEGER, allowNull: false },
  userField: { type: DataTypes.STRING(50), allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'shop_items',
  timestamps: true,
});

module.exports = ShopItem;
