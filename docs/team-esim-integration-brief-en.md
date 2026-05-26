# Team brief: eSIM — recognize the customer when they open the bot link

**Product:** Ey Dost  
**Channels:** WhatsApp bot (`bot.eydost.az`) → web (`eydost.com/esim`)  
**Audience:** Bot/backend team + web (eydost.com) team

> This document mirrors `team-taxi-customer-id-brief-en.md`. The website only displays a read-only balance/order view — all sales and payments stay inside the WhatsApp bot.

---

## What we want (summary)

The customer messages the WhatsApp eSIM bot (+994 99 201 01 17), buys an eSIM, pays — everything inside WhatsApp. Later, when they want to **check their balance**, the bot sends them a link:

```
https://eydost.com/esim?wa_id={whatsapp_user_id}
```

When this link opens, the site looks up the customer **by `wa_id`** from the backend and renders their active eSIMs, remaining data, and order history.

**The website never creates orders, never starts payments, never sends a magic message format.** If the customer wants a new package, the site simply links to `wa.me/994992010117` — the bot continues the conversation normally.

**Stable identifier:** `whatsapp_user_id` (short: `wa_id`).

---

## User journey

1. Customer messages the bot on WhatsApp (+994 99 201 01 17), buys an eSIM, pays (all inside the bot).
2. To check the balance later, the bot sends a link:  
   `https://eydost.com/esim?wa_id=994558878889`
3. Customer opens the link → site reads `wa_id` from the URL.
4. Site makes two server-side calls (with `x-api-key`):
   - `GET /api/public/customers/by-wa/994558878889/esims`
   - `GET /api/public/customers/by-wa/994558878889/orders`
5. For each active eSIM:
   - `GET /api/public/esims/{esim_id}/usage`
6. UI shows: active packages (remaining MB, days left) + order history.

---

## Today's problem

The current `bot.eydost.az` API (`/openapi.json`) has **no endpoint to list a customer's orders / eSIMs by `wa_id`** — everything is keyed by `order_id` and `esim_id`.

The DB already stores `orders.whatsapp_user_id` (since `CreateOrderRequest` accepts that field). We only need two new read routes.

---

## Asks for the bot / backend team

**Add 2 new read-only endpoints:**

```http
GET /api/public/customers/by-wa/{whatsapp_user_id}/esims
Headers: x-api-key: <key>
Response: ApiEnvelope[list[EsimResponse]]
  # all eSIMs; status: active|expired|pending
  # optional: usage snapshot per item (remain_volume, expired_time)
```

```http
GET /api/public/customers/by-wa/{whatsapp_user_id}/orders
Headers: x-api-key: <key>
Response: ApiEnvelope[list[OrderResponse]]
  # newest-first; minimum fields: id, status, country_code, package_code,
  # created_at, sell_price, currency
```

The models already exist (`OrderResponse`, `EsimResponse`, `UsageResponse`) — this is just a filtered SELECT.

**No other bot-side changes are needed.** No new message format, no new webhook, no new message recognition.

---

## Web side (eydost.com) — already deployed

1. Route `/esim`: if URL has `wa_id` → profile screen; otherwise → existing catalog.
2. Vercel proxy: `api/esim-proxy.ts` — `x-api-key` lives in Vercel env (`ESIM_BOT_API_KEY`) and never reaches the browser.
3. Whitelisted proxy endpoints (only 3):
   - `customer-esims` → `GET /api/public/customers/by-wa/{wa_id}/esims`
   - `customer-orders` → `GET /api/public/customers/by-wa/{wa_id}/orders`
   - `esim-usage` → `GET /api/public/esims/{esim_id}/usage`
4. "Order a new eSIM" button → `https://wa.me/994992010117` (no parameters).

Once the two new endpoints are deployed, the site lights up automatically — **no further code change on the web side**.

---

## Agreed technical rules

- **Identifier:** `whatsapp_user_id` only (Meta format, no `+` prefix, e.g. `994558878889`). The phone number is not exposed in the URL — the `wa_id` is the value as Meta provides it.
- **Auth:** `x-api-key` header — server-side only (Vercel proxy), never browser.
- **Bot number:** **+994 99 201 01 17** → `https://wa.me/994992010117`
- **Privacy:** the Privacy Policy must mention `wa_id` processing.

---

## Success criteria

- [ ] Same `wa_id` → always same profile and same eSIM list
- [ ] `GET /customers/by-wa/{wa_id}/esims` < 500 ms
- [ ] `GET /customers/by-wa/{wa_id}/orders` < 500 ms
- [ ] Website never exposes `x-api-key` to the browser
- [ ] Website never calls `POST /api/public/orders` (purchase stays in WhatsApp)

---

## Out of scope for phase 1 (optional later)

- Short-lived signed tokens instead of raw `wa_id` (security upgrade)
- Direct top-up purchase from the website (using existing `/api/public/esims/{esim_id}/topups`)
- Combined profile screen (eSIM + taxi history)

---

## Questions for the bot team (please reply)

1. Can the **two new endpoints** (`/customers/by-wa/{wa_id}/{esims,orders}`) be added this week?
2. `wa_id` format: is the value we send (e.g. `994558878889`) 1:1 with how it is stored in the DB? Without the `+` prefix, international format?
3. Please share an example `wa_id` we can use against staging/production for end-to-end testing (e.g. `994558878889`).
4. If there is a rate limit, what are the limits per `wa_id` per minute for `/customers/by-wa/*`?

Thank you.
