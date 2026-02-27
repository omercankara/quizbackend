const { Sequelize } = require('sequelize');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'quiz_arena';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

async function ensureDatabase() {
  const tempSeq = new Sequelize('', DB_USER, DB_PASS, {
    host: DB_HOST,
    dialect: 'mysql',
    logging: false,
  });
  try {
    await tempSeq.query('CREATE DATABASE IF NOT EXISTS `quiz_arena` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
  } finally {
    await tempSeq.close();
  }
}

module.exports = { sequelize, ensureDatabase };
