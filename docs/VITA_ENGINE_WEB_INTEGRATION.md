# VITA Engine Web Entegrasyonu

Web sitesi, Python çalışma zamanını GitHub Pages üzerinde doğrudan çalıştırmak yerine `js/vita-engine.js` içindeki tarayıcı uyumlu adapter üzerinden VITA Engine veri sözleşmesini kullanır. Bu tercih statik sitenin çalışmasını korur ve aynı girdilerin aynı deterministik sonuçları vermesini sağlar.

## Bağlantı akışı

`index.html` önce `js/vita-engine.js` dosyasını, ardından `js/calculator.js` dosyasını yükler. `calculator.js`, GES ve BESS sonucunu üretirken aynı sonuca `VitaEngine.calculateWater()` ile yağmur suyu ve gri su sonuçlarını ekler. `home-calculator.js` formdaki şehir, çatı alanı, elektrik tüketimi ve aylık su tüketimini bu ortak sözleşmeye aktarır.

## Yapılan doğruluk düzeltmesi

Web GES hesabında tasarım payı nedeniyle öz tüketim daha önce yıllık tüketimi aşabiliyordu. Sonuç artık `min(annualConsumption, annualProduction, calculatedSelfConsumption)` ile fiziksel yıllık tüketimle sınırlanır.

## Su hesap sözleşmesi

Yağmur suyu hesabı çatı alanı, yıllık yağış, çatı akış katsayısı ve ilk yıkama/taşma faktörünü kullanır. Kuşadası için Aydın MGM yıllık 660,6 mm değeri varsayılan olarak eşlenmiştir. Gri su hesabı aylık toplam su tüketiminden kaynak oranını ve işletilebilirlik faktörünü uygular. Kullanılabilir su miktarı yıllık taleple karşılaştırılır ve oran %100 ile sınırlandırılır.

## Test

`tests/vita-engine.test.js` şu kontrolleri yapar:

- Kuşadası yağış değerinin 660,6 mm olarak eşlenmesi
- 150 m² çatı için yağmur suyu hesabı
- Aylık 12 m³ tüketim için gri su hesabı
- GES öz tüketiminin yıllık tüketimi aşmaması
- Web GES ve su sonuçlarının adapter sonuçlarıyla eşleşmesi
- Sıfır alan girdisinin reddedilmesi

Çalıştırma:

```bash
node tests/vita-engine.test.js
node --check js/vita-engine.js
node --check js/calculator.js
node --check js/home-calculator.js
```

Bu entegrasyon ön fizibilite seviyesindedir. Nihai tasarım için gerçek saatlik/15 dakikalık elektrik profili, saha keşfi, aylık yağış-su dengesi, gerçek ASKİ tarifesi, depo hacmi ve tedarikçi teklifleri gereklidir.
