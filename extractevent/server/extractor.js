const cheerio = require('cheerio');
const { callLLM } = require('./llm');
const config = require('./config');

function normalizeTimestamp(ts) {
  if (ts === null || ts === undefined || ts === '') {
    return null;
  }

  const num = typeof ts === 'string' ? parseInt(ts, 10) : ts;
  if (isNaN(num)) {
    return null;
  }

  const sign = num < 0 ? -1 : 1;
  const absNum = Math.abs(num);

  if (absNum <= 9999) {
    return sign * (absNum * 10000 + 101);
  } else if (absNum <= 999999) {
    return sign * (absNum * 100 + 1);
  }

  return num;
}

function normalizePrecision(precision) {
  if (precision === null || precision === undefined || precision === '') {
    return 0;
  }

  const num = typeof precision === 'string' ? parseInt(precision, 10) : precision;
  if (isNaN(num)) {
    return 0;
  }

  if (num < 0) return 0;
  if (num > 2) return 2;
  return num;
}

function extractTextFromHtml(html) {
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, aside').remove();
  return $.text().replace(/\s+/g, ' ').trim();
}

function buildSystemPrompt() {
  return `你是一个专业的历史事件提取专家。你的任务是从给定的历史文档文本中提取所有可识别的历史事件。

【重要规则】
1. 必须返回严格有效的 JSON 格式，不要有任何额外的解释、说明或 markdown 标记
2. 不要用 \`\`\`json 或 \`\`\` 包裹你的响应，直接输出纯 JSON
3. 如果没有找到任何事件，也要返回包含空 events 数组的有效 JSON
4. 确保所有引号都是双引号，字符串内容中的引号要转义
5. 确保 JSON 结构完整，括号配对正确

【事件字段要求】
- title: 事件标题（简短准确）
- start_ts: 开始时间戳（整数，YYYYMMDD格式，公元前用负数）
  * 2024年1月1日 → 20240101
  * 1969年 → 19690101（只知道年份时默认1月1日）
  * 公元前221年 → -2210101
  * 2023年5月 → 20230501（只知道年月时默认1日）
- start_precision: 开始时间精度（整数，0=年级别，1=月级别，2=日级别）
  * 0 = 只知道到年份，如"1969年"
  * 1 = 知道到月份，如"1969年3月"
  * 2 = 知道到具体日期，如"1969年3月15日"
- end_ts: 结束时间戳（格式同start_ts，null表示没有结束时间）
- end_precision: 结束时间精度（格式同start_precision）
- description: 事件详细描述
- tips: 补充说明或备注（可选）
- location_name: 地点名称
- location_lat: 纬度（不知道则为 null）
- location_lng: 经度（不知道则为 null）
- sort_order: 排序序号（从1开始）

【输出格式示例】
{
  "events": [
    {
      "title": "Unix 原型开发",
      "start_ts": 19690101,
      "start_precision": 0,
      "end_ts": null,
      "end_precision": 0,
      "description": "1969年Unix操作系统原型开发",
      "tips": "",
      "location_name": "贝尔实验室",
      "location_lat": null,
      "location_lng": null,
      "sort_order": 1
    }
  ]
}

【严格要求】
- 时间戳必须使用 YYYYMMDD 格式的整数，绝不能只写年份（如1969要写成19690101）
- 精度定义：0=年，1=月，2=日
- 只输出 JSON，不要有任何其他内容
- 确保 JSON 可以直接被 JSON.parse() 解析`;
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
  
  console.log('\n' + '='.repeat(80));
  console.log('LLM 原始响应:');
  console.log('='.repeat(80));
  console.log(cleaned);
  console.log('='.repeat(80) + '\n');
  
  cleaned = cleaned.replace(/^\`\`\`json\s*/i, '');
  cleaned = cleaned.replace(/\`\`\`\s*$/g, '');
  
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  cleaned = cleaned.trim();
  
  cleaned = cleaned.replace(/\n/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  console.log('清理后响应:');
  console.log(cleaned);
  console.log('\n');
  
  return cleaned;
}

async function extractEventsFromText(text, options = {}, attempt = 1) {
  const maxAttempts = 3;
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(text, options);
  
  console.log(`\n[${new Date().toISOString()}] 开始提取事件 (尝试 ${attempt}/${maxAttempts})`);
  
  try {
    const response = await callLLM(userPrompt, systemPrompt);
    const cleanedResponse = cleanJsonResponse(response);
    
    let result;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error(`JSON 解析失败 (尝试 ${attempt}/${maxAttempts}):`, e.message);
      
      if (attempt < maxAttempts) {
        console.log(`准备重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return extractEventsFromText(text, {
          ...options,
          additional_instructions: (options.additional_instructions ? options.additional_instructions + '\n' : '') + 
            '【重要】上次返回的JSON格式不正确，请确保只输出严格有效的JSON，不要有任何其他内容。'
        }, attempt + 1);
      }
      
      throw new Error(`LLM 返回的 JSON 解析失败: ${e.message}\n原始响应: ${response}\n清理后: ${cleanedResponse}`);
    }
    
    if (!result.events || !Array.isArray(result.events)) {
      console.error(`返回结果缺少 events 数组 (尝试 ${attempt}/${maxAttempts})`);
      
      if (attempt < maxAttempts) {
        console.log(`准备重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return extractEventsFromText(text, {
          ...options,
          additional_instructions: (options.additional_instructions ? options.additional_instructions + '\n' : '') + 
            '【重要】上次返回结果缺少 events 数组，请确保返回格式为 {"events": [...]}'
        }, attempt + 1);
      }
      
      throw new Error('LLM 返回结果中缺少 events 数组');
    }
    
    console.log(`成功提取 ${result.events.length} 个事件`);
    return result.events;
    
  } catch (e) {
    if (e.message.includes('JSON 解析失败') || e.message.includes('缺少 events 数组')) {
      throw e;
    }
    
    console.error(`调用 LLM 失败 (尝试 ${attempt}/${maxAttempts}):`, e.message);
    
    if (attempt < maxAttempts) {
      console.log(`准备重试...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      return extractEventsFromText(text, options, attempt + 1);
    }
    
    throw e;
  }
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
  
  const eventsWithDefaults = events.map((e, idx) => {
    const startTs = normalizeTimestamp(e.start_ts);
    const endTs = normalizeTimestamp(e.end_ts);
    let startPrecision = normalizePrecision(e.start_precision);
    let endPrecision = normalizePrecision(e.end_precision);

    if (startTs !== null) {
      const absStart = Math.abs(startTs);
      if (absStart % 10000 === 101) {
        startPrecision = 0;
      } else if (absStart % 100 === 1) {
        startPrecision = 1;
      }
    }
    if (endTs !== null) {
      const absEnd = Math.abs(endTs);
      if (absEnd % 10000 === 101) {
        endPrecision = 0;
      } else if (absEnd % 100 === 1) {
        endPrecision = 1;
      }
    }

    return {
      category_code: categoryCode,
      sub_category_code: subCategoryCode,
      title: e.title || '',
      start_ts: startTs,
      start_precision: startPrecision,
      end_ts: endTs,
      end_precision: endPrecision,
      description: e.description || '',
      tips: e.tips || '',
      location_lat: e.location_lat !== undefined && e.location_lat !== null ? Number(e.location_lat) : null,
      location_lng: e.location_lng !== undefined && e.location_lng !== null ? Number(e.location_lng) : null,
      location_name: e.location_name || '',
      sort_order: e.sort_order !== undefined ? Number(e.sort_order) : (idx + 1)
    };
  });

  console.log(`\n时间规范化结果:`);
  eventsWithDefaults.forEach((e, idx) => {
    console.log(`  [${idx + 1}] ${e.title}: start_ts=${e.start_ts} (精度=${e.start_precision}), end_ts=${e.end_ts} (精度=${e.end_precision})`);
  });
  console.log('');

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
