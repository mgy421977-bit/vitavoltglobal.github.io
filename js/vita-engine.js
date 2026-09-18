/* Vitavolt Global — VITA Engine Offline Pre-Feasibility Core | build 2026-09-17-v4-unified */
(function (window) {
  'use strict';
  var ENGINE_VERSION = '4.0.0', BUILD = '2026-09-17-v4-unified', DB_VERSION = '1.9';
  var CONFIG = {
    solar: { default_panel_power: 620, panel_area_m2: 2.6, system_loss_factor: 0.85, co2_factor: 0.42, performance_ratio: 0.8, design_margin: 1.1, default_specific_yield_kwh_kwp: 1450 },
    battery: { depth_of_discharge: 0.9, round_trip_efficiency: 0.95, peak_support_hours: 2, module_kwh: 2.4, module_usd: 800 },
    water: {
      rainfallMmByCity: { Aydın: 660.6, 'Kuşadası': 660.6, İzmir: 700, Ankara: 450, İstanbul: 850 },
      defaultRainfallMm: 600,
      roofRunoffCoefficient: { Metal: 0.9, Concrete: 0.8, Tile: 0.75 },
      defaultRoofType: 'Tile',
      firstFlushAndOverflowFactor: 0.8,
      greywaterRecoverableRatio: 0.35,
      greywaterOperatingLossFactor: 0.7
    },
    pricing: {
      markup_pct: 15,
      currency: 'USD',
      panel_options: [
        { power_wp: 620, base_usd_per_w: 0.18, source: 'DATABASE' },
        { power_wp: 655, base_usd_per_w: 0.18, source: 'DATABASE' }
      ],
      inverter_options: [
        { power_kw: 6.2, type: 'mppt', base_usd: 290, source: 'DATABASE' },
        { power_kw: 8, type: 'mppt', base_usd: 374.19, source: 'DATABASE' },
        { power_kw: 11, type: 'inverter', base_usd: 650, source: 'DATABASE' },
        { power_kw: 50, type: 'inverter', base_usd: 3000, source: 'DATABASE' },
        { power_kw: 100, type: 'inverter', base_usd: 3600, source: 'DATABASE' }
      ],
      battery_options: [{ capacity_kwh: 2.4, base_usd: 800, source: 'DATABASE' }],
      cost_model: {
        labor_usd_per_panel: 20,
        market_quote_discount_pct: 10,
        proportional_model: { bos_usd_per_kwp: 241.07855208, fixed_bos_usd: 604.19354839, basis: 'ASSUMPTION/MODEL BOS/EPC allowance' },
        bom_ratios: { dc_cable_m_per_panel: 6.19, ac_cable_m_per_panel: 1.67, mc4_pairs_per_panel: 4, dc_spd_sets_per_reference: 2, fuse_sets_per_reference: 4 }
      }
    }
  };
  function n(v, fb) { var x = Number(v); return Number.isFinite(x) ? x : fb !== undefined ? fb : 0; }
  function nn(v) { return Math.max(0, n(v, 0)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function round2(v) { return Math.round(n(v, 0) * 100) / 100; }
  function provenance(value, unit, source) { return { value: value, unit: unit || null, source: source || 'DERIVED' }; }
  function rainfall(city) { var map = CONFIG.water.rainfallMmByCity; return city && map[city] != null ? map[city] : CONFIG.water.defaultRainfallMm; }
  function panelOpt(wp, pricing) {
    var a = (pricing && pricing.panel_options) || CONFIG.pricing.panel_options;
    for (var i = 0; i < a.length; i++) if (+a[i].power_wp === +wp) return a[i];
    return a[0] || { power_wp: 620, base_usd_per_w: 0.18, source: 'DATABASE' };
  }
  function autoInverter(dcKwp, pricing, requestedKw) {
    var a = ((pricing && pricing.inverter_options) || CONFIG.pricing.inverter_options).slice().sort(function (x, y) { return +x.power_kw - +y.power_kw; });
    if (!a.length) return { opt: null, reason: 'no_catalog', count: 0 };
    dcKwp = Math.max(0, +dcKwp || 0);
    if (dcKwp <= 0) return { opt: a[0], reason: 'zero_dc_default_smallest', count: 0 };
    var requested = n(requestedKw, 0);
    if (requested > 0) {
      for (var r = 0; r < a.length; r++) {
        if (+a[r].power_kw === requested) {
          var requestedCount = Math.max(1, Math.ceil(dcKwp / requested));
          return { opt: a[r], reason: requestedCount === 1 ? 'user_selected_catalog_unit' : 'user_selected_parallel_units_to_cover_dc', count: requestedCount };
        }
      }
    }
    var targetAcDcRatio = 0.80;
    var maxOversizeRatio = 1.5;
    var technicallyValid = null;
    for (var tv = 0; tv < a.length; tv++) {
      var tvPower = +a[tv].power_kw;
      if (!(tvPower > 0)) continue;
      var tvCount = Math.max(1, Math.ceil(dcKwp * targetAcDcRatio / tvPower));
      var tvTotal = tvCount * tvPower;
      if (tvTotal < dcKwp * targetAcDcRatio - 0.05 || tvTotal > (tvCount === 1 ? dcKwp + 0.05 : dcKwp * maxOversizeRatio) || (tvCount === 1 && tvTotal < dcKwp - 0.05) || (dcKwp > 80 && tvTotal < dcKwp - 0.05)) continue;
      var tvCandidate = { opt: a[tv], count: tvCount, excess: tvTotal - dcKwp, cost: tvCount * (+a[tv].base_usd || 0) };
      if (!technicallyValid || tvCandidate.count < technicallyValid.count || (tvCandidate.count === technicallyValid.count && tvCandidate.excess < technicallyValid.excess)) technicallyValid = tvCandidate;
    }
    if (technicallyValid) return { opt: technicallyValid.opt, count: technicallyValid.count, reason: 'technical_dc_ac_fit' };
    var singleCap = Math.max(dcKwp * 2.0, dcKwp + 20);
    for (var i = 0; i < a.length; i++) {
      var p = +a[i].power_kw;
      if (p >= dcKwp && p <= singleCap) return { opt: a[i], reason: 'smallest_catalog_unit_covering_dc_kwp', count: 1 };
    }
    var best = null;
    for (var j = 0; j < a.length; j++) {
      var pw = +a[j].power_kw;
      if (!(pw > 0)) continue;
      var count = Math.max(1, Math.ceil(dcKwp / pw));
      var totalKw = count * pw;
      if (totalKw < dcKwp) continue;
      var excess = totalKw - dcKwp;
      if (totalKw / dcKwp > maxOversizeRatio) continue;
      var cost = count * (+a[j].base_usd || 0);
      var cand = { opt: a[j], count: count, excess: excess, cost: cost };
      if (!best || count < best.count || (count === best.count && excess < best.excess - 0.05) || (count === best.count && Math.abs(excess - best.excess) <= 0.05 && cost < best.cost)) best = cand;
    }
    if (!best) {
      var largest = a[a.length - 1];
      return { opt: largest, reason: 'multiple_largest_units_to_cover_dc', count: Math.max(1, Math.ceil(dcKwp / +largest.power_kw)) };
    }
    return { opt: best.opt, reason: best.count === 1 ? 'catalog_unit_covering_dc_kwp' : 'parallel_units_min_excess_covering_dc_kwp', count: best.count };
  }
  function batteryUnit(pricing) {
    var a = (pricing && pricing.battery_options) || CONFIG.pricing.battery_options;
    for (var i = 0; i < a.length; i++) if (+a[i].capacity_kwh === 2.4) return a[i];
    return { capacity_kwh: 2.4, base_usd: 800, source: 'DATABASE' };
  }
  function buildBom(dc, count, pp, invSel, bessReq, pricing) {
    var cm = (pricing && pricing.cost_model) || CONFIG.pricing.cost_model;
    var r = cm.bom_ratios || {};
    var ref = Math.max(1, Math.ceil(count / 42));
    var bu = batteryUnit(pricing);
    var bUnits = bessReq > 0 ? Math.ceil(bessReq / +bu.capacity_kwh) : 0;
    var po = panelOpt(pp, pricing);
    var panelUnit = +po.base_usd_per_w * pp;
    var inv = invSel.opt;
    var invUnit = inv ? +inv.base_usd : null;
    var invQty = inv && dc > 0 ? invSel.count : 0;
    function row(category, item, quantity, unit, unitCost, source, costStatus) {
      var q = nn(quantity), uc = unitCost == null ? null : +unitCost;
      return { category: category, item: item, quantity: q, unit: unit, unitCost: uc, totalCost: uc == null ? null : round2(q * uc), source: source || 'ASSUMPTION', costStatus: costStatus || (uc == null ? 'NOT_PRICED' : 'PRICED') };
    }
    return [
      row('GES', pp + ' Wp Solar Panel', count, 'adet', panelUnit, po.source || 'DATABASE', 'PRICED'),
      row('GES', (inv ? inv.power_kw : 0) + ' kW Inverter', invQty, 'adet', invUnit, inv ? inv.source : 'DATABASE', invUnit == null ? 'NOT_PRICED' : 'PRICED'),
      row('GES', 'DC Cable', Math.round(count * n(r.dc_cable_m_per_panel, 6.19)), 'm', null, 'REFERENCE', 'NOT_PRICED'),
      row('GES', 'AC Cable', Math.round(count * n(r.ac_cable_m_per_panel, 1.67)), 'm', null, 'REFERENCE', 'NOT_PRICED'),
      row('GES', 'MC4 pairs', Math.round(count * n(r.mc4_pairs_per_panel, 4)), 'adet', null, 'REFERENCE', 'NOT_PRICED'),
      row('GES', 'DC SPD sets', Math.round(ref * n(r.dc_spd_sets_per_reference, 2)), 'set', null, 'REFERENCE', 'NOT_PRICED'),
      row('GES', 'Fuse sets', Math.round(ref * n(r.fuse_sets_per_reference, 4)), 'set', null, 'REFERENCE', 'NOT_PRICED'),
      row('GES', 'Mounting Structure', count, 'adet', null, 'ASSUMPTION', 'NOT_PRICED'),
      row('BESS', '2.4 kWh Battery Module', bUnits, 'adet', +bu.base_usd, bu.source || 'DATABASE', bUnits ? 'PRICED' : 'NOT_APPLICABLE'),
      row('BESS', 'BESS connection components', bUnits ? 1 : 0, 'lot', null, 'ASSUMPTION', 'NOT_PRICED'),
      row('FIELD', 'Transportation', 1, 'lot', null, 'ASSUMPTION', 'NOT_PRICED'),
      row('FIELD', 'Installation labor (panel-based)', count, 'panel', n(cm.labor_usd_per_panel, 20), 'DATABASE', 'PRICED'),
      row('FIELD', 'Commissioning', 1, 'lot', null, 'ASSUMPTION', 'NOT_PRICED')
    ];
  }
  function pricing(input, pricingCfg) {
    var c = pricingCfg || CONFIG.pricing, cm = c.cost_model || CONFIG.pricing.cost_model, pm = cm.proportional_model || {};
    var pp = Math.max(1, n(input.panelPowerWp, 620));
    var cnt = Math.max(0, Math.floor(n(input.panelCount)));
    var dc = Math.max(0, n(input.dcCapacityKwp, (cnt * pp) / 1000));
    var po = panelOpt(pp, c), pr = Math.max(0, n(po.base_usd_per_w));
    var panelCost = round2(cnt * pp * pr);
    var invSel = autoInverter(dc, c, input.inverterPowerKw), inv = invSel.opt;
    var invCost = inv ? round2(invSel.count * n(inv.base_usd)) : 0;
    var bessReq = Math.max(0, n(input.bessCapacityKwh)), bu = batteryUnit(c);
    var bUnits = bessReq > 0 ? Math.ceil(bessReq / +bu.capacity_kwh) : 0, installed = round2(bUnits * +bu.capacity_kwh), battCost = round2(bUnits * n(bu.base_usd, 800));
    var laborRate = Math.max(0, n(cm.labor_usd_per_panel, 20)), labor = round2(cnt * laborRate);
    var bos = round2(dc * n(pm.bos_usd_per_kwp, 0) + n(pm.fixed_bos_usd, 0));
    var directMaterial = round2(panelCost + invCost + battCost), directCost = round2(directMaterial + labor), projectCost = round2(directCost + bos);
    var markup = Math.max(0, n(c.markup_pct, 15)), sales = round2(directCost * (1 + markup / 100)), bom = buildBom(dc, cnt, pp, invSel, bessReq, c);
    return {
      currency: c.currency || 'USD', markupPct: markup,
      panel: { powerWp: pp, count: cnt, baseUsdPerW: pr, baseUsd: panelCost, source: po.source || 'DATABASE', provenance: provenance(pr, 'USD/W', po.source || 'DATABASE') },
      inverter: { selection: input.inverterPowerKw > 0 ? 'user_or_auto' : 'auto', powerKw: inv ? +inv.power_kw : 0, type: inv ? inv.type : null, count: invSel.count, unitCost: inv ? +inv.base_usd : 0, baseUsd: invCost, source: inv ? inv.source : 'DATABASE', selectionReason: invSel.reason },
      battery: { requestedCapacityKwh: round2(bessReq), installedCapacityKwh: installed, batteryModuleCount: bUnits, batteryCost: battCost, requestedKwh: round2(bessReq), installedKwh: installed, units: bUnits, baseUsd: battCost, baseUsdPerKwh: installed > 0 ? round2(battCost / installed) : round2(+bu.base_usd / +bu.capacity_kwh), referenceUnitKwh: +bu.capacity_kwh, referenceUnitUsd: +bu.base_usd, basis: 'discrete_2.4kWh_modules_ceiling', provenance: provenance(+bu.base_usd, 'USD/module', 'DATABASE') },
      labor: { rateUsdPerPanel: laborRate, panelCount: cnt, baseUsd: labor, provenance: provenance(laborRate, 'USD/panel', 'DATABASE') },
      bos: { baseUsd: bos, source: 'ASSUMPTION/MODEL', basis: pm.basis || 'proportional BOS/EPC allowance' },
      directMaterial: { baseUsd: directMaterial },
      directCost: { baseUsd: directCost, scope: 'panel + inverter + discrete BESS modules + panel labor' },
      projectCost: { usd: projectCost, baseUsd: projectCost, components: { directCost: directCost, bosAllowance: bos }, basis: 'direct_cost + BOS/EPC model allowance', estimatedPriceUsd: sales },
      commercialPrice: { usd: sales, basis: 'direct_cost_plus_commercial_margin' }, salesPrice: { usd: sales, markupPct: markup }, bom: bom,
      marketPanelUsd: panelCost, marketInverterUsd: invCost, marketPanelInverterUsd: round2(panelCost + invCost)
    };
  }
  function calculateWater(input, selected) {
    selected = selected || {};
    var wantRain = selected.rainwater !== false && nn(input.roofAreaM2) > 0;
    var wantGrey = selected.greywater === true || (selected.greywater !== false && nn(input.monthlyWaterM3) > 0);
    var roof = nn(input.roofAreaM2), m = nn(input.monthlyWaterM3), r = nn(input.rainfallMm || rainfall(input.city)), t = input.roofType || CONFIG.water.defaultRoofType, c = CONFIG.water.roofRunoffCoefficient[t] || 0.75, q = CONFIG.water.firstFlushAndOverflowFactor, demand = m * 12;
    var rain = { selected: false, status: 'NOT_SELECTED' };
    if (wantRain && roof > 0) { var theo = (roof * r) / 1000 * c, usable = theo * q; rain = { selected: true, status: 'CALCULATED', city: input.city || null, rainfallMm: +r.toFixed(1), roofAreaM2: +roof.toFixed(1), roofType: t, annualTheoreticalM3: +theo.toFixed(1), annualUsableM3: +usable.toFixed(1), demandCoveragePct: demand ? +Math.min(100, (usable / demand) * 100).toFixed(1) : 0 }; }
    var grey = { selected: false, status: 'NOT_SELECTED' };
    if (wantGrey && m > 0) { var gm = m * CONFIG.water.greywaterRecoverableRatio, gy = gm * 12 * CONFIG.water.greywaterOperatingLossFactor; grey = { selected: true, status: 'CALCULATED', monthlySourceM3: +gm.toFixed(2), annualUsableM3: +gy.toFixed(1), demandCoveragePct: demand ? +Math.min(100, (gy / demand) * 100).toFixed(1) : 0 }; }
    return { rainfall: rain, greywater: grey, carbon: { energy: null, water: { status: 'FACTOR_REQUIRED' }, wastewater: { status: 'FACTOR_REQUIRED' }, total: { status: 'PARTIAL' } } };
  }
  function validate(result) {
    var issues = [], s = result.solar || {}, p = result.pricing || {}, panelWp = (result.assumptions && result.assumptions.panelPowerWp) || 620;
    var expectedDc = round2(((s.panelCount || 0) * panelWp) / 1000);
    if (Math.abs((s.dcCapacityKwp || 0) - expectedDc) > 0.05) issues.push({ check: 'DC_KWP', expected: expectedDc, actual: s.dcCapacityKwp });
    if (p.battery && p.battery.units != null) {
      var moduleKwh = n(p.battery.referenceUnitKwh, 2.4), moduleUsd = n(p.battery.referenceUnitUsd, 800), inst = round2(p.battery.units * moduleKwh), cost = round2(p.battery.units * moduleUsd);
      if (Math.abs((p.battery.installedKwh || 0) - inst) > 0.05) issues.push({ check: 'BESS_INSTALL', expected: inst, actual: p.battery.installedKwh });
      if (Math.abs((p.battery.baseUsd || 0) - cost) > 0.05) issues.push({ check: 'BESS_COST', expected: cost, actual: p.battery.baseUsd });
    }
    if (p.panel && s.panelCount) { var pc = round2(s.panelCount * panelWp * (p.panel.baseUsdPerW || 0.18)); if (Math.abs((p.panel.baseUsd || 0) - pc) > 0.05) issues.push({ check: 'PANEL_COST', expected: pc, actual: p.panel.baseUsd }); }
    if (p.labor && s.panelCount) { var lab = round2(s.panelCount * n(p.labor.rateUsdPerPanel, 20)); if (Math.abs((p.labor.baseUsd || 0) - lab) > 0.05) issues.push({ check: 'LABOR', expected: lab, actual: p.labor.baseUsd }); }
    var factor = (result.assumptions && result.assumptions.co2FactorKgPerKwh) || 0.42, co2 = Math.round((s.annualProductionKwh || 0) * factor);
    if (Math.abs((s.co2ReductionKg || 0) - co2) > 1) issues.push({ check: 'CO2', expected: co2, actual: s.co2ReductionKg });
    return { ok: issues.length === 0, issues: issues };
  }
  function calculate(input, cfg) {
    input = input || {}; cfg = cfg || {};
    var solarCfg = Object.assign({}, CONFIG.solar, cfg.solar || {}), battCfg = Object.assign({}, CONFIG.battery, cfg.battery || {}), pricingCfg = Object.assign({}, CONFIG.pricing, cfg.pricing || {});
    if (cfg.pricing && cfg.pricing.cost_model) pricingCfg.cost_model = Object.assign({}, CONFIG.pricing.cost_model, cfg.pricing.cost_model);
    var roof = nn(input.roofAreaM2), land = nn(input.landAreaM2), area = roof + (input.landAvailable ? land : 0), panelArea = Math.max(0.5, n(solarCfg.panel_area_m2, 2.6));
    if (area <= 0) throw new Error('En az bir geçerli çatı veya arazi alanı girilmelidir.');
    var pw = Math.max(1, n(input.panelPowerWp != null ? input.panelPowerWp : solarCfg.default_panel_power, 620)), areaPanelCount = Math.max(0, Math.floor(area / panelArea));
    var count = input.panelCountOverride != null && Number.isFinite(Number(input.panelCountOverride)) ? Math.max(0, Math.floor(Number(input.panelCountOverride))) : areaPanelCount;
    var dc = round2((count * pw) / 1000);
    var yieldKwh = Math.max(300, n(input.specificYieldKwhKwp, n(solarCfg.default_specific_yield_kwh_kwp, 1450)));
    var loss = clamp(n(input.systemLossFactorOverride, n(solarCfg.system_loss_factor, 0.85)), 0.1, 1), pr = clamp(n(solarCfg.performance_ratio, 0.8), 0.1, 1), factor = Math.max(0, n(solarCfg.co2_factor, 0.42)), margin = clamp(n(solarCfg.design_margin, 1.1), 0.5, 2);
    var annual = nn(input.annualConsumptionKwh); if (!annual && input.monthlyConsumptionKwh) annual = nn(input.monthlyConsumptionKwh) * 12;
    var production = Math.round(dc * yieldKwh * loss * pr), ratio = annual ? Math.min(1, Math.max(0, (annual * margin) / Math.max(production, 1))) : 0, self = Math.min(annual, production, Math.round(production * ratio)), exp = Math.max(0, production - self), co2 = Math.round(production * factor);
    var daily = annual / 365, night = input.nighttimeShare != null ? clamp(n(input.nighttimeShare), 0, 1) : 0.35, peak = nn(input.peakDemandKw), rec = night >= 0.4 || peak >= Math.max(20, dc * 0.35), bess = 0;
    if (rec && daily > 0) { var target = daily * night * 0.75, dod = clamp(n(battCfg.depth_of_discharge, 0.9), 0.5, 1), rte = clamp(n(battCfg.round_trip_efficiency, 0.95), 0.5, 1); bess = +(target / Math.max(dod * rte, 0.25)).toFixed(1); }
    if (input.bessCapacityKwh != null && nn(input.bessCapacityKwh) > 0) { bess = nn(input.bessCapacityKwh); rec = true; }
    var price = pricing(Object.assign({}, input, { panelPowerWp: pw, panelCount: count, dcCapacityKwp: dc, bessCapacityKwh: bess }), pricingCfg), water = calculateWater({ city: input.city, roofAreaM2: roof, monthlyWaterM3: nn(input.monthlyWaterM3), rainfallMm: input.rainfallMm, roofType: input.roofType }, { rainwater: input.rainwaterSelected === true || (nn(input.monthlyWaterM3) >= 0 && roof > 0), greywater: input.greywaterSelected === true || nn(input.monthlyWaterM3) > 0 });
    if (price.bom && water) {
      if (water.rainfall && water.rainfall.selected) { price.bom.push({ category: 'WATER', item: 'Yağmur suyu hasat sistemi (ön değerlendirme)', quantity: 1, unit: 'sistem', unitCost: null, totalCost: null, source: 'ASSUMPTION', costStatus: 'NOT_PRICED' }); price.bom.push({ category: 'WATER', item: 'Yağmur suyu yıllık kullanılabilir', quantity: water.rainfall.annualUsableM3 || 0, unit: 'm3', unitCost: null, totalCost: null, source: 'DERIVED', costStatus: 'NOT_PRICED' }); }
      if (water.greywater && water.greywater.selected) { price.bom.push({ category: 'WATER', item: 'Gri su dönüşüm sistemi (ön değerlendirme)', quantity: 1, unit: 'sistem', unitCost: null, totalCost: null, source: 'ASSUMPTION', costStatus: 'NOT_PRICED' }); price.bom.push({ category: 'WATER', item: 'Gri su yıllık kullanılabilir', quantity: water.greywater.annualUsableM3 || 0, unit: 'm3', unitCost: null, totalCost: null, source: 'DERIVED', costStatus: 'NOT_PRICED' }); }
    }
    var result = {
      engine: { name: 'VITA Engine Offline Pre-Feasibility Core', version: ENGINE_VERSION, build: BUILD, databaseVersion: DB_VERSION, status: 'active', timestamp: new Date().toISOString() },
      inputs: { roofAreaM2: roof, landAreaM2: land, landAvailable: input.landAvailable === true, panelCountOverride: count, annualConsumptionKwh: annual, city: input.city || null, specificYieldKwhKwp: input.specificYieldKwhKwp != null ? input.specificYieldKwhKwp : null },
      solar: { panelCount: count, dcCapacityKwp: dc, annualProductionKwh: production, selfConsumptionKwh: self, gridExportKwh: exp, co2ReductionKg: co2, emissionFactor: factor, co2Verification: { status: 'assumption_based', factorKgPerKwh: factor }, estimatedAreaM2: +(count * panelArea).toFixed(1) },
      bess: { recommended: rec, suggestedCapacityKwh: bess, requestedCapacityKwh: bess, installedCapacityKwh: price.battery.installedCapacityKwh, batteryModuleCount: price.battery.batteryModuleCount, depthOfDischarge: n(battCfg.depth_of_discharge, 0.9), roundTripEfficiency: n(battCfg.round_trip_efficiency, 0.95) },
      pricing: price, water: water,
      carbon: { energy: { annualProductionKwh: production, emissionFactor: factor, co2ReductionKg: co2, status: 'CALCULATED' }, water: water.carbon.water, wastewater: water.carbon.wastewater, total: { co2ReductionKg: co2, status: 'ENERGY_ONLY' } },
      assumptions: { panelPowerWp: pw, panelAreaM2: panelArea, specificYieldKwhKwp: yieldKwh, specificYieldSource: input.specificYieldKwhKwp != null ? 'MITOS_OR_USER_INPUT' : 'VITA_DEFAULT', systemLossFactor: loss, systemLossSource: input.systemLossFactorOverride != null ? 'MITOS_OR_USER_INPUT' : 'VITA_DEFAULT', performanceRatio: pr, co2FactorKgPerKwh: factor, designMargin: margin },
      warning: 'Bu sonuç ön fizibilite amaçlı yaklaşık hesaplamadır. Nihai sistem tasarımı saha, tüketim ve teknik analiz sonrasında belirlenir.',
      contracts: { anne: { role: 'scenario_and_interpretation_only', mustNot: 'recompute_engineering' }, mitos: { role: 'input_completion_and_scenario_proposal', mustNot: 'override_engine_math' } }
    };
    result.validation = validate(result);
    return result;
  }
  function loadMarketData() {
    if (window.__vitavoltMarketPricing) return Promise.resolve(window.__vitavoltMarketPricing);
    return fetch('/database/calculations.json?v=' + encodeURIComponent(BUILD), { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('fetch failed'); return r.json(); }).then(function (j) {
      if (j.pricing) { CONFIG.pricing = Object.assign({}, CONFIG.pricing, j.pricing); if (j.pricing.cost_model) CONFIG.pricing.cost_model = Object.assign({}, CONFIG.pricing.cost_model, j.pricing.cost_model); }
      if (j.solar) CONFIG.solar = Object.assign({}, CONFIG.solar, j.solar);
      if (j.battery) CONFIG.battery = Object.assign({}, CONFIG.battery, j.battery);
      window.__vitavoltMarketPricing = CONFIG.pricing; return CONFIG.pricing;
    }).catch(function () { window.__vitavoltMarketPricing = CONFIG.pricing; return CONFIG.pricing; });
  }
  window.VitaEngine = { version: ENGINE_VERSION, build: BUILD, config: CONFIG, calculate: calculate, calculateWater: calculateWater, calculatePricing: pricing, validate: validate, cityRainfall: rainfall, loadMarketData: loadMarketData, getPricing: function () { return window.__vitavoltMarketPricing || CONFIG.pricing; } };
})(typeof window !== 'undefined' ? window : global);
