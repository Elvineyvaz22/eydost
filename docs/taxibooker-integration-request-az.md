# İnteqrasiya tələbi: Sabit müştəri ID-si və kanallararası tanıma

**Kimdən:** Ey Dost (eydost.com)  
**Kimə:** Taxibooker / Bot platforması (bsqd.me)  
**Mövzu:** Daimi müştəri ID-ləri, dərin linklər və WhatsApp + veb taksi sifarişi üçün webhook uyğunlaşdırması

---

## 1. Kontekst

Ey Dost taksi sifarişini iki yerdə qəbul edir:

1. **Veb:** `https://eydost.com/taxi` — istifadəçi xəritədə götürülmə və təyinat seçir, sonra WhatsApp-a keçir.
2. **WhatsApp bot:** İstifadəçiyə link göndərilir (tez-tez WhatsApp daxili brauzerdə açılır), xəritədə ünvan seçilir, sifariş tamamlanır.

Hal-hazırda sizin webhook-unuza (`recieve_maps` hadisəsi) `bookingId`, pickup və destination göndəririk. Lakin:

- Bot linkindəki ID çox vaxt **təsadüfi** görünür və ya sessiyalar arası dəyişir.
- Veb tətbiq ilə bot **eyni “müştəri profilini”** (favoritlər, saxlanmış ünvanlar, şəxsiyyət) paylaşmır.
- WhatsApp botumuz vebdə sifariş verən şəxsin çatdakı eyni istifadəçi olduğunu etibarlı tanıya bilmir.

Biz ID və məlumatları elə uyğunlaşdırmaq istəyirik ki, **bir telefon nömrəsi = bir daimi müştəri ID-si** olsun (veb, webhook və WhatsApp üzrə).

---

## 2. Sizdən gözləntilərimiz

### 2.1 Daimi müştəri ID-si (hər telefon nömrəsinə)

- Hər müştəriyə **sabit, təkrar istifadə olunan ID** verin (məs. `CUST-994501234567` və ya daxili UUID), **WhatsApp / telefon nömrəsi** ilə bağlı.
- Bu ID **dəyişməməlidir:**
  - WhatsApp brauzerində xəritə linkinin açılması
  - eydost.com/taxi-dən sifarişlər
  - günlər və ya həftələr sonra təkrar sifarişlər

Zəhmət olmasa istifadə edəcəyiniz sahə adını (məs. `customer_id`, `user_id`, `client_id`) və formatı təsdiqləyin.

### 2.2 Xəritə / veb axını üçün dərin link formatı

Bot istifadəçini taksi səhifəsinə yönləndirəndə URL **hər ikisini** ehtiva etməlidir:

| Parametr | Məqsəd |
|----------|--------|
| `id` və ya `bookingId` | Sizin daimi müştəri / sessiya ID-niz |
| `wa_id` | WhatsApp istifadəçi identifikatoru (mövcuddursa), brauzer sessiyasını çat istifadəçisi ilə bağlamaq üçün |

**Nümunə:**

```
https://eydost.com/taxi?wa_id={whatsapp_user_id}&id={customer_id}
```

Biz `/taxi`-də artıq `id`, `bookingId` və `wa_id` oxuyuruq və webhook payload-da `bookingId` göndəririk.

### 2.3 Webhook payload (Ey Dost → sizə)

Hal-hazırda xəritə hadisəsi endpoint-inə belə POST edirik:

```json
{
  "bookingId": "<URL-dən və ya generasiya>",
  "bot_id": "388c046c-c54f-4b56-9107-24f4ffca0600",
  "user_id": "master",
  "pickup": { "display_name", "formatted_address", "lat", "lng" },
  "destination": { "display_name", "formatted_address", "lat", "lng" },
  "confirmed_at": "<ISO8601>"
}
```

**Xahiş edirik, bu sahələri də qəbul edəsiniz (və ya qaytarasınız):**

| Sahə | Təsvir |
|------|--------|
| `customer_id` | Telefon üzrə sabit ID (dərin linklərdəki ilə eyni) |
| `phone` və ya `wa_id` | E.164 telefon və ya WhatsApp ID (botda uyğunlaşdırma üçün) |
| `source` | məs. `eydost_web` / `eydost_whatsapp` |

Məcburi / istəyə bağlı sahələr və adlandırma qaydalarını təsdiqləyin.

### 2.4 Ey Dost-a gələn məlumat (istəyə bağlı, tövsiyə olunur)

Platformanız geri çağırış edə bilirsə, dəstəkləyə bilərik:

- **Profil sinxronu:** `customer_id` ilə favorit ünvanlar (ev, aeroport, son pickup/drop-off)
- **Sifariş statusu:** taksi təyin olundu, sürücü yoldadır, tamamlandı — botda proaktiv WhatsApp mesajları üçün

Bu gün yalnız tək istiqamətli webhook varsa, hansı hadisələri göndərə bildiyinizi və nümunə JSON-u sənədləşdirin.

### 2.5 Bot davranışı (çatda eyni şəxsiyyət)

Webhook `customer_id` + `phone`/`wa_id` ilə gələndə:

- WhatsApp bot istifadəçini **tanımalıdır** (daimi müştəri üçün “siz kimsiniz?” sorğusu olmamalı).
- Cavablar veb xəritə sessiyası ilə **eyni** sifariş / müştəri qeydinə istinad etməlidir.
- Veb sifarişdən sonra göndərilən linklər **eyni** `customer_id` istifadə etməlidir, yeni təsadüfi ID yox.

---

## 3. Ey Dost tərəfində edəcəyimiz işlər (razılaşmadan sonra)

1. **Verilənlər bazası (Supabase):** `customer_id`, telefon/wa_id, favorit ünvanlar, son sifariş.
2. **Veb `/taxi`:** `?id=` olduqda profil yükləmə; xəritəni doldurma; uğurlu sifarişdən sonra favoritləri saxlama.
3. **Webhook:** mümkün olanda həmişə sabit `customer_id` + `wa_id` göndərmək.
4. **WhatsApp bot:** eyni ID xəritəsi ilə çat və vebin bir istifadəçi olması.

---

## 4. Sizə suallarımız

1. Bu gün **telefon nömrəsi üzrə sabit `customer_id`** verə bilirsinizmi? Yoxdursa, təxmini müddət?
2. İstifadəçilərə göndərəcəyiniz **dəqiq dərin link formatı** nədir?
3. İstifadə etdiyimiz webhook sxeminə `customer_id` / `phone` əlavə olunacaqmı?
4. Müştəri favoritləri və ya sifariş statusu üçün **API** varmı?
5. Staging credentialları və test ID-ləri üçün texniki əlaqə kimdir?

---

## 5. Uğur meyarları

- Eyni istifadəçi, eyni telefon → hər dəfə **eyni ID**.
- Bot linki açılır → URL-də **sabit** `id` görünür.
- Vebdə sifariş → webhook → bot WhatsApp-da müştərini **yenidən soruşmadan** tanıyır.
- (Əlavə) Favorit ünvanlar sessiyalar arası qalır.

Təşəkkürlər. ID formatı və nümunə payload-ları paylaşan kimi staging-də testə hazırıq.

**Əlaqə:** [e-poçt / WhatsApp biznes əlaqəsi]
