# AI News Dashboard

AI 相关新闻聚合站：从 Google News、Reddit、Hacker News 与 arXiv 抓取热点，使用 OpenAI 兼容 API（默认 DeepSeek）生成中文洞察，每 30 分钟自动刷新。

## 快速开始

```bash
cp .env.example .env   # 填入 OPENAI_API_KEY（可选，缺省时展示原文摘要）
npm install
npm run dev
```

打开 http://localhost:3000。

- 手动拉取一次数据：`npx tsx scripts/fetch-news.ts`
- 手动触发刷新：`curl -X POST http://localhost:3000/api/refresh`
- 查看原始数据：`GET /api/news`

## 工作原理

- `lib/sources/` — 数据源（Google News RSS、Reddit Atom、Hacker News Algolia API、arXiv Atom API）
- `lib/pipeline.ts` — 并行抓取 → 失败源复用上一份快照 → 去重并保留各来源的基本代表性 → 取 top 30 → 为新增条目生成中文 insight（旧条目复用缓存，不重复调用 LLM）→ 原子写入 `data/news.json`
- `instrumentation.ts` — Next.js 启动时注册 `node-cron`（`*/30 * * * *`），无缓存数据时立即执行一次
- `app/page.tsx` — 服务端组件，直接读取 `data/news.json` 渲染

## 环境变量（.env，已 gitignore）

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI 兼容 API key | 空（降级为原文摘要） |
| `OPENAI_BASE_URL` | API base URL | `https://api.deepseek.com` |
| `MODEL_NAME` | 模型 ID | `deepseek-chat` |
| `REDDIT_USER_AGENT` | Reddit 请求 UA | `ai-dashboard/0.1` |

## 部署注意

定时刷新依赖 Node 常驻进程（`next dev` / `next start` 有效）。Vercel 等 serverless 平台不支持进程内 cron，需改用 Vercel Cron 定时调用 `POST /api/refresh`（且 `data/` 需换成外部存储）。
