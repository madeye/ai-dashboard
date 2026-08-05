import { fetchGoogleNews } from "@/lib/sources/google-news";
import { fetchReddit } from "@/lib/sources/reddit";
import { fetchArxiv } from "@/lib/sources/arxiv";
import { fetchHackerNews } from "@/lib/sources/hacker-news";
import { fetchTechCrunch } from "@/lib/sources/techcrunch";
import { fetchTheVerge } from "@/lib/sources/the-verge";
import { fetchMitTechReview } from "@/lib/sources/mit-tech-review";
import { fetchHuggingFace } from "@/lib/sources/huggingface";
import { fetchLobsters } from "@/lib/sources/lobsters";
import { fetchProductHunt } from "@/lib/sources/product-hunt";
import { fetchSemiEngineering } from "@/lib/sources/semi-engineering";
import { fetchEeTimes } from "@/lib/sources/ee-times";
import { fetchSemiwiki } from "@/lib/sources/semiwiki";
import { fetchIeeeSpectrum } from "@/lib/sources/ieee-spectrum";
import { generateInsight } from "@/lib/llm";
import { selectNewsItems } from "@/lib/ranking";
import { readNews, writeNews } from "@/lib/store";
import type { NewsItem, NewsSource, PipelineResult } from "@/lib/types";

const MAX_ITEMS = 50;
const MIN_ITEMS_PER_SOURCE = 2;
const LLM_CONCURRENCY = 4;

const SOURCES: ReadonlyArray<{
  id: NewsSource;
  fetch: () => Promise<NewsItem[]>;
}> = [
  { id: "google-news", fetch: fetchGoogleNews },
  { id: "reddit", fetch: fetchReddit },
  { id: "hacker-news", fetch: fetchHackerNews },
  { id: "arxiv", fetch: fetchArxiv },
  { id: "techcrunch", fetch: fetchTechCrunch },
  { id: "the-verge", fetch: fetchTheVerge },
  { id: "mit-tech-review", fetch: fetchMitTechReview },
  { id: "huggingface", fetch: fetchHuggingFace },
  { id: "lobsters", fetch: fetchLobsters },
  { id: "semi-engineering", fetch: fetchSemiEngineering },
  { id: "ee-times", fetch: fetchEeTimes },
  { id: "semiwiki", fetch: fetchSemiwiki },
  { id: "ieee-spectrum", fetch: fetchIeeeSpectrum },
  // Product Hunt requires a developer token; skip the source entirely when
  // it is not configured so it isn't marked stale on every run.
  ...(process.env.PRODUCTHUNT_API_TOKEN
    ? [{ id: "product-hunt" as NewsSource, fetch: fetchProductHunt }]
    : []),
];

let running: Promise<PipelineResult> | null = null;

/** Run the refresh pipeline at most once at a time. */
export function runPipeline(): Promise<PipelineResult> {
  if (!running) {
    const refresh = pipeline().finally(() => {
      if (running === refresh) {
        running = null;
      }
    });
    running = refresh;
  }
  return running;
}

async function pipeline(): Promise<PipelineResult> {
  console.log("[pipeline] fetching sources…");
  const previous = await readNews();
  const attempts = await Promise.allSettled(
    SOURCES.map(({ fetch }) => fetch())
  );

  const staleSources: NewsSource[] = [];
  const fetched = attempts.flatMap((attempt, index) => {
    const source = SOURCES[index].id;
    if (attempt.status === "fulfilled" && attempt.value.length > 0) {
      console.log(`[pipeline] fetched: ${source}=${attempt.value.length}`);
      return attempt.value;
    }

    staleSources.push(source);
    const reason =
      attempt.status === "rejected"
        ? attempt.reason
        : new Error("source returned no items");
    console.error(`[pipeline] ${source} refresh failed:`, reason);
    return previous?.items.filter((item) => item.source === source) ?? [];
  });

  if (fetched.length === 0) {
    throw new Error("No news sources returned data and no previous snapshot exists");
  }

  const fresh = selectNewsItems(
    fetched,
    SOURCES.map(({ id }) => id),
    MAX_ITEMS,
    MIN_ITEMS_PER_SOURCE
  );

  // Reuse existing insights for items we already processed
  const prevById = new Map(previous?.items.map((i) => [i.id, i]) ?? []);

  let llmCalls = 0;
  const items: NewsItem[] = [...fresh];
  await mapWithConcurrency(items, LLM_CONCURRENCY, async (item) => {
    const cached = prevById.get(item.id)?.insight;
    if (cached) {
      item.insight = cached;
      return;
    }
    item.insight = await generateInsight(item);
    llmCalls += 1;
  });

  const generatedAt = new Date().toISOString();
  await writeNews({ generatedAt, items });
  console.log(
    `[pipeline] done: ${items.length} items, ${llmCalls} new insights, ${generatedAt}`
  );
  return {
    generatedAt,
    count: items.length,
    llmCalls,
    staleSources,
  };
}

async function mapWithConcurrency<T>(
  arr: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let index = 0;
  const workers = Array.from(
    { length: Math.min(limit, arr.length) },
    async () => {
      while (index < arr.length) {
        const current = index++;
        await fn(arr[current]);
      }
    }
  );
  await Promise.all(workers);
}
