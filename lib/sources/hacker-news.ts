import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

const QUERIES = ["AI", "LLM", "OpenAI"];

interface AlgoliaHit {
  objectID: string;
  title?: string;
  url?: string | null;
  points?: number | null;
  created_at_i?: number;
}

// HN's official API is per-item and slow; the Algolia search API returns
// fresh stories matching our keywords in one request per query.
export async function fetchHackerNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    QUERIES.map(async (q) => {
      const url = `https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=20&query=${encodeURIComponent(
        q
      )}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HN Algolia ${res.status}`);
      const data = (await res.json()) as { hits?: AlgoliaHit[] };
      return (data.hits ?? []).map((hit): NewsItem => {
        // Ask HN / Show HN posts have no external URL — link to the thread
        const link =
          hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`;
        const points = hit.points ?? 0;
        return {
          id: makeId(link),
          title: hit.title ?? "",
          url: link,
          source: "hacker-news",
          origin: `Hacker News · ${points} pts`,
          publishedAt: hit.created_at_i
            ? new Date(hit.created_at_i * 1000).toISOString()
            : new Date().toISOString(),
        };
      });
    })
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
