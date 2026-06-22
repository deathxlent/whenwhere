const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const EXAMPLE_CONFIG_PATH = path.join(__dirname, '..', 'config.example.json');

let cachedConfig = null;

function loadConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(
      `配置文件不存在: ${CONFIG_PATH}\n` +
      `请复制 config.example.json 为 config.json 并填写正确的配置信息。`
    );
  }

  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configContent);
    validateConfig(config);
    cachedConfig = config;
    return config;
  } catch (e) {
    throw new Error(`配置文件解析失败: ${e.message}`);
  }
}

function validateConfig(config) {
  if (!config.llm || !config.llm.provider) {
    throw new Error('配置缺少 llm.provider 字段');
  }

  const provider = config.llm.provider;
  if (!config.llm.providers || !config.llm.providers[provider]) {
    throw new Error(`配置中未找到提供商 ${provider} 的配置`);
  }

  const providerConfig = config.llm.providers[provider];
  if (!providerConfig.api_key || providerConfig.api_key.startsWith('your-')) {
    throw new Error(`提供商 ${provider} 的 api_key 未正确配置`);
  }
  if (!providerConfig.base_url) {
    throw new Error(`提供商 ${provider} 的 base_url 未配置`);
  }
  if (!providerConfig.model) {
    throw new Error(`提供商 ${provider} 的 model 未配置`);
  }
}

function isConfigured() {
  try {
    loadConfig();
    return true;
  } catch (e) {
    return false;
  }
}

function getRateLimit() {
  const config = loadConfig();
  const rateLimit = config.llm.rate_limit_per_minute;
  if (rateLimit === undefined || rateLimit < 0) {
    return -1;
  }
  return rateLimit;
}

function getCurrentProvider() {
  const config = loadConfig();
  return config.llm.provider;
}

function getProviderConfig() {
  const config = loadConfig();
  const provider = config.llm.provider;
  return config.llm.providers[provider];
}

function getExtractionConfig() {
  const config = loadConfig();
  return config.extraction || {};
}

function reloadConfig() {
  cachedConfig = null;
  return loadConfig();
}

module.exports = {
  loadConfig,
  isConfigured,
  getRateLimit,
  getCurrentProvider,
  getProviderConfig,
  getExtractionConfig,
  reloadConfig
};
