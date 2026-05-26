# Komanda üçün: eSIM — bot linki açılanda müştərini tanımaq

**Məhsul:** Ey Dost  
**Kanallar:** WhatsApp bot (`bot.eydost.az`) → veb (`eydost.com/esim`) → bot (ödəniş)  
**Auditoriya:** Bot/backend komandası + veb (eydost.com) komandası

> Bu sənəd `team-taxi-customer-id-brief-az.md` ilə paralel quruluşdadır. Taksidən fərqli olaraq eSIM-də **ödəniş botda yekunlaşır**, sayt yalnız profil və paket seçimi göstərir.

---

## Nə istəyirik (xülasə)

Müştəri **WhatsApp eSIM botuna** (+994 99 201 01 17) yazanda bot ona link göndərir. Linki açanda **sayt onu tanımalıdır**: keçmiş eSIM-ləri, aktiv paketləri və qalan trafiki göstərməli, "yeni paket al" axını da eyni `wa_id` altında olmalıdır. Ödəniş üçün isə istifadəçi **yenidən bota qaytarılır**.

**Stabil identifikator:** `whatsapp_user_id` (qısa: `wa_id`).  
Ayrıca `customer_id` yaradılmır — backend onsuz da `whatsapp_user_id` ilə işləyir (`AssistantMessageRequest`, `CreateOrderRequest`, `TopupCreateRequest` modellərində bu sahə var).

---

## İstifadəçi yolu (hədəf)

1. Müştəri **eSIM botuna** WhatsApp-da yazır (+994 99 201 01 17).
2. Bot link göndərir:  
   `https://eydost.com/esim?wa_id={whatsapp_user_id}`
3. Müştəri linki açır → sayt **profil ekranını** yükləyir:
   - Aktiv paketlər (status, qalan MB, qalan gün)
   - Keçmiş sifarişlər
   - "Yeni paket al" düyməsi
4. "Yeni paket al" → ölkə seçimi → paket seçimi → **"Botda ödə"** düyməsi.
5. Sayt `POST /api/public/orders` çağırır, `order_id` alır.
6. Sayt istifadəçini bota yönləndirir:  
   `https://wa.me/994992010117?text=PAY%20{order_id}`
7. Bot `PAY {order_id}` mesajını tanıyır → ödəniş linkini göndərir → ödəniş → fulfillment → QR.

---

## Bu günkü problemlər (Swagger təhlilinə əsasən)

| Problem | Təsir |
|---------|--------|
| `wa_id`-yə görə müştərinin sifariş siyahısını gətirən endpoint **yoxdur** | Profil ekranı qura bilmirik |
| `wa_id`-yə görə müştərinin eSIM siyahısı **yoxdur** | "Aktiv paketlər" göstərə bilmirik |
| `order_id` və ya `esim_id` olmadan heç nə sorğulamaq mümkün deyil | Sayta gələn yeni sessiya istifadəçini "tanıya" bilmir |

Mövcud endpoint-lər (uyğun olanlar):

- `GET /api/public/packages?country_code=TR` — kataloq
- `POST /api/public/orders` (qəbul edir `whatsapp_user_id`) — sifariş yaratmaq
- `GET /api/public/orders/{order_id}` — bir sifariş
- `GET /api/public/orders/{order_id}/esim` — bir eSIM detalı
- `GET /api/public/esims/{esim_id}/usage` — istifadə statistikası

---

## Bot / backend komandasından xahiş (prioritet)

**Tələb 1 — Çatışmayan 2 endpoint əlavə edin:**

```http
GET /api/public/customers/by-wa/{whatsapp_user_id}/orders
Headers: x-api-key: <key>
Response: ApiEnvelope[list[OrderResponse]]
  # yeni-ən-köhnə sıralı; minimum sahələr: id, status, country_code, package_code, created_at, sell_price, currency
```

```http
GET /api/public/customers/by-wa/{whatsapp_user_id}/esims
Headers: x-api-key: <key>
Response: ApiEnvelope[list[EsimResponse]]
  # bütün eSIM-lər; status: active|expired|pending
  # opsional: hər biri üçün usage snapshot (remain_volume, expired_time)
```

Modellər mövcuddur (`OrderResponse`, `EsimResponse`, `UsageResponse`) — sadəcə yeni 2 route lazımdır. DB-də `orders.whatsapp_user_id` artıq saxlanır (çünki `CreateOrderRequest` bu sahəni qəbul edir).

**Tələb 2 — Mövcud endpoint-lərdə davranış təsdiqi:**

- `POST /api/public/orders` çağıranda `whatsapp_user_id: "{wa_id}"`, `transport: "web"` ötürəcəyik. Bu vəziyyətdə bot ödəniş linkini avtomatik göndərmir, doğrudur? (Sayt istifadəçini bota redirect edir, ödəniş link sorğusu mesajla başlayır.)
- `GET /api/public/orders/{order_id}?whatsapp_user_id=...` — `whatsapp_user_id` parametri **avtorizasiya rolunu oynayır** (yəni başqa istifadəçinin sifarişinə girmək mümkün deyil), doğrudur?

**Tələb 3 — Bot tərəfdə mesaj tanıma:**

Bot `PAY {order_id}` formatlı mesaj gəlsə, həmin `order_id` üçün ödəniş linkini göndərməlidir (mövcud `/api/public/orders/{order_id}/payment` endpoint-i istifadə edərək). Format dəyişməsi lazımdırsa, alternativ təklif edin (məsələn `pay_<id>`, `/pay <id>`).

---

## Veb tərəf (eydost.com) — artıq yazılır

1. `/esim` route-u: URL-də `wa_id` varsa → profil ekranı, yoxsa → mövcud kataloq.
2. Vercel proxy: `api/esim-proxy.ts` — `x-api-key` Vercel env-də qalır, frontend-də sızmır.
3. Endpoint-lərə müraciət ardıcıllığı (proxy vasitəsilə):
   - `GET /api/public/customers/by-wa/{wa_id}/esims` → aktiv siyahısı
   - `GET /api/public/esims/{esim_id}/usage` → hər aktiv üçün qalan
   - `GET /api/public/customers/by-wa/{wa_id}/orders` → tarixçə
   - `GET /api/public/packages?country_code=XX` → kataloq
   - `POST /api/public/orders` → draft order yaratmaq
4. "Botda ödə" → `window.location = https://wa.me/994992010117?text=PAY%20{order_id}`

---

## Razılaşdığımız texniki qaydalar

- **Identifikator:** yalnız `whatsapp_user_id`. Telefon nömrəsi URL-də açıq yazılmır.
- **Auth:** `x-api-key` header — yalnız serverdən (Vercel proxy), brauzerdə deyil.
- **Bot nömrələri:**
  - eSIM: **+994 99 201 01 17** → `https://wa.me/994992010117`
  - Taksi: +994 99 200 04 44 (bu briefdə deyil, qarışdırmamaq üçün qeyd)
- **Məxfilik:** Privacy Policy-də `wa_id`-nin emalı qeyd olunmalıdır.

---

## Uğur meyarları

- [ ] Eyni `wa_id` → həmişə eyni profil, eyni eSIM siyahısı
- [ ] `GET /customers/by-wa/{wa_id}/esims` < 500 ms
- [ ] `GET /customers/by-wa/{wa_id}/orders` < 500 ms
- [ ] Sayt heç bir vaxt brauzerdə `x-api-key`-i ifşa etmir
- [ ] "Botda ödə" düyməsi həmişə `order_id`-ni mesaj kimi bota gətirir
- [ ] Bot `PAY {order_id}` mesajına ödəniş linki ilə cavab verir

---

## 1-ci mərhələdə yox (sonra mümkün)

- Saytda birbaşa ödəniş (PCI-clean qalmaq üçün hazırda botda saxlanılır)
- `wa_id` əvəzinə qısamüddətli imzalı token (təhlükəsizlik upgrade-i)
- Saytdan birbaşa top-up alışı (mövcud `/api/public/esims/{esim_id}/topups` istifadə edərək) — frontend hazır olandan sonra

---

## Bot komandasına suallar (cavab gözləyirik)

1. Yuxarıdakı **2 yeni endpoint** (`/customers/by-wa/{wa_id}/orders` + `/esims`) bu həftə əlavə oluna bilərmi?
2. `PAY {order_id}` formatı bot tərəfdə işləyəcəkmi, yoxsa başqa format daha rahatdır?
3. Production üçün `x-api-key` (Vercel env-də `ESIM_BOT_API_KEY` adı ilə saxlayacağıq) yeniləməyə ehtiyac var, yoxsa hazırda istifadə etdiyimiz açar (sizə ayrıca verdiyimiz) qüvvədə qalır?
4. Rate-limit varsa, limitlər nələrdir? (`/customers/by-wa/*` hər `wa_id` üçün dəqiqədə neçə sorğu?)
5. Staging URL varsa, link verin (test üçün).

Təşəkkürlər.
