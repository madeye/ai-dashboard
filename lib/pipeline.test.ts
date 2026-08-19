import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("pipeline registers FT, WSJ, and The Economist as sources", () => {
  const pipeline = readFileSync(new URL("./pipeline.ts", import.meta.url), "utf8");
  const types = readFileSync(new URL("./types.ts", import.meta.url), "utf8");
  const dashboard = readFileSync(
    new URL("../app/dashboard.tsx", import.meta.url),
    "utf8"
  );

  assert.match(pipeline, /from "@\/lib\/sources\/ft"/);
  assert.match(pipeline, /from "@\/lib\/sources\/wsj"/);
  assert.match(pipeline, /from "@\/lib\/sources\/economist"/);
  assert.match(pipeline, /\{ id: "ft", fetch: fetchFt \}/);
  assert.match(pipeline, /\{ id: "wsj", fetch: fetchWsj \}/);
  assert.match(pipeline, /\{ id: "economist", fetch: fetchEconomist \}/);

  assert.match(types, /\| "ft"/);
  assert.match(types, /\| "wsj"/);
  assert.match(types, /\| "economist"/);

  assert.match(dashboard, /ft: \{ label: "Financial Times"/);
  assert.match(dashboard, /wsj: \{ label: "Wall Street Journal"/);
  assert.match(dashboard, /economist: \{ label: "The Economist"/);
});
