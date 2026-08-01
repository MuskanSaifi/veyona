# Employee Service Time Tracking — OTP + WhatsApp Feedback

This module lets a field employee start an on-site customer visit, prove
they're really with the customer via a WhatsApp OTP, record the service
duration, and automatically send the customer a feedback link when the
service ends.

It plugs into the existing Veyona Next.js app (App Router, MongoDB,
Mongoose, Interakt WhatsApp). It uses the project's existing Employee +
Customer collections and adds three new ones.

---

## 1. Data model

| Collection       | Mongoose model                          | Purpose                                       |
| ---------------- | --------------------------------------- | --------------------------------------------- |
| `service_visits` | `models/ServiceVisit.js`                | One row per on-site visit                     |
| `otps`           | `models/Otp.js`                         | 4-digit OTP tied to a visit (TTL 5 min)       |
| `feedbacks`      | `models/Feedback.js`                    | Customer rating + comment per completed visit |
| `employees`      | `models/Employee.js` *(existing)*       | Who performed the visit                       |
| `customers`      | `models/Customer.js` *(existing)*       | Who was served                                |

Visit status lifecycle:

```
pending  ──verify-otp──▶  in_progress  ──end-service──▶  completed
                                                  │
                                                  └──▶ WhatsApp feedback link sent
```

---

## 2. Environment variables

Added in `.env`:

```env
KRAYA_TEMPLATE_SERVICE_OTP=service_otp_auth
KRAYA_TEMPLATE_SERVICE_FEEDBACK=service_feedback
# Optional — only set if the feedback template uses a dynamic URL button
KRAYA_FEEDBACK_BUTTON_INDEX=
# Used to build the absolute feedback URL sent to WhatsApp
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`KRAYA_API_KEY` must be configured (see `docs/WHATSAPP_LIVE_SETUP.md`).

---

## 3. Kraya WhatsApp templates

Create these two templates in the [Kraya dashboard](https://kraya-ai.com/dashboard)
under **WhatsApp → Templates** (Category: Utility / Authentication) and
get them Meta-approved.

### a) OTP template — name `service_otp`

> Your service OTP is {{1}}. Please share it with the service provider.

- Language: English
- Variables: 1 — the 4-digit code

### b) Feedback template — name `service_feedback`

> Thank you for using our service 🙏
> Please rate your experience here: {{1}}

- Language: English
- Variables: 1 — the feedback URL

If you instead use a CTA URL button with a dynamic suffix (recommended,
since WhatsApp limits raw URLs in the body), put the URL button's index
(usually `0`) into `KRAYA_FEEDBACK_BUTTON_INDEX`. The helper will
then send the visit's path suffix (`feedback/<id>`) via `buttonValues`.

---

## 4. REST API

All routes are under the existing Next.js App Router. Employee routes
require the `employeeToken` cookie (set by `/api/employee/login`). Admin
routes require the `adminToken` cookie. Public routes have no auth.

| Method | Path                                                | Auth     | Purpose                                       |
| ------ | --------------------------------------------------- | -------- | --------------------------------------------- |
| POST   | `/api/service-tracking/start-service`               | employee | Create a visit, generate + send OTP           |
| POST   | `/api/service-tracking/generate-otp`                | employee | Resend a fresh OTP for a pending visit        |
| POST   | `/api/service-tracking/verify-otp`                  | employee | Verify OTP → `in_progress` + `startTime`      |
| POST   | `/api/service-tracking/end-service`                 | employee | `completed` + duration + send feedback link   |
| GET    | `/api/service-tracking/list`                        | employee | Logged-in employee's own visits               |
| GET    | `/api/service-tracking/visit/[id]`                  | employee | Single visit + active OTP + feedback         |
| POST   | `/api/service-tracking/submit-feedback`             | public   | Save rating + comment                         |
| GET    | `/api/service-tracking/public/[id]`                 | public   | Lightweight info for the feedback page        |
| GET    | `/api/admin/service-tracking/services`              | admin    | All visits (filter by status/employee/date)   |
| GET    | `/api/admin/service-tracking/feedbacks`             | admin    | All submitted feedbacks                       |

### Request examples

```http
POST /api/service-tracking/start-service
Content-Type: application/json

{
  "customer": { "name": "Asha", "phone": "9876543210" },
  "serviceLabel": "AC service"
}
```

```http
POST /api/service-tracking/verify-otp
{ "serviceId": "<id>", "code": "4291" }
```

```http
POST /api/service-tracking/end-service
{ "serviceId": "<id>" }
```

```http
POST /api/service-tracking/submit-feedback
{ "serviceId": "<id>", "rating": 5, "comment": "Great work!" }
```

---

## 5. UI pages

| Route                                          | Who              | What                                                            |
| ---------------------------------------------- | ---------------- | --------------------------------------------------------------- |
| `/employee/service-tracking`                   | employee (auth)  | List own visits + form to start a new one                       |
| `/employee/service-tracking/[id]`              | employee (auth)  | OTP entry → running timer → end-service → copy feedback link    |
| `/feedback/[serviceId]`                        | public           | 5-star rating + optional comment for the customer               |
| `/admin/service-tracking`                      | admin (auth)     | Stats + Services table + Feedbacks table                        |

All pages use Tailwind CSS, `react-hot-toast` for success/error
notifications, and `react-icons` for icons — matching the rest of the
project. The layouts are mobile-responsive (table on desktop → cards on
mobile).

---

## 6. Built-in validations

- OTP expires in **5 minutes** (TTL index drops expired docs).
- Max **5 wrong attempts** per OTP, after which it auto-invalidates.
- A new OTP request invalidates all earlier unused OTPs for that visit.
- A visit cannot be ended unless it's `in_progress` with a `startTime`.
- A single employee cannot have more than one `pending` / `in_progress`
  visit at a time (returns `409` with the active `serviceId`).
- A `feedback` row is unique per `serviceVisit` (DB-enforced).
- Feedback can only be submitted for `completed` visits.
- Customers are deduplicated by phone when starting a visit inline.

---

## 7. Quick local test

1. `npm run dev`
2. Log in at `/employee/login` as any existing employee.
3. Open `/employee/service-tracking`, fill in the customer's name + a
   real WhatsApp number, click **Start service & send OTP**.
4. The customer should receive the 4-digit code via WhatsApp; enter it.
5. Wait a moment, click **End service** — the customer receives the
   feedback link.
6. Open the link (also visible/copyable on the visit page) and submit a
   rating + comment.
7. Log in at `/admin/login` and open `/admin/service-tracking` to see
   both the visit and the feedback row.
