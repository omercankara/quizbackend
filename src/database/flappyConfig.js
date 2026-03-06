const { Sequelize } = require('sequelize');

const FLAPPY_DB_HOST = process.env.FLAPPY_DB_HOST || process.env.DB_HOST || 'localhost';
const FLAPPY_DB_USER = process.env.FLAPPY_DB_USER || process.env.DB_USER || 'root';
const FLAPPY_DB_PASS = process.env.FLAPPY_DB_PASS || process.env.DB_PASS || '';
const FLAPPY_DB_NAME = process.env.FLAPPY_DB_NAME || 'flappybird';

const flappySequelize = new Sequelize(FLAPPY_DB_NAME, FLAPPY_DB_USER, FLAPPY_DB_PASS, {
  host: FLAPPY_DB_HOST,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

async function ensureFlappyDatabase() {
  const tempSeq = new Sequelize('', FLAPPY_DB_USER, FLAPPY_DB_PASS, {
    host: FLAPPY_DB_HOST,
    dialect: 'mysql',
    logging: false,
  });
  try {
    await tempSeq.query(
      `CREATE DATABASE IF NOT EXISTS \`${FLAPPY_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
  } finally {
    await tempSeq.close();
  }
}

module.exports = { flappySequelize, ensureFlappyDatabase, FLAPPY_DB_NAME };
