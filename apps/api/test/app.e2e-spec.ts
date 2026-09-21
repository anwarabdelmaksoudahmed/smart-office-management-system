/**
 * Lightweight API smoke — requires API on PORT (default 3000).
 * Skips automatically when the server is unreachable.
 */
const base =
  process.env.API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:3000';
const prefix = process.env.API_PREFIX ?? 'api';

async function tryFetch(path: string): Promise<Response | null> {
  try {
    return await fetch(`${base}/${prefix}${path}`, {
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    return null;
  }
}

describe('API smoke (optional live server)', () => {
  it('GET /health responds when API is up', async () => {
    const res = await tryFetch('/health');
    if (!res) {
      console.warn('Skipping live API smoke — server not reachable');
      return;
    }
    expect(res.status).toBeLessThan(500);
  });

  it('rejects unauthenticated /orders', async () => {
    const res = await tryFetch('/orders');
    if (!res) return;
    expect([401, 403]).toContain(res.status);
  });
});
