# Komanda üçün: Taksi — bot linki açılanda müştərini tanımaq

**Məhsul:** Ey Dost  
**Kanallar:** WhatsApp bot → veb xəritə (`eydost.com/taxi`) → webhook → yenə bot  
**Auditoriya:** Bot/backend komandası + veb (eydost.com) komandası

---

## Nə istəyirik (xülasə)

Müştəri **WhatsApp botumuza ilk dəfə yazan kimi** bot **dərhal veb linki** göndərməlidir. Link açılanda (adətən WhatsApp daxili brauzerdə) **biz bilməliyik ki, bu kimdir** — hər dəfə təsadüfi yeni ziyarətçi kimi davranmamalıyıq.

Bu gün linkdə çox vaxt **təsadüfi və ya bir dəfəlik kod** olur. Sayt həmin ziyarəti WhatsApp-dakı eyni şəxslə bağlaya bilmir, saxlanmış ünvanları yükləyə bilmir, bot da “xəritədə sifariş verən ilə çatdakı eyni adamdır” deyə bilmir.

**Məqsəd:** Bir telefon / WhatsApp hesabı = **bir daimi müştəri ID-si** — linkdə, saytda, webhook-da və botda eyni olsun.

---

## İstifadəçi yolu (hədəf)

1. Müştəri **WhatsApp botuna** mesaj yazır (taksi məqsədi ilə).
2. Bot link göndərir, məsələn:  
   `https://eydost.com/taxi?wa_id={whatsapp_user_id}&id={customer_id}`
3. Müştəri linki açır → **veb profili yüklənir** (varsa): son ünvanlar, favoritlər və s.
4. Xəritədə götürülmə və təyinat seçilir → təsdiq → **webhook** dispetçer platformasına **eyni** `customer_id` + koordinatlar gedir.
5. WhatsApp-da **bot eyni ID/telefon ilə tanıyır** — “siz kimsiniz?” yox, vahid kontekst.

---

## Bu günkü problemlər

| Problem | Təsir |
|---------|--------|
| Bot linkində təsadüfi `id` | Hər açılış saytda “yeni user” kimi görünür |
| Bəzən `wa_id` linkdə yoxdur | Brauzer sessiyası WhatsApp istifadəçisi ilə bağlanmır |
| `id` yoxdursa veb yeni UUID yaradır | Webhook və bot eyni adam üçün fərqli identifikator |
| Ortaq müştəri bazası yoxdur | Favorit yox, “geri qayıdan müştəri” təcrübəsi yox |

**Vebin indiki davranışı (artıq kodda var):**

- `/taxi`-də URL-dən `?id=`, `?bookingId=`, `?wa_id=` oxunur.
- `wa_id` varsa `sessionStorage`-ə yazılır.
- Webhook-da `bookingId` göndərilir (URL-dən; yoxdursa **yeni təsadüfi UUID** — bunu dayandırmaq istəyirik).

---

## Hər komanda nə etməlidir

### Bot / backend (prioritet)

1. **İlk mesajda** (və ya ilk taksi sorğusunda) istifadəçini **telefon / WhatsApp ID** ilə tapın.
2. **Sabit `customer_id`** verin və ya mövcud olanı istifadə edin (həmin telefon üçün heç vaxt dəyişməsin).
3. Link **yalnız** bu formatda olsun (hər iki parametr mütləq):  
   `https://eydost.com/taxi?wa_id={whatsapp_user_id}&id={customer_id}`
4. Hər link üçün **yeni təsadüfi ID yaratmayın** (xüsusi bir dəfəlik token qaydası varsa, yazılı izah edin).
5. Webhook gələndə sifarişi **`customer_id` + telefon/wa_id** ilə uyğunlaşdırın; bot çatda eyni istifadəçi kimi davam etsin.

### Veb — eydost.com (bot sabit ID verəndən sonra)

1. Səhifə açılanda: URL-dən `id` + `wa_id` oxumaq.
2. **Supabase**-dən profil yükləmək (yaradılacaq): favoritlər, son ünvanlar.
3. Xəritəni əvvəldən doldurmaq / saxlanmış yerləri göstərmək.
4. Göndərmədə webhook: **`bookingId` = `customer_id`** (URL-də `id` varsa təsadüfi UUID yox).
5. Uğurlu sifarişdən sonra profili yeniləmək.

### Dispetçer / xəritə webhook (Taxibooker / bsqd.me — bot platformamız)

1. Sabit `customer_id` və telefon/wa_id qəbul etsin (sahə adları razılaşdırılacaq).
2. İstifadəçiyə qayıdan linklərdə eyni ID olsun.
3. İstəyə bağlı: favorit/status API (2-ci mərhələ).

---

## Razılaşdığımız texniki qaydalar

- **`customer_id`:** daxili kod (məs. `CUST-7f3a9c`), URL-də açıq telefon nömrəsi yox.
- **`wa_id`:** botdan gələn WhatsApp identifikatoru; daxili brauzer üçün linkdə mütləq.
- **Webhook:** istifadəçinin açdığı linkdəki **eyni** `customer_id` getsin.
- **Məxfilik:** Privacy Policy; silmə hüququ; minimum data (ünvan + id, artıq olmayan sahələr yox).

---

## Uğur meyarları

- [ ] Eyni telefon → aylarla eyni `customer_id`
- [ ] Botun ilk cavab linkində həmişə `wa_id` + `customer_id`
- [ ] Linki iki dəfə açanda eyni kontekst (profil DB-dən sonra)
- [ ] Webhook + bot **eyni** müştəri qeydinə istinad
- [ ] Geri qayıdan istifadəçilər üçün “yalnız təsadüfi kod” linki yox

---

## 1-ci mərhələdə yox (sonra mümkün)

- URL-də daimi `id` əvəzinə qısa müddətli imzalı token (təhlükəsizlik).
- Taksi təyin detallarının vebdə göstərilməsi (dispetçer sizin tərəfdə qalır).
- Bir adam, iki telefon birləşdirmə — manual dəstək.

---

## Bot komandasına suallar (cavab gözləyirik)

1. Bu həftə hər taksi linkində `wa_id` + sabit `customer_id` göndərə bilərsinizmi?
2. Müştəri qeydi bu gün harada saxlanır (sizin DB / bizim Supabase)?
3. Pickup/destination əlavə hansı webhook sahələrini qəbul edirsiniz?
4. Staging test üçün texniki əlaqə kimdir?

Təşəkkürlər.
