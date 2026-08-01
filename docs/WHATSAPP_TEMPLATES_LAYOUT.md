# WhatsApp Template Layout (Kraya)

Use this layout when creating templates in **Kraya** → **WhatsApp** → Templates (or Meta Business Manager via Kraya). Template name in API must match the **Name** you give in Kraya (lowercase, underscores: `transactional_booking_confirmation`).

Provider: **Kraya** (`lib/whatsapp.js`). Env vars use `KRAYA_*` (legacy `INTERAKT_*` still works as fallback).

---

## 1. Booking confirmed (User)

**When:** Admin confirms appointment → user gets this WhatsApp.

| Field | Value |
|-------|--------|
| **Template name (API)** | `transactional_booking_confirmation` |
| **Category** | Utility |
| **Language** | English |

**Body (copy exactly):**
```
Thank you for choosing Veyona! 💛
Your appointment for {{1}} is confirmed at {{2}}.
We look forward to pampering you.
```

**Placeholders:**

| Placeholder | Value from app | Example |
|-------------|-----------------|---------|
| {{1}} | Service name + date | `Facial on Thu, 27 Feb, 2026` |
| {{2}} | Time | `10:00 AM` |

**.env:** `KRAYA_TEMPLATE_BOOKING_CONFIRMED=transactional_booking_confirmation`

---

## 2. New appointment (Admin)

**When:** User books appointment → admin gets WhatsApp.

| Field | Value |
|-------|--------|
| **Template name (API)** | `transactional_admin_new_appointment` |
| **Category** | Utility |
| **Language** | English |

**Body:**
```
New appointment booked on Veyona. ✨
Booking ID: {{1}}
Customer: {{2}}

Please review details in the admin dashboard:
    https://veyona.in/admin/dashboard
```

**Placeholders:**

| Placeholder | Value from app |
|-------------|-----------------|
| {{1}} | Booking ID (e.g. last 6 chars) |
| {{2}} | Customer name |

**.env:** `KRAYA_TEMPLATE_ADMIN_NEW_APPOINTMENT=transactional_admin_new_appointment`

---

## 3. Booking received (User)

**When:** User submits booking → instant acknowledgement.

| Field | Value |
|-------|--------|
| **Template name (API)** | `transactional_booking_received` or `transactional_booking_received_xp` |
| **Category** | Utility |
| **Language** | English |

**Placeholders:** {{1}} customer name, {{2}} service names

**.env:** `KRAYA_TEMPLATE_BOOKING_RECEIVED=transactional_booking_received_xp`

---

## 4. Employee assigned (Employee)

**When:** Admin confirms → employee gets WhatsApp.

| Field | Value |
|-------|--------|
| **Template name (API)** | `transactional_employee_assign` |
| **Category** | Utility |
| **Language** | English |

**Body:**
```
You have been assigned a new Veyona appointment. 👩‍⚕️
Client: {{1}}
Date: {{2}}
Time: {{3}}

Please check your employee dashboard for complete details.
```

**.env:** `KRAYA_TEMPLATE_EMPLOYEE_ASSIGN=transactional_employee_assign`

---

## 5. Appointment rescheduled (Customer)

**When:** Admin reschedules → customer gets WhatsApp.

| Field | Value |
|-------|--------|
| **Template name (API)** | `transactional_user_appointment_rescheduled` |
| **Category** | Utility |
| **Language** | English |

**Body:**
```
Your Veyona appointment has been rescheduled. 📅
Service: {{1}}
New date: {{2}}
New time: {{3}}

If you have any questions, please contact us.
```

**.env:** `KRAYA_TEMPLATE_USER_RESCHEDULE=transactional_user_appointment_rescheduled`

---

## 6. Appointment rescheduled (Employee)

**When:** Admin reschedules and employee assigned → employee WhatsApp.

| Field | Value |
|-------|--------|
| **Template name (API)** | `transactional_employee_appointment_rescheduled` |
| **Category** | Utility |
| **Language** | English |

**Body:**
```
Your Veyona appointment has been rescheduled. 📅
Client: {{1}}
Service: {{2}}
New date: {{3}}
New time: {{4}}

Please check your employee dashboard for details.
```

**.env:** `KRAYA_TEMPLATE_EMPLOYEE_RESCHEDULE=transactional_employee_appointment_rescheduled`

---

## 7. Service OTP — SMS (WhatsApp template skip)

Meta **Utility** pe OTP/code templates reject karti hai. Kraya free-form se Template 7 mat banao.

App default: **SMS via 2Factor** (`SERVICE_OTP_CHANNEL=sms`).

Optional WhatsApp: sirf Meta **Authentication + Copy code** template (WhatsApp Manager) ke baad `SERVICE_OTP_CHANNEL=both`.

---

## 8. Service feedback

| Field | Value |
|-------|--------|
| **Template name** | `service_feedback` |
| **Category** | Utility |
| **Header** | IMAGE (public URL in `KRAYA_HEADER_IMAGE_SERVICE_FEEDBACK`) |
| **Button** | Static URL → `https://veyona.in/feedback` |

**.env:**
```
KRAYA_TEMPLATE_SERVICE_FEEDBACK=service_feedback
KRAYA_HEADER_IMAGE_SERVICE_FEEDBACK=https://your-cdn/image.png
KRAYA_FEEDBACK_BUTTON_INDEX=
```

---

## Quick reference: App → Template mapping

| Event | Template name | Body params order |
|-------|-------------------------------------|-------------------|
| User books | `transactional_booking_received_xp` | [ customer, services ] |
| Admin confirms | `transactional_booking_confirmation` | [ service + date, time ] |
| Admin alert | `transactional_admin_new_appointment` | [ bookingId, customer ] |
| Reschedule (user) | `transactional_user_appointment_rescheduled` | [ services, date, time ] |
| Reschedule (employee) | `transactional_employee_appointment_rescheduled` | [ client, services, date, time ] |
| Employee assign | `transactional_employee_assign` | [ customer, date, time ] |
| Service OTP | SMS (2Factor) — WhatsApp AUTH optional | — |
| Feedback | `service_feedback` | [] |

---

## Kraya dashboard steps

1. Go to **Kraya** → **WhatsApp** → Templates (or Meta template UI via Kraya).
2. Create each template with **exact name** from the table.
3. Category **Utility** (service start code bhi Utility).
4. Language **English**. Paste body with `{{1}}`, `{{2}}`…
5. Add IMAGE header / URL button where noted.
6. Submit for Meta approval. After **Approved**, set matching `KRAYA_TEMPLATE_*` in `.env`.

### API + Webhook (your side)

1. [API](https://kraya-ai.com/dashboard/api) → copy **API Key** → `KRAYA_API_KEY`
2. Copy **Leads API URL** → `KRAYA_LEADS_URL`
3. Ask Kraya for **WhatsApp template send URL** → `KRAYA_WHATSAPP_SEND_URL`  
   (If unset, app derives `.../whatsapp/template` from the leads URL — confirm with Kraya support.)
4. [Webhooks](https://kraya-ai.com/dashboard/webhooks) →  
   URL: `https://veyona.in/api/webhooks/kraya`  
   Secret → `KRAYA_WEBHOOK_SECRET` → Enable + Save

---

## .env (minimum)

```env
KRAYA_API_KEY=your_key_from_kraya_api_page
KRAYA_LEADS_URL=https://api.kraya-ai.com/api/external/YOUR_SLUG/leads
KRAYA_WHATSAPP_SEND_URL=https://api.kraya-ai.com/api/external/YOUR_SLUG/whatsapp/template
KRAYA_WEBHOOK_SECRET=choose_a_long_secret
KRAYA_COUNTRY_CODE=91
KRAYA_TEMPLATE_BOOKING_CONFIRMED=transactional_booking_confirmation
KRAYA_TEMPLATE_BOOKING_RECEIVED=transactional_booking_received_xp
KRAYA_TEMPLATE_ADMIN_NEW_APPOINTMENT=transactional_admin_new_appointment
KRAYA_TEMPLATE_EMPLOYEE_ASSIGN=transactional_employee_assign
ADMIN_WHATSAPP_PHONE=9643685727
```
