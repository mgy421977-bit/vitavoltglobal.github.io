/* Homepage hizli fizibilite calculator */
(function(){
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
    var table = document.createElement('div');
    table.className = 'calc-results';
    rows.forEach(function(row) {
      var p = document.createElement('p');
      var strong = document.createElement('strong');
      strong.textContent = row[0] + ': ';
      p.appendChild(strong);
      p.appendChild(document.createTextNode(row[1]));
      table.appendChild(p);
    });
    result.appendChild(table);
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
    var a = document.createElement('div');
    a.className = 'calc-warning';
    a.textContent = r.warning + ' Varsayımlar: ' + r.assumptions.panelPowerWp + ' W panel, ' +
      r.assumptions.specificYieldKwhKwp + ' kWh/kWp·yıl, sistem kaybı ' +
      Math.round((1 - r.assumptions.systemLossFactor) * 100) + '%, PR ' +
      Math.round(r.assumptions.performanceRatio * 100) + '%, CO₂ ' +
      r.assumptions.co2FactorKgPerKwh + ' kg/kWh.';
    result.appendChild(a);
    resultBox.style.display = 'block';
    try { resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;

    var roof = num('cati_alani');
    var land = num('arazi_alani');
    var consumption = num('aylik_tuketim');
    var araziVar = form.elements.arazi_var ? form.elements.arazi_var.value === 'Evet' : land > 0;

    if (roof <= 0 && land <= 0) {
      if (result) { result.textContent = 'Çatı veya arazi alanından en az birini 0’dan büyük girin.'; }
      if (resultBox) resultBox.style.display = 'block';
      return;
    }
    if (consumption < 0 || roof < 0 || land < 0) {
      if (result) { result.textContent = 'Negatif değerler kabul edilmez.'; }
      if (resultBox) resultBox.style.display = 'block';
      return;
    }

    if (!window.VitavoltCalculator) {
      if (result) result.textContent = 'Hesaplama modülü yüklenemedi. Sayfayı yenileyip tekrar deneyin.';
      if (resultBox) resultBox.style.display = 'block';
      return;
    }

    if (window.VitavoltForms) window.VitavoltForms.setLoading(btn, true, 'Hesaplanıyor...');

    try {
      var gece = num('gece_tuketim_payi');
      var calc = window.VitavoltCalculator.calculate({
        roofAreaM2: roof,
        landAreaM2: land,
        landAvailable: araziVar,
        monthlyConsumptionKwh: consumption,
        nighttimeShare: gece > 0 ? gece / 100 : undefined,
        peakDemandKw: num('pik_talep_kw')
      }, window.VitavoltCalculator.defaultConfig);
      render(calc);
      if (window.VitavoltForms) window.VitavoltForms.track('calculator_complete', { calculator: 'homepage' });
    } catch (err) {
      if (result) result.textContent = 'Hesaplama sırasında bir sorun oluştu. Girdi alanlarını kontrol edin.';
      if (resultBox) resultBox.style.display = 'block';
      if (window.VitavoltForms) window.VitavoltForms.track('calculator_error', { calculator: 'homepage' });
    } finally {
      if (window.VitavoltForms) window.VitavoltForms.setLoading(btn, false);
    }
  });

  document.querySelectorAll('.faq-q').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = this.parentElement;
      var open = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); });
      if (!open) item.classList.add('open');
      this.setAttribute('aria-expanded', String(!open));
    });
  });
})();
