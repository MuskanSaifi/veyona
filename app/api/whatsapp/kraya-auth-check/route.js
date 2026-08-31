import { NextResponse } from "next/server";
import { getKrayaApiKey, getKrayaApiKeyFingerprint } from "@/lib/whatsappEnv";
import { getKrayaLeadsUrl } from "@/lib/krayaLeads";

/**
 * GET /api/whatsapp/kraya-auth-check?phone=9643685727
 *
 * Probes Kraya Leads API with several phone/URL variants.
 * Does NOT expose the full API key — only length/prefix/suffix.
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const phoneRaw =
    searchParams.get("phone") ||
    process.env.ADMIN_WHATSAPP_PHONE ||
    process.env.ADMIN_PHONE ||
    "9643685727";
  const phone10 = String(phoneRaw).replace(/\D/g, "").slice(-10);
  const apiKey = getKrayaApiKey();
  const fingerprint = getKrayaApiKeyFingerprint();
  const configuredUrl = getKrayaLeadsUrl();

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      message: "KRAYA_API_KEY missing in env",
      fingerprint,
    });
  }

  const slugMatch = configuredUrl.match(/\/external\/([^/]+)\/leads/i);
  const slug = slugMatch?.[1] || "D2oxd9Cv";

  const urls = [
    configuredUrl,
    `https://api.kraya-ai.com/api/external/${slug}/leads`,
    `https://kraya-ai.com/api/external/${slug}/leads`,
  ].filter((u, i, arr) => arr.indexOf(u) === i);

  const phoneVariants = [
    phone10,
    `+91${phone10}`,
    `+91-${phone10}`,
    `91${phone10}`,
  ];

  const attempts = [];

  for (const url of urls) {
    for (const phone of phoneVariants) {
      const payload = { name: "Veyona Auth Check", phone };
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-KRAYA-API-KEY": apiKey,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        const ok = res.ok;
        attempts.push({
          url,
          phone,
          status: res.status,
          ok,
          message: data.message || data.error || res.statusText,
        });
        // Stop early on first success
        if (ok) {
          return NextResponse.json({
            success: true,
            message: "Kraya API key accepted",
            fingerprint,
            working: { url, phone },
            attempts,
          });
        }
      } catch (err) {
        attempts.push({
          url,
          phone,
          status: 0,
          ok: false,
          message: err.message || "Network error",
        });
      }
    }
  }

  const allInvalidKey = attempts.every(
    (a) =>
      String(a.message || "")
        .toLowerCase()
        .includes("invalid api key")
  );

  return NextResponse.json(
    {
      success: false,
      message: allInvalidKey
        ? "Kraya rejected the API key on every attempt. Key in dashboard UI can still be invalid/expired on their server — ask Kraya to regenerate."
        : "All probe attempts failed (see attempts).",
      fingerprint,
      tip: "Compare fingerprint with dashboard key: length + first 2 + last 2 chars must match exactly (case-sensitive).",
      attempts,
    },
    { status: 502 }
  );
}
