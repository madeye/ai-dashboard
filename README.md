# AI News Dashboard

AI 相关新闻聚合站：从 Google News、Reddit、Hacker News 与 arXiv 抓取热点，使用 OpenAI 兼容 API（默认 DeepSeek）生成中文洞察，每 30 分钟自动刷新。

## 快速开始

```bash
cp .env.example .env
# 填入 Google OAuth 配置与 ALLOWED_USERS；OPENAI_API_KEY 可选
npm install
npm run dev
```

打开 http://localhost:3000。

首次配置 Google Cloud OAuth 2.0 Web 客户端时，将
`http://localhost:3000/api/auth/callback/google` 加入 Authorized redirect URIs。
登录白名单支持用逗号或空格分隔多个邮箱；空白名单会拒绝所有账号。

- 手动拉取一次数据：`npx tsx scripts/fetch-news.ts`
- 手动触发刷新：登录后点击“刷新情报”（`POST /api/refresh` 需要有效会话）
- 查看原始数据：登录后访问 `GET /api/news`

## 工作原理

- `lib/sources/` — 数据源（Google News RSS、Reddit Atom、Hacker News Algolia API、arXiv Atom API）
- `lib/pipeline.ts` — 并行抓取 → 失败源复用上一份快照 → 去重并保留各来源的基本代表性 → 取 top 30 → 为新增条目生成中文 insight（旧条目复用缓存，不重复调用 LLM）→ 原子写入 `data/news.json`
- `instrumentation.ts` — Next.js 启动时注册 `node-cron`（`*/30 * * * *`），无缓存数据时立即执行一次
- `app/page.tsx` — 服务端组件，直接读取 `data/news.json` 渲染

## 环境变量（.env，已 gitignore）

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `AUTH_SECRET` | Auth.js 会话签名密钥（`openssl rand -base64 32`） | 必填 |
| `AUTH_GOOGLE_ID` | Google OAuth 客户端 ID | 必填 |
| `AUTH_GOOGLE_SECRET` | Google OAuth 客户端密钥 | 必填 |
| `ALLOWED_USERS` | 允许登录的 Google 邮箱列表 | 空（拒绝所有账号） |
| `AUTH_URL` | 站点完整外部 URL（生产环境反代后必填，如 `https://news.maxlv.net`） | 本地开发可空 |
| `OPENAI_API_KEY` | OpenAI 兼容 API key | 空（降级为原文摘要） |
| `OPENAI_BASE_URL` | API base URL | `https://api.deepseek.com` |
| `MODEL_NAME` | 模型 ID | `deepseek-chat` |
| `REDDIT_USER_AGENT` | Reddit 请求 UA | `ai-dashboard/0.1` |

## 部署注意

定时刷新依赖 Node 常驻进程（`next dev` / `next start` 有效）。Vercel 等 serverless 平台不支持进程内 cron，需改用 Vercel Cron 定时调用 `POST /api/refresh`（且 `data/` 需换成外部存储）。
