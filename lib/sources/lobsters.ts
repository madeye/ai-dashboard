import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

// Lobsters has no AI-specific feed; we take the frontpage as-is. The ranking
// layer only reserves a small per-source quota, so off-topic stories stay a
// minority of the feed.
const FEED_URL = "https://lobste.rs/rss";

const parser = new Parser({
  timeout: 15000,
});

export async function fetchLobsters(): Promise<NewsItem[]> {
  const feed = await parser.parseURL(FEED_URL);
  return (feed.items ?? []).map((item): NewsItem => {
    const link = item.link ?? "";
    return {
      id: makeId(link || item.title || ""),
      title: item.title ?? "",
      url: link,
      source: "lobsters",
      origin: "Lobsters",
      publishedAt: item.isoDate ?? new Date().toISOString(),
      summary: item.contentSnippet?.slice(0, 500) || undefined,
    };
  });
}
