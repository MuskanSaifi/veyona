# WhatsApp Template Layout (Interakt)

Use this layout when creating templates in **Interakt** → **Templates** → **New Template**. Template name in API must match the **Name** you give in Interakt (use lowercase, underscores: `transactional_booking_confirmation`).

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

**Buttons (optional):** e.g. "View details" → `https://veyona.in/user/dashboard`

---

## 2. New appointment (Admin)

**When:** User books appointment → admin gets WhatsApp (optional; add in app if needed).

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

---

## 3. Appointment reminder (User)

**When:** Can be used for reminder (e.g. cron job before appointment).

| Field | Value |
|-------|--------|
| **Template name (API)** | `transactional_reminder_notification` |
| **Category** | Utility |
| **Language** | English |

**Body:**
```
⏰ Friendly reminder from Veyona.
Your appointment is scheduled for {{1}} at {{2}}.
If you need to reschedule, please contact us in advance.
```

**Placeholders:**

| Placeholder | Value from app |
|-------------|-----------------|
| {{1}} | Date (e.g. Thu, 27 Feb, 2026) |
| {{2}} | Time (e.g. 10:00) |

**Buttons (optional):** "Call to Confirm", "STOP"

---

## 4. Employee assigned (Employee)

**When:** Admin confirms → employee gets WhatsApp (optional; add in app if needed).

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

**Placeholders:**

| Placeholder | Value from app |
|-------------|-----------------|
| {{1}} | Customer name |
| {{2}} | Date |
| {{3}} | Time |

---

## 5. Appointment rescheduled (Customer)

**When:** Admin reschedules from Appointments dashboard → customer gets WhatsApp.

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

**Placeholders:**

| Placeholder | Value from app |
|-------------|-----------------|
| {{1}} | Service name(s), e.g. `Facial x2, Cleanup` |
| {{2}} | New date, e.g. `Thu, 18 Jun, 2026` |
| {{3}} | New time, e.g. `2:30 PM` |

**.env:** `INTERAKT_TEMPLATE_USER_RESCHEDULE=transactional_user_appointment_rescheduled`

---

## 6. Appointment rescheduled (Employee)

**When:** Admin reschedules and an employee is assigned → employee gets WhatsApp.

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

**Placeholders:**

| Placeholder | Value from app |
|-------------|-----------------|
| {{1}} | Customer name |
| {{2}} | Service name(s) |
| {{3}} | New date |
| {{4}} | New time |

**.env:** `INTERAKT_TEMPLATE_EMPLOYEE_RESCHEDULE=transactional_employee_appointment_rescheduled`

---

## Quick reference: App → Template mapping

| Event | Template name (use in .env / code) | Body params order |
|-------|-------------------------------------|-------------------|
| Admin confirms booking | `transactional_booking_confirmation` | [ service + date, time ] |
| User books (admin alert) | `transactional_admin_new_appointment` | [ bookingId, customerName ] |
| Admin reschedules (user) | `transactional_user_appointment_rescheduled` | [ services, date, time ] |
| Admin reschedules (employee) | `transactional_employee_appointment_rescheduled` | [ client, services, date, time ] |
| Reminder | `transactional_reminder_notification` | [ date, time ] |
| Employee assign | `transactional_employee_assign` | [ customerName, date, time ] |

---

## Interakt dashboard steps

1. Go to **Interakt** → **Templates** → **New Template**.
2. Choose **TRANSACTIONAL**.
3. **Name:** Use the exact name from table (e.g. `transactional_booking_confirmation`) – no spaces, lowercase, underscores.
4. **Body:** Paste the body text and use `{{1}}`, `{{2}}` for variables.
5. Add buttons/header/footer if needed (optional).
6. Submit for approval. After approval, use the same **Name** in `.env` as `INTERAKT_TEMPLATE_BOOKING_CONFIRMED` or in code.

---

## .env

```env
INTERAKT_API_KEY=your_key_from_interakt_developer_settings
INTERAKT_TEMPLATE_BOOKING_CONFIRMED=transactional_booking_confirmation
```
