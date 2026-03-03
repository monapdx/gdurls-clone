import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { getClientIp, hashIp } from "../../../lib/utils";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params;

  const link = await sql<{ target_url: string }[]>`
    select target_url from links where code = ${code} limit 1
  `;

  if (link.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const targetUrl = link[0].target_url;

  // Log click (best-effort; do not block redirect)
  const referrer = req.headers.get("referer");
  const ua = req.headers.get("user-agent");
  const ipHash = hashIp(getClientIp(req.headers));

  // Optional: filter common unfurl/preview bots
  const uaLower = (ua || "").toLowerCase();
  const isPreviewBot =
    uaLower.includes("slackbot") ||
    uaLower.includes("discordbot") ||
    uaLower.includes("twitterbot") ||
    uaLower.includes("facebookexternalhit");

  if (!isPreviewBot) {
    try {
      await sql`
        insert into clicks (code, referrer, user_agent, ip_hash)
        values (${code}, ${referrer}, ${ua}, ${ipHash})
      `;
    } catch {
      // ignore logging failure
    }
  }

  return NextResponse.redirect(targetUrl, { status: 302 });
}