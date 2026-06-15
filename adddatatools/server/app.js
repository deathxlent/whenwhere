const express = require('express');
const path = require('path');
const cors = require('cors');

const mapsRouter = require('./routes/maps');
const categoriesRouter = require('./routes/categories');
const eventsRouter = require('./routes/events');
const exportRouter = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/tiles', express.static(path.join(__dirname, '..', 'tiles')));

app.use('/api/maps', mapsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/export', exportRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
========================================
  众筹出题器已启动
  地址: http://localhost:${PORT}
========================================
  `);
});
