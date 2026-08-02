import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

const FEED_URL = "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml";

const parser = new Parser({
  timeout: 15000,
});

export async function fetchTheVerge(): Promise<NewsItem[]> {
  const feed = await parser.parseURL(FEED_URL);
  return (feed.items ?? []).map((item): NewsItem => {
    const link = item.link ?? "";
    return {
      id: makeId(link || item.title || ""),
      title: item.title ?? "",
      url: link,
      source: "the-verge",
      origin: "The Verge",
      publishedAt: item.isoDate ?? new Date().toISOString(),
      summary: item.contentSnippet?.slice(0, 500) || undefined,
    };
  });
}
