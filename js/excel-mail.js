/* Vitavolt Global — hızlı fizibilite Excel eki + müşteri teyidi | 2026-09-17 */
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
    var rows = [['Kategori','Kalem','Miktar','Birim','Birim Maliyet','Toplam Maliyet','Kaynak','Durum']];
    String(text || '').split(/\n+/).filter(Boolean).forEach(function (line) {
      var p = line.split(' | ');
      rows.push([
        p[0] || '', p[1] || '', p[2] || '', p[3] || '',
        p[4] || '', p[5] || '', p[6] || '', p[7] || ''
      ]);
    });
    return rows;
  }

  function buildWorkbook(X, payload) {
    var wb = X.utils.book_new();
    function add(name, rows) {
      var ws = X.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        {wch:28},{wch:34},{wch:18},{wch:16},
        {wch:20},{wch:20},{wch:24},{wch:22}
      ];
      X.utils.book_append_sheet(wb, ws, name);
    }

    add('Yönetici Özeti', [
      ['VITAVOLT GLOBAL — ÖN FİZİBİLİTE'],
      ['Müşteri', payload.ad_soyad || ''],
      ['E-posta', payload.email || ''],
      ['Telefon', payload.telefon || ''],
      ['Şehir', payload.sehir || ''],
      ['Tesis', payload.tesis_tipi || ''],
      ['Çatı', payload.cati_alani || '', 'm²'],
      ['Arazi', payload.arazi_alani || '', 'm²'],
      ['Aylık tüketim', payload.aylik_tuketim || '', 'kWh/ay'],
      ['GES', payload.onerilen_kwp || '', 'kWp'],
      ['Panel adedi', payload.panel_adedi || '', 'adet'],
      ['Panel gücü', payload.panel_wp || '', 'Wp'],
      ['İnverter', payload.inverter_guc_kw || '', 'kW'],
      ['İnverter adedi', payload.inverter_adedi || '', 'adet'],
      ['BESS', payload.bess_kwh || '', 'kWh'],
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

  function hiddenFrame(name) {
    var iframe = document.createElement('iframe');
    iframe.name = name;
    iframe.style.position = 'fixed';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);
    return iframe;
  }

  function nativeMultipartSubmit(payload, blob, filename) {
    return new Promise(function (resolve, reject) {
      var frameName = 'vvMailFrame_' + Date.now();
      var iframe = hiddenFrame(frameName);
      var form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://formsubmit.co/info@vitavoltglobal.com';
      form.enctype = 'multipart/form-data';
      form.target = frameName;
      form.style.display = 'none';

      function add(name, value) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value == null ? '' : String(value);
        form.appendChild(input);
      }

      Object.keys(payload || {}).forEach(function (key) {
        if (key.charAt(0) !== '_') add(key, payload[key]);
      });
      add('_subject', 'Vitavolt Global — Ön Fizibilite + Excel');
      add('_template', 'table');
      add('_captcha', 'false');
      add('_source', 'vitavoltglobal.com');
      add('_page', window.location.href);
      if (payload.email) add('_replyto', payload.email);

      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.name = 'attachment';
      try {
        var dt = new DataTransfer();
        dt.items.add(new File([blob], filename, {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }));
        fileInput.files = dt.files;
      } catch (e) {
        document.body.removeChild(iframe);
        reject(e);
        return;
      }
      form.appendChild(fileInput);
      document.body.appendChild(form);

      var settled = false;
      function finish(ok) {
        if (settled) return;
        settled = true;
        try { form.remove(); } catch (_) {}
        setTimeout(function () { try { iframe.remove(); } catch (_) {} }, 1500);
        if (ok) resolve({ ok: true, method: 'formsubmit-native', excel: true });
        else reject(new Error('FormSubmit native gönderimi başarısız')); 
      }
      iframe.addEventListener('load', function () { finish(true); }, { once: true });
      setTimeout(function () { finish(true); }, 7000);
      try { form.submit(); } catch (e) { finish(false); }
    });
  }

  function sendCustomerConfirmation(payload) {
    var email = payload && payload.email;
    if (!email) return Promise.resolve({ ok: false, skipped: true });

    var safe = {
      name: payload.ad_soyad || '',
      email: email,
      phone: payload.telefon || '',
      city: payload.sehir || '',
      facility: payload.tesis_tipi || '',
      feasibility_status: 'Ön fizibilite talebiniz alınmıştır. Teknik ekip değerlendirmesinin ardından tarafınıza dönüş yapılacaktır.',
      _subject: 'Vitavolt Global — Ön Fizibilite Talebiniz Alındı',
      _cc: email,
      _template: 'table',
      _captcha: 'false',
      _source: 'vitavoltglobal.com'
    };

    return fetch('https://formsubmit.co/ajax/info@vitavoltglobal.com', {
      method: 'POST',
      headers: {'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify(safe)
    }).then(function (res) {
      return { ok: res.ok, method: 'formsubmit-cc' };
    }).catch(function () {
      return { ok: false, method: 'formsubmit-cc' };
    });
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
        var filename = options.attachmentName || 'Vitavolt_On_Fizibilite.xlsx';

        return nativeMultipartSubmit(payload || {}, blob, filename).then(function (mailResult) {
          return sendCustomerConfirmation(payload || {}).then(function (customerResult) {
            return {
              ok: true,
              method: mailResult.method,
              excel: true,
              customerConfirmation: !!customerResult.ok
            };
          });
        });
      }).catch(function (err) {
        /* Excel gönderimi başarısız olursa mevcut veri e-postası yine gönderilir. */
        return original.call(window.VitavoltForms, payload, options).then(function (fallback) {
          return Object.assign({}, fallback, { excel: false, error: String(err && err.message || err) });
        });
      });
    };
    window.VitavoltForms.__excelMailInstalled = true;
  }

  var timer = setInterval(function () {
    if (window.VitavoltForms) { clearInterval(timer); install(); }
  }, 25);
})(window, document);
