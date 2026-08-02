import type { NewsItem, NewsSource } from "@/lib/types";

const timestamp = (item: NewsItem) => {
  const value = new Date(item.publishedAt).getTime();
  return Number.isFinite(value) ? value : 0;
};

/**
 * Select a fresh, deduplicated feed while reserving a small representation
 * floor for slower sources such as arXiv.
 */
export function selectNewsItems(
  candidates: NewsItem[],
  sources: readonly NewsSource[],
  maxItems: number,
  minimumPerSource: number
): NewsItem[] {
  const seen = new Set<string>();
  const sorted = candidates
    .filter((item) => {
      if (!item.title.trim() || !item.url || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => timestamp(b) - timestamp(a));

  const selected: NewsItem[] = [];
  const selectedIds = new Set<string>();

  for (const source of sources) {
    for (const item of sorted.filter((candidate) => candidate.source === source)) {
      if (selected.filter((candidate) => candidate.source === source).length >= minimumPerSource) {
        break;
      }
      selected.push(item);
      selectedIds.add(item.id);
    }
  }

  for (const item of sorted) {
    if (selected.length >= maxItems) break;
    if (!selectedIds.has(item.id)) {
      selected.push(item);
      selectedIds.add(item.id);
    }
  }

  return selected.sort((a, b) => timestamp(b) - timestamp(a)).slice(0, maxItems);
}
