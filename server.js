// server.js
// Node 18+ has global fetch. If you're on older Node, uncomment next line:
// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set('trust proxy', true);

// Simple in-memory cache to reduce API calls (adjust TTL as needed)
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = {
  ts: 0,
  data: null
};

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, { headers = {}, retries = 3, backoffMs = 800 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers, cache: 'no-store' });
    } catch (e) {
      if (attempt === retries) throw e;
      await wait(backoffMs * Math.pow(2, attempt));
      continue;
    }

    // Handle unauthenticated rate limit: 403 + x-ratelimit-remaining: 0
    if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
      // If we have cached data, surface that instead of waiting
      const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000;
      const retryAfter = Math.max(0, reset - Date.now()) + 1000;
      const err = new Error('Rate limited');
      err.code = 'RATE_LIMITED';
      err.retryAfter = retryAfter;
      throw err;
    }

    // Retry transient server errors
    if (res.status >= 500 && res.status <= 599) {
      if (attempt === retries) throw new Error(`GitHub ${res.status}`);
      await wait(backoffMs * Math.pow(2, attempt));
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      const err = new Error(`GitHub error ${res.status}: ${text}`);
      err.status = res.status;
      throw err;
    }

    return res.json();
  }
}

async function fetchAllPublicRepos(user) {
  const perPage = 100;
  let page = 1;
  const all = [];

  while (true) {
    const url = `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=${perPage}&sort=created&direction=asc&page=${page}`;
    const batch = await fetchWithRetry(url, {
      headers: { Accept: 'application/vnd.github+json' }
    });

    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }

  // Ensure stable order (oldest -> newest)
  all.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  return all;
}

app.get('/api/repos', async (req, res) => {
  const user = req.query.user || 'MrEchoFi';

  // Serve from cache if fresh
  const now = Date.now();
  if (cache.data && (now - cache.ts) < CACHE_TTL_MS) {
    res.set('X-Cache', 'HIT');
    return res.status(200).json(cache.data);
  }

  try {
    const data = await fetchAllPublicRepos(user);
    cache.data = data;
    cache.ts = Date.now();

    // Cache headers for clients/CDN
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.set('X-Cache', 'MISS');
    return res.status(200).json(data);
  } catch (err) {
    console.error('Fetch error:', err.message);

    // If rate limited or transient errors and we have cache, serve stale
    if (cache.data) {
      res.set('X-Cache', 'STALE');
      if (err.code === 'RATE_LIMITED' && err.retryAfter) {
        res.set('Retry-After', Math.ceil(err.retryAfter / 1000));
      }
      return res.status(200).json(cache.data);
    }

    // Otherwise, bubble up a friendly error
    if (err.code === 'RATE_LIMITED' && err.retryAfter) {
      res.set('Retry-After', Math.ceil(err.retryAfter / 1000));
      return res.status(429).json({ error: 'Rate limited. Please try again shortly.' });
    }
    return res.status(502).json({ error: 'Failed to fetch repos' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
