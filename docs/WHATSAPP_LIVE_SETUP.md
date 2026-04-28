# WhatsApp Messages on Live / Production

Agar localhost pe WhatsApp msg aa rahe hain lekin **live/production** pe nahi aa rahe, ye steps check karein.

## 1. Production pe Environment Variables set karein

Jahan bhi app deploy hai (Vercel, Railway, Render, cPanel, etc.), wahan **Environment Variables** me ye add karein (values apni `.env` jaisi hi use karein):

| Variable | Required | Description |
|----------|----------|-------------|
| `INTERAKT_API_KEY` | Yes | Interakt Dashboard → Developer Settings → API Key (same as local .env) |
| `ADMIN_WHATSAPP_PHONE` | Yes | 10-digit number jisko new booking alert bhejna hai (e.g. 9643685727) |
| `ADMIN_PHONE` | Optional | Fallback agar ADMIN_WHATSAPP_PHONE na ho |
| `INTERAKT_TEMPLATE_BOOKING_CONFIRMED` | Optional | Default: `transactional_booking_confirmation` |
| `INTERAKT_TEMPLATE_ADMIN_NEW_APPOINTMENT` | Optional | Default: `transactional_admin_new_appointment` |
| `INTERAKT_TEMPLATE_EMPLOYEE_ASSIGN` | Optional | Default: `transactional_employee_assign` |
| `INTERAKT_HEADER_IMAGE_URL` | Optional | Agar template me header image use ho |

**Important:**  
- `INTERAKT_API_KEY` **server-side** use hota hai (API routes), isliye **NEXT_PUBLIC_** mat lagana.  
- Deploy ke baad **redeploy** ya **restart** karein taaki naye env vars load hon.

## 2. Vercel pe kaise add karein

1. Project → **Settings** → **Environment Variables**
2. Add: Name = `INTERAKT_API_KEY`, Value = (apna key), Environment = Production (aur Preview agar chahiye)
3. Same `ADMIN_WHATSAPP_PHONE` add karein
4. **Redeploy** (Deployments → ... → Redeploy)

## 3. Railway / Render / Other

- Project **Settings** / **Environment** me same variables add karein
- Save ke baad app **restart** / **redeploy** karein

## 4. Interakt Dashboard

- Same WhatsApp number / channel jo local pe use kar rahe ho, production ke liye bhi allowed hona chahiye
- API key **server-side** use ho raha hai, isliye "localhost vs live" ka koi alag setting Interakt me nahi hoti – sirf API key sahi hona chahiye

## 5. Debug (optional)

Agar phir bi msg na aaye to production logs check karein:

- Booking confirm hone par ya new appointment create hone par log me `"WhatsApp admin new appointment failed"` ya `"Interakt WhatsApp error"` dikhe to response/error message se reason pata chalega
- Confirm karein ki production build me `INTERAKT_API_KEY` set hai (log me key mat print karein, sirf "WhatsApp not configured" ya error message dekhen)

---

**Short checklist:**  
1. Production env me `INTERAKT_API_KEY` + `ADMIN_WHATSAPP_PHONE` set hai?  
2. Deploy/restart kiya?  
3. Same API key local .env jaisa hai?
