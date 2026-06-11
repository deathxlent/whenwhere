const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const WW_STATIC_PATH = path.join(__dirname, '..', '..', 'ww', 'static');
const PUBLIC_PATH = path.join(__dirname, '..', 'public');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/images', express.static(path.join(WW_STATIC_PATH, 'images')));
app.use(express.static(PUBLIC_PATH));

app.use('/api/categories', require('./routes/categories'));
app.use('/api/events', require('./routes/events'));
app.use('/api/images', require('./routes/images'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'HSD服务运行正常', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`  HSD (heshidi) 维护系统已启动`);
  console.log(`  前端地址: http://localhost:${PORT}`);
  console.log(`  API地址:  http://localhost:${PORT}/api`);
  console.log(`  数据库:   ${path.join(__dirname, '..', '..', 'ww', 'db', 'whenwhere.db')}`);
  console.log(`  图片目录: ${path.join(WW_STATIC_PATH, 'images')}`);
  console.log('='.repeat(50));
});
