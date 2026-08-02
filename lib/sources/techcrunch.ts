import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

const FEED_URL = "https://techcrunch.com/category/artificial-intelligence/feed/";

const parser = new Parser({
  timeout: 15000,
});

export async function fetchTechCrunch(): Promise<NewsItem[]> {
  const feed = await parser.parseURL(FEED_URL);
  return (feed.items ?? []).map((item): NewsItem => {
    const link = item.link ?? "";
    return {
      id: makeId(link || item.title || ""),
      title: item.title ?? "",
      url: link,
      source: "techcrunch",
      origin: "TechCrunch",
      publishedAt: item.isoDate ?? new Date().toISOString(),
      summary: item.contentSnippet?.slice(0, 500) || undefined,
    };
  });
}
