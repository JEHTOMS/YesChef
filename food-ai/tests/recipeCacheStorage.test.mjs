import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeCacheStorage } from '../src/recipeCacheStorage.js';

function fakeClient({ publicBucket = false, race = false } = {}) {
  let bucket;
  const files = new Map();
  const missing = { statusCode: '404', message: 'not found' };
  const client = { storage: {
    getBucket: async () => bucket ? { data: bucket } : { error: missing },
    createBucket: async (name, options) => { bucket = { name, ...options, public: publicBucket }; return race ? { error: { message: 'Bucket already exists' } } : { data: bucket }; },
    from: () => ({
      upload: async (key, value) => { files.set(key, value); return {}; },
      download: async key => files.has(key) ? { data: new Blob([files.get(key)]) } : { error: missing },
    }),
  } };
  return { client, files, getBucket: () => bucket };
}

test('creates a private JSON bucket and round-trips a durable recipe', async () => {
  const { client, getBucket } = fakeClient();
  const storage = createRecipeCacheStorage(() => client);
  assert.equal(await storage.read('recipe.json'), null);
  const entry = { version: 1, expiresAt: 123, data: { recipe: { title: 'Pasta' } } };
  await storage.write('recipe.json', entry);
  assert.equal(getBucket().public, false);
  assert.deepEqual(getBucket().allowedMimeTypes, ['application/json']);
  const restarted = createRecipeCacheStorage(() => client);
  assert.deepEqual(await restarted.read('recipe.json'), entry);
});

test('concurrent bucket creation is safe; existing public buckets cannot receive recipes', async () => {
  const raced = fakeClient({ race: true });
  await createRecipeCacheStorage(() => raced.client).write('key', {});
  assert.equal(raced.files.size, 1);
  const exposed = fakeClient({ publicBucket: true });
  await assert.rejects(createRecipeCacheStorage(() => exposed.client).write('key', {}), /must be private/);
  assert.equal(exposed.files.size, 0);
});

test('missing credentials are optional and a later client can become available', async () => {
  let client;
  const storage = createRecipeCacheStorage(() => client);
  assert.equal(await storage.read('key'), null);
  await storage.write('key', {});
  client = fakeClient().client;
  await storage.write('key', { valid: true });
  assert.deepEqual(await storage.read('key'), { valid: true });
});
