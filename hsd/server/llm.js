const config = require('./llm-config');

let lastRequestTime = 0;
let requestCount = 0;
let windowStartTime = 0;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForRateLimit() {
  const rateLimit = config.getRateLimit();
  if (rateLimit < 0) {
    return;
  }

  const now = Date.now();
  const windowMs = 60 * 1000;

  if (now - windowStartTime >= windowMs) {
    windowStartTime = now;
    requestCount = 0;
  }

  if (requestCount >= rateLimit) {
    const waitTime = windowMs - (now - windowStartTime) + 100;
    await sleep(waitTime);
    windowStartTime = Date.now();
    requestCount = 0;
  }

  requestCount++;
  lastRequestTime = Date.now();
}

async function callLLM(prompt, systemPrompt = null) {
  await waitForRateLimit();

  const provider = config.getCurrentProvider();
  const providerConfig = config.getProviderConfig();

  switch (provider) {
    case 'openrouter':
    case 'openai':
    case 'local':
      return callOpenAICompatible(providerConfig, prompt, systemPrompt);
    case 'claude':
      return callClaude(providerConfig, prompt, systemPrompt);
    default:
      throw new Error(`不支持的 LLM 提供商: ${provider}`);
  }
}

async function callOpenAICompatible(providerConfig, prompt, systemPrompt) {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(`${providerConfig.base_url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${providerConfig.api_key}`
    },
    body: JSON.stringify({
      model: providerConfig.model,
      messages: messages,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API 调用失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callClaude(providerConfig, prompt, systemPrompt) {
  const messages = [
    { role: 'user', content: prompt }
  ];

  const requestBody = {
    model: providerConfig.model,
    max_tokens: 4096,
    messages: messages,
    temperature: 0.3
  };

  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  const response = await fetch(`${providerConfig.base_url}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': providerConfig.api_key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API 调用失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

module.exports = {
  callLLM
};
