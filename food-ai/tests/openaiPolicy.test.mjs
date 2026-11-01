import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OpenAI } from 'openai';
import { chatOptions, OPENAI_CLIENT_OPTIONS, callOpenAIWithRetry, publicAIError } from '../src/openaiPolicy.js';
const failure = (status, code) => Object.assign(new Error('private upstream details'), { status, code });

test('SDK sends GPT-6 requests with preserved budgets and JSON mode', async () => {
  delete process.env.OPENAI_MODEL;
  const sent = [];
  const client = new OpenAI({ apiKey: 'test-only', ...OPENAI_CLIENT_OPTIONS, fetch: async (_, init) => {
    sent.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"isFood":true}' } }] }), { status: 200, headers: { 'content-type': 'application/json' } });
  } });
  for (const limit of [100, 150, 2000]) await client.chat.completions.create({ ...chatOptions(limit), messages: [{ role: 'user', content: 'Return JSON.' }], response_format: { type: 'json_object' } });
  for (const [index, body] of sent.entries()) {
    assert.equal(body.model, 'gpt-6-luna');
    assert.equal(body.reasoning_effort, 'none');
    assert.equal(body.max_completion_tokens, [100, 150, 2000][index]);
    assert.equal(body.max_tokens, undefined);
    assert.deepEqual(body.response_format, { type: 'json_object' });
  }
  process.env.OPENAI_MODEL = 'gpt-6-luna-test-snapshot';
  assert.equal(chatOptions().model, 'gpt-6-luna-test-snapshot');
  delete process.env.OPENAI_MODEL;
});

test('quota errors make exactly one HTTP attempt, including SDK behavior', async () => {
  let calls = 0;
  const client = new OpenAI({ apiKey: 'test-only', ...OPENAI_CLIENT_OPTIONS, fetch: async () => {
    calls++;
    return new Response(JSON.stringify({ error: { message: 'credits exhausted', type: 'insufficient_quota', code: 'insufficient_quota' } }), { status: 429, headers: { 'content-type': 'application/json' } });
  } });
  await assert.rejects(callOpenAIWithRetry(() => client.chat.completions.create({ ...chatOptions(), messages: [] }), { sleep: () => assert.fail('quota must not retry') }), error => publicAIError(error).code === 'ai_quota_exceeded');
  assert.equal(calls, 1);
});

test('temporary 429 honors Retry-After and stops after two attempts', async () => {
  let calls = 0; const delays = [];
  const error = Object.assign(failure(429, 'rate_limit_exceeded'), { headers: new Headers({ 'retry-after': '2' }) });
  await assert.rejects(callOpenAIWithRetry(async () => { calls++; throw error; }, { sleep: async ms => delays.push(ms) }), error);
  assert.equal(calls, 2);
  assert.deepEqual(delays, [2000]);
  assert.equal(publicAIError(error).statusCode, 429);
});

test('long Retry-After, auth and quota failures never retry', async () => {
  for (const error of [failure(401), failure(404), failure(429, 'credit_balance_exhausted'), Object.assign(failure(429), { headers: { 'retry-after': '60' } })]) {
    let calls = 0;
    await assert.rejects(callOpenAIWithRetry(async () => { calls++; throw error; }, { sleep: () => assert.fail('must not retry') }), error);
    assert.equal(calls, 1);
  }
});

test('temporary outages recover and public errors exclude provider details', async () => {
  let calls = 0;
  assert.equal(await callOpenAIWithRetry(async () => { if (++calls === 1) throw failure(503); return 'ok'; }, { sleep: async () => {} }), 'ok');
  for (const error of [failure(401), failure(429), failure(503), failure(429, 'insufficient_quota')]) assert.doesNotMatch(JSON.stringify(publicAIError(error)), /private upstream details/);
  assert.equal(publicAIError(new SyntaxError('bad JSON')), null);
});
