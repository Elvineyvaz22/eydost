curl.exe -A "Mozilla/5.0 (compatible; GPTBot/1.0)" "https://eydost.com/turkey-esim" | findstr /C:"Turkey 3GB" /C:"994992010117"# Team brief: Taxi — recognize the customer when they open the bot link

**Product:** Ey Dost  
**Channels:** WhatsApp bot → web map (`eydost.com/taxi`) → webhook → bot again  
**Audience:** Bot/backend team + web (eydost.com) team

---

## What we want (summary)

When a customer **writes to our WhatsApp bot for the first time**, the bot should **immediately send a link** to our taxi page. When they open that link (usually inside the WhatsApp in-app browser), **we must know who they are** — not treat them as a new random visitor every time.

Today the link often contains a **random or one-time code**. Our website cannot tie that visit to the same person in WhatsApp, cannot load saved addresses, and our bot cannot reliably say “this is the same user who just booked on the map.”

**Goal:** One phone / WhatsApp account = **one permanent customer ID**, used in the link, on the website, in the webhook, and in the bot.

---

## User journey (target)

1. Customer sends any message to the **WhatsApp bot** (taxi intent).
2. Bot replies with a link, for example:  
   `https://eydost.com/taxi?wa_id={whatsapp_user_id}&id={customer_id}`
3. Customer opens the link → **web app loads their profile** (if they exist): last addresses, favorites, language, etc.
4. Customer picks pickup & drop-off on the map → confirms → we send **webhook** to the dispatch platform with the **same** `customer_id` + coordinates.
5. Back in WhatsApp, the **bot recognizes** them by the same ID/phone — no “who are you?”, consistent booking context.

---

## Problems today

| Issue | Impact |
|--------|--------|
| Random `id` in bot links | Every visit looks like a new user on the web |
| No `wa_id` in link sometimes | Web cannot link browser session to WhatsApp user |
| Web generates new UUID if `id` is missing | Webhook and bot use different identities for the same person |
| No shared customer database | No favorites, no “returning customer” experience |

**Current web behaviour (already implemented):**

- We read `?id=`, `?bookingId=`, and `?wa_id=` from the URL on `/taxi`.
- We store `wa_id` in `sessionStorage` when present.
- We POST webhook with `bookingId` (from URL or a **new random UUID** if missing — this is what we want to stop).

---

## What each team must do

### Bot / backend (priority)

1. **On first message** (or first taxi request), resolve the user by **phone / WhatsApp ID**.
2. Assign or reuse a **stable `customer_id`** (never change for that phone).
3. Send links **only** in this format (both parameters required):  
   `https://eydost.com/taxi?wa_id={whatsapp_user_id}&id={customer_id}`
4. Do **not** generate a new random ID for every link unless it is a deliberate one-time booking token (if so, document the rule).
5. When our webhook fires, match the booking using **`customer_id` + phone/wa_id** so the bot can continue the conversation as the same user.

### Web — eydost.com (after bot provides stable IDs)

1. On page load: read `id` + `wa_id` from URL.
2. Load customer profile from **Supabase** (to be built): favorites, last pickup/drop-off.
3. Pre-fill the map / show saved places.
4. On submit: send webhook with **`bookingId` = `customer_id`** (not a new random UUID when `id` was in the URL).
5. Update profile after successful booking.

### Dispatch / maps webhook (Taxibooker / bsqd.me — our bot platform)

1. Accept stable `customer_id` and phone/wa_id in payload (field names to be agreed).
2. Echo the same ID in any links sent back to the user.
3. Optional: API to sync favorites or booking status (phase 2).

---

## Technical rules we agree on

- **`customer_id`:** opaque internal code (e.g. `CUST-7f3a9c`), not the raw phone number in the URL.
- **`wa_id`:** WhatsApp user identifier from the bot; required in links for in-app browser sessions.
- **Webhook:** always include the same `customer_id` that was in the link the user opened.
- **Privacy:** document in Privacy Policy; support delete request; minimize stored data (addresses + id, not unnecessary fields).

---

## Success criteria

- [ ] Same phone → same `customer_id` for months.
- [ ] Bot’s first reply link always includes `wa_id` + `customer_id`.
- [ ] Opening the link twice shows the same user context (after profile DB exists).
- [ ] Webhook + bot refer to the **same** customer record.
- [ ] No more “random code only” links for returning users.

---

## Out of scope for phase 1 (optional later)

- Short-lived signed tokens instead of permanent `id` in URL (security upgrade).
- Automatic taxi assignment details in the web UI (dispatch stays on your side).
- Multi-device merge (same person, two phones) — manual support only.

---

## Questions for the bot team (please reply)

1. Can you send `wa_id` + stable `customer_id` in every taxi link **this week**?
2. Where is the customer record stored today (your DB / our Supabase)?
3. Exact webhook fields you can accept besides pickup/destination?
4. Who is the technical contact for staging tests?

Thank you.
