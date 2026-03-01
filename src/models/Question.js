const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/config');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  questionKey: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  optionA: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  optionB: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  optionC: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  optionD: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  correct: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '0=A, 1=B, 2=C, 3=D',
  },
  hint: {
    type: DataTypes.STRING(500),
    defaultValue: '',
  },
}, {
  tableName: 'questions',
  timestamps: true,
});

module.exports = Question;
