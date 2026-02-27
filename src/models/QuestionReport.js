const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const QuestionReport = sequelize.define('QuestionReport', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  questionId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.ENUM('wrong_answer', 'unclear', 'duplicate', 'inappropriate', 'other'), allowNull: false },
  description: { type: DataTypes.STRING(500), allowNull: true, defaultValue: null },
  status: { type: DataTypes.ENUM('pending', 'reviewed', 'resolved'), defaultValue: 'pending' },
}, {
  tableName: 'question_reports',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['questionId', 'userId'] },
    { fields: ['status'] },
  ],
});

module.exports = QuestionReport;
