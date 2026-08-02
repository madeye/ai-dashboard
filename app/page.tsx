import { AccountControl, RefreshControl } from "@/app/account-controls";
import { Dashboard } from "@/app/dashboard";
import { readNews } from "@/lib/store";

// 首页即公开快照页：ISR 静态生成，响应带 s-maxage，可由 CDN 缓存。
// revalidatePath 无法在非请求上下文（node-cron）中调用，
// 这里用时间兜底：cron 写入的新快照最多延迟约 5 分钟对外可见；
// 手动刷新则由 /api/refresh 里 revalidatePath("/") 立即生效。
// 登录态相关的控件（刷新按钮、账号栏）由客户端组件按会话渲染。
export const revalidate = 300;

export default async function Home() {
  const data = await readNews();

  return (
    <Dashboard
      data={data}
      actions={<RefreshControl />}
      controls={<AccountControl />}
    />
  );
}
