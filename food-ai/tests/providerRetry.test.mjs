import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ServerError, AuthenticationError, VidNavigatorError } from 'vidnavigator';
import { withProviderRetry, providerStatus } from '../src/providerRetry.js';

test('SDK server errors retry once and recover', async () => {
  let calls = 0;
  const delays = [];
  const result = await withProviderRetry(async () => {
    if (++calls === 1) throw new ServerError('provider failed', 500);
    return 'transcript';
  }, async ms => delays.push(ms));
  assert.equal(result, 'transcript');
  assert.equal(calls, 2);
  assert.deepEqual(delays, [1000]);
});

test('persistent 5xx errors stop after two total attempts', async () => {
  let calls = 0;
  const error = new ServerError('offline', 503);
  await assert.rejects(withProviderRetry(async () => { calls++; throw error; }, async () => {}), error);
  assert.equal(calls, 2);
});

test('auth, billing, invalid links, rate limits and ambiguous timeouts are not retried', async () => {
  for (const error of [new AuthenticationError('invalid key', 401), ...[400, 402, 403, 404, 429].map(status => new VidNavigatorError('permanent', status)), new VidNavigatorError('timeout')]) {
    let calls = 0;
    await assert.rejects(withProviderRetry(async () => { calls++; throw error; }, async () => assert.fail('unexpected retry')), error);
    assert.equal(calls, 1);
  }
  assert.equal(providerStatus(new AuthenticationError('invalid key', 401)), 401);
});
