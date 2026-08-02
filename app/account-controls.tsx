"use client";

import { RefreshButton } from "@/app/refresh-button";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

type SessionState = { user?: { email?: string | null } } | null | undefined;

// 首页是静态页，登录态只能在客户端通过 Auth.js 的 session 接口判断。
// undefined = 尚未检查（先按匿名渲染登录入口，与 CDN 缓存的 HTML 一致）。
function useAuthSession(): SessionState {
  const [session, setSession] = useState<SessionState>(undefined);
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSession(data?.user ? data : null))
      .catch(() => setSession(null));
  }, []);
  return session;
}

/** 右上角账号区：匿名显示登录链接，登录后显示邮箱与退出按钮。 */
export function AccountControl() {
  const session = useAuthSession();

  if (session?.user) {
    return (
      <div className="account-control">
        <span title={session.user.email ?? undefined}>
          {session.user.email}
        </span>
        <button type="button" onClick={() => signOut({ redirectTo: "/login" })}>
          退出
        </button>
      </div>
    );
  }

  return (
    <div className="account-control">
      <Link href="/login">登录</Link>
    </div>
  );
}

/** 头部操作区：匿名显示登录引导，登录后显示刷新按钮。 */
export function RefreshControl() {
  const session = useAuthSession();

  if (session?.user) {
    return <RefreshButton />;
  }

  return (
    <Link className="refresh-button" href="/login">
      登录以刷新情报
      <span className="refresh-button__icon" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
