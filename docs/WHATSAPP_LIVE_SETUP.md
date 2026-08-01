# WhatsApp Messages on Live / Production (Kraya)

Agar localhost pe WhatsApp msg aa rahe hain lekin **live/production** pe nahi aa rahe, ye steps check karein.

## 1. Production pe Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KRAYA_API_KEY` | Yes | Kraya Dashboard → API → API Key |
| `KRAYA_LEADS_URL` | Yes | Leads upsert URL from API page |
| `KRAYA_WHATSAPP_SEND_URL` | Yes* | Template send endpoint (confirm with Kraya) |
| `KRAYA_WEBHOOK_SECRET` | Recommended | Same secret as Kraya Webhooks page |
| `ADMIN_WHATSAPP_PHONE` | Yes | 10-digit admin WhatsApp number |
| `KRAYA_TEMPLATE_BOOKING_CONFIRMED` | Optional | Default: `transactional_booking_confirmation` |
| `KRAYA_TEMPLATE_ADMIN_NEW_APPOINTMENT` | Optional | Default: `transactional_admin_new_appointment` |
| `KRAYA_TEMPLATE_EMPLOYEE_ASSIGN` | Optional | Default: `transactional_employee_assign` |
| `KRAYA_HEADER_IMAGE_URL` | Optional | Global fallback for IMAGE headers |

\* If `KRAYA_WHATSAPP_SEND_URL` is empty, the app tries to derive  
`…/whatsapp/template` from `KRAYA_LEADS_URL`. Confirm this path with Kraya support.

**Important:**  
- Keys are **server-side** only — do **not** use `NEXT_PUBLIC_`.  
- After setting env vars, **redeploy / restart**.

Legacy `INTERAKT_*` vars still work as fallback during migration, but prefer `KRAYA_*`.

## 2. Webhook (production)

Kraya → Webhooks:

- URL: `https://veyona.in/api/webhooks/kraya`
- Secret: same as `KRAYA_WEBHOOK_SECRET`
- Enable + Save

## 3. Debug

1. `GET /api/whatsapp/status` → `whatsappConfigured: true`, `provider: "kraya"`
2. `GET /api/whatsapp/test?phone=XXXXXXXXXX` → test send
3. Logs: `"Kraya WhatsApp error"` / `"WhatsApp send URL not configured"`
4. New booking → check lead appears in Kraya CRM

## Short checklist

1. Production me `KRAYA_API_KEY` + send URL + `ADMIN_WHATSAPP_PHONE` set?
2. Templates Meta-approved in Kraya WhatsApp?
3. Deploy/restart kiya?
4. Webhook URL production domain pe point karta hai?
