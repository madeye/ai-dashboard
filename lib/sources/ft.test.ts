import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { FEEDS, canonicalUrl, fetchFt, mapItems } from "./ft";

test("mapItems maps FT RSS entries to NewsItems", () => {
  const items = mapItems(
    [
      {
        title: "China eases limits on Nvidia H200 chips",
        link: "https://www.ft.com/content/6c5650fb-969d-4d4e-80d6-8d11002a8cf7?syn-25a6b1a6=1",
        isoDate: "2026-08-19T02:09:39.000Z",
        contentSnippet: "Beijing permits small shipments.",
      },
    ],
    "FT · AI"
  );

  assert.equal(items.length, 1);
  const [item] = items;
  assert.equal(item.title, "China eases limits on Nvidia H200 chips");
  assert.equal(
    item.url,
    "https://www.ft.com/content/6c5650fb-969d-4d4e-80d6-8d11002a8cf7"
  );
  assert.equal(item.source, "ft");
  assert.equal(item.origin, "FT · AI");
  assert.equal(item.publishedAt, "2026-08-19T02:09:39.000Z");
  assert.equal(item.summary, "Beijing permits small shipments.");
  assert.match(item.id, /^[0-9a-f]{16}$/);
  assert.equal(
    item.id,
    mapItems(
      [
        {
          title: "China eases limits on Nvidia H200 chips",
          link: "https://www.ft.com/content/6c5650fb-969d-4d4e-80d6-8d11002a8cf7",
        },
      ],
      "FT · AI"
    )[0].id
  );
});

test("mapItems drops untitled and linkless entries", () => {
  const items = mapItems(
    [
      { title: "  ", link: "https://www.ft.com/content/abc" },
      { title: "No URL" },
      { link: "https://www.ft.com/content/no-title" },
      {
        title: "Valid",
        link: "https://www.ft.com/content/valid",
        isoDate: "2026-08-19T00:00:00.000Z",
      },
    ],
    "FT · Technology"
  );

  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Valid");
  assert.equal(items[0].origin, "FT · Technology");
});

test("canonicalUrl strips tracking query and hash", () => {
  assert.equal(
    canonicalUrl(
      "https://www.ft.com/content/abc?syn-25a6b1a6=1#top"
    ),
    "https://www.ft.com/content/abc"
  );
});

test("FT source ships the AI, technology, and semiconductors feeds", () => {
  const source = readFileSync(new URL("./ft.ts", import.meta.url), "utf8");
  assert.match(source, /export async function fetchFt/);
  assert.equal(typeof fetchFt, "function");
  assert.deepEqual(
    FEEDS.map(({ url }) => url),
    [
      "https://www.ft.com/artificial-intelligence?format=rss",
      "https://www.ft.com/technology?format=rss",
      "https://www.ft.com/semiconductors?format=rss",
    ]
  );
  assert.match(source, /https:\/\/www\.ft\.com\/artificial-intelligence\?format=rss/);
  assert.match(source, /https:\/\/www\.ft\.com\/technology\?format=rss/);
  assert.match(source, /https:\/\/www\.ft\.com\/semiconductors\?format=rss/);
});
