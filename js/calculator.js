/* Vitavolt Global — Central preliminary feasibility calculator */
(function (window) {
  'use strict';

  var DEFAULT_CONFIG = {
    solar: {
      default_panel_power: 620,
      system_loss_factor: 0.85,
      co2_factor: 0.42,
      performance_ratio: 0.80,
      design_margin: 1.10,
      panel_area_m2: 2.6,
      default_specific_yield_kwh_kwp: 1450
    },
    battery: {
      depth_of_discharge: 0.90,
      round_trip_efficiency: 0.95,
      peak_support_hours: 2
    }
  };

  function finite(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : (fallback || 0);
  }

  function positive(value) {
    return Math.max(0, finite(value, 0));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function mergeConfig(source) {
    source = source || {};
    return {
      solar: Object.assign({}, DEFAULT_CONFIG.solar, source.solar || {}),
      battery: Object.assign({}, DEFAULT_CONFIG.battery, source.battery || {})
    };
  }

  function calculate(input, configSource) {
    var config = mergeConfig(configSource);
    var roof = positive(input && input.roofAreaM2);
    var land = positive(input && input.landAreaM2);
    var useLand = input && input.landAvailable === true;
    var availableArea = roof + (useLand ? land : 0);
    var monthlyConsumption = positive(input && input.monthlyConsumptionKwh);
    var annualConsumption = positive(input && input.annualConsumptionKwh) || monthlyConsumption * 12;

    if (availableArea <= 0) {
      throw new Error('En az bir geçerli çatı veya arazi alanı girilmelidir.');
    }

    var panelArea = Math.max(0.5, finite(config.solar.panel_area_m2, 2.6));
    var panelPowerKw = Math.max(0.05, finite(config.solar.default_panel_power, 620) / 1000);
    var systemLoss = clamp(finite(config.solar.system_loss_factor, 0.85), 0.1, 1);
    var performanceRatio = clamp(finite(config.solar.performance_ratio, 0.8), 0.1, 1);
    var specificYield = Math.max(300, finite(config.solar.default_specific_yield_kwh_kwp, 1450));
    var margin = clamp(finite(config.solar.design_margin, 1.1), 0.5, 2);
    var co2Factor = Math.max(0, finite(config.solar.co2_factor, 0.42));

    var theoreticalPanels = Math.floor(availableArea / panelArea);
    var panelCount = Math.max(0, theoreticalPanels);
    var dcCapacityKwp = Number((panelCount * panelPowerKw).toFixed(1));
    var annualProductionKwh = Math.round(dcCapacityKwp * specificYield * systemLoss * performanceRatio);
    var selfConsumptionRatio = annualConsumption > 0
      ? clamp((annualConsumption * margin) / Math.max(annualProductionKwh, 1), 0, 1)
      : 0;
    var selfConsumedKwh = Math.min(annualProductionKwh, Math.round(annualProductionKwh * selfConsumptionRatio));
    var gridExportKwh = Math.max(0, annualProductionKwh - selfConsumedKwh);
    var co2ReductionKg = Math.round(annualProductionKwh * co2Factor);

    var dailyConsumptionKwh = annualConsumption > 0 ? annualConsumption / 365 : 0;
    var nighttimeShare = input && input.nighttimeShare != null ? clamp(finite(input.nighttimeShare, 0), 0, 1) : 0.35;
    var peakDemandKw = positive(input && input.peakDemandKw);
    var bessRecommended = nighttimeShare >= 0.40 || peakDemandKw >= Math.max(20, dcCapacityKwp * 0.35);
    var suggestedBatteryKwh = 0;
    if (bessRecommended && dailyConsumptionKwh > 0) {
      var usableTarget = dailyConsumptionKwh * nighttimeShare * 0.75;
      var dod = clamp(finite(config.battery.depth_of_discharge, 0.9), 0.5, 1);
      var rte = clamp(finite(config.battery.round_trip_efficiency, 0.95), 0.5, 1);
      suggestedBatteryKwh = Number((usableTarget / Math.max(dod * rte, 0.25)).toFixed(1));
    }

    return {
      inputs: {
        roofAreaM2: roof,
        landAreaM2: land,
        landAvailable: useLand,
        annualConsumptionKwh: annualConsumption
      },
      solar: {
        panelCount: panelCount,
        dcCapacityKwp: dcCapacityKwp,
        annualProductionKwh: annualProductionKwh,
        selfConsumptionKwh: selfConsumedKwh,
        gridExportKwh: gridExportKwh,
        co2ReductionKg: co2ReductionKg,
        estimatedAreaM2: panelCount * panelArea
      },
      bess: {
        recommended: bessRecommended,
        suggestedCapacityKwh: suggestedBatteryKwh,
        depthOfDischarge: clamp(finite(config.battery.depth_of_discharge, 0.9), 0.5, 1),
        roundTripEfficiency: clamp(finite(config.battery.round_trip_efficiency, 0.95), 0.5, 1)
      },
      assumptions: {
        panelPowerWp: Math.round(panelPowerKw * 1000),
        panelAreaM2: panelArea,
        specificYieldKwhKwp: specificYield,
        systemLossFactor: systemLoss,
        performanceRatio: performanceRatio,
        co2FactorKgPerKwh: co2Factor,
        designMargin: margin
      },
      warning: 'Bu sonuç ön fizibilite amaçlı yaklaşık hesaplamadır. Nihai sistem tasarımı saha, tüketim ve teknik analiz sonrasında belirlenir.'
    };
  }

  function formatNumber(value, locale) {
    return Math.round(finite(value, 0)).toLocaleString(locale || 'tr-TR');
  }

  function loadConfig() {
    if (window.__vitavoltCalcConfig) {
      return Promise.resolve(window.__vitavoltCalcConfig);
    }
    return fetch('/database/calculations.json', { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('config fetch failed');
        return res.json();
      })
      .then(function (json) {
        window.__vitavoltCalcConfig = mergeConfig(json);
        return window.__vitavoltCalcConfig;
      })
      .catch(function () {
        window.__vitavoltCalcConfig = DEFAULT_CONFIG;
        return DEFAULT_CONFIG;
      });
  }

  window.VitavoltCalculator = {
    calculate: calculate,
    formatNumber: formatNumber,
    defaultConfig: DEFAULT_CONFIG,
    loadConfig: loadConfig,
    mergeConfig: mergeConfig
  };
})(window);
