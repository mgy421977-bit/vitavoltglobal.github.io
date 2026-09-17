/**
 * Vitavolt Global — VITA Engine Pre-Feasibility Core v1
 *
 * Technical role:
 * Browser-safe deterministic preliminary feasibility calculator.
 *
 * Pricing is data-driven from /database/calculations.json and is executed
 * through the browser-safe VITA Engine adapter when available.
 */
(function (window) {
  'use strict';

  var DEFAULT_CONFIG = {
    solar: { default_panel_power: 620, system_loss_factor: 0.85, co2_factor: 0.42, performance_ratio: 0.80, design_margin: 1.10, panel_area_m2: 2.6, default_specific_yield_kwh_kwp: 1450 },
    battery: { depth_of_discharge: 0.90, round_trip_efficiency: 0.95, peak_support_hours: 2 },
    pricing: {
      markup_pct: 15, currency: 'USD',
      panel_options: [
        { power_wp: 620, base_usd_per_w: 0.18, source: 'user_catalog' },
        { power_wp: 655, base_usd_per_w: 0.195, source: 'user_catalog' }
      ],
      inverter_options: [
        { power_kw: 6.2, type: 'hybrid', base_usd: 366.36, source: 'derived_from_user_market_reference', confidence: 'derived' },
        { power_kw: 11, type: 'inverter', base_usd: 650, source: 'user_market_reference' },
        { power_kw: 50, type: 'inverter', base_usd: 3000, source: 'user_market_reference' },
        { power_kw: 100, type: 'inverter', base_usd: 3500, source: 'user_market_reference' }
      ],
      cost_model: { market_quote_discount_pct: 10, reference_packages: [] }
    }
  };

  function finite(value, fallback) { var number = Number(value); return Number.isFinite(number) ? number : (fallback || 0); }
  function positive(value) { return Math.max(0, finite(value, 0)); }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function mergeConfig(source) {
    source = source || {};
    return { solar: Object.assign({}, DEFAULT_CONFIG.solar, source.solar || {}), battery: Object.assign({}, DEFAULT_CONFIG.battery, source.battery || {}), pricing: Object.assign({}, DEFAULT_CONFIG.pricing, source.pricing || {}) };
  }
  function findOption(options, value, key) {
    if (!Array.isArray(options) || options.length === 0) return null;
    var target = Number(value);
    if (!Number.isFinite(target)) return null;
    return options.find(function (item) { return Number(item[key]) === target; }) || null;
  }
  function autoInverter(options, dcCapacityKwp) {
    if (!Array.isArray(options) || options.length === 0) return null;
    var sorted = options.slice().sort(function (a, b) { return Number(a.power_kw) - Number(b.power_kw); });
    return sorted.find(function (item) { return Number(item.power_kw) >= dcCapacityKwp; }) || sorted[sorted.length - 1];
  }

  function calculatePricing(input, config, dcCapacityKwp, panelCount) {
    var pricing = config.pricing || {}, markupPct = Math.max(0, finite(pricing.markup_pct, 15)), multiplier = 1 + markupPct / 100;
    var panelOptions = Array.isArray(pricing.panel_options) ? pricing.panel_options : [];
    var inverterOptions = Array.isArray(pricing.inverter_options) ? pricing.inverter_options : [];
    var panelPowerWp = positive(input && input.panelPowerWp) || finite(config.solar.default_panel_power, 620);
    var panelOption = findOption(panelOptions, panelPowerWp, 'power_wp') || panelOptions[0] || null;
    if (panelOption) panelPowerWp = Number(panelOption.power_wp);
    var basePanelUsdPerW = panelOption ? Math.max(0, finite(panelOption.base_usd_per_w, 0)) : 0;
    var panelBaseUsd = panelCount * panelPowerWp * basePanelUsdPerW, panelSellUsd = panelBaseUsd * multiplier;
    var requestedInverterKw = positive(input && input.inverterPowerKw);
    var inverterOption = requestedInverterKw > 0 ? findOption(inverterOptions, requestedInverterKw, 'power_kw') : autoInverter(inverterOptions, dcCapacityKwp);
    var inverterQty = inverterOption ? Math.max(1, Math.ceil(dcCapacityKwp / Number(inverterOption.power_kw))) : 0;
    var inverterBaseUsd = inverterOption ? inverterQty * Math.max(0, finite(inverterOption.base_usd, 0)) : 0, inverterSellUsd = inverterBaseUsd * multiplier;

    if (window.VitaEngine && typeof window.VitaEngine.calculatePricing === 'function') {
      return window.VitaEngine.calculatePricing({
        panelPowerWp: panelPowerWp,
        panelCount: panelCount,
        dcCapacityKwp: dcCapacityKwp,
        inverterPowerKw: requestedInverterKw > 0 ? requestedInverterKw : 'auto',
        bessCapacityKwh: positive(input && input.bessCapacityKwh)
      }, pricing);
    }

    return {
      currency: pricing.currency || 'USD', markupPct: markupPct,
      taxNote: pricing.tax_note || 'Fiyatlar + KDV; KDV hesaplanmaz.',
      source: pricing.provenance || 'configured_market_references',
      panel: { selectedPowerWp: panelPowerWp, unitBaseUsdPerW: basePanelUsdPerW, unitSellUsd: Number((panelPowerWp * basePanelUsdPerW * multiplier).toFixed(2)), quantity: panelCount, baseUsd: Number(panelBaseUsd.toFixed(2)), sellUsd: Number(panelSellUsd.toFixed(2)), referenceSource: panelOption ? panelOption.source : 'not_configured' },
      inverter: { selectedPowerKw: inverterOption ? Number(inverterOption.power_kw) : null, type: inverterOption ? inverterOption.type : null, quantity: inverterQty, unitBaseUsd: inverterOption ? Number(inverterOption.base_usd) : 0, unitSellUsd: inverterOption ? Number((Number(inverterOption.base_usd) * multiplier).toFixed(2)) : 0, baseUsd: Number(inverterBaseUsd.toFixed(2)), sellUsd: Number(inverterSellUsd.toFixed(2)), selectionMode: requestedInverterKw > 0 ? 'user_selected' : 'auto_capacity_fit', referenceSource: inverterOption ? inverterOption.source : 'not_configured', confidence: inverterOption ? (inverterOption.confidence || 'market_reference') : 'not_configured' },
      equipmentSubtotalUsd: Number((panelSellUsd + inverterSellUsd).toFixed(2)),
      projectCost: { usd: Number((panelBaseUsd + inverterBaseUsd).toFixed(2)), estimatedPriceUsd: Number(((panelBaseUsd + inverterBaseUsd) * multiplier).toFixed(2)), basis: 'user_catalog_components', marketReference: null },
      scope: 'panel_plus_inverter_only'
    };
  }

  function calculate(input, configSource) {
    input = input || {};
    var config = mergeConfig(configSource), roof = positive(input.roofAreaM2), land = positive(input.landAreaM2), useLand = input.landAvailable === true;
    var availableArea = roof + (useLand ? land : 0), monthlyConsumption = positive(input.monthlyConsumptionKwh), annualConsumption = positive(input.annualConsumptionKwh) || monthlyConsumption * 12;
    if (availableArea <= 0) throw new Error('En az bir geçerli çatı veya arazi alanı girilmelidir.');
    var panelArea = Math.max(0.5, finite(config.solar.panel_area_m2, 2.6));
    var requestedPanelPower = positive(input.panelPowerWp) || finite(config.solar.default_panel_power, 620);
    var panelPowerOption = findOption(config.pricing.panel_options, requestedPanelPower, 'power_wp');
    var panelPowerWp = panelPowerOption ? Number(panelPowerOption.power_wp) : Math.max(50, requestedPanelPower), panelPowerKw = panelPowerWp / 1000;
    var systemLoss = clamp(finite(config.solar.system_loss_factor, 0.85), 0.1, 1), performanceRatio = clamp(finite(config.solar.performance_ratio, 0.8), 0.1, 1), specificYield = Math.max(300, finite(config.solar.default_specific_yield_kwh_kwp, 1450)), margin = clamp(finite(config.solar.design_margin, 1.1), 0.5, 2), co2Factor = Math.max(0, finite(config.solar.co2_factor, 0.42));
    var panelCount = Math.max(0, Math.floor(availableArea / panelArea)), dcCapacityKwp = Number((panelCount * panelPowerKw).toFixed(1));
    var annualProductionKwh = Math.round(dcCapacityKwp * specificYield * systemLoss * performanceRatio);
    var selfConsumptionRatio = annualConsumption > 0 ? clamp((annualConsumption * margin) / Math.max(annualProductionKwh, 1), 0, 1);
    var selfConsumedKwh = Math.min(annualConsumption, annualProductionKwh, Math.round(annualProductionKwh * selfConsumptionRatio)), gridExportKwh = Math.max(0, annualProductionKwh - selfConsumedKwh), co2ReductionKg = Math.round(annualProductionKwh * co2Factor);
    var dailyConsumptionKwh = annualConsumption > 0 ? annualConsumption / 365 : 0, nighttimeShare = input.nighttimeShare != null ? clamp(finite(input.nighttimeShare, 0), 0, 1) : 0.35, peakDemandKw = positive(input.peakDemandKw);
    var bessRecommended = nighttimeShare >= 0.40 || peakDemandKw >= Math.max(20, dcCapacityKwp * 0.35), suggestedBatteryKwh = 0;
    if (bessRecommended && dailyConsumptionKwh > 0) { var usableTarget = dailyConsumptionKwh * nighttimeShare * 0.75, dod = clamp(finite(config.battery.depth_of_discharge, 0.9), 0.5, 1), rte = clamp(finite(config.battery.round_trip_efficiency, 0.95), 0.5, 1); suggestedBatteryKwh = Number((usableTarget / Math.max(dod * rte, 0.25)).toFixed(1)); }
    var water = null;
    if (window.VitaEngine && typeof window.VitaEngine.calculateWater === 'function') water = window.VitaEngine.calculateWater({ city: input.city, roofAreaM2: roof, monthlyWaterM3: positive(input.monthlyWaterM3), roofType: input.roofType });
    return {
      inputs: { roofAreaM2: roof, landAreaM2: land, landAvailable: useLand, annualConsumptionKwh: annualConsumption },
      solar: { panelCount: panelCount, dcCapacityKwp: dcCapacityKwp, annualProductionKwh: annualProductionKwh, selfConsumptionKwh: selfConsumedKwh, gridExportKwh: gridExportKwh, co2ReductionKg: co2ReductionKg, co2Verification: { status: 'assumption_based', factorKgPerKwh: co2Factor, aiScore: null }, estimatedAreaM2: panelCount * panelArea },
      bess: { recommended: bessRecommended, suggestedCapacityKwh: suggestedBatteryKwh, depthOfDischarge: clamp(finite(config.battery.depth_of_discharge, 0.9), 0.5, 1), roundTripEfficiency: clamp(finite(config.battery.round_trip_efficiency, 0.95), 0.5, 1), verification: { status: 'preliminary', basis: peakDemandKw > 0 || input.nighttimeShare != null ? 'user_profile_inputs' : 'default_assumptions', aiScore: null } },
      pricing: calculatePricing(Object.assign({}, input, { panelPowerWp: panelPowerWp, bessCapacityKwh: suggestedBatteryKwh }), config, dcCapacityKwp, panelCount), water: water,
      assumptions: { panelPowerWp: panelPowerWp, panelAreaM2: panelArea, specificYieldKwhKwp: specificYield, systemLossFactor: systemLoss, performanceRatio: performanceRatio, co2FactorKgPerKwh: co2Factor, designMargin: margin },
      warning: 'Bu sonuç ön fizibilite amaçlı yaklaşık hesaplamadır. Nihai sistem tasarımı saha, tüketim ve teknik analiz sonrasında belirlenir.'
    };
  }

  function formatNumber(value, locale) { return Math.round(finite(value, 0)).toLocaleString(locale || 'tr-TR'); }
  function loadConfig() {
    if (window.__vitavoltCalcConfig) return Promise.resolve(window.__vitavoltCalcConfig);
    return fetch('/database/calculations.json', { credentials: 'same-origin' }).then(function (res) { if (!res.ok) throw new Error('config fetch failed'); return res.json(); }).then(function (json) { window.__vitavoltCalcConfig = mergeConfig(json); return window.__vitavoltCalcConfig; }).catch(function () { window.__vitavoltCalcConfig = mergeConfig(DEFAULT_CONFIG); return window.__vitavoltCalcConfig; });
  }
  window.VitavoltCalculator = { calculate: calculate, calculatePricing: calculatePricing, formatNumber: formatNumber, defaultConfig: DEFAULT_CONFIG, loadConfig: loadConfig, mergeConfig: mergeConfig };
})(window);
