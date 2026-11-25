'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.GEMINI_API_KEY = '';

const { createServer, findSpeechAudio, pcmToWav, buildWeatherPayload } = require('../server');

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
});

function post(path, body, headers = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

test('health reports service status without leaking the API key', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'rythu-mitra-api');
  assert.equal(body.ai.configured, false);
  assert.equal(body.tts.configured, false);
  assert.equal('apiKey' in body, false);
});

test('readiness reports loaded datasets', async () => {
  const response = await fetch(`${baseUrl}/api/ready`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ready');
  assert.ok(body.data.mandi > 0);
});

test('mandi prices require live data.gov.in data', async () => {
  const response = await fetch(`${baseUrl}/api/mandi`);
  if (response.status === 200) {
    const body = await response.json();
    assert.equal(body.mode, 'live');
    assert.equal(body.source, 'data.gov.in');
    assert.ok(Array.isArray(body.commodities));
    assert.ok(body.commodities.length > 0);
    return;
  }
  assert.ok(response.status === 502 || response.status === 503);
  const body = await response.json();
  assert.ok(body.code === 'mandi_unavailable' || body.code === 'mandi_not_configured');
});

test('the removed demo scenarios endpoint returns JSON 404', async () => {
  const response = await fetch(`${baseUrl}/api/demo-scenarios`);
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.code, 'not_found');
});

test('removed configuration endpoint is not reachable', async () => {
  const response = await fetch(`${baseUrl}/api/config`);
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.code, 'not_found');
});

test('unknown API paths return JSON 404 instead of HTML', async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`);
  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type') || '', /application\/json/);
  const body = await response.json();
  assert.equal(body.code, 'not_found');
});

test('chat without a configured model returns a labelled local answer', async () => {
  const response = await post('/api/chat', { query: 'paddy fertilizer dose', lang: 'en' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.mode, 'degraded');
  assert.equal(body.live, false);
  assert.equal(body.reason, 'not_configured');
  assert.equal(typeof body.reply, 'string');
  assert.ok(body.reply.length > 0);
});

test('chat rejects empty queries', async () => {
  const response = await post('/api/chat', { query: '   ', lang: 'en' });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.code, 'query_required');
});

test('chat requires a JSON content type', async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'hello'
  });
  assert.equal(response.status, 415);
});

test('chat rejects malformed JSON', async () => {
  const response = await post('/api/chat', '{"query":');
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.code, 'invalid_json');
});

test('chat rejects unsupported methods', async () => {
  const response = await fetch(`${baseUrl}/api/chat`);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
});

test('diagnose requires an image', async () => {
  const response = await post('/api/diagnose', { lang: 'en' });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.code, 'image_required');
});

test('diagnose rejects non-image payloads', async () => {
  const response = await post('/api/diagnose', { image: 'not-an-image', lang: 'en' });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.code, 'invalid_image');
});

test('diagnose refuses to invent a result without a model key', async () => {
  const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1kAAAAASUVORK5CYII=';
  const response = await post('/api/diagnose', { image, lang: 'en' });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, 'diagnosis_not_configured');
});

test('natural voice reports that it needs the Google AI Studio key', async () => {
  const response = await post('/api/tts', { text: 'నమస్తే', lang: 'te' });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, 'tts_not_configured');
});

test('natural voice rejects unsupported methods', async () => {
  const response = await fetch(`${baseUrl}/api/tts`);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
});

test('weather validates coordinates before calling upstream', async () => {
  const response = await fetch(`${baseUrl}/api/weather?lat=999&lon=80`);
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.code, 'invalid_coordinates');
});

test('weather payload includes a seven-day forecast and condition code', () => {
  const dates = Array.from({ length: 7 }, (_, index) => `2026-11-${24 + index}`);
  const payload = buildWeatherPayload('Guntur', {
    current: {
      time: '2026-11-24T10:00',
      temperature_2m: 31.4,
      relative_humidity_2m: 62,
      apparent_temperature: 34.1,
      weather_code: 2,
      is_day: 1,
      wind_speed_10m: 12.2
    },
    daily: {
      time: dates,
      weather_code: [2, 3, 61, 0, 1, 80, 95],
      temperature_2m_max: [32, 31, 29, 30, 33, 28, 27],
      temperature_2m_min: [21, 20, 19, 20, 22, 19, 18],
      precipitation_probability_max: [10, 20, 80, 5, 0, 65, 75],
      wind_speed_10m_max: [12, 14, 18, 10, 9, 20, 22],
      sunrise: dates.map((date) => `${date}T06:15`),
      sunset: dates.map((date) => `${date}T17:45`)
    }
  });

  assert.equal(payload.condition_code, 2);
  assert.equal(payload.forecast.length, 7);
  assert.deepEqual(payload.forecast[0], {
    date: '2026-11-24',
    code: 2,
    max: 32,
    min: 21,
    rain_prob: 10,
    wind_speed: 12,
    sunrise: '2026-11-24T06:15',
    sunset: '2026-11-24T17:45'
  });
  assert.equal(payload.forecast[6].code, 95);
});

test('CORS is restricted to configured origins', async () => {
  const allowed = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'http://localhost:3100' }
  });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:3100');

  const blocked = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://evil.example' }
  });
  assert.equal(blocked.headers.get('access-control-allow-origin'), null);
});

test('preflight requests are answered without a body', async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:3100',
      'Access-Control-Request-Method': 'POST'
    }
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3100');
});

test('responses carry baseline security headers', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.ok(response.headers.get('x-request-id'));
  assert.match(response.headers.get('content-security-policy') || '', /default-src 'none'/);
});

test('speech audio is extracted from Gemini interaction responses', () => {
  const body = {
    steps: [
      { type: 'model_output', content: [{ type: 'text', text: 'ignored' }] },
      { type: 'model_output', content: [{ type: 'audio', data: 'UklGRg==' }] }
    ]
  };
  assert.equal(findSpeechAudio(body), 'UklGRg==');
  assert.equal(findSpeechAudio({ output_audio: { data: 'abc' } }), 'abc');
  assert.equal(findSpeechAudio({}), null);
});

test('raw PCM is wrapped in a playable WAV container', () => {
  const pcm = Buffer.alloc(4);
  const wav = pcmToWav(pcm);
  assert.equal(wav.length, 48);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt32LE(40), 4);
});
