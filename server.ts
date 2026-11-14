import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

interface RetrievedEvidenceItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  provider: string;
  retrievedAt: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STOPWORDS = new Set([
  'about',
  'after',
  'all',
  'also',
  'always',
  'and',
  'any',
  'are',
  'because',
  'been',
  'between',
  'but',
  'can',
  'claim',
  'claims',
  'could',
  'does',
  'each',
  'every',
  'for',
  'from',
  'has',
  'have',
  'how',
  'into',
  'its',
  'may',
  'more',
  'most',
  'never',
  'not',
  'only',
  'our',
  'over',
  'some',
  'such',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'under',
  'using',
  'very',
  'was',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'will',
  'with',
  'would',
  'your',
]);

function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchQuery(input: string): string {
  let sourceText = input;
  const trimmed = input.trim();
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const hostParts = parsed.hostname.replace(/^www\./i, '').split('.');
      const domainRoot = hostParts.slice(0, -1).join(' ');
      const pathWords = parsed.pathname.replace(/[-_/.,]+/g, ' ');
      sourceText = `${domainRoot} ${pathWords}`;
    } catch {
      sourceText = trimmed;
    }
  }

  const cleaned = sourceText
    .replace(/https?:\/\/[^\s]+/gi, ' ')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .trim();
  const tokens = cleaned
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t.toLowerCase()));
  return tokens.slice(0, 7).join(' ') || cleaned.slice(0, 60);
}

async function fetchWikipediaResults(searchTerm: string): Promise<RetrievedEvidenceItem[]> {
  if (!searchTerm.trim()) return [];
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'search');
  url.searchParams.set('srsearch', searchTerm);
  url.searchParams.set('srlimit', '3');
  url.searchParams.set('format', 'json');

  const resp = await fetch(url.toString(), {
    headers: { 'User-Agent': 'TrustLensPrototype/1.0 (College Project)' },
    signal: AbortSignal.timeout(4500),
  });
  if (!resp.ok) {
    throw new Error(`Wikipedia API HTTP ${resp.status}`);
  }
  const data = (await resp.json()) as {
    query?: { search?: Array<{ pageid: number; title: string; snippet: string }> };
  };
  const hits = data.query?.search ?? [];
  const retrievedAt = new Date().toISOString();

  // Fetch fuller summary for top 2 hits via REST summary API when available
  const results = await Promise.all(
    hits.map(async (hit, idx) => {
      const encodedTitle = encodeURIComponent(hit.title.replace(/ /g, '_'));
      const articleUrl = `https://en.wikipedia.org/wiki/${encodedTitle}`;
      let summary = stripHtml(hit.snippet);

      if (idx < 2) {
        try {
          const sumResp = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`,
            {
              headers: { 'User-Agent': 'TrustLensPrototype/1.0 (College Project)' },
              signal: AbortSignal.timeout(3000),
            }
          );
          if (sumResp.ok) {
            const sumJson = (await sumResp.json()) as { extract?: string };
            if (sumJson.extract && sumJson.extract.trim().length > summary.length) {
              summary = sumJson.extract.trim().slice(0, 360);
              if (sumJson.extract.trim().length > 360) summary += '...';
            }
          }
        } catch {
          // Retain search snippet if summary call times out
        }
      }

      return {
        id: `LIVE-WIKI-${hit.pageid}`,
        title: hit.title,
        url: articleUrl,
        summary,
        provider: 'Wikipedia Public Encyclopedia',
        retrievedAt,
      };
    })
  );

  return results;
}

async function fetchDuckDuckGoResult(searchTerm: string): Promise<RetrievedEvidenceItem[]> {
  if (!searchTerm.trim()) return [];
  const url = new URL('https://api.duckduckgo.com/');
  url.searchParams.set('q', searchTerm);
  url.searchParams.set('format', 'json');
  url.searchParams.set('no_html', '1');
  url.searchParams.set('skip_disambig', '1');

  const resp = await fetch(url.toString(), {
    headers: { 'User-Agent': 'TrustLensPrototype/1.0 (College Project)' },
    signal: AbortSignal.timeout(4000),
  });
  if (!resp.ok) {
    throw new Error(`DuckDuckGo API HTTP ${resp.status}`);
  }
  const data = (await resp.json()) as {
    Heading?: string;
    AbstractText?: string;
    AbstractURL?: string;
    AbstractSource?: string;
  };

  if (data.AbstractText && data.AbstractURL && data.Heading) {
    const trimmedSummary =
      data.AbstractText.length > 360
        ? `${data.AbstractText.slice(0, 360)}...`
        : data.AbstractText;

    return [
      {
        id: `LIVE-DDG-${Buffer.from(data.AbstractURL).toString('base64').slice(0, 8)}`,
        title: `${data.Heading} (${data.AbstractSource || 'DuckDuckGo Instant Answer'})`,
        url: data.AbstractURL,
        summary: trimmedSummary,
        provider: 'DuckDuckGo Instant Answer',
        retrievedAt: new Date().toISOString(),
      },
    ];
  }

  return [];
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'trustlens-evidence-proxy' });
  });

  app.post('/api/evidence/retrieve', async (req: Request, res: Response) => {
    const rawQuery = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    const rawSubclaims: string[] = Array.isArray(req.body?.subclaims)
      ? req.body.subclaims.filter((s: unknown): s is string => typeof s === 'string').slice(0, 4)
      : [];

    if (!rawQuery) {
      res.status(400).json({
        status: 'error',
        message: 'A non-empty query is required for evidence retrieval.',
        items: [],
      });
      return;
    }

    const queries = rawSubclaims.length > 0 ? rawSubclaims : [rawQuery];
    const searchTerms = Array.from(
      new Set(queries.map((q) => buildSearchQuery(q)).filter((q) => q.length >= 2))
    ).slice(0, 3);

    if (searchTerms.length === 0) {
      res.json({
        status: 'no_results',
        message: 'No searchable topic keywords could be extracted from the entered text.',
        items: [],
      });
      return;
    }

    try {
      const collected: RetrievedEvidenceItem[] = [];
      let anyProviderSucceeded = false;

      for (const term of searchTerms) {
        const [wikiRes, ddgRes] = await Promise.allSettled([
          fetchWikipediaResults(term),
          fetchDuckDuckGoResult(term),
        ]);

        if (wikiRes.status === 'fulfilled') {
          anyProviderSucceeded = true;
          collected.push(...wikiRes.value);
        }
        if (ddgRes.status === 'fulfilled') {
          anyProviderSucceeded = true;
          collected.push(...ddgRes.value);
        }
      }

      if (!anyProviderSucceeded) {
        res.json({
          status: 'unavailable',
          message:
            'Live public evidence services were unreachable or timed out. Falling back to local evaluation.',
          items: [],
        });
        return;
      }

      // Deduplicate by URL and limit to 6 items
      const dedupedMap = new Map<string, RetrievedEvidenceItem>();
      for (const item of collected) {
        if (!dedupedMap.has(item.url)) {
          dedupedMap.set(item.url, item);
        }
      }
      const items = Array.from(dedupedMap.values()).slice(0, 6);

      if (items.length === 0) {
        res.json({
          status: 'no_results',
          message:
            'Live search completed across public sources (Wikipedia & DuckDuckGo), but no relevant articles matched.',
          items: [],
        });
        return;
      }

      res.json({
        status: 'ok',
        message: `Retrieved ${items.length} public source record(s) from Wikipedia / DuckDuckGo.`,
        items,
      });
    } catch {
      res.json({
        status: 'unavailable',
        message: 'Live retrieval encountered a network error. Using local fallback.',
        items: [],
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`TrustLens server listening on port ${port}`);
  });
}

startServer();
