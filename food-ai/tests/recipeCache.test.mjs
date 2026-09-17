import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeCache, recipeCacheKey } from '../src/recipeCache.js';

const request = { videoInput: 'https://x.com/mrmake1thappen/status/2082996460417671336?s=46' };
const success = () => ({ statusCode: 200, body: JSON.stringify({ success: true, data: { recipe: { title: 'Pasta' } } }) });
const body = response => JSON.parse(response.body);
function fakeStorage() {
  const entries = new Map();
  return { entries, read: async key => entries.get(key), write: async (key, entry) => entries.set(key, structuredClone(entry)) };
}

test('X aliases, share params and account names identify the same post', () => {
  const key = recipeCacheKey(request);
  assert.equal(key, recipeCacheKey({ videoInput: 'https://twitter.com/another/status/2082996460417671336' }));
  assert.notEqual(key, recipeCacheKey({ videoInput: 'https://x.com/mrmake1thappen/status/2082996460417671337' }));
  assert.doesNotMatch(key, /mrmake|208299/);
});

test('YouTube, Instagram and TikTok share variants match', () => {
  for (const variants of [
    ['https://youtu.be/abcdefghijk?si=tracking', 'https://www.youtube.com/watch?v=abcdefghijk&t=30', 'https://youtube.com/shorts/abcdefghijk'],
    ['https://www.instagram.com/reel/Abc123/?igsh=abc', 'https://instagr.am/p/Abc123/'],
    ['https://www.tiktok.com/@chef/video/12345?share_id=a', 'https://m.tiktok.com/@chef/video/12345'],
  ]) assert.equal(new Set(variants.map(videoInput => recipeCacheKey({ videoInput }))).size, 1);
});

test('language and search intent are isolated; unknown URL identities are preserved', () => {
  assert.notEqual(recipeCacheKey(request), recipeCacheKey({ ...request, lang: 'fr' }));
  assert.notEqual(recipeCacheKey(request), recipeCacheKey({ ...request, recipeName: 'vegan' }));
  assert.notEqual(recipeCacheKey({ videoInput: 'https://facebook.com/watch?v=123' }), recipeCacheKey({ videoInput: 'https://facebook.com/watch?v=456' }));
  assert.notEqual(recipeCacheKey({ videoInput: 'https://example.com/video?token=a' }), recipeCacheKey({ videoInput: 'https://example.com/video?token=b' }));
  assert.equal(recipeCacheKey({ videoInput: 'not a url' }), null);
  assert.equal(recipeCacheKey({ videoInput: 'file:///tmp/video' }), null);
});

test('repeat requests skip generation and survive a fresh cache instance', async () => {
  const storage = fakeStorage();
  const first = createRecipeCache({ storage });
  let calls = 0;
  const generate = async () => { calls++; return success(); };
  await first.run(request, generate);
  assert.equal(body(await first.run(request, generate)).cacheSource, 'memory');
  const restarted = createRecipeCache({ storage });
  assert.equal(body(await restarted.run(request, generate)).cacheSource, 'persistent');
  assert.equal(calls, 1);
});

test('concurrent equivalent URLs share one provider request and one cache read', async () => {
  let calls = 0, reads = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  const cache = createRecipeCache({ storage: { read: async () => { reads++; return null; }, write: async () => {} } });
  const generate = async () => { calls++; await gate; return success(); };
  const a = cache.run(request, generate);
  const b = cache.run({ videoInput: 'https://twitter.com/chef/status/2082996460417671336' }, generate);
  await new Promise(resolve => setImmediate(resolve));
  release();
  assert.deepEqual(await a, await b);
  assert.equal(calls, 1);
  assert.equal(reads, 1);
});

test('failures, exceptions and invalid success envelopes are never cached', async () => {
  for (const generateFailure of [
    async () => ({ statusCode: 503, body: '{"success":false,"error":"unavailable"}' }),
    async () => ({ statusCode: 200, body: '{"success":true,"validation":{}}' }),
    async () => { throw new Error('offline'); },
  ]) {
    const storage = fakeStorage();
    const cache = createRecipeCache({ storage });
    await cache.run(request, generateFailure).catch(() => {});
    assert.equal(storage.entries.size, 0);
    assert.equal(body(await cache.run(request, async () => success())).success, true);
    assert.equal(storage.entries.size, 1);
  }
});

test('validation always bypasses recipe cache, even after a successful recipe', async () => {
  const cache = createRecipeCache();
  await cache.run({ recipeName: 'pasta' }, async () => success());
  const validation = { statusCode: 200, body: '{"success":true,"validation":{"isFood":true}}' };
  assert.deepEqual(await cache.run({ recipeName: 'pasta', validateOnly: true }, async () => validation), validation);
});

test('storage read/write failures leave generation and memory cache working', async () => {
  const fail = async () => { throw new Error('storage down'); };
  const cache = createRecipeCache({ storage: { read: fail, write: fail }, warn: () => {} });
  assert.equal(body(await cache.run(request, async () => success())).success, true);
  assert.equal(body(await cache.run(request, fail)).cacheSource, 'memory');
});

test('expired persistent records regenerate; search recipes are memory-only for 30 minutes', async () => {
  let now = 0, calls = 0;
  const storage = fakeStorage();
  const cache = createRecipeCache({ storage, now: () => now });
  const generate = async () => { calls++; return success(); };
  await cache.run(request, generate);
  now = 31 * 86400000;
  await cache.run(request, generate);
  assert.equal(calls, 2);
  await cache.run({ recipeName: 'Pasta' }, generate);
  assert.equal(storage.entries.size, 1);
  now += 31 * 60000;
  await cache.run({ recipeName: 'Pasta' }, generate);
  assert.equal(calls, 4);
});

test('memory is bounded and clearing it retains persistent recipes', async () => {
  const storage = fakeStorage();
  const cache = createRecipeCache({ storage, maxEntries: 1 });
  await cache.run(request, async () => success());
  await cache.run({ videoInput: 'https://x.com/chef/status/456' }, async () => success());
  assert.equal(cache.clearMemory(), 1);
  assert.equal(body(await cache.run(request, () => { throw new Error('must not generate'); })).cacheSource, 'persistent');
});
