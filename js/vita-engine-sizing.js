/* Vitavolt Global — VITA Engine sizing extension | 2026-09-17 */
(function (window) {
  'use strict';
  function num(v, fb) { var x = Number(v); return Number.isFinite(x) ? x : (fb || 0); }
  function round2(v) { return Math.round(num(v) * 100) / 100; }
  function install() {
    if (!window.VitaEngine || typeof window.VitaEngine.calculate !== 'function' || window.VitaEngine.__consumptionSizingInstalled) return false;
    var baseCalculate = window.VitaEngine.calculate;
    window.VitaEngine.calculate = function (input, cfg) {
      input = Object.assign({}, input || {});
      cfg = cfg || {};
      var solar = Object.assign({}, (window.VitaEngine.config && window.VitaEngine.config.solar) || {}, cfg.solar || {});
      var roof = Math.max(0, num(input.roofAreaM2));
      var land = Math.max(0, num(input.landAreaM2));
      var area = roof + (input.landAvailable === true ? land : 0);
      var panelArea = Math.max(0.5, num(solar.panel_area_m2, 2.6));
      var panelWp = Math.max(1, num(input.panelPowerWp, solar.default_panel_power || 620));
      var maxPanels = Math.max(0, Math.floor(area / panelArea));
      var annual = Math.max(0, num(input.annualConsumptionKwh));
      if (!annual && input.monthlyConsumptionKwh) annual = Math.max(0, num(input.monthlyConsumptionKwh)) * 12;
      var yieldKwh = Math.max(300, num(solar.default_specific_yield_kwh_kwp, 1450));
      var loss = Math.min(1, Math.max(0.1, num(solar.system_loss_factor, 0.85)));
      var pr = Math.min(1, Math.max(0.1, num(solar.performance_ratio, 0.8)));
      var margin = Math.min(2, Math.max(0.5, num(solar.design_margin, 1.1)));
      var sizingKwp = annual > 0 ? (annual / (yieldKwh * loss * pr)) * margin : 0;
      var consumptionPanels = sizingKwp > 0 ? Math.ceil((sizingKwp * 1000) / panelWp) : maxPanels;
      var selectedPanels = maxPanels > 0 ? Math.min(maxPanels, consumptionPanels) : 0;
      var areaLimited = annual > 0 && maxPanels > 0 && consumptionPanels > maxPanels;
      var effectiveArea = selectedPanels * panelArea;
      if (area > 0 && selectedPanels >= 0) input.roofAreaM2 = effectiveArea;
      var result = baseCalculate(input, cfg);
      result.inputs = result.inputs || {};
      result.inputs.roofAreaM2 = roof;
      result.inputs.landAreaM2 = land;
      result.inputs.annualConsumptionKwh = annual;
      result.sizing = {
        method: annual > 0 ? 'consumption_driven_with_available_area_cap' : 'area_driven',
        annualConsumptionKwh: annual,
        requiredKwpBeforeAreaCap: round2(sizingKwp),
        maximumAreaKwp: round2((maxPanels * panelWp) / 1000),
        selectedKwp: result.solar.dcCapacityKwp,
        selectedPanelCount: result.solar.panelCount,
        maximumPanelCount: maxPanels,
        areaLimited: areaLimited,
        note: areaLimited ? 'Tüketim hedefi mevcut çatı/arazi alanının kapasitesini aştı; sistem fiziksel alan ile sınırlandı.' : (annual > 0 ? 'GES gücü yıllık tüketimden türetildi ve mevcut alan kapasitesi içinde tutuldu.' : 'Tüketim girilmediği için mevcut alan kapasitesi referans alındı.')
      };
      result.assumptions = result.assumptions || {};
      result.assumptions.sizingMethod = result.sizing.method;
      result.assumptions.requiredKwpBeforeAreaCap = result.sizing.requiredKwpBeforeAreaCap;
      result.assumptions.maximumAreaKwp = result.sizing.maximumAreaKwp;
      result.assumptions.areaLimited = result.sizing.areaLimited;
      result.validation = window.VitaEngine.validate(result);
      return result;
    };
    window.VitaEngine.__consumptionSizingInstalled = true;
    window.VitaEngine.sizingBuild = '2026-09-17-consumption-sizing-v1';
    return true;
  }
  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    if (install() || tries > 400) clearInterval(timer);
  }, 25);
})(typeof window !== 'undefined' ? window : global);
