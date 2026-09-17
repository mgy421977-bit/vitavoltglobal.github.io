# VITA Engine Web Entegrasyonu

Web sitesi, Python çalışma zamanını GitHub Pages üzerinde doğrudan çalıştırmak yerine `js/vita-engine.js` içindeki tarayıcı uyumlu deterministik VITA Engine çekirdeğini kullanır. Statik site üzerinde çalışan tüm ön fizibilite akışlarında VITA, mühendislik matematiğinin tek otoritesidir.

## Birleşik bağlantı akışı

Ana sayfadaki Hızlı Ön Fizibilite ve VITA Intelligence akışları aynı sözleşmeyi kullanır:

`Form → ANNE System Analyze → MITOS Complete Inputs / Scenario Proposal → VITA Engine → ANNE Deterministic Test → Human Approval`

`calculator.js` yalnızca VITA Engine için UI adapter'dır; mühendislik hesabını yeniden yazmaz. `home-calculator.js` ve `vita-unified-form.js` sonuçları bu ortak pipeline üzerinden üretir.

MITOS; şehir, koordinat, yağış, özgül üretim ve çatı yönlenme kaybı gibi girdileri tamamlar ve aday senaryolar üretir. MITOS mühendislik değerlerini hesaplamaz ve VITA çıktısını override edemez. ANNE orkestrasyon, tutarlılık testi ve insan onay kapısını yönetir.

## GES boyutlandırma ve fiziksel alan ayrımı

`js/vita-engine-sizing.js` yıllık tüketimden gerekli GES gücünü türetir ve mevcut çatı/arazi kapasitesiyle sınırlar. Seçilen panel adedi `panelCountOverride` ile doğrudan VITA Engine'e aktarılır.

Önemli ayrım: fiziksel çatı alanı hiçbir zaman seçilen panel alanıyla değiştirilmez. Böylece GES boyutlandırması ile yağmur suyu toplama alanı birbirinden ayrılır. WATER hesabı gerçek çatı alanını kullanmaya devam eder.

Tüketim hedefi fiziksel alanı aşıyorsa sonuçta `areaLimited` ve gereken/alanın izin verdiği kWp bilgisi işaretlenir; sistem fiziksel kapasitenin üzerine çıkarılmaz.

## Su hesap sözleşmesi

Yağmur suyu hesabı çatı alanı, yıllık yağış, çatı akış katsayısı ve ilk yıkama/taşma faktörünü kullanır. Gri su hesabı aylık toplam su tüketiminden kaynak oranını ve işletilebilirlik faktörünü uygular. Kullanılabilir su miktarı yıllık taleple karşılaştırılır ve kapsama oranı %100 ile sınırlandırılır.

## Müşteri ve iç operasyon çıktısı ayrımı

Müşteri ekranında yalnızca ön fizibilite için gerekli teknik bilgiler gösterilir: GES kWp, panel adedi/Wp, inverter kapasitesi/adedi, BESS ön değerlendirmesi, yıllık üretim, CO₂ ve su potansiyeli.

İç maliyet, BOS/EPC allowance, proje maliyeti, satış fiyatı ve ayrıntılı maliyet kırılımı müşteri ekranına verilmez. Hızlı Ön Fizibilite payload'ı bu alanları yalnızca iç operasyon e-postası/Excel üretimi için taşır.

Excel eki; yönetici özeti, teknik detaylar, BOM, iç maliyet ve ANNE/MITOS değerlendirmesini ayrı sekmeler halinde içerir. BOM satırlarında kategori, kalem, miktar, birim, birim maliyet, toplam maliyet, kaynak ve durum alanları korunur.

## Test sözleşmesi

`tests/vita-engine.test.js` şu kontrolleri yapar:

- VITA Engine sürümünün ve adapter'ın yüklenmesi
- Kuşadası yağış değerinin 660,6 mm olarak eşlenmesi
- 150 m² çatı için yağmur suyu hesabı
- Aylık 12 m³ tüketim için gri su hesabı
- GES öz tüketiminin yıllık tüketimi aşmaması
- Tüketim boyutlandırmasında panel override ve fiziksel çatı alanının korunması
- Su hesabının seçilen panel alanına dönüşmemesi
- MITOS şehir verilerinin VITA tarafından kullanılması
- Çatı kayıp varsayımının VITA'ya aktarılması
- BESS modül hesabı ve tedarikçi fiyat tabanı
- İnverter katalog seçimi ve paralel ünite senaryosu
- Büyük projelerin küçük paket referansına zorlanmaması
- ANNE → MITOS → VITA → ANNE test zincirinin geçmesi
- Sıfır alan girdisinin reddedilmesi

Çalıştırma:

```bash
node tests/vita-engine.test.js
node --check js/vita-engine.js
node --check js/calculator.js
node --check js/home-calculator.js
node --check js/vita-engine-sizing.js
node --check js/anne-core.js
node --check js/mitos-core.js
node --check js/vita-unified-form.js
```

Bu entegrasyon ön fizibilite seviyesindedir. Nihai tasarım için gerçek saatlik/15 dakikalık elektrik profili, saha keşfi, gölgelenme/yönlenme analizi, gerçek yağış-su dengesi, güncel tarifeler ve tedarikçi teklifleri gereklidir.
