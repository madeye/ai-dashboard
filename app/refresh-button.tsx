"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RefreshState = "idle" | "refreshing" | "error";

export function RefreshButton() {
  const router = useRouter();
  const [state, setState] = useState<RefreshState>("idle");

  async function refresh() {
    setState("refreshing");
    try {
      const response = await fetch("/api/refresh", { method: "POST" });
      if (!response.ok) throw new Error(`Refresh failed (${response.status})`);
      router.refresh();
      setState("idle");
    } catch (error) {
      console.error(error);
      setState("error");
    }
  }

  const label =
    state === "refreshing"
      ? "正在采集…"
      : state === "error"
        ? "刷新失败，重试"
        : "刷新情报";

  return (
    <button
      type="button"
      className="refresh-button"
      onClick={refresh}
      disabled={state === "refreshing"}
      aria-live="polite"
    >
      <span className="refresh-button__icon" aria-hidden="true">
        ↻
      </span>
      {label}
    </button>
  );
}
