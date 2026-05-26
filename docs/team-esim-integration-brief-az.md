# Komanda üçün: eSIM — bot linki açılanda müştərini tanımaq

**Məhsul:** Ey Dost  
**Kanallar:** WhatsApp bot (`bot.eydost.az`) → veb (`eydost.com/esim`)  
**Auditoriya:** Bot/backend komandası + veb (eydost.com) komandası

> Bu sənəd `team-taxi-customer-id-brief-az.md` ilə paralel quruluşdadır. Sayt yalnız balans/sifariş görünüşü göstərir — alış və ödəniş tamamilə WhatsApp botunda qalır.

---

## Nə istəyirik (xülasə)

Müştəri WhatsApp eSIM botuna (+994 99 201 01 17) yazır, eSIM-i alır, ödəyir. Daha sonra **balansa baxmaq istəyəndə** bot ona link göndərir:

```
https://eydost.com/esim?wa_id={whatsapp_user_id}
```

Bu linki açanda sayt **`wa_id`-yə görə backend-dən** müştərinin eSIM-lərini, qalan trafikini və sifariş tarixçəsini çəkir və göstərir.

**Sayt heç vaxt yeni sifariş yaratmır, ödəniş etmir, mesaj formatı göndərmir.** Yeni paket almaq istəsə, sadəcə `wa.me/994992010117` linkinə yönlənir — bot orada normal şəkildə davam edir.

**Stabil identifikator:** `whatsapp_user_id` (qısa: `wa_id`).

---

## İstifadəçi yolu

1. Müştəri WhatsApp botuna yazır (+994 99 201 01 17), eSIM alır, ödəyir (hər şey botda).
2. Müştəri "balansa baxmaq" istəyəndə bot link göndərir:  
   `https://eydost.com/esim?wa_id=994558878889`
3. Müştəri linki açır → sayt URL-dən `wa_id` oxuyur.
4. Sayt 2 sorğu göndərir (öz `x-api-key`-i ilə, server tərəfdən):
   - `GET /api/public/customers/by-wa/994558878889/esims`
   - `GET /api/public/customers/by-wa/994558878889/orders`
5. Hər aktiv eSIM üçün:
   - `GET /api/public/esims/{esim_id}/usage`
6. Ekranda: aktiv paketlər (qalan MB, qalan gün) + tarixçə.

---

## Bu günkü problem

Hazırkı `bot.eydost.az` API-də (`/openapi.json`) **`wa_id`-yə görə müştərinin sifarişlərini/eSIM-lərini siyahılayan endpoint yoxdur** — hər şey `order_id` və `esim_id` ilə işləyir.

DB-də `orders.whatsapp_user_id` artıq saxlanır (çünki `CreateOrderRequest` bu sahəni qəbul edir) — sadəcə yeni 2 read route lazımdır.

---

## Bot / backend komandasından xahiş

**2 yeni read-only endpoint əlavə edin:**

```http
GET /api/public/customers/by-wa/{whatsapp_user_id}/esims
Headers: x-api-key: <key>
Response: ApiEnvelope[list[EsimResponse]]
  # bütün eSIM-lər; status: active|expired|pending
  # opsional: hər biri üçün usage snapshot (remain_volume, expired_time)
```

```http
GET /api/public/customers/by-wa/{whatsapp_user_id}/orders
Headers: x-api-key: <key>
Response: ApiEnvelope[list[OrderResponse]]
  # yeni-ən-köhnə sıralı; minimum sahələr: id, status, country_code,
  # package_code, created_at, sell_price, currency
```

Modellər mövcuddur (`OrderResponse`, `EsimResponse`, `UsageResponse`) — sadəcə filterli SELECT.

**Bot tərəfində heç bir başqa dəyişiklik tələb olunmur.** Yeni mesaj formatı, yeni webhook, yeni mesaj-tanıma — bunların heç biri lazım deyil.

---

## Veb tərəf (eydost.com) — artıq deploy olunub

1. `/esim` route-u: URL-də `wa_id` varsa → profil ekranı, yoxsa → mövcud kataloq.
2. Vercel proxy: `api/esim-proxy.ts` — `x-api-key` Vercel env-də (`ESIM_BOT_API_KEY`) qalır, brauzerə heç vaxt sızmır.
3. Whitelisted proxy endpoint-ləri (yalnız 3):
   - `customer-esims` → `GET /api/public/customers/by-wa/{wa_id}/esims`
   - `customer-orders` → `GET /api/public/customers/by-wa/{wa_id}/orders`
   - `esim-usage` → `GET /api/public/esims/{esim_id}/usage`
4. "Yeni eSIM al" düyməsi → `https://wa.me/994992010117` (parametrsiz).

Yuxarıdakı 2 endpoint deploy olunan kimi sayt avtomatik dolacaq — **veb tərəfdə heç bir kod dəyişikliyi lazım deyil**.

---

## Razılaşdığımız texniki qaydalar

- **Identifikator:** yalnız `whatsapp_user_id` (Meta formatı, `+` olmadan, məs. `994558878889`). Telefon nömrəsi URL-də açıq yazılmır — `wa_id` öz formasındadır.
- **Auth:** `x-api-key` header — yalnız serverdə (Vercel proxy), brauzerdə deyil.
- **Bot nömrəsi:** **+994 99 201 01 17** → `https://wa.me/994992010117`
- **Məxfilik:** Privacy Policy-də `wa_id`-nin emalı qeyd olunmalıdır.

---

## Uğur meyarları

- [ ] Eyni `wa_id` → həmişə eyni profil və eyni eSIM siyahısı
- [ ] `GET /customers/by-wa/{wa_id}/esims` < 500 ms
- [ ] `GET /customers/by-wa/{wa_id}/orders` < 500 ms
- [ ] Sayt heç bir vaxt brauzerdə `x-api-key`-i ifşa etmir
- [ ] Sayt heç vaxt `POST /api/public/orders` çağırmır (alış WhatsApp-da qalır)

---

## 1-ci mərhələdə yox (sonra mümkün)

- `wa_id` əvəzinə qısamüddətli imzalı token (təhlükəsizlik upgrade-i)
- Saytdan birbaşa top-up alışı (mövcud `/api/public/esims/{esim_id}/topups`)
- Birgə profil ekranı (eSIM + taksi tarixçəsi)

---

## Bot komandasına suallar (cavab gözləyirik)

1. Yuxarıdakı **2 yeni endpoint** (`/customers/by-wa/{wa_id}/{esims,orders}`) bu həftə əlavə oluna bilərmi?
2. `wa_id` formatı: bizim ötürəcəyimiz dəyər (məs. `994558878889`) DB-də saxlanan formatla 1:1 uyğundurmu? `+` olmadan beynəlxalq formatdır?
3. Test üçün staging/production-da bir nümunə `wa_id` ver (məs. `994558878889`) ki, axını yoxlayaq.
4. Rate-limit varsa, limitlər nələrdir? (`/customers/by-wa/*` hər `wa_id` üçün dəqiqədə neçə sorğu?)

Təşəkkürlər.
