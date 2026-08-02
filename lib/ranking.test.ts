import assert from "node:assert/strict";
import test from "node:test";
import { selectNewsItems } from "@/lib/ranking";
import type { NewsItem, NewsSource } from "@/lib/types";

const sources: NewsSource[] = [
  "google-news",
  "reddit",
  "hacker-news",
  "arxiv",
];

function item(
  id: string,
  source: NewsSource,
  minutesOld: number,
  overrides: Partial<NewsItem> = {}
): NewsItem {
  return {
    id,
    source,
    title: `Story ${id}`,
    url: `https://example.com/${id}`,
    origin: source,
    publishedAt: new Date(Date.now() - minutesOld * 60_000).toISOString(),
    ...overrides,
  };
}

test("reserves representation for every available source", () => {
  const candidates = [
    ...Array.from({ length: 10 }, (_, index) =>
      item(`news-${index}`, "google-news", index)
    ),
    item("reddit", "reddit", 100),
    item("hn", "hacker-news", 110),
    item("paper", "arxiv", 1_000),
  ];

  const selected = selectNewsItems(candidates, sources, 8, 1);

  assert.equal(selected.length, 8);
  assert.deepEqual(new Set(selected.map(({ source }) => source)), new Set(sources));
});

test("drops duplicate, untitled, and linkless candidates", () => {
  const selected = selectNewsItems(
    [
      item("valid", "google-news", 0),
      item("valid", "reddit", 1),
      item("untitled", "reddit", 2, { title: " " }),
      item("linkless", "arxiv", 3, { url: "" }),
    ],
    sources,
    10,
    1
  );

  assert.deepEqual(selected.map(({ id }) => id), ["valid"]);
});
