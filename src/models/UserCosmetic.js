const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const UserCosmetic = sequelize.define('UserCosmetic', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  cosmeticKey: { type: DataTypes.STRING(50), allowNull: false },
  cosmeticType: { type: DataTypes.ENUM('frame', 'badge'), allowNull: false },
}, {
  tableName: 'user_cosmetics',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'cosmeticKey'] },
  ],
});

module.exports = UserCosmetic;
