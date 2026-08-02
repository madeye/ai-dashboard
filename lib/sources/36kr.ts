import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";
import { isAiRelated } from "@/lib/sources/ai-filter";

const FEED_URL = "https://36kr.com/feed";

const parser = new Parser({
  timeout: 15000,
});

export async function fetchKr36(): Promise<NewsItem[]> {
  const feed = await parser.parseURL(FEED_URL);
  return (feed.items ?? [])
    .map((item): NewsItem => {
      // 去掉 ?f=rss 跟踪参数，保证 id 稳定
      const link = (item.link ?? "").split("?")[0];
      return {
        id: makeId(link || item.title || ""),
        title: item.title ?? "",
        url: link,
        source: "36kr",
        origin: "36氪",
        publishedAt: item.isoDate ?? new Date().toISOString(),
        summary: item.contentSnippet?.slice(0, 500) || undefined,
      };
    })
    .filter((item) => isAiRelated(item.title));
}
