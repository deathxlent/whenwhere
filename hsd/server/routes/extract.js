const express = require('express');
const router = express.Router();
const multer = require('multer');
const { isConfigured, getCurrentProvider, getRateLimit, reloadConfig } = require('../llm-config');
const { extractFromMultipleHtmls } = require('../extractor');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.get('/status', (req, res) => {
  try {
    const configured = isConfigured();
    let provider = null;
    let rateLimit = null;
    
    if (configured) {
      provider = getCurrentProvider();
      rateLimit = getRateLimit();
    }
    
    res.json({
      success: true,
      data: {
        configured,
        provider,
        rate_limit_per_minute: rateLimit,
        rate_limit_unlimited: rateLimit < 0
      }
    });
  } catch (e) {
    res.json({
      success: true,
      data: {
        configured: false,
        error: e.message
      }
    });
  }
});

router.post('/reload-config', (req, res) => {
  try {
    reloadConfig();
    res.json({ success: true, message: '配置已重新加载' });
  } catch (e) {
    res.json({ success: false, message: '配置加载失败: ' + e.message });
  }
});

router.post('/extract', upload.array('files', 50), async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.json({ success: false, message: 'LLM 配置未完成，请先配置 config.json' });
    }

    if (!req.files || req.files.length === 0) {
      return res.json({ success: false, message: '请上传至少一个 HTML 文件' });
    }

    const options = {
      category_code: req.body.category_code,
      category_name: req.body.category_name,
      sub_category_code: req.body.sub_category_code,
      sub_category_name: req.body.sub_category_name,
      additional_instructions: req.body.additional_instructions
    };

    const htmlFiles = req.files.map(file => ({
      name: file.originalname,
      buffer: file.buffer
    }));

    const result = await extractFromMultipleHtmls(htmlFiles, options);

    res.json({
      success: true,
      message: `提取完成，共提取 ${result.events.length} 个事件`,
      data: result
    });
  } catch (e) {
    console.error('提取事件失败:', e);
    res.json({ success: false, message: '提取失败: ' + e.message });
  }
});

router.post('/extract-preview', upload.array('files', 50), async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.json({ success: false, message: 'LLM 配置未完成，请先配置 config.json' });
    }

    if (!req.files || req.files.length === 0) {
      return res.json({ success: false, message: '请上传至少一个 HTML 文件' });
    }

    const options = {
      category_code: req.body.category_code,
      category_name: req.body.category_name,
      sub_category_code: req.body.sub_category_code,
      sub_category_name: req.body.sub_category_name,
      additional_instructions: req.body.additional_instructions
    };

    const htmlFiles = req.files.map(file => ({
      name: file.originalname,
      buffer: file.buffer
    }));

    const result = await extractFromMultipleHtmls(htmlFiles, options);

    const preview = {
      ...result,
      events: result.events.slice(0, 10)
    };

    res.json({
      success: true,
      message: `预览完成，共提取 ${result.events.length} 个事件（显示前10个）`,
      data: preview,
      total_count: result.events.length
    });
  } catch (e) {
    console.error('预览提取失败:', e);
    res.json({ success: false, message: '预览失败: ' + e.message });
  }
});

module.exports = router;
