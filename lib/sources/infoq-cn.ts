import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";
import { isAiRelated } from "@/lib/sources/ai-filter";

const FEED_URL = "https://www.infoq.cn/feed";

const parser = new Parser({
  timeout: 15000,
});

export async function fetchInfoQcn(): Promise<NewsItem[]> {
  const feed = await parser.parseURL(FEED_URL);
  return (feed.items ?? [])
    .map((item): NewsItem => {
      const link = item.link ?? "";
      return {
        id: makeId(link || item.title || ""),
        title: item.title ?? "",
        url: link,
        source: "infoq-cn",
        origin: "InfoQ 中文",
        publishedAt: item.isoDate ?? new Date().toISOString(),
        summary: item.contentSnippet?.slice(0, 500) || undefined,
      };
    })
    .filter((item) => isAiRelated(item.title));
}
