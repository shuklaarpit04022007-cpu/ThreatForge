import type { Config } from "@netlify/functions";
import { desc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { messages } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25", 10) || 25, 100);

  const rows = await db
    .select()
    .from(messages)
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  const [{ count, phishing, safe }] = await db
    .select({
      count: sql<number>`count(*)::int`,
      phishing: sql<number>`count(*) FILTER (WHERE ${messages.verdict} = 'Phishing')::int`,
      safe: sql<number>`count(*) FILTER (WHERE ${messages.verdict} = 'Safe')::int`,
    })
    .from(messages);

  return Response.json({
    stats: { total: count, phishing, safe },
    items: rows,
  });
};

export const config: Config = {
  path: "/api/messages",
};
