export type NewsSource =
  | "google-news"
  | "reddit"
  | "hacker-news"
  | "arxiv"
  | "techcrunch"
  | "the-verge"
  | "mit-tech-review"
  | "huggingface"
  | "lobsters"
  | "product-hunt"
  | "semi-engineering"
  | "ee-times"
  | "semiwiki"
  | "ieee-spectrum"
  | "ft"
  | "wsj"
  | "economist";

export interface NewsItem {
  /** Stable id derived from the URL */
  id: string;
  title: string;
  url: string;
  source: NewsSource;
  /** Human readable origin, e.g. "r/MachineLearning" or the news outlet name */
  origin: string;
  publishedAt: string; // ISO string
  /** Original snippet (may be empty) */
  summary?: string;
  /** LLM-generated Chinese insight */
  insight?: string;
}

export interface NewsData {
  generatedAt: string; // ISO string
  items: NewsItem[];
}

export interface PipelineResult {
  generatedAt: string;
  count: number;
  llmCalls: number;
  /** Sources served from the previous snapshot because their refresh failed. */
  staleSources: NewsSource[];
}
