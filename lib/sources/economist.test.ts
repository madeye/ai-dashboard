import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  FEED_URL,
  canonicalUrl,
  fetchEconomist,
  mapItems,
} from "./economist";

test("mapItems maps Economist RSS entries to NewsItems", () => {
  const items = mapItems([
    {
      title: "Should AI labs be treated like the owners of dangerous animals?",
      link: "https://www.economist.com/science-and-technology/2026/08/01/should-ai-labs-be-treated-like-the-owners-of-dangerous-animals?utm_source=rss",
      isoDate: "2026-08-01T12:00:00.000Z",
      contentSnippet: "Liability for frontier models is an open question.",
    },
  ]);

  assert.equal(items.length, 1);
  const [item] = items;
  assert.equal(
    item.title,
    "Should AI labs be treated like the owners of dangerous animals?"
  );
  assert.equal(
    item.url,
    "https://www.economist.com/science-and-technology/2026/08/01/should-ai-labs-be-treated-like-the-owners-of-dangerous-animals"
  );
  assert.equal(item.source, "economist");
  assert.equal(item.origin, "The Economist");
  assert.equal(item.publishedAt, "2026-08-01T12:00:00.000Z");
  assert.equal(
    item.summary,
    "Liability for frontier models is an open question."
  );
  assert.match(item.id, /^[0-9a-f]{16}$/);
  assert.equal(
    item.id,
    mapItems([
      {
        title: item.title,
        link: "https://www.economist.com/science-and-technology/2026/08/01/should-ai-labs-be-treated-like-the-owners-of-dangerous-animals",
      },
    ])[0].id
  );
});

test("mapItems drops untitled and linkless entries", () => {
  const items = mapItems([
    { title: "  ", link: "https://www.economist.com/science-and-technology/a" },
    { title: "No URL" },
    { link: "https://www.economist.com/science-and-technology/no-title" },
    {
      title: "Valid",
      link: "https://www.economist.com/science-and-technology/valid",
      isoDate: "2026-08-19T00:00:00.000Z",
    },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Valid");
  assert.equal(items[0].source, "economist");
});

test("canonicalUrl strips tracking query", () => {
  assert.equal(
    canonicalUrl(
      "https://www.economist.com/science-and-technology/story?utm_source=rss"
    ),
    "https://www.economist.com/science-and-technology/story"
  );
});

test("Economist source ships the science-and-technology feed", () => {
  const source = readFileSync(new URL("./economist.ts", import.meta.url), "utf8");
  assert.match(source, /export async function fetchEconomist/);
  assert.equal(typeof fetchEconomist, "function");
  assert.equal(
    FEED_URL,
    "https://www.economist.com/science-and-technology/rss.xml"
  );
  assert.match(
    source,
    /https:\/\/www\.economist\.com\/science-and-technology\/rss\.xml/
  );
});
