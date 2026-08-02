import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

const FEED_URL = "https://huggingface.co/blog/feed.xml";

const parser = new Parser({
  timeout: 15000,
});

export async function fetchHuggingFace(): Promise<NewsItem[]> {
  const feed = await parser.parseURL(FEED_URL);
  return (feed.items ?? []).map((item): NewsItem => {
    const link = item.link ?? "";
    return {
      id: makeId(link || item.title || ""),
      title: item.title ?? "",
      url: link,
      source: "huggingface",
      origin: "Hugging Face Blog",
      publishedAt: item.isoDate ?? new Date().toISOString(),
      summary: item.contentSnippet?.slice(0, 500) || undefined,
    };
  });
}
