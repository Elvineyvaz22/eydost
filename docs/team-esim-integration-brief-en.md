# Team brief: eSIM — recognize the customer when they open the bot link

**Product:** Ey Dost  
**Channels:** WhatsApp bot (`bot.eydost.az`) → web (`eydost.com/esim`) → bot (payment)  
**Audience:** Bot/backend team + web (eydost.com) team

> This document mirrors `team-taxi-customer-id-brief-en.md`. Unlike taxi, eSIM **payment is finalized inside the bot**; the website only displays the customer profile and lets them pick a package.

---

## What we want (summary)

When a customer messages our **WhatsApp eSIM bot** (+994 99 201 01 17), the bot sends a link. When they open it, **the website must recognize them**: show past eSIMs, active packages with remaining data, and let them start a new purchase under the same `wa_id`. For payment, they get **redirected back to the bot**.

**Stable identifier:** `whatsapp_user_id` (short: `wa_id`).  
No separate `customer_id` is created — the backend already supports `whatsapp_user_id` everywhere (`AssistantMessageRequest`, `CreateOrderRequest`, `TopupCreateRequest`).

---

## User journey (target)

1. Customer messages the **eSIM bot** on WhatsApp (+994 99 201 01 17).
2. Bot sends a link:  
   `https://eydost.com/esim?wa_id={whatsapp_user_id}`
3. Customer opens it → website loads the **profile screen**:
   - Active packages (status, remaining MB, days left)
   - Past orders
   - "Buy new package" button
4. "Buy new" → country picker → package picker → **"Pay in bot"** button.
5. Website calls `POST /api/public/orders` and gets an `order_id`.
6. Website redirects the user back to the bot:  
   `https://wa.me/994992010117?text=PAY%20{order_id}`
7. Bot recognizes `PAY {order_id}` → sends payment link → payment → fulfillment → QR.

---

## Today's problems (from Swagger analysis)

| Issue | Impact |
|--------|--------|
| No endpoint to fetch orders by `wa_id` | Cannot build the profile screen |
| No endpoint to fetch eSIMs by `wa_id` | Cannot show "active packages" |
| Everything requires `order_id` or `esim_id` upfront | A new web session has no way to "recognize" the user |

Existing useful endpoints:

- `GET /api/public/packages?country_code=TR` — catalog
- `POST /api/public/orders` (accepts `whatsapp_user_id`) — create order
- `GET /api/public/orders/{order_id}` — single order
- `GET /api/public/orders/{order_id}/esim` — single eSIM details
- `GET /api/public/esims/{esim_id}/usage` — usage stats

---

## Asks for the bot / backend team (priority)

**Ask 1 — Add the missing 2 endpoints:**

```http
GET /api/public/customers/by-wa/{whatsapp_user_id}/orders
Headers: x-api-key: <key>
Response: ApiEnvelope[list[OrderResponse]]
  # sorted newest-first; minimum fields: id, status, country_code, package_code, created_at, sell_price, currency
```

```http
GET /api/public/customers/by-wa/{whatsapp_user_id}/esims
Headers: x-api-key: <key>
Response: ApiEnvelope[list[EsimResponse]]
  # all eSIMs; status: active|expired|pending
  # optional: usage snapshot per item (remain_volume, expired_time)
```

The models already exist (`OrderResponse`, `EsimResponse`, `UsageResponse`) — only two new routes are needed. The DB already stores `orders.whatsapp_user_id` (since `CreateOrderRequest` accepts that field).

**Ask 2 — Confirm existing endpoint behaviour:**

- When we call `POST /api/public/orders` with `whatsapp_user_id: "{wa_id}"` and `transport: "web"`, the bot will **not** auto-send a payment link, correct? (The website redirects the user back to the bot; the payment link request starts from the user's chat message.)
- `GET /api/public/orders/{order_id}?whatsapp_user_id=...` — does the `whatsapp_user_id` query param act as **authorization** (i.e., users cannot peek at other people's orders)?

**Ask 3 — Bot-side message recognition:**

When the bot receives a message in the format `PAY {order_id}`, it should send the payment link for that order (using the existing `/api/public/orders/{order_id}/payment` endpoint internally). If a different format is preferred (e.g., `pay_<id>`, `/pay <id>`), please propose it.

---

## Web side (eydost.com) — already in progress

1. Route `/esim`: if URL has `wa_id` → profile screen; otherwise → existing catalog.
2. Vercel proxy: `api/esim-proxy.ts` — `x-api-key` stays in Vercel env, never reaches the browser.
3. Endpoint call order (through proxy):
   - `GET /api/public/customers/by-wa/{wa_id}/esims` → active list
   - `GET /api/public/esims/{esim_id}/usage` → remaining per active
   - `GET /api/public/customers/by-wa/{wa_id}/orders` → history
   - `GET /api/public/packages?country_code=XX` → catalog
   - `POST /api/public/orders` → draft order
4. "Pay in bot" → `window.location = https://wa.me/994992010117?text=PAY%20{order_id}`

---

## Agreed technical rules

- **Identifier:** `whatsapp_user_id` only. Phone number is not exposed in the URL.
- **Auth:** `x-api-key` header — server-side only (Vercel proxy), never browser.
- **Bot numbers:**
  - eSIM: **+994 99 201 01 17** → `https://wa.me/994992010117`
  - Taxi: +994 99 200 04 44 (mentioned here only to avoid confusion)
- **Privacy:** the Privacy Policy must mention `wa_id` processing.

---

## Success criteria

- [ ] Same `wa_id` → always same profile, same eSIM list
- [ ] `GET /customers/by-wa/{wa_id}/esims` < 500 ms
- [ ] `GET /customers/by-wa/{wa_id}/orders` < 500 ms
- [ ] Website never exposes `x-api-key` to the browser
- [ ] "Pay in bot" button always brings `order_id` as a chat message to the bot
- [ ] Bot responds to `PAY {order_id}` with the payment link

---

## Out of scope for phase 1 (optional later)

- Direct payment on the website (kept PCI-clean for now by routing payment through the bot)
- Short-lived signed tokens instead of raw `wa_id` (security upgrade)
- Direct top-up purchase from the website (using existing `/api/public/esims/{esim_id}/topups`) — once the frontend is stable

---

## Questions for the bot team (please reply)

1. Can the **two new endpoints** (`/customers/by-wa/{wa_id}/orders` + `/esims`) be added this week?
2. Will the `PAY {order_id}` format work on the bot side, or is a different format easier?
3. For production, do we need a fresh `x-api-key` (we will store it in Vercel env as `ESIM_BOT_API_KEY`), or does the current key (shared with you separately) stay valid?
4. If there is a rate limit, what are the limits per `wa_id` per minute for `/customers/by-wa/*`?
5. If a staging URL exists, please share it (for testing).

Thank you.
