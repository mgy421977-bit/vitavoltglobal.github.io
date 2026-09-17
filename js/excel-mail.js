/* Vitavolt Global — hızlı fizibilite Excel eki | 2026-09-17 */
(function (window, document) {
  'use strict';

  function loadXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      s.onload = function () { resolve(window.XLSX); };
      s.onerror = function () { reject(new Error('Excel modülü yüklenemedi')); };
      document.head.appendChild(s);
    });
  }

  function parseLines(text) {
    return String(text || '').split(/\n+/).filter(Boolean).map(function (line) {
      return [line];
    });
  }

  function parseBom(text) {
    var rows = [['Kategori','Kalem','Miktar','Birim','Maliyet','Kaynak']];
    String(text || '').split(/\n+/).filter(Boolean).forEach(function (line) {
      var p = line.split(' | ');
      rows.push([p[0] || '', p[1] || '', p[2] || '', p[3] || '', p[4] || '', p[5] || '']);
    });
    return rows;
  }

  function buildWorkbook(X, payload) {
    var wb = X.utils.book_new();
    function add(name, rows) {
      var ws = X.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{wch:34},{wch:28},{wch:22},{wch:18},{wch:22},{wch:24}];
      X.utils.book_append_sheet(wb, ws, name);
    }

    add('Yönetici Özeti', [
      ['VITAVOLT GLOBAL — ÖN FİZİBİLİTE'],
      ['Müşteri', payload.ad_soyad || ''],
      ['E-posta', payload.email || ''],
      ['Telefon', payload.telefon || ''],
      ['Şehir', payload.sehir || ''],
      ['Tesis', payload.tesis_tipi || ''],
      ['GES', payload.onerilen_kwp || '', 'kWp'],
      ['Panel', payload.onerilen_kwp ? '' : '', ''],
      ['Yıllık üretim', payload.yillik_uretim_kwh || '', 'kWh/yıl'],
      ['CO₂ azaltımı', payload.co2_kg || '', 'kg/yıl'],
      ['Yağmur suyu', payload.yagmur_suyu_m3 || '', 'm³/yıl'],
      ['Gri su', payload.gri_su_m3 || '', 'm³/yıl']
    ]);

    add('Teknik Detaylar', [['Alan','Değer']].concat(parseLines(payload.teknik_detaylar)));
    add('BOM', parseBom(payload.bom_listesi));
    add('Yönetici Notları', [['Notlar']].concat(parseLines(payload.yonetici_ozeti)));
    add('Maliyet - İç', [['İç Hesap / Teklif'],[payload.maliyet_detayi || '']] );
    add('ANNE - MITOS', [['Değerlendirme']].concat(parseLines(payload.mitos_degerlendirme)));

    return wb;
  }

  function install() {
    if (!window.VitavoltForms || window.VitavoltForms.__excelMailInstalled) return;
    var original = window.VitavoltForms.submitPayload;
    window.VitavoltForms.submitPayload = function (payload, options) {
      options = options || {};
      if (options.formName !== 'vitaHizliForm') return original.call(window.VitavoltForms, payload, options);

      return loadXlsx().then(function (X) {
        var wb = buildWorkbook(X, payload || {});
        var bytes = X.write(wb, { bookType: 'xlsx', type: 'array' });
        var blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        var fd = new FormData();
        Object.keys(payload || {}).forEach(function (key) {
          if (key.charAt(0) !== '_') fd.append(key, payload[key] == null ? '' : String(payload[key]));
        });
        fd.append('_subject', options.subject || payload._subject || 'Vitavolt Global — Ön Fizibilite');
        fd.append('_template', 'table');
        fd.append('_captcha', 'false');
        fd.append('_source', 'vitavoltglobal.com');
        if (payload.email) {
          fd.append('_replyto', payload.email);
        }
        fd.append('attachment', blob, options.attachmentName || 'Vitavolt_On_Fizibilite.xlsx');

        return fetch(window.VitavoltForms.config.endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: fd
        }).then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return { ok: true, method: 'formsubmit', excel: true };
        });
      }).catch(function (err) {
        /* Excel eki oluşturulamazsa mevcut FormSubmit akışı yine çalışsın. */
        return original.call(window.VitavoltForms, payload, options);
      });
    };
    window.VitavoltForms.__excelMailInstalled = true;
  }

  var timer = setInterval(function () {
    if (window.VitavoltForms) { clearInterval(timer); install(); }
  }, 25);
})(window, document);
