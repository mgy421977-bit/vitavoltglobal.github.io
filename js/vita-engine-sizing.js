/* Vitavolt Global — VITA Engine sizing extension | 2026-09-17-v4 */
(function (window) {
  'use strict';
  function num(v, fb) { var x = Number(v); return Number.isFinite(x) ? x : (fb || 0); }
  function round2(v) { return Math.round(num(v) * 100) / 100; }
  function chooseInverter(dcKwp, pricing) {
    var list = ((pricing && pricing.inverter_options) || []).slice().sort(function (a, b) { return num(a.power_kw) - num(b.power_kw); });
    if (!list.length || dcKwp <= 0) return { opt: null, count: 0, totalKw: 0, fallback: false, reason: 'no_catalog_or_zero_dc' };
    var target = dcKwp * 0.80;
    var candidates = [];
    list.forEach(function (opt) {
      var unit = num(opt.power_kw);
      if (unit <= 0) return;
      var count = Math.floor((dcKwp + 1e-9) / unit);
      if (count < 1) return;
      var total = count * unit;
      if (total <= dcKwp + 1e-9) candidates.push({ opt: opt, count: count, totalKw: total, cost: count * num(opt.base_usd) });
    });
    var preferred = candidates.filter(function (c) { return c.totalKw + 1e-9 >= target; });
    var pool = preferred.length ? preferred : candidates;
    if (pool.length) {
      pool.sort(function (a, b) {
        if (a.count !== b.count) return a.count - b.count;
        var da = Math.abs(a.totalKw - target), db = Math.abs(b.totalKw - target);
        if (Math.abs(da - db) > 0.0001) return da - db;
        return a.cost - b.cost;
      });
      var best = pool[0];
      return { opt: best.opt, count: best.count, totalKw: round2(best.totalKw), fallback: !preferred.length, reason: preferred.length ? 'dc_ac_target_80pct_preferred' : 'closest_catalog_below_dc_fallback' };
    }
    var covering = list.find(function (opt) { return num(opt.power_kw) >= dcKwp; }) || list[list.length - 1];
    return { opt: covering, count: 1, totalKw: round2(num(covering.power_kw)), fallback: true, reason: 'smallest_catalog_unit_covering_dc_fallback' };
  }
  function applyInverterRule(result) {
    if (!result || !result.solar || !result.pricing) return;
    var dc = Math.max(0, num(result.solar.dcCapacityKwp));
    if (dc <= 0) return;
    var pricingCfg = window.VitaEngine && window.VitaEngine.config && window.VitaEngine.config.pricing;
    var selected = chooseInverter(dc, pricingCfg);
    if (!selected.opt || !selected.count) return;
    var p = result.pricing;
    var oldCost = num(p.inverter && p.inverter.baseUsd);
    var newUnitCost = num(selected.opt.base_usd);
    var newCost = round2(selected.count * newUnitCost);
    var delta = round2(newCost - oldCost);
    p.inverter = p.inverter || {};
    p.inverter.selection = 'auto_dc_ac_80pct_preferred';
    p.inverter.powerKw = num(selected.opt.power_kw);
    p.inverter.type = selected.opt.type || null;
    p.inverter.count = selected.count;
    p.inverter.unitCost = newUnitCost;
    p.inverter.baseUsd = newCost;
    p.inverter.source = selected.opt.source || 'DATABASE';
    p.inverter.selectionReason = selected.reason;
    p.inverter.targetAcDcRatio = 0.80;
    p.inverter.actualAcDcRatio = round2(selected.totalKw / dc);
    p.inverter.dcAcRatio = selected.totalKw > 0 ? round2(dc / selected.totalKw) : 0;
    p.inverter.totalAcKw = selected.totalKw;
    p.inverter.sizingFallback = !!selected.fallback;
    p.marketInverterUsd = newCost;
    p.marketPanelInverterUsd = round2(num(p.marketPanelUsd) + newCost);
    if (p.directMaterial) p.directMaterial.baseUsd = round2(num(p.directMaterial.baseUsd) + delta);
    if (p.directCost) p.directCost.baseUsd = round2(num(p.directCost.baseUsd) + delta);
    var direct = num(p.directCost && p.directCost.baseUsd);
    var bos = num(p.bos && p.bos.baseUsd);
    var project = round2(direct + bos);
    var markup = num(p.markupPct, 15);
    var sales = round2(direct * (1 + markup / 100));
    if (p.projectCost) {
      p.projectCost.usd = project;
      p.projectCost.baseUsd = project;
      p.projectCost.estimatedPriceUsd = sales;
      p.projectCost.components = p.projectCost.components || {};
      p.projectCost.components.directCost = direct;
      p.projectCost.components.bosAllowance = bos;
    }
    if (p.commercialPrice) p.commercialPrice.usd = sales;
    if (p.salesPrice) p.salesPrice.usd = sales;
    (p.bom || []).some(function (row) {
      if (row.category !== 'GES' || String(row.item || '').indexOf('Inverter') === -1) return false;
      row.item = selected.opt.power_kw + ' kW Inverter'; row.quantity = selected.count; row.unitCost = newUnitCost; row.totalCost = round2(newCost); row.source = selected.opt.source || 'DATABASE'; row.costStatus = 'PRICED'; return true;
    });
    result.assumptions = result.assumptions || {};
    result.assumptions.inverterAcDcTargetRatio = 0.80;
    result.assumptions.inverterSelectionRule = 'AC inverter target is 20% below DC; catalog combinations stay at or below DC when possible.';
    result.sizing = result.sizing || {};
    result.sizing.inverter = { targetAcDcRatio: 0.80, selectedAcKw: selected.totalKw, actualAcDcRatio: round2(selected.totalKw / dc), dcAcRatio: selected.totalKw > 0 ? round2(dc / selected.totalKw) : 0, powerKw: num(selected.opt.power_kw), count: selected.count, fallback: !!selected.fallback, reason: selected.reason };
  }
  function install() {
    if (!window.VitaEngine || typeof window.VitaEngine.calculate !== 'function' || (window.VitaEngine.__consumptionSizingInstalled && window.VitaEngine.sizingBuild === '2026-09-17-consumption-sizing-v4-inverter-80pct-water-separated')) return false;
    var baseCalculate = window.VitaEngine.calculate;
    window.VitaEngine.calculate = function (input, cfg) {
      input = Object.assign({}, input || {}); cfg = cfg || {};
      var solar = Object.assign({}, (window.VitaEngine.config && window.VitaEngine.config.solar) || {}, cfg.solar || {});
      var roof = Math.max(0, num(input.roofAreaM2)), land = Math.max(0, num(input.landAreaM2));
      var area = roof + (input.landAvailable === true ? land : 0);
      var panelArea = Math.max(0.5, num(solar.panel_area_m2, 2.6));
      var panelWp = Math.max(1, num(input.panelPowerWp, solar.default_panel_power || 620));
      var maxPanels = Math.max(0, Math.floor(area / panelArea));
      var annual = Math.max(0, num(input.annualConsumptionKwh));
      if (!annual && input.monthlyConsumptionKwh) annual = Math.max(0, num(input.monthlyConsumptionKwh)) * 12;
      var yieldKwh = Math.max(300, num(input.specificYieldKwhKwp, num(solar.default_specific_yield_kwh_kwp, 1450)));
      var loss = Math.min(1, Math.max(0.1, num(input.systemLossFactorOverride, num(solar.system_loss_factor, 0.85))));
      var pr = Math.min(1, Math.max(0.1, num(solar.performance_ratio, 0.8)));
      var margin = Math.min(2, Math.max(0.5, num(solar.design_margin, 1.1)));
      var sizingKwp = annual > 0 ? (annual / (yieldKwh * loss * pr)) * margin : 0;
      var consumptionPanels = sizingKwp > 0 ? Math.ceil((sizingKwp * 1000) / panelWp) : maxPanels;
      var selectedPanels = maxPanels > 0 ? Math.min(maxPanels, consumptionPanels) : 0;
      var areaLimited = annual > 0 && maxPanels > 0 && consumptionPanels > maxPanels;
      input.panelCountOverride = selectedPanels;
      var result = baseCalculate(input, cfg);
      applyInverterRule(result);
      result.inputs = result.inputs || {};
      result.inputs.roofAreaM2 = roof; result.inputs.landAreaM2 = land; result.inputs.annualConsumptionKwh = annual; result.inputs.panelCountOverride = selectedPanels;
      result.sizing = result.sizing || {};
      result.sizing.method = annual > 0 ? 'consumption_driven_with_available_area_cap' : 'area_driven';
      result.sizing.annualConsumptionKwh = annual;
      result.sizing.requiredKwpBeforeAreaCap = round2(sizingKwp);
      result.sizing.maximumAreaKwp = round2((maxPanels * panelWp) / 1000);
      result.sizing.selectedKwp = result.solar.dcCapacityKwp; result.sizing.selectedPanelCount = result.solar.panelCount; result.sizing.maximumPanelCount = maxPanels; result.sizing.areaLimited = areaLimited;
      result.sizing.yieldKwhKwp = yieldKwh; result.sizing.systemLossFactor = loss; result.sizing.physicalRoofAreaM2 = roof; result.sizing.usableAreaM2 = area;
      result.sizing.note = areaLimited ? 'Tüketim hedefi mevcut çatı/arazi alanının kapasitesini aştı; sistem fiziksel alan ile sınırlandı.' : (annual > 0 ? 'GES gücü yıllık tüketimden türetildi ve mevcut alan kapasitesi içinde tutuldu.' : 'Tüketim girilmediği için mevcut alan kapasitesi referans alındı.');
      result.assumptions = result.assumptions || {};
      result.assumptions.sizingMethod = result.sizing.method; result.assumptions.requiredKwpBeforeAreaCap = result.sizing.requiredKwpBeforeAreaCap; result.assumptions.maximumAreaKwp = result.sizing.maximumAreaKwp; result.assumptions.areaLimited = result.sizing.areaLimited; result.assumptions.physicalRoofAreaM2 = roof; result.assumptions.usableAreaM2 = area;
      result.validation = window.VitaEngine.validate(result);
      return result;
    };
    window.VitaEngine.__consumptionSizingInstalled = true;
    window.VitaEngine.sizingBuild = '2026-09-17-consumption-sizing-v4-inverter-80pct-water-separated';
    return true;
  }
  var tries = 0; var timer = setInterval(function () { tries++; if (install() || tries > 400) clearInterval(timer); }, 25);
})(typeof window !== 'undefined' ? window : global);
