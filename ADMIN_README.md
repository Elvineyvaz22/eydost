# Ey Dost Admin Panel

## Giriş Məlumatları

Admin panelinə daxil olmaq üçün:

**URL:** `/admin` və ya `/admin/login`

**Email:** admin@eydost.ai
**Şifrə:** admin123

## Admin İstifadəçisi Yaratmaq

Əgər admin istifadəçisi yoxdursa, Supabase Auth vasitəsilə yaradın:

1. Supabase Dashboard-a keçin
2. Authentication > Users səhifəsinə keçin
3. "Add User" düyməsinə klikləyin
4. Email: admin@eydost.ai
5. Password: admin123
6. "Create User" düyməsinə klikləyin

## Admin Panel Bölmələri

### 1. İdarə Paneli
Əsas səhifə və xoş gəlmisiniz mesajı.

### 2. Hero Bölməsi
Ana səhifənin yuxarı hissəsini redaktə edin:
- Nişan (Badge) mətni
- Başlıq və vurğulanmış başlıq
- Alt başlıq
- Düymə mətnləri

### 3. Bölmələr
Hal-hazırda tərcümələr səhifəsindən redaktə edilə bilər.

### 4. Gələcək Modullar
Gələcəkdə əlavə ediləcək modulların siyahısını redaktə edin.
Modul əlavə etmək və ya silmək mümkündür.

### 5. Brend Ayarları
Saytın brend elementlərini konfiqurasiya edin:
- Loqo URL
- Əsas rəng
- İkinci rəng

### 6. Altbilgi (Footer)
Footer məlumatlarını redaktə edin:
- Email
- Telefon
- Instagram linki
- WhatsApp linki
- Altbilgi mətni

### 7. Tərcümələr (AZ / EN)
Tam sayt məzmununu JSON formatında redaktə edin:
- Azərbaycan dili məzmunu
- İngilis dili məzmunu

## Təhlükəsizlik

- Admin panel Supabase Auth ilə qorunur
- Yalnız təsdiqlənmiş istifadəçilər daxil ola bilər
- Bütün məlumatlar Supabase verilənlər bazasında saxlanılır

## Texniki Məlumat

- Admin panel tam Azərbaycan dilindədir
- React Router ilə marşrutlaşdırma
- Supabase verilənlər bazası
- TailwindCSS dizayn
