/* Vitavolt Global — VITA Engine web adapter
 * Browser-safe implementation of the shared VITA Engine contract.
 * This module keeps assumptions explicit and returns traceable water/BESS results.
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
      roofRunoffCoefficient: {
        Metal: 0.90,
        Concrete: 0.80,
        Tile: 0.75
      },
      defaultRoofType: 'Tile',
      firstFlushAndOverflowFactor: 0.80,
      greywaterRecoverableRatio: 0.35,
      greywaterOperatingLossFactor: 0.70
    }
  };

  function finite(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function nonNegative(value) {
    return Math.max(0, finite(value, 0));
  }

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
        demandCoveragePct: annualDemandM3 > 0
          ? Number(Math.min(100, annualUsableRainwaterM3 / annualDemandM3 * 100).toFixed(1))
          : 0
      },
      greywater: {
        monthlySourceM3: Number(monthlyGreywaterM3.toFixed(2)),
        annualUsableM3: Number(annualGreywaterM3.toFixed(1)),
        demandCoveragePct: annualDemandM3 > 0
          ? Number(Math.min(100, annualGreywaterM3 / annualDemandM3 * 100).toFixed(1))
          : 0
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

  window.VitaEngine = {
    version: 'web-contract-1.0',
    config: CONFIG,
    calculateWater: calculateWater,
    cityRainfall: cityRainfall
  };
})(window);
