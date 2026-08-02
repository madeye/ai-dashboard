import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";
import { isAiRelated } from "@/lib/sources/ai-filter";

const FEED_URL = "https://www.geekpark.net/rss";

const parser = new Parser({
  timeout: 15000,
});

export async function fetchGeekpark(): Promise<NewsItem[]> {
  const feed = await parser.parseURL(FEED_URL);
  return (feed.items ?? [])
    .map((item): NewsItem => {
      const link = item.link ?? "";
      return {
        id: makeId(link || item.title || ""),
        title: item.title?.trim() ?? "",
        url: link,
        source: "geekpark",
        origin: "极客公园",
        publishedAt: item.isoDate ?? new Date().toISOString(),
        summary: item.contentSnippet?.slice(0, 500) || undefined,
      };
    })
    .filter((item) => isAiRelated(item.title));
}
