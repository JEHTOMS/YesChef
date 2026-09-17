import { createHash } from 'node:crypto';

const LINK_TTL = 30 * 24 * 60 * 60 * 1000;
const SEARCH_TTL = 30 * 60 * 1000;

// Normalize only known video identities; keep unknown query parameters so distinct
// videos (and URLs carrying access tokens) cannot accidentally share a result.
export function canonicalVideoUrl(input) {
  const url = new URL(input.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
  if (['youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
    const id = host === 'youtu.be' ? url.pathname.split('/')[1]
      : url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed|v|live)\/([^/]+)/)?.[1];
    if (id && /^[\w-]{11}$/.test(id)) return `youtube:${id}`;
  }
  if (['instagram.com', 'instagr.am'].includes(host)) {
    const id = url.pathname.match(/^\/(?:reel|reels|p|tv)\/([\w-]+)\/?$/)?.[1];
    if (id) return `instagram:${id}`;
  }
  if (host === 'tiktok.com') {
    const id = url.pathname.match(/^\/@[^/]+\/video\/(\d+)\/?$/)?.[1];
    if (id) return `tiktok:${id}`;
  }
  if (['twitter.com', 'x.com'].includes(host)) {
    const id = url.pathname.match(/^\/[^/]+\/status\/(\d+)\/?$/)?.[1];
    if (id) return `twitter:${id}`;
  }
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ['fbclid', 'igsh', 'igshid'].includes(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return url.toString();
}

export function recipeCacheKey(request) {
  if (request?.validateOnly) return null;
  const lang = typeof request?.lang === 'string' ? request.lang.trim().toLowerCase() : 'en';
  const name = typeof request?.recipeName === 'string' ? request.recipeName.trim().toLowerCase() : '';
  let identity;
  try {
    identity = request?.videoInput ? canonicalVideoUrl(request.videoInput) : name;
  } catch { return null; }
  if (!identity) return null;
  const kind = request.videoInput ? 'link' : 'search';
  const digest = createHash('sha256').update(JSON.stringify([identity, name, lang || 'en'])).digest('hex');
  return `v1/${kind}/${digest}.json`;
}

export function createRecipeCache({ storage, now = Date.now, maxEntries = 200, warn = console.warn } = {}) {
  const memory = new Map();
  const pending = new Map();
  const valid = entry => entry?.version === 1 && Number.isFinite(entry.expiresAt)
    && entry.expiresAt > now() && !!entry.data?.recipe;
  const remember = (key, entry) => {
    memory.delete(key);
    memory.set(key, entry);
    if (memory.size > maxEntries) memory.delete(memory.keys().next().value);
  };
  const hit = (entry, source) => ({
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, data: entry.data, fromCache: true, cacheSource: source }),
  });

  return {
    clearMemory() { const size = memory.size; memory.clear(); return size; },
    async run(request, generate) {
      const key = recipeCacheKey(request);
      if (!key) return generate();
      const local = memory.get(key);
      if (valid(local)) return hit(local, 'memory');
      memory.delete(key);
      if (pending.has(key)) return pending.get(key);
      const task = (async () => {
        if (request.videoInput && storage) {
          try {
            const stored = await storage.read(key);
            if (valid(stored)) { remember(key, stored); return hit(stored, 'persistent'); }
          } catch (error) { warn('Recipe cache read unavailable:', error.message); }
        }
        const response = await generate();
        let payload;
        try { payload = JSON.parse(response.body); } catch { return response; }
        if (response.statusCode !== 200 || !payload.success || !payload.data?.recipe) return response;
        const entry = { version: 1, expiresAt: now() + (request.videoInput ? LINK_TTL : SEARCH_TTL), data: payload.data };
        remember(key, entry);
        if (request.videoInput && storage) {
          try { await storage.write(key, entry); }
          catch (error) { warn('Recipe cache write unavailable:', error.message); }
        }
        return response;
      })();
      pending.set(key, task);
      try { return await task; } finally { pending.delete(key); }
    },
  };
}
