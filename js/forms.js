/* Vitavolt Global — Reusable client-side form helpers (production-ready modular) */
(function (window, document) {
  'use strict';

  /**
   * Config for form backend.
   * Set FORM_ENDPOINT to a real secure endpoint (e.g. Formspree, custom API, Netlify Forms)
   * when available. Leave empty/null to use mailto fallback.
   * NEVER put API keys or secrets in this file or any frontend code.
   */
  var FORM_CONFIG = {
    endpoint: null, // e.g. 'https://formspree.io/f/xxxxxx' or your API
    method: 'POST',
    mailtoFallback: true,
    mailtoAddress: 'info@vitavoltglobal.com'
  };

  function validate(form) {
    if (!form) return false;
    if (typeof form.reportValidity === 'function' && !form.reportValidity()) return false;
    return true;
  }

  function setLoading(button, loading, label) {
    if (!button) return;
    if (loading) {
      if (!button.dataset.originalLabel) {
        button.dataset.originalLabel = button.textContent.trim();
      }
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = label || 'Gönderiliyor...';
    } else {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      if (button.dataset.originalLabel) {
        button.textContent = button.dataset.originalLabel;
      }
    }
  }

  function status(element, message, type) {
    if (!element) return;
    element.textContent = message || '';
    element.className = 'form-status' + (type ? ' is-' + type : '');
    element.setAttribute('role', type === 'error' ? 'alert' : 'status');
    if (type === 'error' || type === 'success') {
      element.focus && element.focus();
    }
  }

  function track(name, params) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, params || {});
      }
      if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
        window.dataLayer.push(Object.assign({ event: name }, params || {}));
      }
    } catch (_) {
      // Analytics must never block form flow.
    }
  }

  /**
   * Serialize form to plain object (safe, no files assumed for contact).
   */
  function formToObject(form) {
    var data = new FormData(form);
    var obj = {};
    data.forEach(function (value, key) {
      obj[key] = typeof value === 'string' ? value.trim() : value;
    });
    return obj;
  }

  /**
   * Build a readable mailto body from form data.
   */
  function buildMailto(form, options) {
    options = options || {};
    var data = formToObject(form);
    var lang = document.documentElement.lang || 'tr';
    var isEn = lang === 'en';
    var labels = isEn
      ? { subject: 'Vitavolt Global project inquiry', name: 'Full name', company: 'Company', phone: 'Phone', email: 'Email', service: 'Service', details: 'Project details', missing: 'Not provided', city: 'City' }
      : { subject: 'Vitavolt Global proje talebi', name: 'Ad Soyad', company: 'Şirket', phone: 'Telefon', email: 'E-posta', service: 'Hizmet', details: 'Proje detayları', missing: 'Belirtilmedi', city: 'Şehir' };

    var serviceText = data.service || '';
    try {
      var sel = form.querySelector('[name="service"]');
      if (sel && sel.options && sel.selectedIndex >= 0) {
        serviceText = sel.options[sel.selectedIndex].textContent.trim();
      }
    } catch (_) {}

    var subject = labels.subject + (serviceText ? ' — ' + serviceText : '');
    var lines = [
      labels.name + ': ' + (data.name || labels.missing),
      labels.company + ': ' + (data.company || labels.missing),
      labels.phone + ': ' + (data.phone || labels.missing),
      labels.email + ': ' + (data.email || labels.missing),
      labels.service + ': ' + (serviceText || labels.missing)
    ];
    if (data.city) lines.push(labels.city + ': ' + data.city);
    lines.push('');
    lines.push(labels.details + ':');
    lines.push(data.message || data.details || labels.missing);

    var body = lines.join('\n');
    var address = options.to || FORM_CONFIG.mailtoAddress;
    return 'mailto:' + address +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }

  /**
   * Submit handler that prefers real endpoint, falls back to mailto.
   * Returns a Promise.
   */
  function submitForm(form, options) {
    options = options || {};
    var btn = options.button || form.querySelector('[type="submit"]');
    var statusEl = options.statusElement || form.querySelector('.form-status');
    var loadingLabel = options.loadingLabel || 'Gönderiliyor...';

    if (!validate(form)) {
      status(statusEl, options.invalidMessage || 'Lütfen zorunlu alanları kontrol edin.', 'error');
      track('lead_form_validation_error', { form: form.id || 'unknown' });
      return Promise.resolve({ ok: false, reason: 'validation' });
    }

    // Optional KVKK / consent check
    var consent = form.querySelector('[name="kvkk_consent"], [name="privacy_consent"]');
    if (consent && !consent.checked) {
      status(statusEl, options.consentMessage || 'Devam etmek için KVKK bilgilendirme metnini onaylamanız gerekir.', 'error');
      track('lead_form_consent_missing', { form: form.id || 'unknown' });
      return Promise.resolve({ ok: false, reason: 'consent' });
    }

    setLoading(btn, true, loadingLabel);
    track('lead_form_submit_start', { form: form.id || 'unknown' });

    var payload = formToObject(form);
    payload._source = 'vitavoltglobal-web';
    payload._page = window.location.pathname;
    payload._lang = document.documentElement.lang || 'tr';

    var endpoint = options.endpoint !== undefined ? options.endpoint : FORM_CONFIG.endpoint;

    if (endpoint) {
      return fetch(endpoint, {
        method: FORM_CONFIG.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          setLoading(btn, false);
          status(statusEl, options.successMessage || 'Talebiniz alındı. En kısa sürede dönüş yapacağız.', 'success');
          track('lead_form_submit', { method: 'api', form: form.id || 'unknown' });
          form.reset();
          return { ok: true, method: 'api' };
        })
        .catch(function (err) {
          setLoading(btn, false);
          // Fallback to mailto if configured
          if (FORM_CONFIG.mailtoFallback) {
            status(statusEl, options.fallbackMessage || 'Bağlantı sorunu nedeniyle e-posta taslağı açılıyor...', 'success');
            track('lead_form_submit', { method: 'mailto_fallback', form: form.id || 'unknown' });
            window.location.href = buildMailto(form, options);
            return { ok: true, method: 'mailto_fallback' };
          }
          status(statusEl, options.errorMessage || 'Gönderim sırasında bir sorun oluştu. Lütfen telefon veya e-posta ile iletişime geçin.', 'error');
          track('lead_form_error', { form: form.id || 'unknown' });
          return { ok: false, reason: 'network', error: err };
        });
    }

    // No endpoint: mailto path
    return new Promise(function (resolve) {
      setTimeout(function () {
        setLoading(btn, false);
        status(statusEl, options.mailtoMessage || 'E-posta taslağınız hazırlanıyor. Gönder butonuna basarak talebinizi iletebilirsiniz.', 'success');
        track('lead_form_submit', { method: 'mailto', form: form.id || 'unknown' });
        window.location.href = buildMailto(form, options);
        resolve({ ok: true, method: 'mailto' });
      }, 350);
    });
  }

  window.VitavoltForms = {
    validate: validate,
    setLoading: setLoading,
    status: status,
    track: track,
    formToObject: formToObject,
    buildMailto: buildMailto,
    submitForm: submitForm,
    config: FORM_CONFIG
  };
})(window, document);
