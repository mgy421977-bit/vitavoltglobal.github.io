/* Vitavolt Global — form helpers: real email via FormSubmit AJAX */
(function (window, document) {
  'use strict';

  /**
   * FormSubmit.co AJAX → info@vitavoltglobal.com
   * İlk kullanımda FormSubmit aktivasyon maili gönderir; bir kez onaylanmalı.
   */
  var FORM_CONFIG = {
    endpoint: 'https://formsubmit.co/ajax/info@vitavoltglobal.com',
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
  }

  function track(name, params) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, params || {});
      }
    } catch (_) {}
  }

  function formToObject(form) {
    var data = new FormData(form);
    var obj = {};
    data.forEach(function (value, key) {
      if (key === 'kvkk_consent') {
        obj[key] = true;
        return;
      }
      obj[key] = typeof value === 'string' ? value.trim() : value;
    });
    return obj;
  }

  function buildMailto(form, options) {
    options = options || {};
    var obj = formToObject(form);
    var lines = [];
    Object.keys(obj).forEach(function (k) {
      if (k.charAt(0) === '_') return;
      lines.push(k + ': ' + obj[k]);
    });
    var subject = options.subject || ('Vitavolt web talebi — ' + (obj.ad_soyad || obj.name || 'Yeni lead'));
    return 'mailto:' + encodeURIComponent(FORM_CONFIG.mailtoAddress) +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
  }

  function submitForm(form, options) {
    options = options || {};
    if (!form || !validate(form)) {
      return Promise.resolve({ ok: false, reason: 'validation' });
    }

    var consent = form.querySelector('[name="kvkk_consent"], [name="privacy_consent"]');
    if (consent && !consent.checked) {
      var statusEl0 = options.statusElement || form.querySelector('.form-status, .msf-status, #formStatus, #msfStatus');
      status(statusEl0, 'Devam etmek için KVKK onayını işaretleyin.', 'error');
      return Promise.resolve({ ok: false, reason: 'consent' });
    }

    var btn = options.button || form.querySelector('[type="submit"]');
    var statusEl = options.statusElement || form.querySelector('.form-status, .msf-status, #formStatus, #msfStatus');
    setLoading(btn, true, options.loadingLabel || 'Gönderiliyor...');
    status(statusEl, '', '');

    var payload = formToObject(form);
    payload._subject = options.subject || ('Vitavolt Global — Web talebi (' + (form.id || 'form') + ')');
    payload._template = 'table';
    payload._captcha = 'false';
    payload._source = 'vitavoltglobal.com';
    payload._page = window.location.href;
    payload._replyto = payload.eposta || payload.email || '';

    var endpoint = options.endpoint !== undefined ? options.endpoint : FORM_CONFIG.endpoint;

    function finishMailto() {
      setLoading(btn, false);
      status(statusEl, options.mailtoMessage || 'E-posta uygulamanız açılıyor. Gönder ile talebi iletin.', 'success');
      track('lead_form_submit', { method: 'mailto_fallback', form: form.id || 'unknown' });
      window.location.href = buildMailto(form, options);
      return { ok: true, method: 'mailto' };
    }

    if (!endpoint) {
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(finishMailto()); }, 200);
      });
    }

    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          return { res: res, json: json };
        });
      })
      .then(function (pack) {
        setLoading(btn, false);
        if (pack.res.ok) {
          status(statusEl, options.successMessage || 'Talebiniz alındı ve e-posta ile iletildi. En kısa sürede dönüş yapacağız.', 'success');
          track('lead_form_submit', { method: 'formsubmit', form: form.id || 'unknown' });
          try { form.reset(); } catch (_) {}
          return { ok: true, method: 'formsubmit' };
        }
        throw new Error('HTTP ' + pack.res.status);
      })
      .catch(function () {
        if (FORM_CONFIG.mailtoFallback) {
          return finishMailto();
        }
        setLoading(btn, false);
        status(statusEl, options.errorMessage || 'Gönderim başarısız. +90 545 441 19 77 veya info@vitavoltglobal.com', 'error');
        track('lead_form_error', { form: form.id || 'unknown' });
        return { ok: false, reason: 'network' };
      });
  }

  function submitPayload(payload, options) {
    options = options || {};
    var data = Object.assign({}, payload || {});
    data._subject = options.subject || 'Vitavolt Global — Ön fizibilite lead';
    data._template = 'table';
    data._captcha = 'false';
    data._source = 'vitavoltglobal.com';
    data._page = window.location.href;
    if (data.email || data.eposta) {
      data._replyto = data.eposta || data.email;
    }

    return fetch(FORM_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        track('lead_form_submit', { method: 'formsubmit', form: options.formName || 'payload' });
        return { ok: true };
      })
      .catch(function () {
        track('lead_form_error', { form: options.formName || 'payload' });
        return { ok: false };
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
    submitPayload: submitPayload,
    config: FORM_CONFIG
  };
})(window, document);
