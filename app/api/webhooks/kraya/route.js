import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/kraya
 *
 * Receives lead create/update events from Kraya.
 * Configure in Kraya dashboard → Webhooks:
 *   URL: https://veyona.in/api/webhooks/kraya
 *   Secret: KRAYA_WEBHOOK_SECRET
 */
export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const secret = process.env.KRAYA_WEBHOOK_SECRET?.trim();
  if (secret) {
    const headerSecret =
      req.headers.get("x-kraya-webhook-secret") ||
      req.headers.get("x-webhook-secret") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const bodySecret = payload?.secret || payload?.webhook_secret;
    if (headerSecret !== secret && bodySecret !== secret) {
      return NextResponse.json({ message: "Invalid webhook secret" }, { status: 401 });
    }
  }

  const {
    lead_id,
    name,
    phone,
    email,
    notes,
    stage,
    pipeline,
    event_type,
    custom_attributes,
  } = payload || {};

  console.info("[kraya webhook]", {
    event_type: event_type || "unknown",
    lead_id,
    name,
    phone,
    email,
    stage,
    pipeline,
    notes: notes ? String(notes).slice(0, 120) : undefined,
    custom_attributes,
  });

  return NextResponse.json({
    success: true,
    received: true,
    event_type: event_type || null,
    lead_id: lead_id || null,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Kraya webhook endpoint. Configure POST from Kraya dashboard.",
  });
}
