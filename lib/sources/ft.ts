import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

// FT section feeds: AI, technology, and semiconductors — aligned with the
// dashboard's AI / chip brief, not the general homepage.
export const FEEDS = [
  {
    url: "https://www.ft.com/artificial-intelligence?format=rss",
    origin: "FT · AI",
  },
  {
    url: "https://www.ft.com/technology?format=rss",
    origin: "FT · Technology",
  },
  {
    url: "https://www.ft.com/semiconductors?format=rss",
    origin: "FT · Semiconductors",
  },
] as const;

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "ai-dashboard/0.1 (news aggregator)",
  },
});

export interface RssEntry {
  title?: string;
  link?: string;
  isoDate?: string;
  contentSnippet?: string;
}

/** Strip tracking query params so the same FT article keeps a stable id. */
export function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Map raw RSS entries to NewsItems (pure, exported for tests). */
export function mapItems(items: RssEntry[], origin: string): NewsItem[] {
  return items.flatMap((item) => {
    const title = (item.title ?? "").replace(/\s+/g, " ").trim();
    const rawLink = (item.link ?? "").trim();
    if (!title || !rawLink) return [];
    const url = canonicalUrl(rawLink);
    return [
      {
        id: makeId(url),
        title,
        url,
        source: "ft" as const,
        origin,
        publishedAt: item.isoDate ?? new Date().toISOString(),
        summary: item.contentSnippet?.slice(0, 500) || undefined,
      },
    ];
  });
}

export async function fetchFt(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, origin }) => {
      const feed = await parser.parseURL(url);
      return mapItems(feed.items ?? [], origin);
    })
  );

  const seen = new Set<string>();
  return results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
}
