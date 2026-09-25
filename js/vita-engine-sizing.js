/* Vitavolt Global — VITA Engine sizing extension | 2026-09-25-v6 */
(function (window) {
  'use strict';
  function num(v, fb) { var x = Number(v); return Number.isFinite(x) ? x : (fb || 0); }
  function round2(v) { return Math.round(num(v) * 100) / 100; }

  /*
   * Select an inverter combination around the requested AC/DC target.
   * The catalog is authoritative. Total AC must not exceed DC when a
   * feasible under-DC combination exists. Closeness to 0.80 is the first
   * criterion; inverter count and cost are tie-breakers.
   */
  function chooseInverter(dcKwp, pricing) {
    var list = ((pricing && pricing.inverter_options) || []).slice()
      .filter(function (o) { return num(o.power_kw) > 0; })
      .sort(function (a, b) { return num(a.power_kw) - num(b.power_kw); });
    if (!list.length || dcKwp <= 0) return { opt: null, count: 0, totalKw: 0, fallback: false, reason: 'no_catalog_or_zero_dc' };

    var target = dcKwp * 0.80;
    /* Prefer exact/closest feasible AC capacity to 80% of DC; catalog combinations may mix inverter sizes. */
    var maxUnits = Math.min(32, Math.floor(dcKwp / Math.min.apply(null, list.map(function (o) { return num(o.power_kw); }))));
    var candidates = [];

    function walk(index, remainingKw, counts, totalKw, totalCost, units) {
      if (index >= list.length) {
        if (units > 0 && totalKw <= dcKwp + 1e-9) {
          var combo = [];
          list.forEach(function (o, i) { if (counts[i]) combo.push({ opt: o, count: counts[i] }); });
          candidates.push({ combo: combo, totalKw: totalKw, cost: totalCost, units: units, distance: Math.abs(totalKw - target) });
        }
        return;
      }
      var unit = num(list[index].power_kw);
      var maxCount = Math.min(Math.floor(remainingKw / unit + 1e-9), maxUnits - units);
      for (var c = 0; c <= maxCount; c++) {
        counts[index] = c;
        walk(index + 1, remainingKw - c * unit, counts, totalKw + c * unit, totalCost + c * num(list[index].base_usd), units + c);
      }
      counts[index] = 0;
    }
    walk(0, dcKwp, [], 0, 0, 0);

    if (!candidates.length) {
      var covering = list.find(function (o) { return num(o.power_kw) >= dcKwp; }) || list[list.length - 1];
      return { opt: covering, count: 1, totalKw: round2(num(covering.power_kw)), fallback: true, reason: 'smallest_catalog_unit_covering_dc_fallback' };
    }

    candidates.sort(function (a, b) {
      if (Math.abs(a.distance - b.distance) > 0.0001) return a.distance - b.distance;
      if (a.units !== b.units) return a.units - b.units;
      return a.cost - b.cost;
    });

    var best = candidates[0];
    var primary = best.combo[0];
    var sameModel = best.combo.every(function (x) { return x.opt.power_kw === primary.opt.power_kw; });
    return {
      opt: sameModel ? primary.opt : primary.opt,
      combo: best.combo,
      count: best.units,
      totalKw: round2(best.totalKw),
      fallback: false,
      reason: 'closest_to_dc_ac_target_80pct'
    };
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
    var combo = selected.combo || [{ opt: selected.opt, count: selected.count }];
    var newCost = round2(combo.reduce(function (sum, x) { return sum + x.count * num(x.opt.base_usd); }, 0));
    var delta = round2(newCost - oldCost);
    var comboLabel = combo.map(function (x) { return x.count + '×' + num(x.opt.power_kw) + ' kW'; }).join(' + ');

    p.inverter = p.inverter || {};
    p.inverter.selection = 'auto_dc_ac_80pct_preferred';
    p.inverter.powerKw = num(selected.opt.power_kw);
    p.inverter.type = selected.opt.type || null;
    p.inverter.count = selected.count;
    p.inverter.unitCost = selected.count === 1 ? num(selected.opt.base_usd) : round2(newCost / selected.count);
    p.inverter.baseUsd = newCost;
    p.inverter.source = combo.length > 1 ? 'DATABASE_COMBINATION' : (selected.opt.source || 'DATABASE');
    p.inverter.selectionReason = selected.reason;
    p.inverter.configuration = comboLabel;
    p.inverter.targetAcDcRatio = 0.80;
    p.inverter.actualAcDcRatio = round2(selected.totalKw / dc);
    p.inverter.dcAcRatio = selected.totalKw > 0 ? round2(dc / selected.totalKw) : 0;
    p.inverter.totalAcKw = selected.totalKw;
    p.inverter.sizingFallback = !!selected.fallback;
    p.marketInverterUsd = newCost;
    p.marketPanelInverterUsd = round2(num(p.marketPanelUsd) + newCost);
    if (p.directMaterial) p.directMaterial.baseUsd = round2(num(p.directMaterial.baseUsd) + delta);
    if (p.directCost) p.directCost.baseUsd = round2(num(p.directCost.baseUsd) + delta);

    /* Commercial pricing is based on total project cost, not direct cost alone. */
    var direct = num(p.directCost && p.directCost.baseUsd);
    var bos = num(p.bos && p.bos.baseUsd);
    var project = round2(direct + bos);
    var markup = num(p.markupPct, 15);
    var sales = round2(project * (1 + markup / 100));
    if (p.projectCost) {
      p.projectCost.usd = project;
      p.projectCost.baseUsd = project;
      p.projectCost.estimatedPriceUsd = sales;
      p.projectCost.components = p.projectCost.components || {};
      p.projectCost.components.directCost = direct;
      p.projectCost.components.bosAllowance = bos;
      p.projectCost.components.commercialMarkup = round2(sales - project);
      p.projectCost.pricingBasis = 'direct_cost_plus_bos_allowance_then_markup';
    }
    if (p.commercialPrice) { p.commercialPrice.usd = sales; p.commercialPrice.basis = 'total_project_cost'; }
    if (p.salesPrice) { p.salesPrice.usd = sales; p.salesPrice.basis = 'total_project_cost'; }

    var inverterRows = (p.bom || []).filter(function (row) { return row.category === 'GES' && String(row.item || '').indexOf('Inverter') !== -1; });
    if (inverterRows.length) {
      var first = inverterRows[0];
      first.item = comboLabel + ' Inverter Configuration';
      first.quantity = 1;
      first.unitCost = newCost;
      first.totalCost = newCost;
      first.source = p.inverter.source;
      first.costStatus = 'PRICED';
      inverterRows.slice(1).forEach(function (row) { row.quantity = 0; row.totalCost = 0; row.costStatus = 'SUPERSEDED'; });
    }

    result.assumptions = result.assumptions || {};
    result.assumptions.inverterAcDcTargetRatio = 0.80;
    result.assumptions.inverterSelectionRule = 'AC inverter target is 20% below DC; catalog combinations are selected by closest feasible AC/DC ratio.';
    result.sizing = result.sizing || {};
    result.sizing.inverter = {
      targetAcDcRatio: 0.80,
      selectedAcKw: selected.totalKw,
      actualAcDcRatio: round2(selected.totalKw / dc),
      dcAcRatio: selected.totalKw > 0 ? round2(dc / selected.totalKw) : 0,
      powerKw: num(selected.opt.power_kw),
      count: selected.count,
      configuration: comboLabel,
      fallback: !!selected.fallback,
      reason: selected.reason
    };
  }

  function install() {
    if (!window.VitaEngine || typeof window.VitaEngine.calculate !== 'function' || (window.VitaEngine.__consumptionSizingInstalled && window.VitaEngine.sizingBuild === '2026-09-25-consumption-sizing-v6-inverter-80pct')) return false;
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
    window.VitaEngine.sizingBuild = '2026-09-17-consumption-sizing-v5-inverter-80pct-cost-fix';
    return true;
  }
  var tries = 0; var timer = setInterval(function () { tries++; if (install() || tries > 400) clearInterval(timer); }, 25);
})(typeof window !== 'undefined' ? window : global);
