'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const VERSION = require('./package.json').version;
const STARTED_AT = Date.now();

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  try {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const index = trimmed.indexOf('=');
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.warn('Could not read .env file:', error.message);
  }
}

loadEnv();

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES) || 12 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 60;
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX) || 10;
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS) || 8_000;
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 45_000;
const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts';
const GEMINI_TTS_VOICE = process.env.GEMINI_TTS_VOICE || 'Kore';
const DATA_GOV_IN_API_KEY = process.env.DATA_GOV_IN_API_KEY || '';
const DATA_GOV_IN_SAMPLE_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
const DATA_GOV_IN_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const TTS_MAX_CHARS = Number(process.env.TTS_MAX_CHARS) || 1_200;
const TTS_CACHE_MAX = Number(process.env.TTS_CACHE_MAX) || 40;
const TTS_CACHE_TTL_MS = Number(process.env.TTS_CACHE_TTL_MS) || 15 * 60 * 1000;
const TRUST_PROXY = process.env.TRUST_PROXY === '1';

const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3100,http://127.0.0.1:3100')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const DATA_DIR = path.join(__dirname, 'data');

function readJson(fileName, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, fileName), 'utf8'));
  } catch (error) {
    log('error', 'data_load_failed', { file: fileName, error: error.message });
    return fallback;
  }
}

const mandiPrices = readJson('mandi_prices.json', { updated_at: '', commodities: [] });
const ttsCache = new Map();
let mandiCache = null;
const MANDI_CACHE_TTL_MS = 60 * 60 * 1000; // Cache mandi for 1 hour

const weatherCache = new Map();
const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000; // Cache weather per city for 15 minutes

function firstText(item, keys) {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

async function fetchMandiFromGov() {
  if (!DATA_GOV_IN_API_KEY) throw new Error('DATA_GOV_IN_API_KEY is not configured');
  if (mandiCache && Date.now() < mandiCache.expiresAt) return mandiCache.payload;
  const buildUrl = (apiKey) => {
    const url = new URL(`https://api.data.gov.in/resource/${DATA_GOV_IN_RESOURCE_ID}`);
    url.searchParams.set('limit', '200');
    url.searchParams.set('format', 'json');
    url.searchParams.set('api-key', apiKey);
    url.searchParams.set('filters[state.keyword]', 'Telangana');
    return url;
  };
  let body;
  try {
    body = await fetchJson(buildUrl(DATA_GOV_IN_API_KEY), UPSTREAM_TIMEOUT_MS);
  } catch (error) {
    log('warn', 'mandi_gov_primary_failed', { error: error.message });
    body = await fetchJson(buildUrl(DATA_GOV_IN_SAMPLE_KEY), UPSTREAM_TIMEOUT_MS);
  }
  const results = Array.isArray(body.records) ? body.records : Array.isArray(body.results) ? body.results : [];
  const telanganaResults = results.filter((item) => {
    const state = firstText(item, ['state_name', 'state', 'state_code']);
    return !state || /telangana|^tg$/i.test(state);
  });
  const updatedAt = firstText(telanganaResults[0] ?? {}, ['arrival_date', 'date']) || firstText(body, ['updated_at', 'updated_date', 'last_updated', 'time_updated']) || new Date().toISOString();
  const commodities = telanganaResults
    .map((item, index) => {
      const name = firstText(item, ['commodity_name', 'commodity', 'name_en', 'name', 'crop_name']) || `Commodity ${index + 1}`;
      const variety = firstText(item, ['variety', 'grade', 'variety_name']) || '';
      const marketEn = firstText(item, ['market_name', 'market_center', 'market', 'state_name', 'state', 'district_name']) || '';
      const stateEn = firstText(item, ['state_name', 'state', 'state_code']) || '';
      const priceText = firstText(item, ['modal_price', 'price', 'modal_price_per_quintal', 'rate']) || '0';
      const minText = firstText(item, ['min_price', 'minimum_price', 'price_from', 'min_price_per_quintal']) || '';
      const maxText = firstText(item, ['max_price', 'maximum_price', 'price_to', 'max_price_per_quintal']) || '';
      const dateText = firstText(item, ['date_arrival', 'arrival_date', 'date']) || '';
      const toKg = (value) => Math.round((Number(value) / 100) * 10) / 10;
      const modalPrice = toKg(priceText);
      const minPrice = minText ? toKg(minText) : modalPrice;
      const maxPrice = maxText ? toKg(maxText) : modalPrice;
      return {
        id: `${name.replace(/[^a-z0-9]+/gi, '').toLowerCase()}_${index + 1}`,
        name_en: name,
        name_te: name,
        variety,
        market_en: marketEn,
        market_te: marketEn,
        min_price: minPrice,
        max_price: maxPrice,
        modal_price: modalPrice,
        unit: '₹ / Kg',
        change: '',
        trend: 'up'
      };
    })
    .filter((item) => item.modal_price > 0);
  if (!commodities.length) throw new Error('DATA_GOV_IN_API_KEY returned no commodities');
  const payload = {
    updated_at: updatedAt,
    commodities
  };
  mandiCache = { payload, expiresAt: Date.now() + MANDI_CACHE_TTL_MS };
  return payload;
}

function log(level, message, fields = {}) {
  const entry = { time: new Date().toISOString(), level, message, ...fields };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

class HttpError extends Error {
  constructor(status, message, code = 'request_error') {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

function clientIp(req) {
  if (TRUST_PROXY) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
  }
  return req.socket.remoteAddress || 'unknown';
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Request-Id');
    res.setHeader('Access-Control-Max-Age', '600');
  }
}

function setBaseHeaders(req, res, requestId) {
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  if (req.url && (req.url.startsWith('/api/weather') || req.url.startsWith('/api/mandi'))) {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200');
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  applyCors(req, res);
}

function sendJson(req, res, status, payload) {
  applyCors(req, res);
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  if (req.url && (req.url.startsWith('/api/weather') || req.url.startsWith('/api/mandi'))) {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200');
  }
  res.end(body);
}

function sendAudio(req, res, status, buffer, contentType = 'audio/wav') {
  applyCors(req, res);
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Cache-Control', 'no-store');
  res.end(buffer);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const contentType = String(req.headers['content-type'] || '')
      .split(';')[0]
      .trim()
      .toLowerCase();

    if (contentType !== 'application/json') {
      reject(new HttpError(415, 'Content-Type must be application/json', 'unsupported_media_type'));
      return;
    }

    const chunks = [];
    let size = 0;
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        fail(new HttpError(413, 'Request body is too large', 'payload_too_large'));
        return;
      }
      if (!settled) {
        chunks.push(chunk);
      }
    });

    req.on('end', () => {
      if (settled) return;
      settled = true;
      if (size === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'Request body must be valid JSON', 'invalid_json'));
      }
    });

    req.on('error', () => fail(new HttpError(400, 'Could not read request body', 'invalid_body')));
  });
}

const rateBuckets = new Map();

function consumeRateLimit(key, limit) {
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.start >= RATE_LIMIT_WINDOW_MS) {
    bucket = { start: now, count: 0 };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.start + RATE_LIMIT_WINDOW_MS - now) / 1000))
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.start > RATE_LIMIT_WINDOW_MS * 2) {
      rateBuckets.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS).unref();

function clampString(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function parseCoordinate(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return null;
  return number;
}

function parseLanguage(value) {
  return value === 'te' ? 'te' : 'en';
}

async function fetchJson(url, timeoutMs, headers = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': `rythu-mitra/${VERSION}`,
      ...headers
    },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) {
    throw new Error(`Upstream returned HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchWeather(lat, lon, city = '') {
  const cacheKey = `${city || ''}_${lat.toFixed(3)}_${lon.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.payload;
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,is_day,wind_speed_10m'
  );
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset'
  );
  url.searchParams.set('timezone', 'Asia/Kolkata');
  url.searchParams.set('forecast_days', '7');
  const meteo = await fetchJson(url, UPSTREAM_TIMEOUT_MS);
  const payload = buildWeatherPayload(city, meteo);
  weatherCache.set(cacheKey, { payload, expiresAt: Date.now() + WEATHER_CACHE_TTL_MS });
  return payload;
}

function buildWeatherPayload(city, meteo) {
  const current = meteo.current;
  const daily = meteo.daily || {};
  if (!current || typeof current.temperature_2m !== 'number') {
    throw new Error('Weather response did not include current conditions');
  }

  const rainProb =
    Array.isArray(daily.precipitation_probability_max) &&
    typeof daily.precipitation_probability_max[0] === 'number'
      ? daily.precipitation_probability_max[0]
      : 0;
  const temp = Math.round(current.temperature_2m);
  const humidity = Math.round(current.relative_humidity_2m ?? 0);
  const windSpeed = Math.round(current.wind_speed_10m ?? 0);

  let advisory = 'Favorable weather for field activities. Irrigate in the early morning or evening.';
  let advisoryTe =
    'వ్యవసాయ పనులకు అనుకూలమైన వాతావరణం. ఉదయం లేదా సాయంత్రం వేళల్లో నీటి తడులు ఇవ్వండి.';

  if (rainProb > 40) {
    advisory =
      'High chance of rainfall. Halt pesticide and fungicide sprays to prevent wash-off. Ensure field drainage.';
    advisoryTe =
      'భారీ వర్ష సూచన ఉంది. మందుల పిచికారీ నిలిపివేయండి. పొలాల్లో మురుగునీటి కాలువలను సిద్ధంగా ఉంచండి.';
  } else if (temp > 36) {
    advisory =
      'High temperatures detected. Irrigate crops frequently to prevent heat stress and avoid noon spraying.';
    advisoryTe =
      'అధిక ఉష్ణోగ్రతలు నమోదయ్యే అవకాశం ఉంది. ఎండ తీవ్రత తగ్గించేందుకు తగినంత తేమను అందించండి.';
  }

  const conditionCode =
    typeof current.weather_code === 'number' ? current.weather_code : 0;
  const isDay = current.is_day !== 0;
  const dailyDates = Array.isArray(daily.time) ? daily.time : [];
  const forecast = dailyDates.slice(0, 7).map((date, index) => ({
    date,
    code:
      Array.isArray(daily.weather_code) && typeof daily.weather_code[index] === 'number'
        ? daily.weather_code[index]
        : 0,
    max:
      Array.isArray(daily.temperature_2m_max) &&
      typeof daily.temperature_2m_max[index] === 'number'
        ? Math.round(daily.temperature_2m_max[index])
        : temp,
    min:
      Array.isArray(daily.temperature_2m_min) &&
      typeof daily.temperature_2m_min[index] === 'number'
        ? Math.round(daily.temperature_2m_min[index])
        : temp,
    rain_prob:
      Array.isArray(daily.precipitation_probability_max) &&
      typeof daily.precipitation_probability_max[index] === 'number'
        ? Math.round(daily.precipitation_probability_max[index])
        : 0,
    wind_speed:
      Array.isArray(daily.wind_speed_10m_max) &&
      typeof daily.wind_speed_10m_max[index] === 'number'
        ? Math.round(daily.wind_speed_10m_max[index])
        : windSpeed,
    sunrise:
      Array.isArray(daily.sunrise) && typeof daily.sunrise[index] === 'string'
        ? daily.sunrise[index]
        : null,
    sunset:
      Array.isArray(daily.sunset) && typeof daily.sunset[index] === 'string'
        ? daily.sunset[index]
        : null
  }));

  return {
    city,
    temp,
    apparent_temp: Math.round(current.apparent_temperature ?? temp),
    humidity,
    rain_prob: Math.round(rainProb),
    wind_speed: windSpeed,
    condition_code: conditionCode,
    is_day: isDay,
    forecast,
    advisory,
    advisory_te: advisoryTe,
    observed_at: current.time || null,
    source: 'open-meteo',
    mode: 'live'
  };
}

async function callGemini(payload, timeoutMs) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini is not configured');
  }

  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      GEMINI_MODEL
    )}:generateContent`
  );
  endpoint.searchParams.set('key', GEMINI_API_KEY);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs)
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.error?.message || `Gemini returned HTTP ${response.status}`);
  }
  if (!body) {
    throw new Error('Gemini returned an empty response');
  }
  return body;
}

function extractGeminiText(body) {
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Gemini response did not include text');
  }
  return text.trim();
}

function findSpeechAudio(body) {
  if (typeof body?.output_audio?.data === 'string') {
    return body.output_audio.data;
  }

  const steps = Array.isArray(body?.steps) ? body.steps : [];
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];
    if (step?.type !== 'model_output' || !Array.isArray(step.content)) continue;
    for (let itemIndex = step.content.length - 1; itemIndex >= 0; itemIndex -= 1) {
      const item = step.content[itemIndex];
      if (item?.type === 'audio' && typeof item.data === 'string') {
        return item.data;
      }
    }
  }

  const parts = body?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    for (const part of parts) {
      const inline = part?.inlineData ?? part?.inline_data;
      if (typeof inline?.data === 'string') return inline.data;
    }
  }

  return null;
}

function pcmToWav(pcm, sampleRate = 24_000) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function synthesizeSpeech(text, lang, voice) {
  if (!GEMINI_API_KEY) {
    throw new HttpError(
      503,
      'Natural voice is not configured. Add GEMINI_API_KEY to enable it.',
      'tts_not_configured'
    );
  }

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY
    },
    body: JSON.stringify({
      model: GEMINI_TTS_MODEL,
      input: [
        {
          type: 'user_input',
          content: [
            {
              type: 'text',
              text,
              annotations: [
                {
                  type: 'speech_metadata',
                  style:
                    lang === 'te'
                      ? 'natural, warm, clear Telugu for farmers'
                      : 'natural, warm, clear Indian English for farmers'
                }
              ]
            }
          ]
        }
      ],
      response_format: { type: 'audio', mime_type: 'audio/wav', sample_rate: 24_000 },
      generation_config: { speech_config: [{ voice }] }
    }),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS)
  });

  const raw = await response.text();
  let body = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.error?.message || `Gemini TTS returned HTTP ${response.status}`);
  }

  const audioBase64 = findSpeechAudio(body);
  if (!audioBase64) {
    throw new Error('Gemini TTS response did not include audio');
  }

  const audio = Buffer.from(audioBase64, 'base64');
  if (audio.length < 44 || audio.toString('ascii', 0, 4) !== 'RIFF') {
    return pcmToWav(audio);
  }
  return audio;
}

async function callGeminiChat(query, lang) {
  const body = await callGemini(
    {
      system_instruction: {
        parts: [
          {
            text: `You are Rythu Mitra, an agricultural advisor for farmers in Telangana. Answer in ${
              lang === 'te' ? 'Telugu' : 'English'
            }. Give practical agronomy guidance with exact fertilizer doses, organic remedies, and chemical active ingredients with dosage per litre when relevant. Use short paragraphs and bullet points. Do not invent schemes, prices, or guarantees.`
          }
        ]
      },
      contents: [{ role: 'user', parts: [{ text: query }] }]
    },
    AI_TIMEOUT_MS
  );
  return extractGeminiText(body);
}

async function callGeminiVision(base64ImageStr, lang) {
  const [meta, base64Data] = base64ImageStr.split(';base64,');
  const mimeType = meta.replace('data:', '') || 'image/jpeg';

  const body = await callGemini(
    {
      system_instruction: {
        parts: [
          {
            text: `You are an expert plant pathologist for Indian agriculture (Telangana). Analyze the leaf image and identify the crop, disease or pest, severity, symptoms, organic remedy, chemical treatment with exact dosage per litre, and prevention. Reply in ${
              lang === 'te' ? 'Telugu' : 'English'
            } where the schema asks for localised text. Output ONLY valid JSON matching this schema with no markdown fences:
{
  "crop": "English crop name",
  "crop_te": "తెలుగు పంట పేరు",
  "disease": "English disease or pest name",
  "disease_te": "తెలుగు వ్యాధి పేరు",
  "severity": "Low | Moderate | High",
  "severity_te": "తక్కువ | మధ్యస్థం | తీవ్రం",
  "symptoms": "Visible symptoms in English",
  "symptoms_te": "లక్షణాలు తెలుగులో",
  "organic_cure": "Organic treatment in English",
  "organic_te": "సేంద్రీయ నివారణ తెలుగులో",
  "chemical_cure": "Chemical treatment with dosage in English",
  "chemical_te": "రసాయన మందులు మరియు మోతాదు తెలుగులో",
  "prevention": "Prevention in English",
  "prevention_te": "ముందస్తు జాగ్రత్తలు తెలుగులో"
}`
          }
        ]
      },
      contents: [
        {
          role: 'user',
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Data } },
            { text: 'Diagnose this leaf. Output pure JSON matching the schema.' }
          ]
        }
      ],
      generationConfig: { response_mime_type: 'application/json' }
    },
    AI_TIMEOUT_MS
  );

  const raw = extractGeminiText(body);
  const clean = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  let diagnosis;
  try {
    diagnosis = JSON.parse(clean);
  } catch {
    throw new Error('Gemini returned invalid diagnosis JSON');
  }
  if (!diagnosis || typeof diagnosis.disease !== 'string') {
    throw new Error('Gemini diagnosis was missing required fields');
  }
  return diagnosis;
}

function answerAgronomyQueryOffline(query, lang) {
  const q = query.toLowerCase();

  if (
    q.includes('urea') ||
    q.includes('వరి') ||
    q.includes('paddy') ||
    q.includes('fertilizer') ||
    q.includes('నత్రజని')
  ) {
    return lang === 'te'
      ? 'వరి పైరుకు ఎకరానికి ఎరువుల మోతాదు: ఆఖరి దుక్కిలో 30 కిలోల యూరియా + 100 కిలోల SSP + 25 కిలోల పొటాష్. నాటిన 20 నుండి 25 రోజులకు (పిలక దశ) 30 కిలోల యూరియా, మరియు 40 నుండి 45 రోజులకు (చిరుపొట్ట దశ) 25 కిలోల యూరియా + 15 కిలోల పొటాష్ వేయాలి.'
      : 'For 1 acre of Paddy: Apply 30kg Urea + 100kg SSP + 25kg MOP as basal dose during puddling. Top dress 30kg Urea at active tillering (21 to 25 DAT) and 25kg Urea + 15kg Potash at panicle initiation (40 to 45 DAT).';
  }

  if (q.includes('chilli') || q.includes('మిరప') || q.includes('leaf curl') || q.includes('ముడత')) {
    return lang === 'te'
      ? 'మిరపలో ఆకు ముడత నివారణకు: వేప నూనె 5 మి.లీ లీటరు నీటికి కలిపి పిచికారీ చేయాలి. తెల్లదోమ మరియు తామర పురుగుల నివారణకు ఫిప్రోనిల్ 5% SC @ 2 మి.లీ లేదా డయాఫెంథియురాన్ @ 1.25 గ్రా లీటరు నీటికి పిచికారీ చేయాలి.'
      : 'For Chilli Leaf Curl control: Spray Neem Oil @ 5ml/L or 5% NSKE. For vector whiteflies/thrips, spray Fipronil 5% SC @ 2ml/L or Diafenthiuron 50% WP @ 1.25g/L.';
  }

  if (
    q.includes('cotton') ||
    q.includes('ప్రత్తి') ||
    q.includes('bollworm') ||
    q.includes('పురుగు')
  ) {
    return lang === 'te'
      ? 'ప్రత్తిలో గులాబీ రంగు కాయ తొలుచు పురుగు నివారణకు: ఎకరానికి 8 లింగాకర్షక బుట్టలు అమర్చాలి. తీవ్రత ఎక్కువగా ఉంటే క్లోరాంట్రానిలిప్రోల్ 18.5% SC @ 0.3 మి.లీ లేదా ఎమామెక్టిన్ బెంజోయేట్ @ 0.4 గ్రా లీటరు నీటికి కలిపి పిచికారీ చేయండి.'
      : 'For Pink Bollworm in Cotton: Install 8 pheromone traps per acre. If infestation is high, spray Chlorantraniliprole 18.5% SC @ 0.3ml/L or Emamectin Benzoate 5% SG @ 0.4g/L.';
  }

  return lang === 'te'
    ? 'వ్యవసాయంలో సమతుల్య ఎరువులు మరియు సమగ్ర సస్యరక్షణ పాటించడం వల్ల మేలైన దిగుబడులు సాధించవచ్చు. మీ పంట పేరు మరియు లక్షణాలను తెలియజేయండి.'
    : 'For optimal crop yield, follow integrated pest management (IPM) and soil-test-based fertilizer application. Please specify your crop name and symptoms for detailed advice.';
}

const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=\s]+$/i;

function assertAllowedMethod(req, allowed) {
  console.log('[API] assertAllowedMethod', req.method, allowed);
  if (!allowed.includes(req.method)) {
    const error = new HttpError(405, 'Method not allowed', 'method_not_allowed');
    error.allow = allowed.join(', ');
    throw error;
  }
}

async function route(req, res, url) {
  const pathname = url.pathname;

  if (pathname === '/api/health' && req.method === 'GET') {
    return sendJson(req, res, 200, {
      status: 'ok',
      service: 'rythu-mitra-api',
      version: VERSION,
      uptime_seconds: Math.round((Date.now() - STARTED_AT) / 1000),
      ai: { configured: Boolean(GEMINI_API_KEY), model: GEMINI_MODEL },
      tts: {
        configured: Boolean(GEMINI_API_KEY),
        model: GEMINI_TTS_MODEL,
        voice: GEMINI_TTS_VOICE
      },
      time: new Date().toISOString()
    });
  }

  if (pathname === '/api/ready' && req.method === 'GET') {
    const ready = Array.isArray(mandiPrices.commodities) && mandiPrices.commodities.length > 0;
    return sendJson(req, res, ready ? 200 : 503, {
      status: ready ? 'ready' : 'degraded',
      data: {
        mandi: Array.isArray(mandiPrices.commodities) ? mandiPrices.commodities.length : 0
      }
    });
  }

  if (pathname === '/api/mandi') {
    assertAllowedMethod(req, ['GET']);
    if (!DATA_GOV_IN_API_KEY) {
      throw new HttpError(503, 'DATA_GOV_IN_API_KEY is not configured', 'mandi_not_configured');
    }
    try {
      const live = await fetchMandiFromGov();
      return sendJson(req, res, 200, {
        ...live,
        mode: 'live',
        source: 'data.gov.in',
        live: true
      });
    } catch (error) {
      log('error', 'mandi_gov_failed', { error: error.message });
      throw new HttpError(502, 'Government Mandi API data is temporarily unavailable: ' + error.message, 'mandi_unavailable');
    }
  }

  if (pathname === '/api/weather') {
    assertAllowedMethod(req, ['GET']);
    const latParam = url.searchParams.get('lat');
    const lonParam = url.searchParams.get('lon');
    const lat = latParam === null ? 16.3067 : parseCoordinate(latParam, -90, 90);
    const lon = lonParam === null ? 80.4365 : parseCoordinate(lonParam, -180, 180);
    if (lat === null || lon === null) {
      throw new HttpError(400, 'Latitude or longitude is invalid', 'invalid_coordinates');
    }
    const city = clampString(url.searchParams.get('city') || 'Hyderabad', 80) || 'Hyderabad';

    try {
      const payload = await fetchWeather(lat, lon, city);
      return sendJson(req, res, 200, payload);
    } catch (error) {
      log('error', 'weather_upstream_failed', { error: error.message });
      return sendJson(req, res, 502, {
        error: 'Weather service is temporarily unavailable. Please try again.',
        code: 'weather_unavailable',
        mode: 'degraded'
      });
    }
  }

  if (pathname === '/api/chat') {
    assertAllowedMethod(req, ['POST']);
    const body = await readJsonBody(req);
    const query = clampString(body.query, 2000);
    const lang = parseLanguage(body.lang);

    if (!query) {
      throw new HttpError(400, 'Query is required', 'query_required');
    }

    if (GEMINI_API_KEY) {
      // In production with an active Gemini key, always call live AI model
      const reply = await callGeminiChat(query, lang);
      return sendJson(req, res, 200, {
        success: true,
        reply,
        live: true,
        mode: 'live',
        model: GEMINI_MODEL
      });
    }

    if (process.env.ENABLE_LOCAL_FALLBACK === '1' || !GEMINI_API_KEY) {
      return sendJson(req, res, 200, {
        success: true,
        reply: answerAgronomyQueryOffline(query, lang),
        live: false,
        mode: 'degraded',
        source: 'local-knowledge',
        reason: 'not_configured'
      });
    }
  }

  if (pathname === '/api/diagnose') {
    console.log('[API] diagnose request received');
    assertAllowedMethod(req, ['POST']);
    const body = await readJsonBody(req);
    const image = typeof body.image === 'string' ? body.image.trim() : '';
    const lang = parseLanguage(body.lang);

    if (!image) {
      throw new HttpError(400, 'A leaf image is required', 'image_required');
    }
    if (image.length > MAX_BODY_BYTES) {
      throw new HttpError(413, 'Image is too large', 'payload_too_large');
    }
    if (!IMAGE_DATA_URL.test(image)) {
      throw new HttpError(
        400,
        'Image must be a base64 data URL in PNG, JPEG, or WebP format',
        'invalid_image'
      );
    }
    if (!GEMINI_API_KEY) {
      throw new HttpError(
        503,
        'Crop diagnosis is not configured. Add GEMINI_API_KEY to enable live image analysis.',
        'diagnosis_not_configured'
      );
    }

    try {
      const diagnosis = await callGeminiVision(image, lang);
      return sendJson(req, res, 200, {
        success: true,
        diagnosis,
        live: true,
        mode: 'live',
        model: GEMINI_MODEL
      });
      console.log('[API] diagnose response sent');
    } catch (error) {
      log('error', 'diagnose_live_failed', { error: error.message });
      throw new HttpError(
        502,
        'The vision model could not analyze this image. Please try again.',
        'diagnosis_unavailable'
      );
    }
  }

  if (pathname === '/api/tts') {
    assertAllowedMethod(req, ['POST']);
    if (!GEMINI_API_KEY) {
      throw new HttpError(
        503,
        'Natural voice is not configured. Add GEMINI_API_KEY to enable it.',
        'tts_not_configured'
      );
    }

    const body = await readJsonBody(req);
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const lang = parseLanguage(body.lang);
    const requestedVoice = typeof body.voice === 'string' ? body.voice.trim() : '';
    const voice = /^[A-Za-z0-9_-]{1,64}$/.test(requestedVoice)
      ? requestedVoice
      : GEMINI_TTS_VOICE;

    if (!text) {
      throw new HttpError(400, 'Text is required', 'text_required');
    }
    if (text.length > TTS_MAX_CHARS) {
      throw new HttpError(
        413,
        `Text must be ${TTS_MAX_CHARS} characters or fewer`,
        'text_too_long'
      );
    }

    const cacheKey = crypto
      .createHash('sha256')
      .update(`${voice}|${lang}|${text}`)
      .digest('hex');
    const cached = ttsCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < TTS_CACHE_TTL_MS) {
      return sendAudio(req, res, 200, cached.audio);
    }

    try {
      const audio = await synthesizeSpeech(text, lang, voice);
      ttsCache.set(cacheKey, { createdAt: Date.now(), audio });
      if (ttsCache.size > TTS_CACHE_MAX) {
        ttsCache.delete(ttsCache.keys().next().value);
      }
      return sendAudio(req, res, 200, audio);
    } catch (error) {
      log('error', 'tts_failed', { error: error.message, model: GEMINI_TTS_MODEL });
      throw new HttpError(
        502,
        'The natural voice service is temporarily unavailable. Please try again.',
        'tts_unavailable'
      );
    }
  }

  if (pathname.startsWith('/api/')) {
    throw new HttpError(404, 'API endpoint not found', 'not_found');
  }

  throw new HttpError(404, 'Not found', 'not_found');
}

function createServer() {
  return http.createServer(async (req, res) => {
    const startedAt = process.hrtime.bigint();
    const requestId = crypto.randomUUID();
    let url;
    try {
      url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    } catch {
      res.statusCode = 400;
      res.end();
      return;
    }

    setBaseHeaders(req, res, requestId);

    try {
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const ip = clientIp(req);
      const isProbe = url.pathname === '/api/health' || url.pathname === '/api/ready';
      if (!isProbe) {
        const general = consumeRateLimit(`${ip}:all`, RATE_LIMIT_MAX);
        if (!general.allowed) {
          res.setHeader('Retry-After', String(general.retryAfterSeconds));
          sendJson(req, res, 429, {
            error: 'Too many requests. Please slow down and try again.',
            code: 'rate_limited'
          });
          return;
        }
      }

      if (
        url.pathname === '/api/chat' ||
        url.pathname === '/api/diagnose' ||
        url.pathname === '/api/tts'
      ) {
        const aiLimit = consumeRateLimit(`${ip}:ai`, AI_RATE_LIMIT_MAX);
        if (!aiLimit.allowed) {
          res.setHeader('Retry-After', String(aiLimit.retryAfterSeconds));
          sendJson(req, res, 429, {
            error: 'AI request limit reached. Please wait a minute and try again.',
            code: 'ai_rate_limited'
          });
          return;
        }
      }

      await route(req, res, url);
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.allow) res.setHeader('Allow', error.allow);
        sendJson(req, res, error.status, { error: error.message, code: error.code });
      } else {
        log('error', 'unhandled_request_error', {
          request_id: requestId,
          error: error.message,
          stack: IS_PRODUCTION ? undefined : error.stack
        });
        sendJson(req, res, 500, { error: 'Internal server error', code: 'internal_error' });
      }
    } finally {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      log('info', 'request', {
        request_id: requestId,
        method: req.method,
        path: url.pathname,
        status: res.statusCode,
        duration_ms: Math.round(durationMs)
      });
    }
  });
}

function start() {
  const server = createServer();
  server.requestTimeout = 60_000;
  server.headersTimeout = 15_000;
  server.keepAliveTimeout = 5_000;

  server.listen(PORT, HOST, () => {
    log('info', 'server_started', {
      port: PORT,
      host: HOST,
      env: NODE_ENV,
      ai_configured: Boolean(GEMINI_API_KEY),
      ai_model: GEMINI_MODEL,
      tts_model: GEMINI_TTS_MODEL,
      tts_voice: GEMINI_TTS_VOICE
    });
  });

  const shutdown = (signal) => {
    log('info', 'server_stopping', { signal });
    server.close((error) => {
      if (error) {
        log('error', 'server_close_failed', { error: error.message });
        process.exit(1);
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

if (require.main === module) {
  start();
}

module.exports = {
  createServer,
  start,
  answerAgronomyQueryOffline,
  buildWeatherPayload,
  parseCoordinate,
  findSpeechAudio,
  pcmToWav
};
