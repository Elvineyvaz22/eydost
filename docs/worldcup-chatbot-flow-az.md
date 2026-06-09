# World Cup 2026 eSIM Chatbot Flow

Bu flow WhatsApp/chatbot ucundur. Saytda kampaniya sehifesi ikinci derecelidir; esas qiymet ve paket secimi botda aparilir.

## Qayda

- Maya qiymeti musteriye gosterilmir.
- Bot yalniz son satis qiymetini gosterir.
- Satis qiymeti: `maya qiymeti * 1.75`.
- Mesajlarda `Airalo`, `endirim`, `maya`, `evvelki qiymet` sozleri yazilmir.
- Hazir endpoint maya qiymetini cavabda qaytarmir.

## Endpoint

```http
GET /api/worldcup-packages?country=US
GET /api/worldcup-packages?country=US&type=standard
GET /api/worldcup-packages?country=US&type=daily
```

Hazirda aktiv qiymet siyahisi: `US`.
`CA` ve `MX` qiymetleri geldikden sonra eyni endpoint-e elave edilmelidir.

## Cavab numunesi

```json
{
  "ok": true,
  "campaign": "world-cup-2026",
  "markup": "included",
  "country": "US",
  "packages": [
    {
      "id": "us-20gb-30d",
      "country_code": "US",
      "country": "United States",
      "name": "United States 20GB 30Days",
      "data": "20GB",
      "days": "30",
      "type": "standard",
      "network": "3G/4G/5G",
      "currency": "USD",
      "price_usd": 21.75,
      "price": "$21.75"
    }
  ]
}
```

## Bot suallari

1. "World Cup 2026 ucun hansi olke lazimdir: ABŞ, Kanada, yoxsa Meksika?"
2. "Standart paket isteyirsiniz, yoxsa gunluk paket?"
3. "Nece gun qalacaqsiniz?"
4. "Texmini ne qeder data lazimdir: 5GB, 10GB, 20GB, 50GB?"

## Bot cavab formati

```text
ABŞ ucun uygun paketler:

1. 10GB / 30 gun - $11.60
2. 20GB / 30 gun - $21.75
3. 50GB / 30 gun - $49.00

Hansi paketi secirsiniz?
```

## Sifaris mesaji

```text
Salam, World Cup 2026 ucun eSIM almaq isteyirem.
Olke: United States
Paket: 20GB / 30 gun
Qiymet: $21.75
```

