import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

// IEEE Spectrum 按 topic 提供 feed，这里只取 semiconductors 频道。
const FEED_URL = "https://spectrum.ieee.org/feeds/topic/semiconductors.rss";

const parser = new Parser({
  timeout: 15000,
});

export async function fetchIeeeSpectrum(): Promise<NewsItem[]> {
  const feed = await parser.parseURL(FEED_URL);
  return (feed.items ?? []).map((item): NewsItem => {
    const link = item.link ?? "";
    return {
      id: makeId(link || item.title || ""),
      title: item.title ?? "",
      url: link,
      source: "ieee-spectrum",
      origin: "IEEE Spectrum",
      publishedAt: item.isoDate ?? new Date().toISOString(),
      summary: item.contentSnippet?.slice(0, 500) || undefined,
    };
  });
}
