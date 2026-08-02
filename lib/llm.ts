import OpenAI from "openai";
import type { NewsItem } from "@/lib/types";

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL ?? "https://api.deepseek.com",
    });
  }
  return client;
}

export function hasLLM(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Generate a short Chinese insight for a news item.
 * Falls back to a truncated summary when the API is not configured or fails.
 */
export async function generateInsight(item: NewsItem): Promise<string> {
  const openai = getClient();
  if (!openai) {
    return fallbackInsight(item);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.MODEL_NAME ?? "deepseek-chat",
      max_tokens: 200,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "你是 AI 行业新闻分析师。根据用户给出的新闻标题和摘要，用中文输出两部分：" +
            "①一句话概括新闻要点；②一句话说明它对 AI 行业/从业者为什么重要。" +
            "总共不超过 80 字，直接输出内容，不要加序号、标题或多余解释。",
        },
        {
          role: "user",
          content: `标题：${item.title}\n来源：${item.origin}\n摘要：${
            item.summary ?? "（无）"
          }`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim();
    return text && text.length > 0 ? text : fallbackInsight(item);
  } catch (err) {
    console.error(`[llm] insight failed for ${item.id}:`, err);
    return fallbackInsight(item);
  }
}

function fallbackInsight(item: NewsItem): string {
  const base = item.summary?.replace(/\s+/g, " ").trim() ?? item.title;
  return `${base.slice(0, 120)}${base.length > 120 ? "…" : ""}（未配置 LLM，展示原文摘要）`;
}
