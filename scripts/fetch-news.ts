// Manual one-shot run of the pipeline: npx tsx scripts/fetch-news.ts
import { runPipeline } from "../lib/pipeline";

async function main() {
  try {
    process.loadEnvFile();
  } catch {
    // no .env file — continue with existing environment
  }
  const result = await runPipeline();
  console.log(
    `done: ${result.count} items (${result.llmCalls} new insights)` +
      (result.staleSources.length > 0
        ? `; stale sources: ${result.staleSources.join(", ")}`
        : "")
  );
  // rss-parser/node 可能残留 keep-alive 连接，显式退出一次性脚本
  process.exit(0);
}

void main().catch((error) => {
  console.error("fetch failed:", error);
  process.exit(1);
});
