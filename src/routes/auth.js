const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Kullanıcı adı 3-20 karakter olmalı' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Şifre en az 4 karakter olmalı' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const oduserId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const user = await User.create({
      oduserId,
      username,
      password: hashedPassword,
    });

    res.json({
      success: true,
      user: {
        userId: user.oduserId,
        username: user.username,
        level: user.level,
        rating: user.rating,
        avatar: user.avatar,
        bio: user.bio,
        title: user.title,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Bu hesap henüz şifre belirlenmemiş, lütfen kayıt olun' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Şifre yanlış' });
    }

    res.json({
      success: true,
      user: {
        userId: user.oduserId,
        username: user.username,
        level: user.level,
        rating: user.rating,
        avatar: user.avatar,
        bio: user.bio,
        title: user.title,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
