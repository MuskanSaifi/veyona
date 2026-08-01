import { NextResponse } from "next/server";
import { getKrayaApiKey } from "@/lib/whatsappEnv";

/**
 * GET /api/whatsapp/status
 * Returns whether WhatsApp (Kraya) is configured. Does not expose secrets.
 */
export async function GET() {
  const apiKey = getKrayaApiKey();
  const sendUrl =
    process.env.KRAYA_WHATSAPP_SEND_URL?.trim() ||
    (process.env.KRAYA_LEADS_URL?.trim() &&
    /\/leads\/?$/i.test(process.env.KRAYA_LEADS_URL)
      ? process.env.KRAYA_LEADS_URL.replace(/\/leads\/?$/i, "/whatsapp/template")
      : "");
  const leadsUrl = process.env.KRAYA_LEADS_URL?.trim() || "";

  return NextResponse.json({
    provider: "kraya",
    whatsappConfigured: Boolean(apiKey && sendUrl),
    leadsConfigured: Boolean(apiKey && leadsUrl),
    sendUrlConfigured: Boolean(sendUrl),
    env: process.env.NODE_ENV || "development",
  });
}
