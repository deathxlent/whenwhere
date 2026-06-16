const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

let PORT = 3003;
try {
  const serverConfig = config.getServerConfig();
  PORT = serverConfig.port || 3003;
} catch (e) {
  console.warn('加载配置失败，使用默认端口 3003:', e.message);
}

const PUBLIC_PATH = path.join(__dirname, '..', 'public');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(PUBLIC_PATH));

app.use('/api/extract', require('./routes/extract'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ExtractEvent 服务运行正常', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`  ExtractEvent - 历史事件提取工具已启动`);
  console.log(`  前端地址: http://localhost:${PORT}`);
  console.log(`  API地址:  http://localhost:${PORT}/api`);
  console.log(`  配置文件: ${path.join(__dirname, '..', 'config.json')}`);
  
  try {
    if (config.isConfigured()) {
      const provider = config.getCurrentProvider();
      const rateLimit = config.getRateLimit();
      console.log(`  LLM提供商: ${provider}`);
      console.log(`  速率限制: ${rateLimit < 0 ? '无限制' : `${rateLimit}次/分钟`}`);
    } else {
      console.log(`  LLM配置: 未配置（请复制 config.example.json 为 config.json）`);
    }
  } catch (e) {
    console.log(`  LLM配置: 未配置`);
  }
  
  console.log('='.repeat(50));
});
