import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { messages } from "../../db/schema.js";

const KEYWORDS = [
  "urgent", "verify", "account", "password",
  "click", "login", "bank", "otp",
  "suspended", "limited time", "security alert",
];

function analyzeMessage(message: string) {
  const lower = message.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  for (const word of KEYWORDS) {
    if (lower.includes(word)) {
      score += 10;
      reasons.push(`Contains '${word}'`);
    }
  }

  if (/https?:\/\//i.test(lower)) {
    score += 20;
    reasons.push("Contains a link");
  }

  if (message.includes("!")) {
    score += 5;
    reasons.push("Uses urgency (!)");
  }

  if (lower.includes("immediately") || /\bnow\b/.test(lower)) {
    score += 10;
    reasons.push("Creates urgency");
  }

  if (message.includes("@") && message.includes(".")) {
    score += 5;
    reasons.push("Contains email-like pattern");
  }

  const finalScore = Math.min(score, 100);
  return {
    verdict: score >= 40 ? "Phishing" : "Safe",
    score: finalScore,
    reason: reasons.length ? reasons.join(", ") : "No strong phishing signals",
  };
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ verdict: "Error", score: 0, reason: "Invalid JSON" }, { status: 400 });
  }

  const message = (body.message || "").toString().trim();
  if (!message) {
    return Response.json({ verdict: "Error", score: 0, reason: "Empty message" }, { status: 400 });
  }

  const result = analyzeMessage(message);

  try {
    await db.insert(messages).values({
      message,
      verdict: result.verdict,
      score: result.score,
      reason: result.reason,
      ip: context.ip ?? null,
      country: context.geo?.country?.name ?? null,
      city: context.geo?.city ?? null,
      userAgent: req.headers.get("user-agent"),
    });
  } catch (err) {
    console.error("Failed to persist message:", err);
  }

  return Response.json(result);
};

export const config: Config = {
  path: "/api/analyze",
};
