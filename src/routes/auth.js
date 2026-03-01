const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();
const User = require('../models/User');

// Web client ID (Google Console > Web application - app ile aynı)
const GOOGLE_WEB_CLIENT_ID = '227946567742-557ol0e3njaarbh6vfidub7l2r0s88qa.apps.googleusercontent.com';

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

// ── GOOGLE İLE GİRİŞ ──
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Google token gerekli' });
    }

    const client = new OAuth2Client(GOOGLE_WEB_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_WEB_CLIENT_ID });
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email || null;
    const name = payload.name || payload.given_name || email?.split('@')[0] || 'Kullanıcı';
    const picture = payload.picture || null;

    let user = await User.findOne({ where: { googleId } });
    if (!user) {
      user = await User.findOne({ where: { email } });
    }
    if (!user) {
      const baseUsername = (name || 'user').replace(/\s+/g, '_').slice(0, 15);
      let username = baseUsername;
      let suffix = 0;
      while (await User.findOne({ where: { username } })) {
        username = `${baseUsername}${++suffix}`.slice(0, 20);
      }
      const oduserId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      user = await User.create({
        oduserId,
        username,
        email,
        googleId,
        avatar: picture,
        password: null,
      });
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.email = user.email || email;
        user.avatar = user.avatar || picture;
        await user.save();
      }
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
    console.error('Google auth error:', err.message);
    console.error('Google auth full error:', err);
    if (err.message?.includes('Token used too late') || err.message?.includes('expired')) {
      return res.status(401).json({ error: 'Oturum süresi doldu, tekrar deneyin' });
    }
    // Audience mismatch = frontend/backend farklı client ID kullanıyor
    const msg = err.message?.includes('audience') ? 'Client ID uyuşmazlığı (frontend/backend kontrol et)' : 'Google ile giriş başarısız';
    res.status(401).json({ error: msg });
  }
});

module.exports = router;
