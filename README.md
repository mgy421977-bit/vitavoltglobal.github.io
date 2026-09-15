# Vitavolt Global

**Energy Infrastructure & Intelligence**

İzmir merkezli mühendislik ve enerji teknolojileri şirketi. Canlı site: [vitavoltglobal.com](https://vitavoltglobal.com)

> Enerji altyapısını veriden karara dönüştürüyoruz.
> Renewable Energy · BESS · Energy Intelligence · Carbon

---

## Konumlandırma

| Katman | Anlamı |
|--------|--------|
| **Vitavolt Global** | Gerçek enerji altyapısı: GES, BESS, EPC, karbon, su |
| **VITA** | Enerji verisi, hesaplama ve karar destek katmanı |
| **VITA Quick Feasibility** | Bugün çalışan tarayıcı tabanlı ön fizibilite (`calculator.js`) |
| **VITA Engine** | VITA'nın hesaplama ve veri sözleşmesi etrafında gelişen Energy Intelligence çekirdeği |
| **ANNE AI** | Concept / Development — bilişsel mimari ve AI araştırması |
| **VINCULUM** | Concept / Development — dağıtık/evolutionary swarm intelligence araştırma vizyonu |

Teknik kanıt (yayımlanan portföy): **7.264 kWp** — [Teknik Çalışmalar](https://vitavoltglobal.com/vaka-calismalari.html)

---

## VITA Engine — Technical Positioning

VITA Engine, Vitavolt Global'in enerji verisi, mühendislik hesapları ve karar destek metodolojisini ortak bir teknik sözleşme altında birleştirmeyi amaçlayan Energy Intelligence çekirdeğidir.

Web katmanı bugün GitHub Pages üzerinde çalışan statik HTML/CSS/JavaScript mimarisidir. `js/calculator.js` ve `js/vita-engine.js`, tarayıcı tarafında deterministik ön fizibilite hesaplamaları gerçekleştirir.

> **Teknik durum:** Sürekli eğitim (Continuous Training), saha verisiyle model güncelleme ve dinamik model ağırlıklarının üretim ortamına aktarılması VITA'nın hedeflenen/araştırılan mimarisidir. Mevcut public repository, bu training pipeline'ının üretim ortamında aktif olduğunu kanıtlayan bir model registry, training job veya reproducible training pipeline içermemektedir. Bu nedenle bu özellikler bugün canlı ürün kabiliyeti olarak sunulmaz.

Hedeflenen mimari:

`Field Data → Data Quality → Training / Research → Model Validation → Frozen Model Artifact → Web Inference → Verification → Decision Support`

`/database/` ve `/research/` klasörleri veri ve araştırma varlıklarının organizasyonu için kullanılan public bilgi katmanlarıdır; bunların otomatik continuous-training pipeline'ı olduğu iddiası ayrıca doğrulanmalıdır.

---

## AI Research Roadmap

### ANNE AI — Concept / Development

ANNE, enerji hesaplama motorunun kendisi değil; Vitavolt Research altında geliştirilen AGI-oriented open cognitive architecture araştırmasıdır.

Uzun vadeli araştırma yönleri:

- heterogeneous AI orchestration
- cognitive memory
- verification and agency controls
- **N-LINK:** graphene-based neural-interface hardware araştırma vizyonu
- insan–makine etkileşimi için yeni nesil bilişsel arayüzler

N-LINK bugün doğrulanmış bir ticari donanım ürünü değildir; Ar-Ge roadmap'idir.

### VINCULUM — Concept / Development

VINCULUM, dağıtık ve evolutionary swarm intelligence yaklaşımı üzerine araştırma vizyonudur.

Roadmap yönleri:

- GPS-independent coordination
- distributed swarm state
- decentralized communication
- adaptive collective behavior
- fault-tolerant swarm coordination
- heterogeneous autonomous-agent cooperation

VINCULUM bugün ticari olarak deploy edilmiş bir swarm-control ürünü olarak sunulmaz; araştırma ve geliştirme vizyonudur.

---

## Hizmetler (Altyapı)

- **GES** — çatı ve endüstriyel güneş
- **BESS** — batarya depolama
- **Endüstriyel EPC** — mühendislik, tedarik, uygulama
- **Karbon & ESG** — emisyon azaltımı, ETS/CBAM bilgilendirme, yeşil sertifika için teknik veri desteği
- **Su yönetimi** — yağmur suyu, gri su
- **VITA Quick Feasibility** — GES kapasite, üretim, CO₂, basit BESS önerisi

---

## Teknik portföy (özet)

| Konum | Tip | Kapasite |
|-------|-----|----------|
| Konya OSB | Çatı GES (alüminyum) | 1.300 kWp |
| Beyşehir | Çatı GES (mermer) | 1.100 kWp |
| Afyon OSB | GES | 3.000 kWp |
| Konya OSB | GES | 1.504 kWp |
| Kahramanmaraş OSB | GES | 360 kWp |
| **Toplam** | | **7.264 kWp** |

Çevresel metrikler tahmini/varsayımlıdır; proje özelinde netleşir.

Firma unvanları gizlilik nedeniyle yayımlanmaz.

### Validation Reference Dataset

Yayımlanan **7.264 kWp** teknik portföy, VITA Engine'in gelecekteki model validation çalışmaları için yapılandırılabilecek bir **Validation Reference Dataset** için teknik referans kaynağıdır.

**7.264 kWp toplamı tek başına bir AI doğruluk veya model başarı skoru değildir.** Formal validation için proje girdileri, mühendislik sonuçları, ölçüm verileri, zaman damgaları ve bağımsız değerlendirme metodolojisi gerekir.

---

## VITA

- **Canlı:** Quick Feasibility (çatı/arazi, kWp, üretim, öz tüketim, CO₂, basit BESS)
- **Roadmap / Planned:** Financial Analysis, BESS Intelligence, Carbon Intelligence, Scenario Analysis, Technical Verification
- **Research:** Continuous Training / Model Validation architecture
- **Anne AI:** Concept / Development
- **VINCULUM:** Concept / Development

Hub: [vita-energy-intelligence.html](https://vitavoltglobal.com/vita-energy-intelligence.html)

---

## Teknik Governance

- Doğrulanmamış KPI, sertifika, patent veya müşteri sayısı yayımlanmaz.
- Model doğrulama sonucu ile konsept/roadmap ayrıştırılır.
- Tahmini çevresel metrikler açıkça varsayım olarak belirtilir.
- AI kabiliyeti ancak kod, test, veri veya yayınlanmış teknik kanıtla destekleniyorsa canlı olarak tanımlanır.
- Araştırma hipotezleri ticari ürün gibi sunulmaz.

---

## Teknoloji

- Statik HTML / CSS / JS — GitHub Pages
- `js/calculator.js` + `js/home-calculator.js` — ön fizibilite
- `js/vita-engine.js` — browser-safe VITA Engine adapter
- Form lead → e-posta entegrasyonu
- TR / EN i18n (`js/translations.js`)

---

## Site haritası (özet)

- `/` — Ana sayfa + fizibilite
- `/services.html` — Altyapı
- `/vita-energy-intelligence.html` — VITA
- `/vaka-calismalari.html` — Teknik çalışmalar
- `/research/` — Araştırma
- `/blog/` — Insights
- `/contact.html` — İletişim

---

## İletişim

- **E-posta:** info@vitavoltglobal.com
- **Tel / WhatsApp:** +90 545 441 19 77
- **Adres:** Folkart Towers A Kule K.26 D.2601, Bayraklı / İzmir

Kuşadası ofis/şube olarak gösterilmez; İzmir merkezli, Ege’de hizmet.

---

## Katkı / deploy

```bash
# main branch → GitHub Pages → vitavoltglobal.com
```

**Kural:** Doğrulanmamış KPI, sertifika, patent, müşteri sayısı veya AI doğruluk skoru uydurulmaz. Roadmap açıkça Planned / Concept etiketlenir.
