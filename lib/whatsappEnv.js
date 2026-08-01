/**
 * Prefer KRAYA_* env vars; fall back to legacy INTERAKT_* during migration.
 */
export function envWhatsApp(key, fallback = "") {
  const kraya = process.env[`KRAYA_${key}`];
  if (kraya != null && String(kraya).trim() !== "") return String(kraya).trim();
  const interakt = process.env[`INTERAKT_${key}`];
  if (interakt != null && String(interakt).trim() !== "") return String(interakt).trim();
  return fallback;
}

export function getKrayaApiKey() {
  return (
    process.env.KRAYA_API_KEY?.trim() ||
    process.env.INTERAKT_API_KEY?.trim() ||
    ""
  );
}

export function getTemplateEnv(name, fallback = "") {
  return envWhatsApp(`TEMPLATE_${name}`, fallback);
}
