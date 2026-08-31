# Kraya pe WhatsApp Templates (Interakt jaisi) — named variables only

Kraya **`{{1}}`, `{{2}}` allow nahi karti**.  
Error: *Invalid variable(s): {{1}}, {{2}}. Use only variables from the list below.*

Isliye sirf neeche **blue chips** / custom attributes use karo.

---

## Messages kaise jaate hain (Kraya support)

**Direct send URL nahi hai.** Website lead upsert karti hai + `sequence` field:

`POST https://api.kraya-ai.com/api/external/{slug}/leads`

Us sequence me approved WhatsApp template hona chahiye.  
Isliye templates approve ke baad **Auto Follow-ups** me sequences banao (naam `.env` ke `KRAYA_SEQUENCE_*` se match).

Detail: [`WHATSAPP_LIVE_SETUP.md`](./WHATSAPP_LIVE_SETUP.md)

---

## Pehle yeh karo — Custom attributes add karo

Kraya me jo chips pehle se hain (`{{lead_name}}`, `{{Appointment Date}}`, `{{Service Interested In}}`) unke alawa yeh **naye custom attributes** banao taaki templates me use ho saken.

**Kahan:** Kraya → CRM / Settings / Custom attributes (ya lead fields) → Add attribute

| Attribute name (exact, chip banega) | Use |
|-------------------------------------|-----|
| `Booking ID` | optional — ab app `Service Interested In` me booking id daalti hai |
| `OTP Code` | optional — ab app OTP `Service Interested In` me bhejti hai |
| `Refund Note` | Cancel / refund (agar list me na ho) |

**Mat use karo jab tak list me chip na dikhe:** `Appointment Time`, `OTP Code`, `Booking ID` — inki jagah existing chips use karo (neeche templates).

---

## Form rules (har template)

| Field | Value |
|-------|--------|
| Category | **Utility** (booking/OTP) — Marketing mat choose karo (rejection warning isi liye aati hai) |
| Business | Veyona |
| Format | **Standard Template** |
| Variables | Message me cursor rakh ke **blue chip click** karo — type mat karo `{{1}}`. Har variable ke **pehle aur baad** plain text hona chahiye (start/end pe variable nahi). |
| Attachments | Image tabhi jab pehle Interakt pe image thi |
| Button | Feedback / dashboard link ke liye ON |
| Submit | **SAVE & SUBMIT** → wait **Approved** |

---

## Template 1 — Booking received (Customer)

| Field | Value |
|-------|--------|
| Template Name | `transactional_booking_received` |
| Category | **Utility** |

**Body — chips se banao:**

```
Hi {{lead_name}},

We have received your booking request for {{Service Interested In}} at Veyona.
Our team will confirm your appointment shortly.

Thank you for choosing us!
```

Chips: `lead_name` + `Service Interested In`

---

## Template 2 — Booking confirmed (Customer)

| Field | Value |
|-------|--------|
| Template Name | `transactional_booking_confirmation` |
| Category | **Utility** |
| Attachments | Image (optional) |

**Body (sirf list ke chips — `Appointment Time` mat use karo):**

```
Thank you for choosing Veyona! 💛
Your appointment for {{Service Interested In}} is confirmed at {{Appointment Date}}.
We look forward to pampering you.
```

Chips (sirf yeh 2): `Service Interested In` + `Appointment Date`

App bhejegi:
- `Service Interested In` → e.g. `Facial`
- `Appointment Date` → e.g. `Thu, 27 Feb, 2026 at 10:00 AM` (date + time ek saath)

> `{{Appointment Time}}` aapki list me nahi hai — isliye time `{{Appointment Date}}` me merge hota hai.
---

## Template 3 — New appointment (Admin)

| Field | Value |
|-------|--------|
| Template Name | `transactional_admin_new_appointment` |
| Category | **Utility** |

**Rule:** Variable message ke **shuru / end** pe nahi ho sakti — pehle aur baad me text hona chahiye.

**Body (copy — chips click se daalo):**

```
A new appointment has been booked on Veyona.

Customer {{lead_name}} requested {{Service Interested In}}.

Please review details in the admin dashboard: https://veyona.in/admin/dashboard — thank you.
```

Chips (sirf yeh 2, jo list me hain): `lead_name` + `Service Interested In`

App bhejegi:
- `lead_name` → customer name  
- `Service Interested In` → e.g. `Booking ABC123 · Facial, Cleanup` (booking id yahi andar)

> `{{Booking ID}}` mat use karo jab tak woh chip list me na dikhe.  
> Line ko variable pe khatam mat karo — hamesha baad me text / full stop rakho.
---

## Template 4 — Employee assign

| Field | Value |
|-------|--------|
| Template Name | `transactional_employee_assign` |
| Category | **Utility** |

**Body (har variable ke pehle aur baad me text):**

```
You have been assigned a new Veyona appointment.

Client is {{lead_name}}, service is {{Service Interested In}}, scheduled at {{Appointment Date}}.

Please check your employee dashboard for complete details.
```

Chips: `lead_name` + `Service Interested In` + `Appointment Date`  
(`Appointment Date` me date + time dono, e.g. `Thu, 27 Feb, 2026 at 2:30 PM`)

---

## Template 5 — Reschedule (Customer)

| Field | Value |
|-------|--------|
| Template Name | `transactional_user_appointment_rescheduled` |
| Category | **Utility** |

**Body:**

```
Your Veyona appointment has been rescheduled.

Service is {{Service Interested In}} and the new date and time is {{Appointment Date}}.

If you have any questions, please contact us.
```

Chips: `Service Interested In` + `Appointment Date`

---

## Template 6 — Reschedule (Employee)

| Field | Value |
|-------|--------|
| Template Name | `transactional_employee_appointment_rescheduled` |
| Category | **Utility** |

**Body:**

```
Your Veyona appointment has been rescheduled.

Client is {{lead_name}}, service is {{Service Interested In}}, and the new date and time is {{Appointment Date}}.

Please check your employee dashboard for details.
```

Chips: `lead_name` + `Service Interested In` + `Appointment Date`

---

## Template 7 — Service OTP — **Kraya pe mat banao (reject hoga)**

Meta rule: **OTP / visit code** sirf **Authentication (preset + Copy code)** se ja sakta hai.  
Kraya ka free-form Utility template (`{{Service Interested In}}` + “code”) **baar-baar reject** hota hai — yeh Meta policy hai, wording change se fix nahi hota.

### App ab kya karti hai

Service OTP **SMS (2Factor)** se jati hai — WhatsApp Template 7 ki zarurat nahi.

`.env`:

```
SERVICE_OTP_CHANNEL=sms
TWO_FACTOR_API_KEY=...   # pehle se login OTP ke liye set hai
```

Baaki saare approved WhatsApp templates (1–6, 8) normal chalenge.

### Optional — baad me WhatsApp AUTH chahiye ho to

1. **WhatsApp Manager** → Message templates → **Authentication** → Copy code (Meta preset)  
   *(Kraya free body editor se nahi)*
2. Approve hone ke baad `.env`:

```
KRAYA_TEMPLATE_SERVICE_OTP=<auth_template_name>
SERVICE_OTP_CHANNEL=both
```

Tab SMS + WhatsApp dono.

---

## Template 8 — Service feedback

| Field | Value |
|-------|--------|
| Template Name | `service_feedback` |
| Category | **Utility** |
| Attachments | **Image** |
| Button | ON → text `Give Feedback` → URL `https://veyona.in/feedback` (static) |

**Body (variables optional / none):**

```
Thank you for visiting Veyona! 🙏
We'd love your feedback on today's service.
Tap the button below to share your experience.
```

---

## Chip map — Interakt `{{1}}` → Kraya

| Pehle Interakt | Ab Kraya chip |
|----------------|---------------|
| {{1}} customer name | `{{lead_name}}` |
| services | `{{Service Interested In}}` |
| date + time | `{{Appointment Date}}` (dono ek chip me, e.g. `Thu, 27 Feb at 10:00 AM`) |
| booking id | `{{Service Interested In}}` ke andar text (e.g. `Booking ABC123 · Facial`) |
| OTP | **SMS** (WhatsApp Utility template Meta reject) |

Website app inhi **named** values ko Kraya API pe bhejti hai.

---

## Category warning

*Ensure you've selected the right category to prevent rejection.*

- Booking / confirm / assign / reschedule / feedback → **Utility**
- Service OTP → **SMS** (WhatsApp AUTH sirf Meta preset se; Kraya free-form skip)
- Offers / bridal promo → **Marketing**

Galat category = Meta reject / delayed approval.

---

## Checklist

1. Sirf list me dikhne wale chips use karo — **`OTP Code` / `Booking ID` / `Appointment Time` skip**
2. Template open → Category **Utility**
3. Body me sirf **blue chip click** — har variable ke pehle/baad text
4. **SAVE & SUBMIT** → Approved
5. Template 7 (OTP) Kraya pe mat submit karo — app SMS use karti hai (`SERVICE_OTP_CHANNEL=sms`)
6. `.env` me baaki template names same rakho
7. Test: `/api/whatsapp/test?phone=XXXXXXXXXX`

---

## Related

- Env / live: [`WHATSAPP_LIVE_SETUP.md`](./WHATSAPP_LIVE_SETUP.md)
- Env template names: [`WHATSAPP_TEMPLATES_LAYOUT.md`](./WHATSAPP_TEMPLATES_LAYOUT.md)
