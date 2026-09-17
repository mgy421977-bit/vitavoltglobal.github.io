/* Vitavolt Global — MITOS CORE Offline Scenario Optimizer | build 2026-09-17 */
(function (window) {
  'use strict';
  var VERSION = '0.1.0-offline';
  var BUILD = '2026-09-17-mitos-v1';

  function n(v, fb) { var x = Number(v); return Number.isFinite(x) ? x : (fb || 0); }
  function clone(x) { return JSON.parse(JSON.stringify(x || {})); }

  /*
   * MITOS is a scenario generator/optimizer, not an engineering calculator.
   * It may propose candidate inputs; VITA Engine remains the sole authority
   * for engineering, cost, carbon and water mathematics. Human approval is
   * required before any proposal becomes a project decision.
   */
  function propose(input) {
    input = clone(input);
    var scenarios = [];
    var base = clone(input);
    scenarios.push({ id: 'BASELINE', label: 'Mevcut kullanıcı verisi', input: base, reason: 'Referans senaryo; kullanıcı girdileri değiştirilmez.' });

    var roof = n(input.roofAreaM2, 0);
    var cons = n(input.monthlyConsumptionKwh, 0);
    var night = n(input.nighttimeShare, 0);

    if (roof > 0) {
      var solarPlus = clone(input);
      solarPlus.roofAreaM2 = roof * 1.10;
      scenarios.push({ id: 'SOLAR_HEADROOM', label: '+10% çatı kullanım senaryosu', input: solarPlus, reason: 'Çatı alanı kullanılabilirliği doğrulanırsa üretim kapasitesi etkisini test etmek.' });
    }

    if (cons > 0) {
      var efficiency = clone(input);
      efficiency.annualConsumptionKwh = cons * 12 * 0.90;
      efficiency.monthlyConsumptionKwh = cons * 0.90;
      scenarios.push({ id: 'EFFICIENCY', label: '%10 tüketim verimliliği senaryosu', input: efficiency, reason: 'Enerji verimliliği varsayımının sistem boyutlandırmasına etkisini test etmek.' });
    }

    if (night > 0) {
      var storage = clone(input);
      storage.nighttimeShare = Math.min(1, night + 0.10);
      scenarios.push({ id: 'LOAD_SHIFT', label: '+10 puan gece yükü / BESS senaryosu', input: storage, reason: 'Yük kaydırmanın BESS ön değerlendirmesine etkisini test etmek.' });
    }

    return {
      version: VERSION,
      build: BUILD,
      status: 'PROPOSALS_ONLY',
      objective: 'compare_candidate_scenarios_without_overriding_vita_math',
      scenarios: scenarios,
      rules: [
        'MITOS does not calculate engineering values.',
        'Every candidate must be evaluated by VITA Engine.',
        'MITOS cannot override validated VITA outputs.',
        'Human approval is required for project decisions.'
      ]
    };
  }

  window.MitosCore = { version: VERSION, build: BUILD, propose: propose };
})(typeof window !== 'undefined' ? window : global);
