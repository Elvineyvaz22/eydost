# Ey Dost — Blog məzmun strategiyası

Bu sənəd Airalo, TrySoro və SEO ən yaxşı təcrübələrinə əsaslanır. Məqsəd: hər məqalədə **2–3 şəkil**, **7 dil**, aydın struktur və WhatsApp-a yönləndirmə.

---

## 1. Məqalə növləri (pillələr)

| Kateqoriya | Məqsəd | Nümunə mövzular |
|------------|--------|----------------|
| **eSIM** | Satış + aktivləşdirmə | Ölkə/bölgə planları, quraşdırma, rouminq müqayisəsi |
| **Taksi** | Taksi WhatsApp sifarişi | Hava limanı transferi, şəhər bələdçisi, Avropa |
| **Travel** | Ümumi səyahət + trafik | Festival, mövsüm, “necə qənaət etmək” |

Hər məqalə **yalnız bir əsas CTA**-ya gedir:
- eSIM / Travel → WhatsApp **+994 99 201 01 17** (`/esim`)
- Taksi → WhatsApp **+994 99 200 04 44** (`/taxi`)

---

## 2. Standart məqalə strukturu (Airalo tipli)

### Uzunluq
| Tip | Söz sayı | Oxuma | Şəkil |
|-----|----------|-------|-------|
| **Qısa** | 600–900 | 4–5 dəq | 2 şəkil |
| **Standart** | 1 000–1 500 | 6–8 dəq | 3 şəkil |
| **Bələdçi** | 1 500–2 500 | 9–12 dəq | 3–4 şəkil |

### Blok sırası (hər dil üçün eyni məntiq)

```
1. Hero metadata
   - title (H1 mənbəyi)
   - description (SEO + hero alt mətn)

2. Featured image (şəkil #1)
   - Kart + məqalə başlığı (16:9 və ya 2:1)
   - Unsplash / öz shoot / TrySoro featured

3. Giriş (bölmə başlığısız)
   - 2–3 paraqraf: problem → həll → Ey Dost

4. Bölmə A (H2) + şəkil #2 (istəyə görə)
   - “Necə işləyir” / “Nə daxildir”

5. Bölmə B (H2)
   - Siyahı və ya müqayisə cədvəli (mətn)

6. Bölmə C (H2) + şəkil #3 (istəyə görə)
   - Praktik məsləhət / ölkə-spesifik

7. “Ey Dost ilə necə alırsınız” (H2)
   - WhatsApp addımları (3 bullet)

8. FAQ (H2, 3–4 sual) — istəyə bağlı

9. CTA blok (saytda avtomatik)
```

### Şəkil qaydaları

| # | Yer | Məzmun | Ölçü |
|---|-----|--------|------|
| 1 | Featured | Başlıq mövzusunu vizual göstərir | 1200×630 min |
| 2 | 1-ci H2-dən sonra | “Necə işləyir” / xəritə / telefon QR | 800×450 |
| 3 | Orta və ya son H2 | Destinasiya, taksi, eSIM ekranı | 800×450 |

- **Alt mətn** hər dilə tərcümə olunur (accessibility + SEO).
- **Caption** istəyə bağlı, qısa.
- Rəqib mətnini və şəklini kopyalamayın — Unsplash, Canva, öz brend.

---

## 3. Slug və SEO

```
Format: {topic-keywords}-eydost-guide
Nümunə: best-esim-thailand-2026
         book-taxi-paris-airport-transfer
```

- `title` — 50–60 simvol, əsas açar söz əvvəl
- `description` — 140–160 simvol, CTA ilə
- Daxili link: 1–2 məqalə + `/esim` və ya `/taxi`
- `publishedAt` — ISO `YYYY-MM-DD`

---

## 4. 7 dil workflow

| Addım | Kim | Nə |
|-------|-----|-----|
| 1 | Məzmun (EN) | Tam məqalə + şəkil URL-ləri |
| 2 | Tərcümə | AZ, RU, TR, AR, ES, ZH (`globalEsimPlan/` və ya `blogLocales/`) |
| 3 | Kod | `blogPosts` + `blogPostImages` + `blogLocales` |
| 4 | Deploy | Vercel; sitemap avtomatik |
| 5 | TrySoro (opsional) | Eyni mövzunu paneldə dərc — saytda əsas mənbə öz blog |

**Qayda:** Şəkil URL-ləri dilərdən asılı deyil — `post.image` + `section.image.src` ümumidir; yalnız `alt` / `caption` tərcümə olunur.

---

## 5. Aylıq mövzu planı (nümunə — 8 həftə)

| Həftə | eSIM | Taksi | Travel |
|-------|------|-------|--------|
| 1 | Best eSIM Turkey 2026 | Istanbul airport transfer | Summer Europe packing |
| 2 | eSIM vs roaming UAE | Dubai WhatsApp taxi | Ramadan travel connectivity |
| 3 | How to install eSIM Samsung | London Heathrow transfer | Cherry blossom Japan eSIM |
| 4 | Global vs regional eSIM | Paris CDG guide | Digital nomad Europe |

Hər həftə **1–2 yeni məqalə** kifayətdir (keyfiyyət > həcm).

---

## 6. Texniki checklist (developer)

Yeni məqalə əlavə edərkən:

- [ ] `slug` unikal
- [ ] `readingMinutes` real oxuma vaxtına uyğun
- [ ] `image` featured (`blogPostImages.ts`)
- [ ] Hər əsas H2-də `section.image` (2–3 şəkil)
- [ ] 7 dil: EN+AZ+RU `blogPosts.ts`, TR/AR/ES/ZH `blogLocales/` və ya tam fayl
- [ ] `scripts/generate-sitemap.mjs` — `blogSlugs` siyahısına slug
- [ ] WhatsApp CTA kateqoriyaya uyğun (kod avtomatik)

---

## 7. Keyfiyyət kontrol

- [ ] Birinci paraqrafda problem aydındır
- [ ] Ey Dost fərqi (WhatsApp, dəqiqə, ID yox) keçir
- [ ] Qiymət/iddia yalan deyil
- [ ] Rəqib adı ilə müqayisə təhqiramiz deyil
- [ ] Mobil oxunaqlı (qısa paraqraflar, siyahılar)
- [ ] 2–3 şəkil yüklənir (404 yox)

---

## 8. Növbəti addım

1. Bu strategiyaya uyğun **1 pilot məqalə** seçin (məs. *Best eSIM for Turkey 2026*).
2. EN mətni + 3 şəkil URL göndərin və ya `.md` verin.
3. Biz 7 dilə yerləşdirib sayta əlavə edirik.
4. Köhnə 10 məqaləyə tədricən `section.image` əlavə edilir (backlog).

Şablon: `docs/blog-post-template.md`
