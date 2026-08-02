import { promises as fs } from "fs";
import path from "path";
import type { NewsData } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "news.json");

export async function readNews(): Promise<NewsData | null> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as NewsData;
  } catch {
    return null;
  }
}

export async function writeNews(data: NewsData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, DATA_FILE);
}
