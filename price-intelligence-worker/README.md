# VITA Price Intelligence Gateway

Bu Worker, VITA Intelligence Studio'nun tarayıcıdan doğrudan tedarikçi sitelerine bağlanmak yerine sunucu/edge üzerinden kaynak toplamasını sağlar.

## Akış

VITA BOM → Price Intelligence Gateway → kaynak/tedarikçi sayfaları → PRICE_RECORD → ANNE/insan incelemesi → VERIFIED → BOM

## Güvenlik kuralları
- Tarayıcıda tedarikçi fetch'i yapılmaz.
- API anahtarları browser'a konmaz.
- Kaynak URL olmadan fiyat VERIFIED olamaz.
- Kaynak tarihi olmadan fiyat VERIFIED olamaz.
- DERIVED BOM satırları fiyat araştırmasına aday değildir.
- Gateway hiçbir kaydı otomatik VERIFIED yapmaz.
- VITA'nın teknik hesabını değiştirmez.

## Cloudflare Worker

`price-intelligence-worker/src/index.js` dosyasını Worker olarak deploy et.

`wrangler.toml` içindeki `ALLOWED_ORIGIN` değerini gerçek site origin'i ile sınırla.

İsteğe bağlı arama sağlayıcısı için Worker secret/variable:
- `SEARCH_API_URL`
- `SEARCH_API_KEY`

Arama sağlayıcısı `{ results: [{ url, title, snippet }] }` formatında sonuç döndürmelidir.

## Studio bağlantısı

Vita Intelligence sayfasında **Price Intelligence Gateway → Gateway URL** alanına Worker adresini gir.

Örnek:

`https://<worker-adresi>/price-intelligence`

Sonra **GATEWAY TEST ET** ile `/health` kontrolünü çalıştır.

## Fiyatın BOM'a geçmesi

Bu katman yalnızca kanıt kaydı üretir. Araştırılan fiyatlar doğrudan BOM fiyatı olarak işaretlenmez. Bir sonraki katmanda ANNE review queue + insan onayı ile `VERIFIED` kaydı oluşturulmalıdır.
