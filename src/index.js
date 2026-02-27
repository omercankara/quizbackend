const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { sequelize, ensureDatabase } = require('./database/config');
require('./models');
const { seedDatabase } = require('./database/seed');

const { setupGameSocket } = require('./sockets/gameHandler');
const { setupChatSocket } = require('./sockets/chatHandler');
const path = require('path');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'Quiz Game Backend' });
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

setupGameSocket(io);
setupChatSocket(io);

async function startServer() {
  try {
    await ensureDatabase();
    console.log('Veritabanı kontrol edildi / oluşturuldu.');

    await sequelize.authenticate();
    console.log('MySQL bağlantısı başarılı.');

    await sequelize.sync({ alter: true });
    console.log('Tablolar senkronize edildi.');

    await seedDatabase();

    server.listen(PORT, () => {
      console.log(`Server ${PORT} portunda çalışıyor`);
    });
  } catch (error) {
    console.error('Sunucu başlatma hatası:', error.message);
    console.error('WampServer\'ın çalıştığından ve MySQL servisinin aktif olduğundan emin olun.');
    process.exit(1);
  }
}

startServer();
