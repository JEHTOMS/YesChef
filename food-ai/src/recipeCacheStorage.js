import { createClient } from '@supabase/supabase-js';

const BUCKET = 'recipe-cache';
const missing = error => String(error?.statusCode) === '404'
  || /not found|does not exist/i.test(error?.message || '');

// Private, server-only storage. No table migration or browser credentials needed.
export function createRecipeCacheStorage(getClient) {
  let ready;
  async function ensureBucket(client) {
    if (!ready) ready = (async () => {
      let result = await client.storage.getBucket(BUCKET);
      if (result.error && missing(result.error)) {
        const created = await client.storage.createBucket(BUCKET, {
          public: false, allowedMimeTypes: ['application/json'], fileSizeLimit: 1024 * 1024,
        });
        // Another server may have created it concurrently. Always verify privacy.
        if (created.error && !/already exists|duplicate/i.test(created.error.message)) throw created.error;
        result = await client.storage.getBucket(BUCKET);
      }
      if (result.error) throw result.error;
      if (!result.data || result.data.public) throw new Error('Recipe cache bucket must be private');
    })().catch(error => { ready = undefined; throw error; });
    return ready;
  }
  return {
    async read(key) {
      const client = getClient();
      if (!client) return null;
      const { data, error } = await client.storage.from(BUCKET).download(key);
      if (error) { if (missing(error)) return null; throw error; }
      return JSON.parse(await data.text());
    },
    async write(key, entry) {
      const client = getClient();
      if (!client) return;
      await ensureBucket(client);
      const { error } = await client.storage.from(BUCKET).upload(key, JSON.stringify(entry), {
        contentType: 'application/json', upsert: true, cacheControl: '0',
      });
      if (error) throw error;
    },
  };
}

let client;
export const recipeCacheStorage = createRecipeCacheStorage(() => {
  // dotenv is loaded after imports by the server, so initialize on first request.
  if (!client && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (url, options = {}) => globalThis.fetch(url, {
        ...options,
        signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(3000)]) : AbortSignal.timeout(3000),
      }) },
    });
  }
  return client;
});
