const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const FriendRequest = sequelize.define('FriendRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  toUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'friend_requests',
  timestamps: true,
});

module.exports = FriendRequest;
