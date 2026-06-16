const cheerio = require('cheerio');
const { callLLM } = require('./llm');
const config = require('./config');

function extractTextFromHtml(html) {
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, aside').remove();
  return $.text().replace(/\s+/g, ' ').trim();
}

function buildSystemPrompt() {
  return `你是一个历史事件提取专家。请从给定的历史文档文本中提取所有历史事件。

要求：
1. 仔细阅读文本，识别所有具有明确时间和地点的历史事件
2. 每个事件必须包含：标题、开始时间、结束时间（可选）、描述、地点信息
3. 时间格式使用整数，如公元前221年表示为 -221，公元2024年表示为 2024
4. 如果只有年份，时间精度为 2（年级别）；如果有年月，精度为 1；如果有年月日，精度为 0
5. 如果不知道具体经纬度，location_lat 和 location_lng 可以为 null
6. 输出必须是严格的 JSON 格式，包含 events 数组

输出 JSON 格式示例：
{
  "events": [
    {
      "title": "事件标题",
      "start_ts": 2024,
      "start_precision": 2,
      "end_ts": null,
      "end_precision": 0,
      "description": "事件详细描述",
      "tips": "补充说明或备注",
      "location_name": "地点名称",
      "location_lat": null,
      "location_lng": null,
      "sort_order": 1
    }
  ]
}`;
}

function buildUserPrompt(text, options = {}) {
  const extractionConfig = config.getExtractionConfig();
  let prompt = `请从以下历史文档文本中提取所有历史事件：\n\n`;
  prompt += `--- 文档开始 ---\n${text}\n--- 文档结束 ---\n\n`;
  
  if (options.category_code) {
    prompt += `分类编码: ${options.category_code}\n`;
  }
  if (options.sub_category_code) {
    prompt += `子分类编码: ${options.sub_category_code}\n`;
  }
  if (options.additional_instructions) {
    prompt += `\n附加说明: ${options.additional_instructions}\n`;
  }
  
  prompt += `\n请提取所有事件并以JSON格式输出。`;
  return prompt;
}

function cleanJsonResponse(response) {
  let cleaned = response.trim();
  
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  cleaned = cleaned.trim();
  
  return cleaned;
}

async function extractEventsFromText(text, options = {}) {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(text, options);
  
  const response = await callLLM(userPrompt, systemPrompt);
  const cleanedResponse = cleanJsonResponse(response);
  
  let result;
  try {
    result = JSON.parse(cleanedResponse);
  } catch (e) {
    throw new Error(`LLM 返回的 JSON 解析失败: ${e.message}\n原始响应: ${response}`);
  }
  
  if (!result.events || !Array.isArray(result.events)) {
    throw new Error('LLM 返回结果中缺少 events 数组');
  }
  
  return result.events;
}

async function extractFromHtml(html, options = {}) {
  const text = extractTextFromHtml(html);
  
  if (text.length < 10) {
    throw new Error('HTML 内容过少，无法提取事件');
  }
  
  const events = await extractEventsFromText(text, options);
  
  const extractionConfig = config.getExtractionConfig();
  const categoryCode = options.category_code || extractionConfig.default_category_code || 'history';
  const subCategoryCode = options.sub_category_code || extractionConfig.default_sub_category_code || 'events';
  
  const eventsWithDefaults = events.map((e, idx) => ({
    category_code: categoryCode,
    sub_category_code: subCategoryCode,
    title: e.title || '',
    start_ts: e.start_ts !== undefined && e.start_ts !== null ? e.start_ts : null,
    start_precision: e.start_precision !== undefined ? e.start_precision : (extractionConfig.start_precision_default || 2),
    end_ts: e.end_ts !== undefined && e.end_ts !== null ? e.end_ts : null,
    end_precision: e.end_precision !== undefined ? e.end_precision : (extractionConfig.end_precision_default || 0),
    description: e.description || '',
    tips: e.tips || '',
    location_lat: e.location_lat !== undefined ? e.location_lat : null,
    location_lng: e.location_lng !== undefined ? e.location_lng : null,
    location_name: e.location_name || '',
    sort_order: e.sort_order !== undefined ? e.sort_order : (idx + 1)
  }));
  
  return {
    version: '1.0',
    export_time: new Date().toISOString(),
    events: eventsWithDefaults
  };
}

async function extractFromMultipleHtmls(htmlFiles, options = {}) {
  const allEvents = [];
  
  for (let i = 0; i < htmlFiles.length; i++) {
    const file = htmlFiles[i];
    const html = file.content || file.buffer?.toString('utf8');
    const fileName = file.name || `file_${i + 1}`;
    
    const result = await extractFromHtml(html, {
      ...options,
      additional_instructions: options.additional_instructions 
        ? `${options.additional_instructions}\n当前文档: ${fileName}`
        : `当前文档: ${fileName}`
    });
    
    const startIdx = allEvents.length;
    result.events.forEach((e, idx) => {
      e.sort_order = startIdx + idx + 1;
      allEvents.push(e);
    });
  }
  
  const extractionConfig = config.getExtractionConfig();
  const categoryCode = options.category_code || extractionConfig.default_category_code || 'history';
  const categoryName = options.category_name || extractionConfig.default_category_name || '历史';
  const subCategoryCode = options.sub_category_code || extractionConfig.default_sub_category_code || 'events';
  const subCategoryName = options.sub_category_name || extractionConfig.default_sub_category_name || '历史事件';
  
  return {
    version: '1.0',
    export_time: new Date().toISOString(),
    exported_event_count: allEvents.length,
    maps: [],
    categories: [
      {
        code: categoryCode,
        name: categoryName,
        sort_order: 1
      }
    ],
    sub_categories: [
      {
        category_code: categoryCode,
        code: subCategoryCode,
        name: subCategoryName,
        sort_order: 1,
        map_code: null,
        center_lat: null,
        center_lng: null,
        default_zoom: 2,
        min_zoom: 2,
        max_zoom: 8
      }
    ],
    events: allEvents
  };
}

module.exports = {
  extractTextFromHtml,
  extractFromHtml,
  extractFromMultipleHtmls
};
