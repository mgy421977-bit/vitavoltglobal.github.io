/* Homepage hızlı fizibilite — ANNE Core → VITA Engine | build 2026-09-17-anne-v2 */
(function () {
  'use strict';
  var form = document.getElementById('vitaHizliForm');
  if (!form) return;
  var btn = document.getElementById('hesaplaBtn');
  var box = document.getElementById('sonucKutusu');
  var result = document.getElementById('sonucIcerik');
  function num(k) {
    var e = form.elements[k];
    if (!e) return 0;
    var v = Number(e.value);
    return Number.isFinite(v) ? v : 0;
  }
  function money(v) {
    return Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
  }
  function bomText(b) {
    return (b || []).map(function (x) {
      var cost = x.costStatus === 'PRICED' && x.totalCost != null ? ' | ' + money(x.totalCost) : x.costStatus === 'NOT_PRICED' ? ' | NOT_PRICED' : '';
      return x.category + ' | ' + x.item + ' | ' + x.quantity + ' ' + x.unit + cost + ' | ' + (x.source || '');
    }).join('\n');
  }
  function manager(r) {
    var p = r.pricing || {}, d = p.directCost || {}, m = p.directMaterial || {}, l = p.labor || {}, b = p.battery || {}, bos = p.bos || {}, w = r.water || {}, a = r.anne || {};
    var lines = [
      'VITA YÖNETİCİ ÖZETİ',
      'ANNE Core: ' + (a.version || 'offline') + ' | VITA: ' + ((r.engine && r.engine.version) || 'VITA') + ' | build ' + ((r.engine && r.engine.build) || ''),
      'TESİS: ' + ((a.facility && a.facility.type) || 'belirtilmedi') + ' | Şehir: ' + ((a.facility && a.facility.city) || 'belirtilmedi'),
      'GES: ' + r.solar.dcCapacityKwp + ' kWp | ' + r.solar.panelCount + ' panel | ' + r.solar.annualProductionKwh.toLocaleString('tr-TR') + ' kWh/yıl',
      'BESS: ' + (r.bess.recommended ? 'ön değerlendirmede öneriliyor' : 'ön değerlendirmede tetiklenmedi') + ' | talep ' + (b.requestedCapacityKwh != null ? b.requestedCapacityKwh : r.bess.suggestedCapacityKwh) + ' kWh | kurulu ' + (b.installedCapacityKwh != null ? b.installedCapacityKwh : b.installedKwh) + ' kWh | ' + (b.batteryModuleCount != null ? b.batteryModuleCount : b.units) + ' modül',
      'CO₂: ' + r.solar.co2ReductionKg + ' kg/yıl (factor ' + (r.solar.emissionFactor != null ? r.solar.emissionFactor : 0.42) + ' kg/kWh)',
      'DİREKT MALZEME: ' + money(m.baseUsd),
      'İŞÇİLİK: ' + money(l.baseUsd) + ' | ' + money(l.rateUsdPerPanel) + ' / panel × ' + l.panelCount + ' panel',
      'TOPLAM DİREKT MALİYET: ' + money(d.baseUsd),
      'BOS/EPC ALLOWANCE: ' + money(bos.baseUsd),
      'PROJECT COST: ' + money(p.projectCost && p.projectCost.usd),
      'SALES PRICE: ' + money(p.salesPrice && p.salesPrice.usd),
      'Validation: ' + (r.validation && r.validation.ok ? 'OK' : 'CHECK'),
      'ANNE değerlendirme güveni: ' + (a.confidence || 'PRELIMINARY')
    ];
    if (w.rainfall && w.rainfall.selected) lines.push('Yağmur suyu: ' + w.rainfall.annualUsableM3 + ' m³/yıl (seçili)');
    else lines.push('Yağmur suyu: seçilmedi / hesaplanmadı');
    if (w.greywater && w.greywater.selected) lines.push('Gri su: ' + w.greywater.annualUsableM3 + ' m³/yıl (seçili)');
    else lines.push('Gri su: seçilmedi / hesaplanmadı');
    if (a.optimizationFactors && a.optimizationFactors.length) lines.push('ANNE optimizasyon alanları: ' + a.optimizationFactors.map(function (x) { return x.label; }).join(', '));
    if (a.missingData && a.missingData.length) lines.push('ANNE eksik veri: ' + a.missingData.map(function (x) { return x.label; }).join(', '));
    lines.push('Not: Bu rapor ön fizibilitedir; nihai sistem tasarımı saha, tüketim ve teknik analiz sonrasında belirlenir.');
    return lines.join('\n');
  }
  function technical(r) {
    var p = r.pricing || {}, b = p.battery || {}, a = r.anne || {};
    return [
      'ANNE assessment: ' + (a.confidence || 'OFFLINE_ASSESSMENT'),
      'GES kWp: ' + r.solar.dcCapacityKwp,
      'Panel adedi: ' + r.solar.panelCount,
      'Panel Wp: ' + (r.assumptions && r.assumptions.panelPowerWp),
      'Yıllık üretim kWh: ' + r.solar.annualProductionKwh,
      'Öz tüketim kWh: ' + r.solar.selfConsumptionKwh,
      'Şebeke ihracı kWh: ' + r.solar.gridExportKwh,
      'CO₂ kg/yıl: ' + r.solar.co2ReductionKg,
      'BESS talep kWh: ' + (b.requestedCapacityKwh != null ? b.requestedCapacityKwh : r.bess.suggestedCapacityKwh),
      'BESS kurulu kWh: ' + (b.installedCapacityKwh != null ? b.installedCapacityKwh : ''),
      'BESS modül adedi: ' + (b.batteryModuleCount != null ? b.batteryModuleCount : b.units),
      'DoD: ' + r.bess.depthOfDischarge,
      'RTE: ' + r.bess.roundTripEfficiency,
      'Inverter: ' + (p.inverter && p.inverter.powerKw) + ' kW x' + (p.inverter && p.inverter.count) + ' (' + (p.inverter && p.inverter.selectionReason) + ')',
      'Yağmur suyu: ' + (r.water && r.water.rainfall && r.water.rainfall.selected ? r.water.rainfall.annualUsableM3 + ' m3/yil' : 'secilmedi'),
      'Gri su: ' + (r.water && r.water.greywater && r.water.greywater.selected ? r.water.greywater.annualUsableM3 + ' m3/yil' : 'secilmedi'),
      'ANNE optimizasyon faktörleri: ' + (a.optimizationFactors || []).map(function (x) { return x.id; }).join(', '),
      'ANNE regulation status: ' + (a.regulation && a.regulation.status)
    ].join('\n');
  }
  function ensureAnneCore() {
    if (window.AnneCore && typeof window.AnneCore.assess === 'function') return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'js/anne-core.js?v=2026-09-17-anne-v2';
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('ANNE Core yüklenemedi')); };
      document.head.appendChild(s);
    });
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (window.VitavoltForms) window.VitavoltForms.setLoading(btn, true, 'Hesaplanıyor...');
    var roof = num('cati_alani'), land = num('arazi_alani'), cons = num('aylik_tuketim'), waterM = num('aylik_su_tuketim'), night = num('gece_tuketim_payi'), peak = num('pik_talep_kw');
    var city = (form.elements.sehir && form.elements.sehir.value) || '';
    var facilityType = (form.elements.tesis_tipi && form.elements.tesis_tipi.value) || '';
    var araziVar = form.elements.arazi_var && form.elements.arazi_var.value === 'Evet';
    var load = typeof window.VitaEngine.loadMarketData === 'function' ? window.VitaEngine.loadMarketData() : Promise.resolve();
    Promise.all([load, ensureAnneCore()]).then(function () {
      var calc = window.AnneCore.assess({
        roofAreaM2: roof,
        landAreaM2: land,
        landAvailable: araziVar,
        annualConsumptionKwh: cons * 12,
        monthlyConsumptionKwh: cons,
        monthlyWaterM3: waterM,
        city: city,
        facilityType: facilityType,
        tesisTipi: facilityType,
        nighttimeShare: night ? night / 100 : undefined,
        peakDemandKw: peak || undefined,
        greywaterSelected: waterM > 0,
        rainwaterSelected: roof > 0
      });
      if (!calc.anne || calc.anne.status !== 'ANNE_VITA_VALIDATED') throw new Error('ANNE Core doğrulama zinciri tamamlanamadı');
      var p = calc.pricing || {}, d = p.directCost || {};
      result.innerHTML = '<p><strong>GES:</strong> ' + calc.solar.dcCapacityKwp + ' kWp · ' + calc.solar.panelCount + ' panel · ' + calc.solar.annualProductionKwh.toLocaleString('tr-TR') + ' kWh/yıl</p>' +
        '<p><strong>CO₂:</strong> ' + calc.solar.co2ReductionKg.toLocaleString('tr-TR') + ' kg/yıl</p>' +
        '<p><strong>Direct Cost:</strong> ' + money(d.baseUsd) + ' · <strong>Sales:</strong> ' + money(p.salesPrice && p.salesPrice.usd) + '</p>' +
        '<p><strong>ANNE:</strong> ' + (calc.anne && calc.anne.status) + ' · ' + (calc.anne && calc.anne.confidence) + '</p>' +
        '<p style="color:#94a3b8;font-size:.85rem">' + calc.warning + '</p>';
      box.style.display = 'block';
      var lead = {
        ad_soyad: (form.elements.ad_soyad && form.elements.ad_soyad.value) || '', telefon: (form.elements.telefon && form.elements.telefon.value) || '', email: (form.elements.email && form.elements.email.value) || '', sehir: city, tesis_tipi: facilityType,
        cati_alani_m2: roof, arazi_alani_m2: land, aylik_tuketim_kwh: cons, aylik_su_tuketim: waterM || '',
        yagmur_suyu_m3: calc.water && calc.water.rainfall && calc.water.rainfall.selected ? calc.water.rainfall.annualUsableM3 : '',
        gri_su_m3: calc.water && calc.water.greywater && calc.water.greywater.selected ? calc.water.greywater.annualUsableM3 : '',
        onerilen_kwp: calc.solar.dcCapacityKwp, yillik_uretim_kwh: calc.solar.annualProductionKwh, co2_kg: calc.solar.co2ReductionKg,
        piyasa_panel_usd: p.marketPanelUsd != null ? p.marketPanelUsd : (p.panel && p.panel.baseUsd) || 0,
        piyasa_inverter_usd: p.marketInverterUsd != null ? p.marketInverterUsd : (p.inverter && p.inverter.baseUsd) || 0,
        piyasa_panel_inverter_usd: p.marketPanelInverterUsd != null ? p.marketPanelInverterUsd : 0,
        vita_on_maliyet_usd: d.baseUsd || 0, vita_tahmini_fiyat_usd: (p.salesPrice && p.salesPrice.usd) || (p.commercialPrice && p.commercialPrice.usd) || 0,
        vita_maliyet_bazisi: p.projectCost && p.projectCost.basis ? p.projectCost.basis : 'user_catalog_plus_panel_labor', vita_referans_paket: '', vita_referans_teklif_usd: 0, vita_referans_maliyet_usd: 0, vita_referans_indirim_pct: 10, fiyat_katmani_pct: p.markupPct || 15,
        yonetici_ozeti: manager(calc), bom_listesi: bomText(p.bom), teknik_detaylar: technical(calc),
        maliyet_detayi: 'Panel: ' + money(p.panel && p.panel.baseUsd) + ' | İnverter: ' + money(p.inverter && p.inverter.baseUsd) + ' | BESS: ' + money(p.battery && p.battery.baseUsd) + ' | İşçilik: ' + money(p.labor && p.labor.baseUsd) + ' | Direct Cost: ' + money(d.baseUsd) + ' | BOS: ' + money(p.bos && p.bos.baseUsd) + ' | Project: ' + money(p.projectCost && p.projectCost.usd) + ' | Sales: ' + money(p.salesPrice && p.salesPrice.usd)
      };
      var note = document.getElementById('calcMailNote');
      if (window.VitavoltForms && typeof window.VitavoltForms.submitPayload === 'function') return window.VitavoltForms.submitPayload(lead, { subject: 'VITA — Yönetici Özeti + BOM + Ön Fizibilite | ' + (lead.ad_soyad || 'İsimsiz'), formName: 'vitaHizliForm' }).then(function (x) { if (note) note.textContent = x.ok ? 'Yönetici özeti e-posta ile iletildi.' : 'Sonuç hesaplandı; e-posta sorunlu olabilir.'; });
    }).catch(function (err) {
      result.textContent = err && err.message ? err.message : 'Hesaplama yüklenemedi. Sayfayı yenileyin.';
      box.style.display = 'block';
    }).finally(function () { if (window.VitavoltForms) window.VitavoltForms.setLoading(btn, false); });
  });
})();
