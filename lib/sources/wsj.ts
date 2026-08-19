import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

// Dow Jones public technology feed (RSSWSJD). The older feeds.a.dj.com
// WSJD URL still resolves but serves stale items.
export const FEED_URL = "https://feeds.content.dowjones.io/public/rss/RSSWSJD";

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

/** Strip tracking query params so the same WSJ article keeps a stable id. */
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
export function mapItems(items: RssEntry[]): NewsItem[] {
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
        source: "wsj" as const,
        origin: "Wall Street Journal",
        publishedAt: item.isoDate ?? new Date().toISOString(),
        summary: item.contentSnippet?.slice(0, 500) || undefined,
      },
    ];
  });
}

export async function fetchWsj(): Promise<NewsItem[]> {
  const feed = await parser.parseURL(FEED_URL);
  return mapItems(feed.items ?? []);
}
