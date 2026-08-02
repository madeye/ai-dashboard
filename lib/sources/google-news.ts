import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

const QUERIES = ["artificial intelligence", "LLM", "OpenAI"];

const parser = new Parser<{ contentSnippet?: string; creator?: string }>({
  timeout: 15000,
});

export async function fetchGoogleNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    QUERIES.map(async (q) => {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
        q
      )}&hl=en-US&gl=US&ceid=US:en`;
      const feed = await parser.parseURL(url);
      return (feed.items ?? []).map((item): NewsItem => {
        // Google News titles look like "Headline - Outlet"
        const rawTitle = item.title ?? "";
        const dash = rawTitle.lastIndexOf(" - ");
        const title = dash > 0 ? rawTitle.slice(0, dash) : rawTitle;
        const origin = dash > 0 ? rawTitle.slice(dash + 3) : "Google News";
        const link = item.link ?? "";
        return {
          id: makeId(link || rawTitle),
          title,
          url: link,
          source: "google-news",
          origin,
          publishedAt: item.isoDate ?? new Date().toISOString(),
          summary: item.contentSnippet?.slice(0, 500),
        };
      });
    })
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
