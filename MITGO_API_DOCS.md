# Mitgo / eSIM Access API Dokumentasiyası

**⚠️ Qeyd:** `developers.mitgo.com` saytı Cloudflare/Zendesk ilə qorunur və 403 Forbidden qaytarır. Aşağıdakı məlumatlar proyektin öz kod bazasından (`backend/esim_access/`) və açıq mənbələrdən toplanıb.

**Rəsmi Developer Portal:** https://developers.mitgo.com  
**eSIM Access Console:** https://console.esimaccess.com/developer  
**API Baza URL:** `https://api.esimaccess.com`

---

## Autentifikasiya

Bütün sorğular HMAC-SHA256 imzası ilə təsdiqlənir.

### Header-lar

| Header | Açıqlama |
|--------|----------|
| `RT-AccessCode` | Developer panelindən alınan Access Code |
| `RT-RequestID` | UUID formatında unikal sorğu ID |
| `RT-Timestamp` | Unix timestamp (milisaniyə) |
| `RT-Signature` | HMAC-SHA256 imzası |
| `Content-Type` | `application/json` |

### İmza Formulu

```
signData  = Timestamp + RequestID + AccessCode + RequestBody
signature = HMAC-SHA256(signData, SecretKey)
```

---

## API Endpoints

### 1. Paketləri Siyahılaşdır
```
POST /api/v1/open/package/list
```
Paketləri ölkə və ya tipə görə filter etmək olar.

**Parametrlər:**
- `type` — "BASE" və ya "TOPUP"
- `locationCode` — ISO Alpha-2 ölkə kodu (məsələn, "TR")

**Cavab:**
```json
{
  "success": true,
  "obj": {
    "packageList": [
      {
        "packageCode": "JC016",
        "slug": "AU_1_7",
        "name": "Australia 1GB 7 Days",
        "price": 1000,
        "currencyCode": "USD",
        "volume": "1GB",
        "duration": 7,
        "durationUnit": "DAY",
        "location": "AU",
        "speed": "Unlimited",
        "supportTopUpType": true
      }
    ]
  }
}
```

---

### 2. eSIM Sifarişi
```
POST /api/v1/open/esim/order
```
Yeni eSIM profili sifariş edir.

**Parametrlər:**
- `transactionId` — Unique idempotency ID
- `packageInfoList` — Paket məlumatları massivi
  - `packageCode` — Paket kodu (məsələn "JC016") VƏ YA `slug`
  - `count` — Neçə ədəd sifariş (max 30)

**Cavab:**
```json
{
  "success": true,
  "obj": {
    "orderNo": "ORD123456"
  }
}
```

⚠️ **Qeyd:** Profillər asinxron ayrılır. Bir neçə saniyə gözləyib `GET /api/v1/open/esim/query` sorğusu ilə yoxlamalısınız.

---

### 3. eSIM Məlumatını Sorğula
```
POST /api/v1/open/esim/query
```

**Parametrlər:**
- `orderNo` — Sifariş nömrəsi

**Cavab (hazır olduqda):**
```json
{
  "success": true,
  "obj": {
    "esimList": [
      {
        "iccid": "89012345678901234567",
        "qrCodeUrl": "https://...",
        "ac": " activation code",
        "status": "ACTIVATED"
      }
    ]
  }
}
```

**Xəta kodu 200010:** SM-DP+ hələ profilləri ayırır — bir neçə saniyə sonra yenidən sorğula.

---

### 4. eSIM Status Sorğusu
```
POST /api/v1/open/esim/query
```
Mövcud eSIM-in status və istifadə məlumatını götürür.

**Parametrlər:**
- `esimTranNo` — Unikal eSIM transaction nömrəsi (ən etibarlı)
- `iccid` — ICCID
- `orderNo` — Sifariş nömrəsi
- `pager` — `{pageSize, pageNum}`

---

### 5. Balans Sorğula
```
POST /api/v1/open/balance/query
```
Hesab balansını yoxlayır.

**Cavab:**
```json
{
  "success": true,
  "obj": {
    "balance": 1000.00,
    "currencyCode": "USD"
  }
}
```

---

### 6. Top-Up
```
POST /api/v1/open/esim/topup
```
Mövcud eSIM-ə data əlavə edir.

**Parametrlər:**
- `iccid` — eSIM ICCID
- `packageCode` — Top-up paket kodu VƏ YA `slug`
- `transactionId` — Unique idempotency ID

---

### 7. Ləğv Etmə
```
POST /api/v1/open/esim/cancel
```
eSIM-i ləğv edir və balansa refund edir.

**Parametrlər:**
- `esimTranNo` — eSIM transaction nömrəsi

---

### 8. Dayandırma (Suspend)
```
POST /api/v1/open/esim/suspend
```
Aktiv eSIM-i dayandırır.

---

### 9. Aktivləşdirmə (Unsuspend)
```
POST /api/v1/open/esim/unsuspend
```
Dayandırılmış eSIM-i yenidən aktivləşdirir.

---

## Rate Limit

**8 sorğu/saniyə** — Token Bucket alqoritmi ilə məhdudlaşdırılıb.

---

## Webhook-lar

### ORDER_STATUS
eSIM profilləri hazır olduqda göndərilir.

### LOW_BALANCE
Balans 25% və ya 10%-ə düşdükdə göndərilir.

### SMDP_EVENT
SM-DP+ server lifecycle event-ləri.

---

## Layihədəki İnteqrasiya

Proyektdə bu API `backend/esim_access/` qovluğunda tam işlənmiş halda var:

| Fayl | Funksiya |
|------|-----------|
| `client.py` | HMAC-SHA256 autentifikasiya, HTTP sorğuları, rate limiting |
| `service.py` | Biznes məntiqi — bütün əsas əməliyyatlar |
| `api.py` | FastAPI router — frontend-ə REST endpoint-ləri |
| `pricing.py` | Supabase-dən pricing qaydaları, satış qiyməti kalkulyasiyası |
| `sync.py` | Paketləri Supabase-ə sync edir |
| `webhooks.py` | Webhook handler — ORDER_STATUS, LOW_BALANCE, SMDP_EVENT |
| `whatsapp.py` | WhatsApp Business API inteqrasiyası |

### .env Konfiqurasiyası

```env
ESIM_ACCESS_CODE=your_access_code
ESIM_SECRET_KEY=your_secret_key
ESIM_BASE_URL=https://api.esimaccess.com
ESIM_TIMEOUT=30
```

### Rate Limiting Davranışı

```python
# client.py-də Token Bucket implementasiyası:
# Rate: 8 sorğu/saniyə
# Hər sorğudan əvvəl token yoxlanılır
# Əgər token yoxdursa, sleep edilir
```

---

## Ümumi Xətalar

| errorCode | Məna |
|-----------|------|
| 200010 | SM-DP+ hələ profilləri ayırır (retry et) |
| 401 | Autentifikasiya xətası |
| 429 | Rate limit aşılıb |

---

## Əlavə Mənbələr

- Developer Portal: https://developers.mitgo.com
- eSIM Access Console: https://console.esimaccess.com/developer
- eydost.az layihəsi: `backend/esim_access/` altında tam OpenAPI inteqrasiyası mövcuddur
