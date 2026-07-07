# Dünkü Sen kalıcı yayın notları

Bu prototip tek Node.js sunucusu olarak çalışır:

- Statik mobil uygulama dosyaları
- Sosyal/yoldaş API uçları
- JSON tabanlı küçük veritabanı

## Kalıcı link için gerekenler

Geçici Cloudflare quick tunnel linkleri bilgisayar veya tünel kapanınca ölür. Kalıcı kullanım için uygulama bir hosting servisine taşınmalı ve sabit bir HTTPS alan adı almalıdır.

## Veri kalıcılığı

Sunucu varsayılan olarak `data/social-db.json` dosyasını kullanır. Hosting ortamında verilerin silinmemesi için kalıcı disk bağlanmalı ve şu değişkenlerden biri verilmelidir:

- `DATA_DIR=/kalici/disk/yolu`
- veya `DB_PATH=/kalici/disk/yolu/social-db.json`

## Docker ile çalışma

```bash
docker build -t dunku-sen .
docker run -p 4173:4173 -v dunku-sen-data:/data dunku-sen
```

Sonra sağlık kontrolü:

```bash
curl http://localhost:4173/api/health
```

## Güncellemelerin telefona gelmesi

Her sürümde `index.html` ve `sw.js` içindeki asset sürümü yükseltilir. Service worker açık uygulamada da yeni sürümü arar; telefon eski sürümde kalırsa uygulamayı kapatıp açmak yeterlidir.
