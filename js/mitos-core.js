/* Vitavolt Global — MITOS CORE | build 2026-09-17-mitos-v2
 * Role: research / complete / validate INPUTS for VITA Engine.
 * Does NOT compute engineering values. VITA is sole math authority.
 * Future: PVGIS + NASA POWER live fetch (currently city-table fallback).
 */
(function (window) {
  'use strict';
  var VERSION = '0.2.0-offline';
  var BUILD = '2026-09-17-mitos-v2';

  var CITY = {
    'izmir': { lat: 38.42, lon: 27.14, rainfallMm: 700, yieldKwhKwp: 1480 },
    'kuşadası': { lat: 37.86, lon: 27.26, rainfallMm: 660, yieldKwhKwp: 1500 },
    'kusadasi': { lat: 37.86, lon: 27.26, rainfallMm: 660, yieldKwhKwp: 1500 },
    'aydın': { lat: 37.84, lon: 27.85, rainfallMm: 660, yieldKwhKwp: 1500 },
    'aydin': { lat: 37.84, lon: 27.85, rainfallMm: 660, yieldKwhKwp: 1500 },
    'ankara': { lat: 39.93, lon: 32.86, rainfallMm: 450, yieldKwhKwp: 1450 },
    'istanbul': { lat: 41.01, lon: 28.98, rainfallMm: 850, yieldKwhKwp: 1320 },
    'konya': { lat: 37.87, lon: 32.48, rainfallMm: 350, yieldKwhKwp: 1550 },
    'antalya': { lat: 36.90, lon: 30.70, rainfallMm: 1100, yieldKwhKwp: 1550 },
    'bursa': { lat: 40.19, lon: 29.06, rainfallMm: 700, yieldKwhKwp: 1380 },
    'gaziantep': { lat: 37.07, lon: 37.38, rainfallMm: 450, yieldKwhKwp: 1520 },
    'adana': { lat: 37.00, lon: 35.32, rainfallMm: 650, yieldKwhKwp: 1500 },
    'muğla': { lat: 37.22, lon: 28.37, rainfallMm: 1200, yieldKwhKwp: 1480 },
    'mugla': { lat: 37.22, lon: 28.37, rainfallMm: 1200, yieldKwhKwp: 1480 }
  };

  var ROOF_ORIENTATION_LOSS = 0.20;

  function n(v, fb) { var x = Number(v); return Number.isFinite(x) ? x : (fb !== undefined ? fb : 0); }
  function clone(x) { return JSON.parse(JSON.stringify(x || {})); }
  function normCity(c) { return String(c || '').trim().toLocaleLowerCase('tr-TR'); }

  function resolveCity(city) {
    var key = normCity(city);
    if (CITY[key]) return { key: key, data: CITY[key], source: 'CITY_TABLE' };
    for (var k in CITY) {
      if (key.indexOf(k) !== -1 || k.indexOf(key) !== -1) return { key: k, data: CITY[k], source: 'CITY_TABLE_PARTIAL' };
    }
    return { key: key || null, data: { lat: null, lon: null, rainfallMm: 600, yieldKwhKwp: 1450 }, source: 'DEFAULT_FALLBACK' };
  }

  function completeInputs(raw) {
    raw = clone(raw || {});
    var sources = {};
    var missing = [];
    var notes = [];
    var cityRes = resolveCity(raw.city);
    sources.city = sources.coords = sources.rainfallMm = sources.specificYieldKwhKwp = cityRes.source;
    var roof = n(raw.roofAreaM2, 0);
    var land = n(raw.landAreaM2, 0);
    var isRoof = roof > 0;
    var roofLoss = isRoof ? ROOF_ORIENTATION_LOSS : 0;
    sources.roofOrientationLossPct = isRoof ? 'ASSUMPTION_ROOF_ORIENTATION_20PCT' : 'NOT_APPLICABLE';
    if (!raw.city || !String(raw.city).trim()) missing.push({ key: 'city', label: 'Tesis şehri' });
    if (roof <= 0 && land <= 0 && !raw.landAvailable) missing.push({ key: 'area', label: 'Çatı veya arazi alanı' });
    if (!n(raw.monthlyConsumptionKwh, 0) && !n(raw.annualConsumptionKwh, 0)) {
      missing.push({ key: 'consumption', label: 'Aylık veya yıllık elektrik tüketimi' });
    }
    var input = clone(raw);
    input.lat = cityRes.data.lat;
    input.lon = cityRes.data.lon;
    input.rainfallMm = n(raw.rainfallMm, cityRes.data.rainfallMm);
    input.specificYieldKwhKwp = n(raw.specificYieldKwhKwp, cityRes.data.yieldKwhKwp);
    input.roofOrientationLossPct = roofLoss * 100;
    input.systemLossFactorOverride = isRoof ? Math.max(0.1, 0.85 * (1 - roofLoss)) : undefined;
    input.greywaterSelected = raw.greywaterSelected === true || n(raw.monthlyWaterM3, 0) > 0;
    input.rainwaterSelected = raw.rainwaterSelected === true || roof > 0;
    input._mitos = {
      version: VERSION, build: BUILD, sources: sources, cityResolved: cityRes.key,
      climateSource: 'OFFLINE_CITY_TABLE', futureSources: ['PVGIS', 'NASA_POWER'],
      roofOrientationLossApplied: isRoof, notes: notes
    };
    return {
      version: VERSION, build: BUILD,
      status: missing.length ? 'INCOMPLETE_BUT_USABLE' : 'READY_FOR_VITA',
      readyForVita: true, input: input, sources: sources, missing: missing,
      rules: [
        'MITOS does not calculate engineering values.',
        'VITA Engine is the sole deterministic calculator.',
        'Climate defaults are CITY_TABLE until PVGIS/NASA live.',
        'Roof systems carry 20% orientation/roof loss assumption tag.'
      ]
    };
  }

  function propose(input) {
    input = clone(input);
    var scenarios = [];
    scenarios.push({ id: 'BASELINE', label: 'Mevcut kullanıcı verisi', input: clone(input), reason: 'Referans senaryo; kullanıcı girdileri değiştirilmez.' });
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
      version: VERSION, build: BUILD, status: 'PROPOSALS_ONLY',
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

  window.MitosCore = {
    version: VERSION, build: BUILD,
    completeInputs: completeInputs, propose: propose, resolveCity: resolveCity
  };
})(typeof window !== 'undefined' ? window : global);
