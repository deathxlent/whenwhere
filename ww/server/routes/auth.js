const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

const ENCRYPTION_KEY = process.env.WW_ENCRYPTION_KEY || 'whenwhere-2024-secret-key-32b';

function encryptToken(token) {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(encryptedToken) {
  try {
    const parts = encryptedToken.split(':');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return null;
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

router.post('/register', (req, res) => {
  const { username } = req.body;
  if (!username || username.trim().length === 0) {
    return res.json({ success: false, message: '请输入用户名' });
  }
  if (username.trim().length > 20) {
    return res.json({ success: false, message: '用户名不能超过20个字符' });
  }

  const name = username.trim();
  const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(name);

  if (existing) {
    return res.json({ success: false, message: '该用户名已存在，请输入您的token或选择其他用户名', needToken: true });
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const encrypted = encryptToken(token);

  const result = db.prepare('INSERT INTO users (username, token_hash) VALUES (?, ?)').run(name, tokenHash);
  const userId = result.lastInsertRowid;

  res.json({
    success: true,
    data: {
      id: userId,
      username: name,
      token: token,
      encrypted: encrypted
    },
    message: '注册成功'
  });
});

router.post('/login', (req, res) => {
  const { username, token } = req.body;
  if (!username || !token) {
    return res.json({ success: false, message: '请输入用户名和token' });
  }

  const name = username.trim();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(name);

  if (!user) {
    return res.json({ success: false, message: '用户不存在' });
  }

  const tokenHash = hashToken(token.trim());
  if (tokenHash !== user.token_hash) {
    return res.json({ success: false, message: 'token不正确' });
  }

  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const encrypted = encryptToken(token.trim());

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      encrypted: encrypted
    },
    message: '登录成功'
  });
});

router.post('/verify', (req, res) => {
  const { encrypted } = req.body;
  if (!encrypted) {
    return res.json({ success: false, message: '未提供凭证' });
  }

  const token = decryptToken(encrypted);
  if (!token) {
    return res.json({ success: false, message: '凭证无效' });
  }

  const tokenHash = hashToken(token);
  const user = db.prepare('SELECT id, username FROM users WHERE token_hash = ?').get(tokenHash);

  if (!user) {
    return res.json({ success: false, message: '用户不存在' });
  }

  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  res.json({
    success: true,
    data: { id: user.id, username: user.username }
  });
});

module.exports = router;
