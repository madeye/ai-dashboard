import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { FEED_URL, canonicalUrl, fetchWsj, mapItems } from "./wsj";

test("mapItems maps WSJ RSS entries to NewsItems", () => {
  const items = mapItems([
    {
      title: "Inside Big Tech’s Frantic Race to Quell the Growing Backlash to AI",
      link: "https://www.wsj.com/tech/inside-big-techs-frantic-race-to-quell-the-growing-backlash-to-ai-2a717339?mod=rss_Technology",
      isoDate: "2026-08-19T01:00:00.000Z",
      contentSnippet: "Tech companies are holding listening sessions.",
    },
  ]);

  assert.equal(items.length, 1);
  const [item] = items;
  assert.equal(
    item.title,
    "Inside Big Tech’s Frantic Race to Quell the Growing Backlash to AI"
  );
  assert.equal(
    item.url,
    "https://www.wsj.com/tech/inside-big-techs-frantic-race-to-quell-the-growing-backlash-to-ai-2a717339"
  );
  assert.equal(item.source, "wsj");
  assert.equal(item.origin, "Wall Street Journal");
  assert.equal(item.publishedAt, "2026-08-19T01:00:00.000Z");
  assert.equal(item.summary, "Tech companies are holding listening sessions.");
  assert.match(item.id, /^[0-9a-f]{16}$/);
  assert.equal(
    item.id,
    mapItems([
      {
        title: item.title,
        link: "https://www.wsj.com/tech/inside-big-techs-frantic-race-to-quell-the-growing-backlash-to-ai-2a717339",
      },
    ])[0].id
  );
});

test("mapItems drops untitled and linkless entries", () => {
  const items = mapItems([
    { title: "  ", link: "https://www.wsj.com/articles/abc" },
    { title: "No URL" },
    { link: "https://www.wsj.com/articles/no-title" },
    {
      title: "Valid",
      link: "https://www.wsj.com/articles/valid",
      isoDate: "2026-08-19T00:00:00.000Z",
    },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Valid");
  assert.equal(items[0].source, "wsj");
});

test("canonicalUrl strips WSJ RSS tracking params", () => {
  assert.equal(
    canonicalUrl(
      "https://www.wsj.com/tech/story?mod=rss_Technology"
    ),
    "https://www.wsj.com/tech/story"
  );
});

test("WSJ source ships the Dow Jones technology feed", () => {
  const source = readFileSync(new URL("./wsj.ts", import.meta.url), "utf8");
  assert.match(source, /export async function fetchWsj/);
  assert.equal(typeof fetchWsj, "function");
  assert.equal(
    FEED_URL,
    "https://feeds.content.dowjones.io/public/rss/RSSWSJD"
  );
  assert.match(
    source,
    /https:\/\/feeds\.content\.dowjones\.io\/public\/rss\/RSSWSJD/
  );
});
