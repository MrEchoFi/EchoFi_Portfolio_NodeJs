// pages/api/repos.js
export default async function handler(req, res) {
  const { user } = req.query;
  if (!user) return res.status(400).json({ error: 'Missing user' });

  // Edge cache: cache at CDN for 10 minutes, allow stale for a day while revalidating
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400');

  // In-memory cache per serverless instance (helps between invocations on the same pod)
  // Note: multiple regions/instances may not share this, but the CDN cache above handles scale.
  if (!global.__REPOS_CACHE) global.__REPOS_CACHE = {};
  const key = `repos:${user}`;
  const entry = global.__REPOS_CACHE[key] || {};

  const ghUrl = `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=created&direction=asc`;

  try {
    const ghRes = await fetch(ghUrl, {
      headers: entry.etag ? { 'If-None-Match': entry.etag } : {}
    });

    // If data hasn’t changed, serve our cached JSON
    if (ghRes.status === 304 && entry.data) {
      return res.status(200).json(entry.data);
    }

    if (!ghRes.ok) {
      // If rate limited or other error, serve last good data if available
      if (entry.data) {
        res.setHeader('X-From-Cache', 'stale');
        return res.status(200).json(entry.data);
      }
      return res.status(ghRes.status).json({ error: `GitHub error ${ghRes.status}` });
    }

    const data = await ghRes.json();
    const etag = ghRes.headers.get('etag') || null;

    // Store fresh cache
    global.__REPOS_CACHE[key] = { data, etag, ts: Date.now() };

    return res.status(200).json(data);
  } catch (err) {
    // Network error fallback: serve stale if we’ve got it
    if (entry.data) {
      res.setHeader('X-From-Cache', 'stale');
      return res.status(200).json(entry.data);
    }
    return res.status(500).json({ error: 'Failed to fetch repositories' });
  }
}
