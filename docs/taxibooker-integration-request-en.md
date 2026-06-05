# Integration Request: Stable Customer ID & Cross-Channel User Recognition

**From:** Ey Dost (eydost.com)  
**To:** Taxibooker / Bot platform (bsqd.me)  
**Subject:** Persistent customer IDs, deep links, and webhook alignment for WhatsApp + web taxi booking

---

## 1. Background

Ey Dost operates a taxi booking flow in two places:

1. **Web:** `https://eydost.com/taxi` — user selects pickup and drop-off on a map, then continues via WhatsApp.
2. **WhatsApp bot:** User receives a link (often opened inside the WhatsApp in-app browser), selects locations on the map, and completes the ride request.

Today we send booking data to your webhook (`recieve_maps` event) with a `bookingId`, pickup, and destination. However:

- The ID in the bot link often appears **random** or changes between sessions.
- The web app and the bot do **not** share a stable “customer profile” (favorites, saved addresses, identity).
- Our WhatsApp bot cannot reliably recognize that the same person who booked on the web is the same user in chat.

We would like to align IDs and data so **one phone number = one permanent customer ID** across web, webhook, and WhatsApp.

---

## 2. What we need from you

### 2.1 Persistent customer ID (per phone number)

- Assign each customer a **fixed, reusable ID** (e.g. `CUST-994501234567` or your internal UUID), derived from or linked to their **WhatsApp / phone number**.
- This ID must **not change** between:
  - Map link opens in WhatsApp browser
  - Bookings from eydost.com/taxi
  - Subsequent rides days or weeks later

Please confirm the field name you will use (e.g. `customer_id`, `user_id`, `client_id`) and its format.

### 2.2 Deep link format for the map / web flow

When the bot sends the user to our taxi page, the URL should include **both**:

| Parameter   | Purpose |
|------------|---------|
| `id` or `bookingId` | Your persistent customer / session ID |
| `wa_id`    | WhatsApp user identifier (if available), so our web app can tie the browser session to the chat user |

**Example:**

```
https://eydost.com/taxi?wa_id={whatsapp_user_id}&id={customer_id}
```

We already read `id`, `bookingId`, and `wa_id` from the query string on `/taxi` and pass `bookingId` in our webhook payload.

### 2.3 Webhook payload (outbound from Ey Dost → you)

We currently POST to your maps event endpoint with:

```json
{
  "bookingId": "<from URL or generated>",
  "bot_id": "388c046c-c54f-4b56-9107-24f4ffca0600",
  "user_id": "master",
  "pickup": { "display_name", "formatted_address", "lat", "lng" },
  "destination": { "display_name", "formatted_address", "lat", "lng" },
  "confirmed_at": "<ISO8601>"
}
```

**We request that you also accept (or return) these fields:**

| Field | Description |
|-------|-------------|
| `customer_id` | Your stable per-phone ID (same as in deep links) |
| `phone` or `wa_id` | E.164 phone or WhatsApp ID for matching in bot |
| `source` | e.g. `eydost_web` / `eydost_whatsapp` |

Please confirm required vs optional fields and any naming conventions.

### 2.4 Inbound to Ey Dost (optional but recommended)

If your platform can call us back, we would support:

- **Profile sync:** `GET/POST` customer favorites (home, airport, last pickup/drop-off) keyed by `customer_id`
- **Booking status:** ride assigned, driver en route, completed — so our bot can send proactive WhatsApp messages

If you only support webhooks one-way today, please document what events you can emit and sample JSON.

### 2.5 Bot behavior (same identity in chat)

When a webhook arrives with `customer_id` + `phone`/`wa_id`:

- The WhatsApp bot should **recognize** the user (no “who are you?” for returning customers).
- Replies should reference the same booking / customer record as the web map session.
- Links sent after a web booking should reuse the **same** `customer_id`, not a new random ID.

---

## 3. What Ey Dost will implement (on our side)

Once the above is agreed:

1. **Database (Supabase):** store `customer_id`, phone/wa_id, favorite addresses, last booking.
2. **Web `/taxi`:** load profile when `?id=` is present; pre-fill map; save favorites after successful booking.
3. **Webhook:** always send your stable `customer_id` + `wa_id` when available.
4. **WhatsApp bot:** use the same ID mapping so chat and web are one user.

---

## 4. Questions for you

1. Can you provide a **stable `customer_id` per phone number** today? If not, what is the ETA?
2. What is the **exact deep link format** you will send to users?
3. Will you add `customer_id` / `phone` to the webhook schema we already use?
4. Do you expose an **API** to read/update customer favorites or booking status?
5. Who is our technical contact for staging credentials and test IDs?

---

## 5. Success criteria

- Same user, same phone → **same ID** every time.
- User opens bot link → map opens with **consistent** `id` in the URL.
- User books on web → webhook → bot **knows** the customer in WhatsApp without asking again.
- (Stretch) Favorite locations persist across sessions.

Thank you. We are ready to test on staging as soon as you share ID format and sample payloads.

**Contact:** [your email / WhatsApp business contact]
