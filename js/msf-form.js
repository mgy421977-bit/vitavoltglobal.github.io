/* Vitavolt Global — Multi-step feasibility form (Vanilla JS, no jQuery) */
(function () {
  'use strict';

  var form = document.getElementById('msfForm');
  if (!form) return;

  var panels = Array.prototype.slice.call(form.querySelectorAll('.msf-panel'));
  var steps = Array.prototype.slice.call(document.querySelectorAll('#msfSteps .msf-step'));
  var progressBar = document.getElementById('msfProgressBar');
  var statusEl = document.getElementById('msfStatus');
  var submitBtn = document.getElementById('msfSubmit');
  var current = 1;
  var total = panels.length;

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.className = 'msf-status' + (type ? ' is-' + type : '');
  }

  function clearErrors() {
    form.querySelectorAll('.msf-error').forEach(function (el) {
      el.hidden = true;
      el.textContent = '';
    });
    form.querySelectorAll('.msf-input.is-invalid').forEach(function (el) {
      el.classList.remove('is-invalid');
    });
  }

  function showError(name, message) {
    var el = form.querySelector('[data-error-for="' + name + '"]');
    if (el) {
      el.textContent = message;
      el.hidden = false;
    }
    var input = form.querySelector('[name="' + name + '"]');
    if (input && input.classList && input.type !== 'radio' && input.type !== 'checkbox') {
      input.classList.add('is-invalid');
    }
  }

  function goTo(step) {
    current = step;
    panels.forEach(function (panel) {
      var n = Number(panel.getAttribute('data-panel'));
      var active = n === current;
      panel.classList.toggle('is-active', active);
      if (active) {
        panel.removeAttribute('hidden');
        panel.style.display = '';
      } else {
        panel.setAttribute('hidden', 'hidden');
        panel.style.display = 'none';
      }
    });
    steps.forEach(function (s) {
      var n = Number(s.getAttribute('data-step'));
      s.classList.toggle('is-active', n === current);
      s.classList.toggle('is-done', n < current);
    });
    if (progressBar) {
      progressBar.style.width = ((current / total) * 100).toFixed(2) + '%';
    }
    setStatus('');
    var first = form.querySelector('.msf-panel.is-active input:not([type="radio"]):not([type="checkbox"]), .msf-panel.is-active input[type="radio"]');
    if (first) {
      window.setTimeout(function () { try { first.focus(); } catch (e) {} }, 40);
    }
  }

  function validateStep(step) {
    clearErrors();
    var ok = true;

    if (step === 1) {
      var tip = form.querySelector('input[name="kurulum_tipi"]:checked');
      if (!tip) {
        showError('kurulum_tipi', 'Kurulum tipini seçin.');
        ok = false;
      }
      var cati = Number(form.elements.cati_m2 && form.elements.cati_m2.value) || 0;
      var arazi = Number(form.elements.arazi_m2 && form.elements.arazi_m2.value) || 0;
      if (cati < 0 || arazi < 0) {
        showError('alan', 'Alan değerleri negatif olamaz.');
        ok = false;
      } else if (cati === 0 && arazi === 0) {
        showError('alan', 'Çatı veya arazi alanından en az birini girin.');
        ok = false;
      } else if (tip) {
        if (tip.value === 'cati' && cati <= 0) {
          showError('alan', 'Çatı GES için çatı alanını girin.');
          ok = false;
        }
        if (tip.value === 'arazi' && arazi <= 0) {
          showError('alan', 'Arazi GES için arazi alanını girin.');
          ok = false;
        }
      }
    }

    if (step === 2) {
      var val = Number(form.elements.aylik_tuketim && form.elements.aylik_tuketim.value);
      if (!form.elements.aylik_tuketim.value || !Number.isFinite(val) || val <= 0) {
        showError('aylik_tuketim', 'Geçerli bir aylık tüketim / fatura değeri girin.');
        ok = false;
      }
    }

    if (step === 3) {
      var ad = (form.elements.ad_soyad.value || '').trim();
      if (ad.length < 2) {
        showError('ad_soyad', 'Ad soyad girin.');
        ok = false;
      }
      var tel = (form.elements.telefon.value || '').replace(/\s/g, '');
      if (tel.length < 10) {
        showError('telefon', 'Geçerli bir telefon numarası girin.');
        ok = false;
      }
      var mail = (form.elements.eposta.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        showError('eposta', 'Geçerli bir e-posta adresi girin.');
        ok = false;
      }
      if (!form.elements.kvkk_consent.checked) {
        showError('kvkk_consent', 'Devam etmek için KVKK bilgilendirmesini onaylayın.');
        ok = false;
      }
    }

    return ok;
  }

  form.querySelectorAll('input[name="tuketim_birim"]').forEach(function (r) {
    r.addEventListener('change', function () {
      var hint = document.getElementById('tuketimHint');
      if (!hint) return;
      hint.textContent = r.value === 'tl'
        ? 'Aylık ortalama elektrik faturanızı TL cinsinden girin.'
        : 'Aylık elektrik tüketiminizi kWh cinsinden girin.';
    });
  });

  form.querySelectorAll('[data-next]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!validateStep(current)) return;
      if (current < total) goTo(current + 1);
    });
  });

  form.querySelectorAll('[data-prev]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (current > 1) goTo(current - 1);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(3)) return;

    var tipEl = form.querySelector('input[name="kurulum_tipi"]:checked');
    var birimEl = form.querySelector('input[name="tuketim_birim"]:checked');
    var data = {
      kurulum_tipi: tipEl ? tipEl.value : '',
      cati_m2: form.elements.cati_m2.value,
      arazi_m2: form.elements.arazi_m2.value,
      tuketim_birim: birimEl ? birimEl.value : 'kwh',
      aylik_tuketim: form.elements.aylik_tuketim.value,
      aylik_su_tuketim: (form.elements.aylik_su_tuketim && form.elements.aylik_su_tuketim.value) || '',
      ad_soyad: form.elements.ad_soyad.value.trim(),
      telefon: form.elements.telefon.value.trim(),
      eposta: form.elements.eposta.value.trim()
    };

    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'lead_form_submit', { form: 'multi_step_feasibility' });
      }
      if (window.VitavoltForms && typeof window.VitavoltForms.track === 'function') {
        window.VitavoltForms.track('lead_form_submit', { form: 'msf', method: 'mailto' });
      }
    } catch (_) {}

    if (window.VitavoltForms && typeof window.VitavoltForms.submitForm === 'function') {
      window.VitavoltForms.submitForm(form, {
        button: submitBtn,
        statusElement: statusEl,
        loadingLabel: 'Gönderiliyor...',
        successMessage: 'Talebiniz alındı. En kısa sürede dönüş yapacağız.',
        mailtoMessage: 'E-posta taslağınız hazırlanıyor.'
      });
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    setStatus('E-posta taslağı hazırlanıyor...', 'success');
    var body = [
      'Kurulum tipi: ' + data.kurulum_tipi,
      'Çatı (m²): ' + data.cati_m2,
      'Arazi (m²): ' + data.arazi_m2,
      'Tüketim: ' + data.aylik_tuketim + ' (' + data.tuketim_birim + ')'
    ];
    if (data.aylik_su_tuketim) body.push('Aylık su: ' + data.aylik_su_tuketim);
    body.push('', 'Ad Soyad: ' + data.ad_soyad, 'Telefon: ' + data.telefon, 'E-posta: ' + data.eposta);
    body = body.join('\n');
    window.location.href =
      'mailto:info@vitavoltglobal.com' +
      '?subject=' + encodeURIComponent('Ön fizibilite talebi — ' + data.ad_soyad) +
      '&body=' + encodeURIComponent(body);
    if (submitBtn) submitBtn.disabled = false;
  });

  document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
    function mark() { img.classList.add('is-loaded'); }
    if (img.complete) mark();
    else img.addEventListener('load', mark, { once: true });
  });

  goTo(1);
})();
