const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const STATIC_PATH = path.join(__dirname, '..', 'static');
const PUBLIC_PATH = path.join(__dirname, '..', 'public');

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(PUBLIC_PATH));
app.use('/images', express.static(path.join(STATIC_PATH, 'images')));
app.use('/geojson', express.static(path.join(STATIC_PATH, 'geojson')));
app.use('/lib', express.static(path.join(STATIC_PATH, 'lib')));
app.use('/tiles', express.static(path.join(STATIC_PATH, 'tiles')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/achievements', require('./routes/achievements'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'WW服务运行正常', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`  WW (whenwhere) 猜猜看已启动`);
  console.log(`  前端地址: http://localhost:${PORT}`);
  console.log(`  API地址:  http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
});
