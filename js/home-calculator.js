/* Homepage hizli fizibilite — hesapla + lead mail */
(function () {
  'use strict';
  var form = document.getElementById('vitaHizliForm');
  if (!form) return;
  var btn = document.getElementById('hesaplaBtn');
  var resultBox = document.getElementById('sonucKutusu');
  var result = document.getElementById('sonucIcerik');

  function num(name) {
    var el = form.elements[name];
    if (!el) return 0;
    var v = Number(el.value);
    return Number.isFinite(v) ? v : 0;
  }

  function render(r) {
    if (!result || !resultBox) return;
    result.textContent = '';
    var rows = [
      ['Önerilen DC GES Gücü', r.solar.dcCapacityKwp.toLocaleString('tr-TR') + ' kWp'],
      ['Tahmini panel adedi', String(r.solar.panelCount)],
      ['Tahmini yıllık üretim', r.solar.annualProductionKwh.toLocaleString('tr-TR') + ' kWh'],
      ['Tahmini öz tüketim', r.solar.selfConsumptionKwh.toLocaleString('tr-TR') + ' kWh'],
      ['Şebekeye aktarım', r.solar.gridExportKwh.toLocaleString('tr-TR') + ' kWh'],
      ['Tahmini CO₂ azaltımı', r.solar.co2ReductionKg.toLocaleString('tr-TR') + ' kg/yıl']
    ];
    if (r.pricing && r.pricing.equipmentSubtotalUsd > 0) {
      rows.push(['Panel + inverter piyasa tahmini', r.pricing.equipmentSubtotalUsd.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' ' + r.pricing.currency + ' (KDV hariç)']);
    }
    var table = document.createElement('div');
    table.className = 'calc-results';
    rows.forEach(function (row) {
      var p = document.createElement('p');
      var strong = document.createElement('strong');
      strong.textContent = row[0] + ': ';
      p.appendChild(strong);
      p.appendChild(document.createTextNode(row[1]));
      table.appendChild(p);
    });
    result.appendChild(table);
    if (r.pricing && r.pricing.panel && r.pricing.inverter) {
      var priceNote = document.createElement('p');
      priceNote.className = 'calc-warning';
      priceNote.textContent = 'Fiyat katmanı: %' + r.pricing.markupPct + ' · ' +
        r.pricing.panel.quantity + ' × ' + r.pricing.panel.selectedPowerWp + ' Wp panel · ' +
        r.pricing.inverter.quantity + ' × ' + r.pricing.inverter.selectedPowerKw + ' kW inverter. ' +
        'Yalnızca panel + inverter ön tahminidir; diğer EPC kalemleri dahil değildir.';
      result.appendChild(priceNote);
    }
    if (r.bess && r.bess.recommended) {
      var b = document.createElement('p');
      var bs = document.createElement('strong');
      bs.textContent = 'BESS değerlendirmesi önerilir.';
      b.appendChild(bs);
      result.appendChild(b);
      if (r.bess.suggestedCapacityKwh > 0) {
        var bp = document.createElement('p');
        bp.textContent = 'Önerilen başlangıç batarya kapasitesi: ' + r.bess.suggestedCapacityKwh.toLocaleString('tr-TR') + ' kWh';
        result.appendChild(bp);
      }
    }
    if (r.water && r.water.rainfall && r.water.greywater) {
      var water = document.createElement('div');
      water.className = 'calc-water-results';
      water.innerHTML = '<p><strong>Yağmur suyu potansiyeli:</strong> ' + r.water.rainfall.annualUsableM3.toLocaleString('tr-TR') + ' m³/yıl · yaklaşık %' + r.water.rainfall.demandCoveragePct.toLocaleString('tr-TR') + ' su talebi karşılanabilir.</p>' +
        '<p><strong>Gri su potansiyeli:</strong> ' + r.water.greywater.annualUsableM3.toLocaleString('tr-TR') + ' m³/yıl · yaklaşık %' + r.water.greywater.demandCoveragePct.toLocaleString('tr-TR') + ' su talebi karşılanabilir.</p>';
      result.appendChild(water);
    }
    var a = document.createElement('div');
    a.className = 'calc-warning';
    a.textContent = r.warning + ' Varsayımlar: ' + r.assumptions.panelPowerWp + ' W panel, ' + r.assumptions.specificYieldKwhKwp + ' kWh/kWp·yıl, sistem kaybı ' + Math.round((1 - r.assumptions.systemLossFactor) * 100) + '%, PR ' + Math.round(r.assumptions.performanceRatio * 100) + '%, CO₂ ' + r.assumptions.co2FactorKgPerKwh + ' kg/kWh.';
    result.appendChild(a);

    var mailNote = document.createElement('p');
    mailNote.className = 'calc-warning';
    mailNote.id = 'calcMailNote';
    mailNote.textContent = 'İletişim bilgileriniz ekibe iletiliyor...';
    result.appendChild(mailNote);
    resultBox.style.display = 'block';
    try { resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
    var roof = num('cati_alani');
    var land = num('arazi_alani');
    var consumption = num('aylik_tuketim');
    var araziVar = form.elements.arazi_var ? form.elements.arazi_var.value === 'Evet' : land > 0;
    if (roof <= 0 && land <= 0) { if (result) result.textContent = 'Çatı veya arazi alanından en az birini 0’dan büyük girin.'; if (resultBox) resultBox.style.display = 'block'; return; }
    if (consumption < 0 || roof < 0 || land < 0) { if (result) result.textContent = 'Negatif değerler kabul edilmez.'; if (resultBox) resultBox.style.display = 'block'; return; }
    if (!window.VitavoltCalculator) { if (result) result.textContent = 'Hesaplama modülü yüklenemedi. Sayfayı yenileyip tekrar deneyin.'; if (resultBox) resultBox.style.display = 'block'; return; }
    if (window.VitavoltForms) window.VitavoltForms.setLoading(btn, true, 'Hesaplanıyor...');

    var calculateWithConfig = function(config) {
      var gece = num('gece_tuketim_payi');
      return window.VitavoltCalculator.calculate({
        roofAreaM2: roof, landAreaM2: land, landAvailable: araziVar,
        monthlyConsumptionKwh: consumption, nighttimeShare: gece > 0 ? gece / 100 : undefined,
        peakDemandKw: num('pik_talep_kw'), city: (form.elements.sehir && form.elements.sehir.value) || '',
        monthlyWaterM3: num('aylik_su_tuketim')
      }, config);
    };

    var configPromise = typeof window.VitavoltCalculator.loadConfig === 'function'
      ? window.VitavoltCalculator.loadConfig()
      : Promise.resolve(window.VitavoltCalculator.defaultConfig);

    configPromise.then(function(config) {
      var calc;
      try { calc = calculateWithConfig(config); render(calc); if (window.VitavoltForms) window.VitavoltForms.track('calculator_complete', { calculator: 'homepage' }); }
      catch (err) { if (result) result.textContent = 'Hesaplama sırasında bir sorun oluştu. Girdi alanlarını kontrol edin.'; if (resultBox) resultBox.style.display = 'block'; if (window.VitavoltForms) window.VitavoltForms.setLoading(btn, false); return; }

      var lead = {
        ad_soyad: (form.elements.ad_soyad && form.elements.ad_soyad.value) || '',
        telefon: (form.elements.telefon && form.elements.telefon.value) || '',
        email: (form.elements.email && form.elements.email.value) || '',
        sehir: (form.elements.sehir && form.elements.sehir.value) || '',
        tesis_tipi: (form.elements.tesis_tipi && form.elements.tesis_tipi.value) || '',
        cati_alani_m2: roof, arazi_alani_m2: land, aylik_tuketim_kwh: consumption,
        aylik_su_tuketim: (form.elements.aylik_su_tuketim && form.elements.aylik_su_tuketim.value) || '',
        onerilen_kwp: calc.solar.dcCapacityKwp, yillik_uretim_kwh: calc.solar.annualProductionKwh,
        co2_kg: calc.solar.co2ReductionKg,
        piyasa_panel_usd: calc.pricing ? calc.pricing.panel.sellUsd : 0,
        piyasa_inverter_usd: calc.pricing ? calc.pricing.inverter.sellUsd : 0,
        piyasa_panel_inverter_usd: calc.pricing ? calc.pricing.equipmentSubtotalUsd : 0,
        fiyat_katmani_pct: calc.pricing ? calc.pricing.markupPct : 0
      };
      var note = document.getElementById('calcMailNote');
      if (window.VitavoltForms && typeof window.VitavoltForms.submitPayload === 'function') {
        window.VitavoltForms.submitPayload(lead, {subject: 'Vitavolt — Ön fizibilite lead: ' + (lead.ad_soyad || 'İsimsiz'), formName: 'vitaHizliForm'})
          .then(function(r) { if (note) note.textContent = r.ok ? 'Talebiniz e-posta ile iletildi. En kısa sürede dönüş yapacağız.' : 'Sonuç hesaplandı. E-posta iletimi başarısız olduysa info@vitavoltglobal.com veya WhatsApp yazın.'; })
          .finally(function() { if (window.VitavoltForms) window.VitavoltForms.setLoading(btn, false); });
      } else { if (window.VitavoltForms) window.VitavoltForms.setLoading(btn, false); if (note) note.textContent = 'Sonuç hazır. İletişim: info@vitavoltglobal.com'; }
    }).catch(function() {
      if (result) result.textContent = 'Piyasa/veri konfigürasyonu yüklenemedi. Varsayılan VITA ayarlarıyla tekrar deneyin.';
      if (resultBox) resultBox.style.display = 'block';
      if (window.VitavoltForms) window.VitavoltForms.setLoading(btn, false);
    });
  });

  document.querySelectorAll('.faq-q').forEach(function (btnEl) {
    btnEl.addEventListener('click', function () { var item = this.parentElement; var open = item.classList.contains('open'); document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); }); if (!open) item.classList.add('open'); this.setAttribute('aria-expanded', String(!open)); });
  });
})();
