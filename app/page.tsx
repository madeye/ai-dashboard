import { RefreshButton } from "@/app/refresh-button";
import { readNews } from "@/lib/store";
import type { NewsItem, NewsSource } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SOURCE_META: Record<
  NewsSource,
  { label: string; shortLabel: string; marker: string }
> = {
  "google-news": { label: "Google News", shortLabel: "News", marker: "G" },
  reddit: { label: "Reddit", shortLabel: "Reddit", marker: "R" },
  "hacker-news": { label: "Hacker News", shortLabel: "HN", marker: "Y" },
  arxiv: { label: "arXiv", shortLabel: "Papers", marker: "A" },
};

const SOURCES = Object.keys(SOURCE_META) as NewsSource[];

function timeAgo(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return "时间未知";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function NewsCard({ item, rank }: { item: NewsItem; rank: number }) {
  const source = SOURCE_META[item.source];

  return (
    <article className={`news-card news-card--${item.source}`}>
      <div className="news-card__rank" aria-hidden="true">
        {String(rank).padStart(2, "0")}
      </div>
      <div className="news-card__body">
        <div className="news-card__meta">
          <span className="source-badge">
            <span className="source-badge__marker" aria-hidden="true">
              {source.marker}
            </span>
            {source.label}
          </span>
          <span className="news-card__origin">{item.origin}</span>
          <time dateTime={item.publishedAt}>{timeAgo(item.publishedAt)}</time>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="news-card__link"
        >
          <h2>{item.title}</h2>
          <span className="news-card__arrow" aria-hidden="true">
            ↗
          </span>
        </a>
        {item.insight && <p className="news-card__insight">{item.insight}</p>}
      </div>
    </article>
  );
}

export default async function Home() {
  const data = await readNews();
  const items = data?.items ?? [];
  const sourceCounts = Object.fromEntries(
    SOURCES.map((source) => [
      source,
      items.filter((item) => item.source === source).length,
    ])
  ) as Record<NewsSource, number>;

  return (
    <main className="dashboard-shell">
      <div className="ambient-grid" aria-hidden="true" />

      <header className="briefing-header">
        <div className="briefing-header__topline">
          <Link className="wordmark" href="/" aria-label="AI Signal 首页">
            <span className="wordmark__glyph" aria-hidden="true">
              AI
            </span>
            <span>Signal Desk</span>
          </Link>
          <div className="live-status">
            <span className="live-status__dot" aria-hidden="true" />
            30 分钟刷新周期
          </div>
        </div>

        <div className="briefing-header__main">
          <div>
            <p className="eyebrow">AI INDUSTRY BRIEFING / 人工智能情报简报</p>
            <h1>
              把噪声留在外面。
              <span>只看正在改变 AI 的信号。</span>
            </h1>
            <p className="briefing-header__intro">
              聚合新闻、社区讨论与最新论文，并用中文提炼它们为何值得关注。
            </p>
          </div>
          <div className="briefing-header__actions">
            <RefreshButton />
            <p>
              {data
                ? `上次更新 ${new Date(data.generatedAt).toLocaleString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}`
                : "尚未完成首次采集"}
            </p>
          </div>
        </div>

        <div className="source-pulse" aria-label="当前快照的来源分布">
          {SOURCES.map((source) => (
            <div
              className={`source-pulse__lane source-pulse__lane--${source}`}
              key={source}
            >
              <div>
                <span className="source-pulse__marker" aria-hidden="true">
                  {SOURCE_META[source].marker}
                </span>
                <span>{SOURCE_META[source].shortLabel}</span>
              </div>
              <strong>{String(sourceCounts[source]).padStart(2, "0")}</strong>
            </div>
          ))}
        </div>
      </header>

      <section className="feed" aria-labelledby="feed-title">
        <div className="feed__heading">
          <div>
            <p className="eyebrow">LATEST SIGNALS</p>
            <h2 id="feed-title">最新情报</h2>
          </div>
          <p>{items.length > 0 ? `${items.length} 条精选` : "等待首次采集"}</p>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__radar" aria-hidden="true" />
            <h2>情报雷达正在待命</h2>
            <p>点击“刷新情报”采集第一批内容；配置模型后还会生成中文洞察。</p>
          </div>
        ) : (
          <div className="news-list">
            {items.map((item, index) => (
              <NewsCard key={item.id} item={item} rank={index + 1} />
            ))}
          </div>
        )}
      </section>

      <footer className="dashboard-footer">
        <span>AI SIGNAL DESK</span>
        <span>Google News · Reddit · Hacker News · arXiv</span>
      </footer>
    </main>
  );
}
