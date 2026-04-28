import { NextResponse } from "next/server";

/**
 * GET /api/whatsapp/status
 * Returns whether WhatsApp (Interakt) is configured on this environment.
 * Use on live to verify INTERAKT_API_KEY is set. Does not expose the key.
 */
export async function GET() {
  const configured =
    typeof process.env.INTERAKT_API_KEY === "string" &&
    process.env.INTERAKT_API_KEY.trim().length > 0;
  return NextResponse.json({
    whatsappConfigured: configured,
    env: process.env.NODE_ENV || "development",
  });
}
