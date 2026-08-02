<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI News Dashboard（AI 新闻聚合站）

AI 相关新闻聚合站：从 Google News、Reddit、Hacker News、arXiv、TechCrunch、The Verge、MIT Technology Review、Hugging Face Blog、Lobsters、Product Hunt，以及中文媒体（36氪、InfoQ 中文、极客公园）、日语媒体（ITmedia AI+、Publickey、gihyo.jp）、韩语媒体（AI타임스）抓取热点，使用 OpenAI 兼容 API（默认 DeepSeek）为每条新闻生成中文洞察（insight），每 30 分钟自动刷新一次。首页 `/` 为公开静态快照页（ISR，可 CDN 缓存），无需登录即可浏览；登录（Google OAuth + 邮箱白名单）后可手动刷新与访问原始数据接口。

## 技术栈

- **框架**：Next.js 16.2（App Router）+ React 19 + TypeScript（strict 模式，`@/*` 路径别名指向仓库根目录）
- **认证**：Auth.js v5 beta（`next-auth` 5.0.0-beta，Google provider，JWT session）
- **样式**：Tailwind CSS v4（`@tailwindcss/postcss`，无独立配置文件）+ `app/globals.css` 中的自定义 CSS 类
- **数据采集**：`rss-parser`（RSS/Atom feeds）、原生 `fetch`（Hacker News Algolia API）
- **LLM**：`openai` SDK，指向 OpenAI 兼容端点（默认 `https://api.deepseek.com`，模型 `deepseek-chat`）
- **定时任务**：`node-cron`，注册在 `instrumentation.ts` 中（需要常驻 Node 进程）
- **存储**：无数据库。新闻快照保存在 `data/news.json`（已 gitignore，运行时生成）

## 常用命令

```bash
cp .env.example .env        # 首次配置，填入 Google OAuth 与 ALLOWED_USERS
npm install
npm run dev                 # 开发服务器 http://localhost:3000
npm run build               # 生产构建
npm start                   # 生产模式运行
npm run lint                # ESLint（eslint-config-next，flat config）
npm test                    # tsx --test lib/*.test.ts（Node 内置 test runner）
npx tsx scripts/fetch-news.ts   # 手动跑一次抓取管线（会先尝试加载 .env）
```

首次配置 Google Cloud OAuth 2.0 Web 客户端时，将 `http://localhost:3000/api/auth/callback/google` 加入 Authorized redirect URIs。

## 架构与代码组织

### 抓取管线（`lib/`）

- `lib/pipeline.ts` — 核心管线：并行抓取最多 17 个数据源（`Promise.allSettled`）→ 失败或空结果的源复用上一份快照中该源的条目（记入 `staleSources`）→ `selectNewsItems` 去重、按来源保留最低代表性（每源至少 2 条）并取 top 50 → 仅为新增条目调用 LLM 生成中文 insight（旧条目按 id 复用缓存，不重复调用；并发上限 4）→ 原子写入 `data/news.json`（先写 `.tmp` 再 rename）。`runPipeline()` 有进程内单飞（single-flight）保护。`product-hunt` 仅在配置了 `PRODUCTHUNT_API_TOKEN` 时才会注册。
- `lib/sources/` — 每个数据源一个文件：`google-news.ts`（RSS 搜索）、`reddit.ts`（Atom feed，需自定义 User-Agent；`.json` API 未认证会被 403）、`hacker-news.ts`（Algolia search API，一次请求一个关键词）、`arxiv.ts`（Atom API 而非 RSS，因为 RSS 周末为空）、`techcrunch.ts` / `the-verge.ts` / `mit-tech-review.ts` / `huggingface.ts` / `lobsters.ts`（单 feed RSS）、`product-hunt.ts`（v2 GraphQL API，需 developer token）、`36kr.ts` / `infoq-cn.ts` / `geekpark.ts`（中文媒体 RSS）、`itmedia-ai.ts` / `gihyo.ts`（日语媒体 RSS）、`publickey.ts`（日语 Atom）、`aitimes.ts`（韩语媒体 RSS）。中日韩综合媒体的条目需经 `ai-filter.ts` 按标题关键词过滤，只保留 AI 相关内容（勿加入摘要匹配，正文偶发提及 AI 会导致误报）。所有 fetch 函数失败时返回部分结果而不抛出。
- `lib/ranking.ts` — 去重（按 id）+ 按时间排序 + 每源最低配额选择逻辑。
- `lib/llm.ts` — 生成中文 insight（system prompt 要求：①一句话要点 ②一句话意义，共 ≤80 字）。未配置 `OPENAI_API_KEY` 或调用失败时降级为截断的原文摘要，不抛错。
- `lib/store.ts` — `data/news.json` 读写；读取失败返回 `null`。
- `lib/types.ts` — `NewsItem` / `NewsData` / `NewsSource` / `PipelineResult` 类型定义。条目 id 是 URL 的 sha1 前 16 位（`lib/utils.ts`）。
- `lib/auth-allowlist.ts` — 登录邮箱白名单解析（逗号或空白分隔；空名单拒绝所有人）。

### Web 层（`app/`）

- `app/dashboard.tsx` — 新闻看板的纯展示组件（`Dashboard`）；通过 `controls` / `actions` 插槽注入登录态相关 UI。
- `app/page.tsx` — 首页，即公开快照页（无需登录）：ISR 静态页（`revalidate = 300`），读 `data/news.json` 渲染 `Dashboard`，响应带 `s-maxage`，可由 CDN 按静态页面缓存。cron 写入的新快照最多延迟约 5 分钟可见；手动刷新由 `/api/refresh` 调 `revalidatePath("/")` 立即生效（`revalidatePath` 只能在 Route Handler / Server Function 中调用，node-cron 回调里不能调）。页面文案为中文。
- `app/account-controls.tsx` — 客户端组件（`AccountControl` / `RefreshControl`）：首页是静态页，登录态只能在客户端通过 `/api/auth/session` 判断；匿名渲染登录入口（与 CDN 缓存的 HTML 一致），登录后切换为刷新按钮与账号栏（含 `next-auth/react` 的 `signOut`）。
- `app/refresh-button.tsx` — 客户端组件，POST `/api/refresh` 后 `router.refresh()`。
- `app/login/page.tsx` — 登录页。
- `app/api/auth/[...nextauth]/route.ts` — Auth.js handler。
- `app/api/refresh/route.ts` — `POST` 手动触发管线（需登录），成功后 `revalidatePath("/")`；返回 502 表示抓取失败但旧快照已保留。
- `app/api/news/route.ts` — `GET` 返回原始 JSON 快照（需登录）。
- `proxy.ts` — 路由守卫（Next.js 16 中取代 `middleware.ts` 的文件约定）：页面全部公开，未登录只拦截 API（返回 401 JSON；matcher 已排除 `/api/auth`）。CDN 缓存策略：`/` 为静态 ISR（`s-maxage=300`）可缓存；登录态差异由客户端组件处理，CDN 上的 HTML 对所有人相同，不存在缓存串号问题。
- `auth.ts`（仓库根）— Auth.js 配置：Google provider、`signIn` 回调中检查邮箱白名单。
- `instrumentation.ts` — 启动时注册 node-cron（`*/30 * * * *`），无缓存数据时立即抓取一次。仅 `nodejs` runtime 生效。

## 环境变量

见 `.env.example`。必填：`AUTH_SECRET`、`AUTH_GOOGLE_ID`、`AUTH_GOOGLE_SECRET`。`ALLOWED_USERS` 为空时拒绝所有账号（fail-closed）。`OPENAI_API_KEY` 可选（缺失时降级为原文摘要）。`PRODUCTHUNT_API_TOKEN` 可选（缺失时不注册 product-hunt 源）。生产环境反代后需设置 `AUTH_URL`。`.env` 与 `data/` 均已 gitignore，不要提交。

## 测试

- 测试文件放在被测模块旁边，命名 `*.test.ts`（现有 `lib/ranking.test.ts`、`lib/auth-allowlist.test.ts`、`lib/sources/product-hunt.test.ts`、`lib/sources/ai-filter.test.ts`）。
- 使用 Node 内置 test runner（`node:test` + `node:assert/strict`），通过 `npm test`（`tsx --test lib/*.test.ts lib/sources/*.test.ts`）运行。注意 glob 只匹配 `lib/` 与 `lib/sources/` 一层，在其他目录新增测试需要同步更新该命令。

## 代码约定

- 源码注释中英文混用；面向用户的文案（页面、LLM prompt、报错信息）为中文。
- 数据源的失败是常态：单个 fetch 失败不应让整个管线失败，对外部 API 一律设超时（15s）。
- LLM 调用昂贵且慢：新增条目才调用，旧条目必须复用缓存 insight。
- 写 `data/news.json` 必须通过 `lib/store.ts` 的原子写入，不要在其他模块直接操作文件。

## 部署

- 定时刷新依赖常驻 Node 进程（`next start`）。Vercel 等 serverless 平台不支持进程内 cron，需改用 Vercel Cron 定时调用 `POST /api/refresh`，并把 `data/` 换成外部存储。
- 生产部署走 `scripts/deploy.sh`：rsync 同步文件到服务器（排除 `.git`、`node_modules`、`.env`、`data`），远端执行 `npm ci && npm run build` 后用 systemd 重启服务。服务器凭据放在 `deploy.conf`（已 gitignore，模板见 `deploy.conf.example`）或用环境变量 `DEPLOY_SSH` / `DEPLOY_DIR` / `DEPLOY_SERVICE` 提供。
