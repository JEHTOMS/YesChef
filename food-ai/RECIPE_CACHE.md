# Recipe link cache

Successful `/api/recipe` link results are reused for 30 days. The server checks a
bounded memory cache, then a private Supabase Storage bucket named `recipe-cache`,
before calling the video or recipe providers. Simultaneous equivalent requests
within one server share the same work. Different server instances share stored
results, but do not share an in-flight lock.

The existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` Railway variables enable
persistence. The server creates the private bucket on its first successful link
request; no SQL migration or frontend setting is required. Keys are versioned
SHA-256 hashes of the canonical video identity, recipe query and language. Known
YouTube, Instagram, TikTok and X/Twitter video URLs ignore share tracking; short
redirect links are cached by their supplied URL without resolving redirects.

Only successful recipe responses are stored. Validation and errors are never
cached. Existing title-based recipe fallback behavior is unchanged. Text searches
remain memory-only for 30 minutes. Missing credentials or storage failures fall
back to memory and normal generation; storage requests have a three-second timeout.
A cache hit includes `fromCache: true` and `cacheSource: memory` or `persistent`.

Cache entries begin accumulating after this release; historical requests cannot
be recovered from the previous process-only cache. Expired objects are ignored
and replaced when requested again, but are not automatically deleted from Storage.
For maintenance, remove an individual hashed object or empty the private bucket
in Supabase. `/api/clear-cache` clears only server memory and retains durable
recipes. Do not make the bucket public or add client-access policies.

VidNavigator responses with HTTP 500, 502, 503 or 504 are retried once after one
second. Repeated temporary failures return a friendly HTTP 503 response. Auth,
billing, invalid links, rate limits and ambiguous network failures are not retried.
An uncached link still requires the external provider to succeed.

Run the server regression suite with Node 22:

```sh
node --experimental-test-module-mocks --test tests/*.test.mjs
```

Tests use provider and storage fixtures, with no paid API requests. They cover URL
identity, language isolation, validation, expiry, concurrency, storage failures,
restart reuse, both recipe success paths and provider error recovery.
