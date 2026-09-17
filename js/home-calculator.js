/* Homepage hızlı fizibilite — VITA Engine single authority | build 2026-09-17-v3-water-bom */
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
    return (b || [])
      .map(function (x) {
        var cost =
          x.costStatus === 'PRICED' && x.totalCost != null
            ? ' | ' + money(x.totalCost)
            : x.costStatus === 'NOT_PRICED'
              ? ' | NOT_PRICED'
              : '';
        return x.category + ' | ' + x.item + ' | ' + x.quantity + ' ' + x.unit + cost + ' | ' + (x.source || '');
      })
      .join('\n');
  }
  function manager(r) {
    var p = r.pricing || {};
    var d = p.directCost || {};
    var m = p.directMaterial || {};
    var l = p.labor || {};
    var b = p.battery || {};
    var bos = p.bos || {};
    var w = r.water || {};
    var lines = [
      'VITA YÖNETİCİ ÖZETİ',
      'Engine: ' + ((r.engine && r.engine.version) || 'VITA') + ' | build ' + ((r.engine && r.engine.build) || ''),
      'GES: ' + r.solar.dcCapacityKwp + ' kWp | ' + r.solar.panelCount + ' panel | ' + r.solar.annualProductionKwh.toLocaleString('tr-TR') + ' kWh/yıl',
      'BESS: ' +
        (r.bess.recommended ? 'ön değerlendirmede öneriliyor' : 'ön değerlendirmede tetiklenmedi') +
        ' | talep ' +
        (b.requestedCapacityKwh != null ? b.requestedCapacityKwh : r.bess.suggestedCapacityKwh) +
        ' kWh | kurulu ' +
        (b.installedCapacityKwh != null ? b.installedCapacityKwh : b.installedKwh) +
        ' kWh | ' +
        (b.batteryModuleCount != null ? b.batteryModuleCount : b.units) +
        ' modül',
      'CO₂: ' + r.solar.co2ReductionKg + ' kg/yıl (factor ' + (r.solar.emissionFactor != null ? r.solar.emissionFactor : 0.42) + ' kg/kWh)',
      'DİREKT MALZEME: ' + money(m.baseUsd),
      'İŞÇİLİK: ' + money(l.baseUsd) + ' | ' + money(l.rateUsdPerPanel) + ' / panel × ' + l.panelCount + ' panel',
      'TOPLAM DİREKT MALİYET (Direct Cost): ' + money(d.baseUsd),
      'BOS/EPC ALLOWANCE (modeled, not in Direct Cost purchase lines): ' + money(bos.baseUsd),
      'PROJECT COST (direct + BOS model): ' + money(p.projectCost && p.projectCost.usd),
      'SALES PRICE (commercial layer %' + (p.markupPct || 15) + ' on Direct Cost): ' + money(p.salesPrice && p.salesPrice.usd),
      'Validation: ' + (r.validation && r.validation.ok ? 'OK' : 'CHECK')
    ];
    if (w.rainfall && w.rainfall.selected) lines.push('Yağmur suyu: ' + w.rainfall.annualUsableM3 + ' m³/yıl (seçili)');
    else lines.push('Yağmur suyu: seçilmedi / hesaplanmadı');
    if (w.greywater && w.greywater.selected) lines.push('Gri su: ' + w.greywater.annualUsableM3 + ' m³/yıl (seçili)');
    else lines.push('Gri su: seçilmedi / hesaplanmadı');
    lines.push('Not: Bu rapor ön fizibilitedir; nihai sistem tasarımı saha, tüketim ve teknik analiz sonrasında belirlenir.');
    return lines.join('\n');
  }
  function technical(r) {
    var p = r.pricing || {};
    var b = p.battery || {};
    return [
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
      'Gri su: ' + (r.water && r.water.greywater && r.water.greywater.selected ? r.water.greywater.annualUsableM3 + ' m3/yil' : 'secilmedi')
    ].join('\n');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (window.VitavoltForms) window.VitavoltForms.setLoading(btn, true, 'Hesaplanıyor...');
    if (!(window.VitaEngine && typeof window.VitaEngine.calculate === 'function')) {
      result.textContent = 'VITA Engine yüklenemedi. Sayfayı yenileyin.';
      box.style.display = 'block';
      if (window.VitavoltForms) window.VitavoltForms.setLoading(btn, false);
      return;
    }
    var roof = num('cati_alani');
    var land = num('arazi_alani');
    var cons = num('aylik_tuketim');
    var waterM = num('aylik_su_tuketim');
    var night = num('gece_tuketim_payi');
    var peak = num('pik_talep_kw');
    var city = (form.elements.sehir && form.elements.sehir.value) || '';
    var araziVar = form.elements.arazi_var && form.elements.arazi_var.value === 'Evet';
    var load = typeof window.VitaEngine.loadMarketData === 'function' ? window.VitaEngine.loadMarketData() : Promise.resolve();
    load
      .then(function () {
        var calc = window.VitaEngine.calculate({
          roofAreaM2: roof,
          landAreaM2: land,
          landAvailable: araziVar,
          annualConsumptionKwh: cons * 12,
          monthlyWaterM3: waterM,
          city: city,
          nighttimeShare: night ? night / 100 : undefined,
          peakDemandKw: peak || undefined,
          greywaterSelected: waterM > 0,
          rainwaterSelected: roof > 0
        });
        var p = calc.pricing || {};
        var d = p.directCost || {};
        var m = p.directMaterial || {};
        var l = p.labor || {};
        var pc = p.projectCost || {};
        result.innerHTML =
          '<p><strong>GES:</strong> ' +
          calc.solar.dcCapacityKwp +
          ' kWp · ' +
          calc.solar.panelCount +
          ' panel · ' +
          calc.solar.annualProductionKwh.toLocaleString('tr-TR') +
          ' kWh/yıl</p>' +
          '<p><strong>CO₂:</strong> ' +
          calc.solar.co2ReductionKg.toLocaleString('tr-TR') +
          ' kg/yıl</p>' +
          '<p><strong>Direct Cost:</strong> ' +
          money(d.baseUsd) +
          ' · <strong>Sales:</strong> ' +
          money(p.salesPrice && p.salesPrice.usd) +
          '</p>' +
          '<p style="color:#94a3b8;font-size:.85rem">' +
          calc.warning +
          '</p>';
        box.style.display = 'block';
        var lead = {
          ad_soyad: (form.elements.ad_soyad && form.elements.ad_soyad.value) || '',
          telefon: (form.elements.telefon && form.elements.telefon.value) || '',
          email: (form.elements.email && form.elements.email.value) || '',
          sehir: city,
          tesis_tipi: (form.elements.tesis_tipi && form.elements.tesis_tipi.value) || '',
          cati_alani_m2: roof,
          arazi_alani_m2: land,
          aylik_tuketim_kwh: cons,
          aylik_su_tuketim: waterM || '',
          yagmur_suyu_m3: calc.water && calc.water.rainfall && calc.water.rainfall.selected ? calc.water.rainfall.annualUsableM3 : '',
          gri_su_m3: calc.water && calc.water.greywater && calc.water.greywater.selected ? calc.water.greywater.annualUsableM3 : '',
          onerilen_kwp: calc.solar.dcCapacityKwp,
          yillik_uretim_kwh: calc.solar.annualProductionKwh,
          co2_kg: calc.solar.co2ReductionKg,
          piyasa_panel_usd: p.marketPanelUsd != null ? p.marketPanelUsd : (p.panel && p.panel.baseUsd) || 0,
          piyasa_inverter_usd: p.marketInverterUsd != null ? p.marketInverterUsd : (p.inverter && p.inverter.baseUsd) || 0,
          piyasa_panel_inverter_usd: p.marketPanelInverterUsd != null ? p.marketPanelInverterUsd : 0,
          vita_on_maliyet_usd: d.baseUsd || 0,
          vita_tahmini_fiyat_usd: (p.salesPrice && p.salesPrice.usd) || (p.commercialPrice && p.commercialPrice.usd) || 0,
          vita_maliyet_bazisi: pc.basis || 'user_catalog_plus_panel_labor',
          vita_referans_paket: '',
          vita_referans_teklif_usd: 0,
          vita_referans_maliyet_usd: 0,
          vita_referans_indirim_pct: 10,
          fiyat_katmani_pct: p.markupPct || 15,
          yonetici_ozeti: manager(calc),
          bom_listesi: bomText(p.bom),
          teknik_detaylar: technical(calc),
          maliyet_detayi:
            'Panel: ' +
            money(p.panel && p.panel.baseUsd) +
            ' | İnverter: ' +
            money(p.inverter && p.inverter.baseUsd) +
            ' | BESS: ' +
            money(p.battery && p.battery.baseUsd) +
            ' | İşçilik: ' +
            money(l.baseUsd) +
            ' | Direct Cost: ' +
            money(d.baseUsd) +
            ' | BOS: ' +
            money(p.bos && p.bos.baseUsd) +
            ' | Project: ' +
            money(pc.usd) +
            ' | Sales: ' +
            money(p.salesPrice && p.salesPrice.usd)
        };
        var note = document.getElementById('calcMailNote');
        if (window.VitavoltForms && typeof window.VitavoltForms.submitPayload === 'function') {
          return window.VitavoltForms
            .submitPayload(lead, {
              subject: 'VITA — Yönetici Özeti + BOM + Ön Fizibilite | ' + (lead.ad_soyad || 'İsimsiz'),
              formName: 'vitaHizliForm'
            })
            .then(function (x) {
              if (note) note.textContent = x.ok ? 'Yönetici özeti e-posta ile iletildi.' : 'Sonuç hesaplandı; e-posta sorunlu olabilir.';
            });
        }
      })
      .catch(function () {
        result.textContent = 'Hesaplama yüklenemedi. Sayfayı yenileyin.';
        box.style.display = 'block';
      })
      .finally(function () {
        if (window.VitavoltForms) window.VitavoltForms.setLoading(btn, false);
      });
  });
})();
