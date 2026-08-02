export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const cron = (await import("node-cron")).default;
  const { runPipeline } = await import("@/lib/pipeline");
  const { readNews } = await import("@/lib/store");

  // Refresh every 30 minutes
  cron.schedule("*/30 * * * *", () => {
    void runPipeline().catch((error) => {
      console.error("[cron] scheduled refresh failed:", error);
    });
  });
  console.log("[cron] news refresh scheduled every 30 minutes");

  // Fetch immediately on startup if there is no data yet
  const existing = await readNews();
  if (!existing) {
    console.log("[cron] no cached data, running initial fetch…");
    void runPipeline().catch((error) => {
      console.error("[cron] initial refresh failed:", error);
    });
  }
}
