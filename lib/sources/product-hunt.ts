import type { NewsItem } from "@/lib/types";
import { makeId } from "@/lib/utils";

const API_URL = "https://api.producthunt.com/v2/api/graphql";

const QUERY = `{
  posts(topic: "artificial-intelligence", order: NEWEST, first: 20) {
    edges {
      node {
        name
        tagline
        url
        createdAt
        votesCount
      }
    }
  }
}`;

interface ProductHuntPost {
  name?: string;
  tagline?: string;
  url?: string;
  createdAt?: string;
  votesCount?: number;
}

/** Map raw Product Hunt posts to NewsItems (pure, exported for tests). */
export function mapPosts(posts: ProductHuntPost[]): NewsItem[] {
  return posts
    .filter((post) => post.name && post.url)
    .map((post): NewsItem => {
      const link = post.url ?? "";
      return {
        id: makeId(link),
        title: post.name ?? "",
        url: link,
        source: "product-hunt",
        origin: `Product Hunt · ${post.votesCount ?? 0} votes`,
        publishedAt: post.createdAt ?? new Date().toISOString(),
        summary: post.tagline?.slice(0, 500) || undefined,
      };
    });
}

// Product Hunt has no public RSS; the v2 GraphQL API needs a developer token.
// The pipeline only registers this source when PRODUCTHUNT_API_TOKEN is set.
export async function fetchProductHunt(): Promise<NewsItem[]> {
  const token = process.env.PRODUCTHUNT_API_TOKEN;
  if (!token) throw new Error("PRODUCTHUNT_API_TOKEN is not set");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: QUERY }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Product Hunt API ${res.status}`);

  const data = (await res.json()) as {
    data?: { posts?: { edges?: { node: ProductHuntPost }[] } };
    errors?: unknown;
  };
  if (data.errors) throw new Error(`Product Hunt API error: ${JSON.stringify(data.errors)}`);

  const posts = data.data?.posts?.edges?.map((edge) => edge.node) ?? [];
  return mapPosts(posts);
}
