const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const PurchaseHistory = sequelize.define('PurchaseHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  itemKey: { type: DataTypes.STRING(50), allowNull: false },
  itemName: { type: DataTypes.STRING(100), allowNull: false },
  price: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
}, {
  tableName: 'purchase_history',
  timestamps: true,
  indexes: [{ fields: ['userId', 'createdAt'] }],
});

module.exports = PurchaseHistory;
