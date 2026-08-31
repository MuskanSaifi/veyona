# WhatsApp Messages on Live / Production (Kraya)

## How Kraya sends WhatsApp (important)

Kraya **does not** expose a public “send template by name” HTTP API (support confirmed).

Messages go out like this:

1. Website **upserts a lead** → `KRAYA_LEADS_URL`
2. Request includes **`sequence`** = Auto Follow-up sequence name
3. That sequence contains your **approved WhatsApp template** → message is sent

`KRAYA_WHATSAPP_SEND_URL` is **optional** — only if Kraya later gives a direct send endpoint.  
**Do not** put the webhook URL there.

---

## 1. Production environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KRAYA_API_KEY` | Yes | CRM → Kraya API → API Key |
| `KRAYA_LEADS_URL` | Yes | Leads API URL from same page |
| `KRAYA_WEBHOOK_SECRET` | Recommended | Same as Webhooks page |
| `ADMIN_WHATSAPP_PHONE` | Yes | Admin 10-digit number |
| `KRAYA_SEQUENCE_*` | Recommended | Auto Follow-up sequence names |
| `KRAYA_WHATSAPP_SEND_URL` | No | Only if Kraya provides a direct send API |

After changing env → **restart / redeploy**.

---

## 2. Create Auto Follow-up sequences (required)

Kraya → **Auto Follow-ups** → create one active sequence per message type.

Each sequence should include the matching approved template, e.g.:

| Sequence name (example) | Template inside it |
|-------------------------|--------------------|
| `transactional_booking_received` | `transactional_booking_received` |
| `transactional_booking_confirmation` | `transactional_booking_confirmation` |
| `transactional_admin_new_appointment` | `transactional_admin_new_appointment` |
| `transactional_employee_assign` | `transactional_employee_assign` |
| `transactional_user_appointment_rescheduled` | same |
| `transactional_employee_appointment_rescheduled` | same |
| `service_feedback` | `service_feedback` |

Easiest: **sequence name = template name** (matches `.env`).

---

## 3. Webhook (Kraya → website)

Kraya → Webhooks:

- URL: `https://veyona.in/api/webhooks/kraya`
- Secret: same as `KRAYA_WEBHOOK_SECRET`
- Active + Save

This receives lead events; it does **not** send WhatsApp.

---

## 4. Debug

1. `GET /api/whatsapp/status` → `whatsappConfigured: true`, `deliveryMode: "leads_sequence"`
2. `GET /api/whatsapp/test?phone=XXXXXXXXXX` → lead upsert with sequence
3. Logs: `[whatsapp/kraya] send via lead sequence` or `Kraya lead upsert failed`
4. If `Invalid api key` → re-copy API key from dashboard, restart
5. New booking → lead in Kraya CRM + sequence WhatsApp

## Checklist

1. API key valid (leads upsert succeeds)
2. Templates approved
3. Auto Follow-up sequences active (with those templates)
4. `KRAYA_SEQUENCE_*` / names match
5. Deploy + restart
