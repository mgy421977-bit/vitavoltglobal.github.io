/* Vitavolt Global — Reusable client-side form helpers */
(function (window, document) {
  'use strict';

  function validate(form) {
    if (!form) return false;
    if (typeof form.reportValidity === 'function' && !form.reportValidity()) return false;
    return true;
  }

  function setLoading(button, loading, label) {
    if (!button) return;
    if (loading) {
      if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent.trim();
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = label || 'Gönderiliyor...';
    } else {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      if (button.dataset.originalLabel) button.textContent = button.dataset.originalLabel;
    }
  }

  function status(element, message, type) {
    if (!element) return;
    element.textContent = message || '';
    element.className = 'form-status' + (type ? ' is-' + type : '');
  }

  function track(name, params) {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    } catch (_) {
      // Analytics must never block a form flow.
    }
  }

  window.VitavoltForms = {
    validate: validate,
    setLoading: setLoading,
    status: status,
    track: track
  };
})(window, document);
