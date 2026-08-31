/**
 * Prefer KRAYA_* env vars; fall back to legacy INTERAKT_* during migration.
 */

function sanitizeSecret(value) {
  if (value == null) return "";
  return String(value)
    .replace(/^\uFEFF/, "") // BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width
    .trim()
    .replace(/^["']|["']$/g, "");
}

export function envWhatsApp(key, fallback = "") {
  const kraya = process.env[`KRAYA_${key}`];
  if (kraya != null && sanitizeSecret(kraya) !== "") return sanitizeSecret(kraya);
  const interakt = process.env[`INTERAKT_${key}`];
  if (interakt != null && sanitizeSecret(interakt) !== "") {
    return sanitizeSecret(interakt);
  }
  return fallback;
}

export function getKrayaApiKey() {
  return (
    sanitizeSecret(process.env.KRAYA_API_KEY) ||
    sanitizeSecret(process.env.INTERAKT_API_KEY) ||
    ""
  );
}

export function getTemplateEnv(name, fallback = "") {
  return envWhatsApp(`TEMPLATE_${name}`, fallback);
}

/** Safe fingerprint for logs / debug UI — never the full key */
export function getKrayaApiKeyFingerprint() {
  const key = getKrayaApiKey();
  if (!key) return { configured: false, length: 0, prefix: "", suffix: "" };
  return {
    configured: true,
    length: key.length,
    prefix: key.slice(0, 2),
    suffix: key.slice(-2),
  };
}
