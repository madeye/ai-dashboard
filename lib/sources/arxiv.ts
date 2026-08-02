import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

const CATEGORIES = ["cs.AI", "cs.CL", "cs.LG"];

interface ArxivItem {
  summary?: string;
}

const parser = new Parser<Record<string, never>, ArxivItem>({
  timeout: 15000,
  customFields: { item: ["summary"] },
});

export async function fetchArxiv(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    CATEGORIES.map(async (category) => {
      // Daily RSS feeds are empty on weekends. The Atom API always exposes the
      // latest submissions, so the dashboard still has a useful paper stream.
      const query = new URLSearchParams({
        search_query: `cat:${category}`,
        sortBy: "submittedDate",
        sortOrder: "descending",
        start: "0",
        max_results: "12",
      });
      const feed = await parser.parseURL(
        `https://export.arxiv.org/api/query?${query.toString()}`
      );

      return (feed.items ?? []).map((item): NewsItem => {
        const link = item.link ?? "";
        const title = (item.title ?? "").replace(/\s+/g, " ").trim();
        const summary = item.summary?.replace(/\s+/g, " ").trim();

        return {
          id: makeId(link || title),
          title,
          url: link,
          source: "arxiv",
          origin: `arXiv ${category}`,
          publishedAt: item.isoDate ?? new Date().toISOString(),
          summary: summary?.slice(0, 500),
        };
      });
    })
  );

  return results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
}
