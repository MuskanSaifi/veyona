import { NextResponse } from "next/server";
import { getKrayaApiKey } from "@/lib/whatsappEnv";

/**
 * GET /api/whatsapp/status
 * Returns whether WhatsApp (Kraya) is configured. Does not expose secrets.
 *
 * Delivery mode: lead upsert + Auto Follow-up sequence (no direct template API yet).
 */
export async function GET() {
  const apiKey = getKrayaApiKey();
  const leadsUrl = process.env.KRAYA_LEADS_URL?.trim() || "";
  const directSendUrl = process.env.KRAYA_WHATSAPP_SEND_URL?.trim() || "";
  const sequenceMode = Boolean(apiKey && leadsUrl);

  return NextResponse.json({
    provider: "kraya",
    deliveryMode: directSendUrl ? "direct_send_url" : "leads_sequence",
    whatsappConfigured: sequenceMode || Boolean(apiKey && directSendUrl),
    leadsConfigured: sequenceMode,
    sendUrlConfigured: Boolean(directSendUrl),
    env: process.env.NODE_ENV || "development",
  });
}
