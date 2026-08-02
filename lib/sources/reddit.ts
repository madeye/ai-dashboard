import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

const SUBREDDITS = ["artificial", "MachineLearning", "OpenAI", "LocalLLaMA"];

// Reddit blocks unauthenticated .json API access (403), but its Atom
// feeds still work — so we consume Reddit through RSS like Google News.
const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      process.env.REDDIT_USER_AGENT ?? "ai-dashboard/0.1 (news aggregator)",
  },
});

export async function fetchReddit(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    SUBREDDITS.map(async (sub) => {
      const feed = await parser.parseURL(
        `https://www.reddit.com/r/${sub}/hot/.rss?limit=15`
      );
      return (feed.items ?? []).map((item): NewsItem => {
        const link = item.link ?? "";
        return {
          id: makeId(link || item.title || ""),
          title: item.title ?? "",
          url: link,
          source: "reddit",
          origin: `r/${sub}`,
          publishedAt: item.isoDate ?? new Date().toISOString(),
          summary: item.contentSnippet?.slice(0, 500) || undefined,
        };
      });
    })
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
