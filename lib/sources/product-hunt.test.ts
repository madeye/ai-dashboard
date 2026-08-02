import assert from "node:assert/strict";
import test from "node:test";
import { mapPosts } from "./product-hunt";

test("mapPosts maps GraphQL posts to NewsItems", () => {
  const items = mapPosts([
    {
      name: "AI Widget",
      tagline: "A widget that does AI",
      url: "https://www.producthunt.com/posts/ai-widget",
      createdAt: "2026-08-01T10:00:00Z",
      votesCount: 42,
    },
  ]);

  assert.equal(items.length, 1);
  const [item] = items;
  assert.equal(item.title, "AI Widget");
  assert.equal(item.url, "https://www.producthunt.com/posts/ai-widget");
  assert.equal(item.source, "product-hunt");
  assert.equal(item.origin, "Product Hunt · 42 votes");
  assert.equal(item.publishedAt, "2026-08-01T10:00:00Z");
  assert.equal(item.summary, "A widget that does AI");
  assert.match(item.id, /^[0-9a-f]{16}$/);
});

test("mapPosts drops posts without a name or url and defaults votes", () => {
  const items = mapPosts([
    { name: "No URL", tagline: "missing link" },
    { url: "https://www.producthunt.com/posts/no-name" },
    { name: "No Votes", url: "https://www.producthunt.com/posts/no-votes" },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0].title, "No Votes");
  assert.equal(items[0].origin, "Product Hunt · 0 votes");
});
