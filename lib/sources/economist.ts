import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

// Section RSS, not the general "latest" dump — ranking only reserves a small
// per-source quota, so off-topic sci/tech pieces stay a minority of the feed.
export const FEED_URL =
  "https://www.economist.com/science-and-technology/rss.xml";

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

/** Strip tracking query params so the same article keeps a stable id. */
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
        source: "economist" as const,
        origin: "The Economist",
        publishedAt: item.isoDate ?? new Date().toISOString(),
        summary: item.contentSnippet?.slice(0, 500) || undefined,
      },
    ];
  });
}

export async function fetchEconomist(): Promise<NewsItem[]> {
  const feed = await parser.parseURL(FEED_URL);
  return mapItems(feed.items ?? []);
}
