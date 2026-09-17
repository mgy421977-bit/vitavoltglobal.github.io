/* Vitavolt Global — VITA Engine web adapter
 * Browser-safe VITA Engine contract.
 * Water calculations + auditable market-reference pricing.
 * Pricing is a manually curated market-reference layer, not autonomous learning.
 */
(function (window) {
  'use strict';

  var CONFIG = {
    water: {
      rainfallMmByCity: {
        'Aydın': 660.6,
        'Kuşadası': 660.6,
        'İzmir': 700,
        'Ankara': 450,
        'İstanbul': 850
      },
      defaultRainfallMm: 600,
      roofRunoffCoefficient: { Metal: 0.90, Concrete: 0.80, Tile: 0.75 },
      defaultRoofType: 'Tile',
      firstFlushAndOverflowFactor: 0.80,
      greywaterRecoverableRatio: 0.35,
      greywaterOperatingLossFactor: 0.70
    },
    pricing: {
      markup_pct: 15,
      currency: 'USD',
      tax_note: 'Fiyatlar + KDV. %15 fiyat katmani KDV\'nin uzerindedir; KDV hesaplanmaz.',
      panel_options: [
        { power_wp: 620, base_usd_per_w: 0.18, source: 'user_market_reference' },
        { power_wp: 655, base_usd_per_w: 0.195, source: 'user_market_reference' }
      ],
      inverter_options: [
        { power_kw: 6.2, type: 'hybrid', base_usd: 366.36, source: 'estimated_from_11kw_reference' },
        { power_kw: 11, type: 'inverter', base_usd: 650, source: 'user_market_reference' },
        { power_kw: 50, type: 'inverter', base_usd: 3000, source: 'user_market_reference' },
        { power_kw: 100, type: 'inverter', base_usd: 3500, source: 'user_market_reference' }
      ]
    }
  };

  function finite(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function nonNegative(value) { return Math.max(0, finite(value, 0)); }

  function cityRainfall(city) {
    var name = String(city || '').trim();
    return CONFIG.water.rainfallMmByCity[name] || CONFIG.water.defaultRainfallMm;
  }

  function calculateWater(input) {
    input = input || {};
    var roofAreaM2 = nonNegative(input.roofAreaM2);
    var monthlyWaterM3 = nonNegative(input.monthlyWaterM3);
    var rainfallMm = nonNegative(input.rainfallMm || cityRainfall(input.city));
    var roofType = input.roofType || CONFIG.water.defaultRoofType;
    var runoffCoefficient = CONFIG.water.roofRunoffCoefficient[roofType] || 0.75;
    var collectionFactor = CONFIG.water.firstFlushAndOverflowFactor;
    var annualTheoreticalRainwaterM3 = roofAreaM2 * rainfallMm / 1000 * runoffCoefficient;
    var annualUsableRainwaterM3 = annualTheoreticalRainwaterM3 * collectionFactor;
    var monthlyGreywaterM3 = monthlyWaterM3 * CONFIG.water.greywaterRecoverableRatio;
    var annualGreywaterM3 = monthlyGreywaterM3 * 12 * CONFIG.water.greywaterOperatingLossFactor;
    var annualDemandM3 = monthlyWaterM3 * 12;

    return {
      rainfall: {
        city: input.city || null,
        rainfallMm: Number(rainfallMm.toFixed(1)),
        roofAreaM2: Number(roofAreaM2.toFixed(1)),
        roofType: roofType,
        annualTheoreticalM3: Number(annualTheoreticalRainwaterM3.toFixed(1)),
        annualUsableM3: Number(annualUsableRainwaterM3.toFixed(1)),
        demandCoveragePct: annualDemandM3 > 0 ? Number(Math.min(100, annualUsableRainwaterM3 / annualDemandM3 * 100).toFixed(1)) : 0
      },
      greywater: {
        monthlySourceM3: Number(monthlyGreywaterM3.toFixed(2)),
        annualUsableM3: Number(annualGreywaterM3.toFixed(1)),
        demandCoveragePct: annualDemandM3 > 0 ? Number(Math.min(100, annualGreywaterM3 / annualDemandM3 * 100).toFixed(1)) : 0
      },
      assumptions: {
        runoffCoefficient: runoffCoefficient,
        firstFlushAndOverflowFactor: collectionFactor,
        greywaterRecoverableRatio: CONFIG.water.greywaterRecoverableRatio,
        greywaterOperatingLossFactor: CONFIG.water.greywaterOperatingLossFactor,
        note: 'Yağmur ve gri su miktarı ön fizibilitedir; aylık su dengesi, depo hacmi ve tesisat ayrımı sahada doğrulanmalıdır.'
      }
    };
  }

  function findPanelOption(powerWp, pricing) {
    var options = (pricing && pricing.panel_options) || [];
    var target = finite(powerWp, 0);
    for (var i = 0; i < options.length; i++) if (Number(options[i].power_wp) === target) return options[i];
    return options.length ? options[0] : null;
  }

  function findInverterOption(powerKw, pricing) {
    var options = (pricing && pricing.inverter_options) || [];
    var target = finite(powerKw, 0);
    if (!target || String(powerKw) === 'auto') return null;
    for (var i = 0; i < options.length; i++) if (Number(options[i].power_kw) === target) return options[i];
    return options.length ? options[0] : null;
  }

  function chooseAutoInverter(dcCapacityKwp, pricing) {
    var options = ((pricing && pricing.inverter_options) || []).slice().sort(function (a, b) { return Number(a.power_kw) - Number(b.power_kw); });
    if (!options.length) return null;
    for (var i = 0; i < options.length; i++) if (Number(options[i].power_kw) >= dcCapacityKwp) return options[i];
    return options[options.length - 1];
  }

  function calculatePricing(input, pricingSource) {
    input = input || {};
    var pricing = pricingSource || CONFIG.pricing;
    var markupPct = Math.max(0, finite(pricing.markup_pct, 15));
    var markup = 1 + markupPct / 100;
    var panelPowerWp = Math.max(1, finite(input.panelPowerWp, 620));
    var panelCount = Math.max(0, Math.floor(finite(input.panelCount, 0)));
    var dcCapacityKwp = Math.max(0, finite(input.dcCapacityKwp, panelCount * panelPowerWp / 1000));
    var panelOption = findPanelOption(panelPowerWp, pricing);
    var panelUsdPerW = panelOption ? Math.max(0, finite(panelOption.base_usd_per_w, 0)) : 0;
    var panelBaseUsd = panelCount * panelPowerWp * panelUsdPerW;
    var requestedInverter = input.inverterPowerKw;
    var inverterOption = (requestedInverter && requestedInverter !== 'auto') ? findInverterOption(requestedInverter, pricing) : chooseAutoInverter(dcCapacityKwp, pricing);
    var inverterCount = 0;
    if (inverterOption && dcCapacityKwp > 0) inverterCount = Math.max(1, Math.ceil(dcCapacityKwp / Number(inverterOption.power_kw)));
    var inverterBaseUsd = inverterCount * (inverterOption ? Math.max(0, finite(inverterOption.base_usd, 0)) : 0);
    var baseTotalUsd = panelBaseUsd + inverterBaseUsd;
    var sellTotalUsd = baseTotalUsd * markup;

    return {
      currency: pricing.currency || 'USD',
      markupPct: markupPct,
      taxNote: pricing.tax_note || 'KDV hesaplanmaz.',
      panel: {
        powerWp: panelPowerWp,
        count: panelCount,
        baseUsdPerW: panelUsdPerW,
        baseUsd: Number(panelBaseUsd.toFixed(2)),
        sellUsd: Number((panelBaseUsd * markup).toFixed(2)),
        source: panelOption ? panelOption.source : 'not_available'
      },
      inverter: {
        selection: requestedInverter || 'auto',
        powerKw: inverterOption ? Number(inverterOption.power_kw) : 0,
        type: inverterOption ? inverterOption.type : null,
        count: inverterCount,
        baseUnitUsd: inverterOption ? Number(inverterOption.base_usd) : 0,
        baseUsd: Number(inverterBaseUsd.toFixed(2)),
        sellUsd: Number((inverterBaseUsd * markup).toFixed(2)),
        source: inverterOption ? inverterOption.source : 'not_available'
      },
      total: {
        baseUsd: Number(baseTotalUsd.toFixed(2)),
        sellUsd: Number(sellTotalUsd.toFixed(2)),
        scope: 'panel_plus_selected_inverter_only'
      },
      verification: {
        status: 'market_reference',
        note: 'Fiyatlar kullanıcı tarafından sağlanan piyasa referanslarına dayanır; %15 fiyat katmanı üzerine eklenmiştir. KDV, konstrüksiyon, kablo, koruma, işçilik, nakliye ve diğer EPC kalemleri dahil değildir.'
      }
    };
  }

  function mergePricing(source) {
    if (!source) return CONFIG.pricing;
    var merged = Object.assign({}, CONFIG.pricing, source);
    if (Array.isArray(source.panel_options)) merged.panel_options = source.panel_options;
    if (Array.isArray(source.inverter_options)) merged.inverter_options = source.inverter_options;
    return merged;
  }

  function loadMarketData() {
    if (window.__vitavoltMarketPricing) return Promise.resolve(window.__vitavoltMarketPricing);
    return fetch('/database/calculations.json', { credentials: 'same-origin' })
      .then(function (res) { if (!res.ok) throw new Error('market data fetch failed'); return res.json(); })
      .then(function (json) {
        window.__vitavoltMarketPricing = mergePricing(json.pricing);
        CONFIG.pricing = window.__vitavoltMarketPricing;
        return window.__vitavoltMarketPricing;
      })
      .catch(function () {
        window.__vitavoltMarketPricing = CONFIG.pricing;
        return CONFIG.pricing;
      });
  }

  window.VitaEngine = {
    version: 'web-contract-1.1',
    config: CONFIG,
    calculateWater: calculateWater,
    calculatePricing: calculatePricing,
    cityRainfall: cityRainfall,
    loadMarketData: loadMarketData,
    getPricing: function () { return window.__vitavoltMarketPricing || CONFIG.pricing; }
  };
})(window);
