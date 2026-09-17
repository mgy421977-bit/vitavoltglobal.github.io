/**
 * Vitavolt Global — VITA Engine Pre-Feasibility Core v1 (UI adapter)
 * Authoritative math lives in vita-engine.js (VitaEngine).
 * This module only exposes a stable VitavoltCalculator API for the homepage form.
 * Coefficients are DATABASE / ASSUMPTION — not "AI verification scores".
 */
(function (window) {
  'use strict';

  function ensureEngine() {
    return window.VitaEngine && typeof window.VitaEngine.calculate === 'function';
  }

  function calculate(input, config) {
    if (!ensureEngine()) {
      throw new Error('VITA Engine not loaded');
    }
    return window.VitaEngine.calculate(input, config || {});
  }

  function loadConfig() {
    if (ensureEngine() && typeof window.VitaEngine.loadMarketData === 'function') {
      return window.VitaEngine.loadMarketData().then(function (pricing) {
        return { pricing: pricing, solar: window.VitaEngine.config.solar, battery: window.VitaEngine.config.battery };
      });
    }
    return Promise.resolve({ pricing: {}, solar: {}, battery: {} });
  }

  window.VitavoltCalculator = {
    calculate: calculate,
    loadConfig: loadConfig,
    formatNumber: function (value, locale) {
      return Math.round(Number(value) || 0).toLocaleString(locale || 'tr-TR');
    },
    defaultConfig: function () {
      return ensureEngine() ? window.VitaEngine.config : {};
    }
  };
})(window);
