/* Vitavolt Global — MITOS CORE | build 2026-09-17-mitos-v3
 * Role: research / complete / validate INPUTS for VITA Engine.
 * Does NOT compute engineering values. VITA is the sole math authority.
 * Solar climate layer: 81 Turkish provinces, PVGIS v5.2 reference values.
 * Rainfall remains station/city-table data where available; otherwise explicit fallback.
 */
(function (window) {
  'use strict';
  var VERSION = '0.3.0-offline';
  var BUILD = '2026-09-17-mitos-v3-81-city-solar';

  /*
   * Specific yield values: kWh/kWp/year.
   * Reference: PVGIS v5.2, province-center, fixed 30° south, 14% system loss
   * as published in the 81-province reference table used for this layer.
   * These are climate inputs, not VITA engineering outputs.
   */
  var YIELD = {
    'antalya':1620,'mersin':1610,'burdur':1610,'niğde':1610,'nigde':1610,
    'izmir':1590,'aydın':1590,'aydin':1590,'muğla':1590,'mugla':1590,
    'gaziantep':1580,'şanlıurfa':1580,'sanliurfa':1580,'adıyaman':1580,'adiyaman':1580,
    'karaman':1580,'mardin':1570,'aksaray':1570,'kilis':1570,'konya':1560,
    'hatay':1560,'uşak':1560,'usak':1560,'adana':1550,'kahramanmaraş':1550,'kahramanmaras':1550,
    'kırşehir':1530,'kirsehir':1530,'çanakkale':1520,'canakkale':1520,'ısparta':1510,'isparta':1510,
    'denizli':1500,'batman':1500,'şırnak':1500,'sirnak':1500,'diyarbakır':1490,'diyarbakir':1490,
    'malatya':1490,'elazığ':1490,'elazig':1490,'hakkari':1490,'siirt':1490,'kırıkkale':1490,'kirikkale':1490,
    'tunceli':1480,'ankara':1470,'afyonkarahisar':1470,'van':1470,'nevşehir':1460,'nevsehir':1460,
    'yozgat':1450,'eskişehir':1440,'eskisehir':1440,'kayseri':1440,'balıkesir':1430,'balikesir':1430,
    'kütahya':1430,'kutahya':1430,'bingöl':1430,'bingol':1430,'çankırı':1430,'cankiri':1430,
    'bitlis':1420,'sivas':1420,'osmaniye':1420,'manisa':1410,'erzincan':1410,'çorum':1390,'corum':1390,
    'kırklareli':1390,'kirklareli':1390,'istanbul':1380,'edirne':1380,'bayburt':1380,'ağrı':1370,'agri':1370,
    'iğdır':1360,'igdir':1360,'tekirdağ':1350,'tekirdag':1350,'karabük':1350,'karabuk':1350,
    'amasya':1340,'bilecik':1340,'bartın':1340,'bartin':1340,'yalova':1340,'erzurum':1330,'bursa':1320,
    'tokat':1320,'gümüşhane':1310,'gumushane':1310,'kastamonu':1310,'muş':1310,'mus':1310,'zonguldak':1310,
    'kars':1300,'artvin':1280,'bolu':1280,'sinop':1280,'kocaeli':1270,'sakarya':1260,'ardahan':1240,
    'düzce':1210,'duzce':1210,'samsun':1200,'ordu':1150,'giresun':1070,'trabzon':1060,'rize':1020
  };

  /* Existing rainfall reference values are retained where already validated in the project. */
  var RAINFALL = {
    'izmir':700,
    'kuşadası':660,'kusadasi':660,
    'aydın':660,'aydin':660,
    'ankara':450,
    'istanbul':850,
    'konya':350,
    'antalya':1100,
    'bursa':700,
    'gaziantep':450,
    'adana':650,
    'muğla':1200,'mugla':1200
  };

  var COORDS = {
    'izmir':[38.42,27.14],'kuşadası':[37.86,27.26],'kusadasi':[37.86,27.26],
    'aydın':[37.84,27.85],'aydin':[37.84,27.85],'ankara':[39.93,32.86],
    'istanbul':[41.01,28.98],'konya':[37.87,32.48],'antalya':[36.90,30.70],
    'bursa':[40.19,29.06],'gaziantep':[37.07,37.38],'adana':[37.00,35.32],
    'muğla':[37.22,28.37],'mugla':[37.22,28.37]
  };

  var CITY_NAMES = [
    'Adana','Adıyaman','Afyonkarahisar','Ağrı','Aksaray','Amasya','Ankara','Antalya','Ardahan','Artvin','Aydın','Balıkesir','Bartın','Batman','Bayburt','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Düzce','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Iğdır','Isparta','İstanbul','İzmir','Kahramanmaraş','Karabük','Karaman','Kars','Kastamonu','Kayseri','Kırıkkale','Kırklareli','Kırşehir','Kilis','Kocaeli','Konya','Kütahya','Malatya','Manisa','Mardin','Mersin','Muğla','Muş','Nevşehir','Niğde','Ordu','Osmaniye','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas','Şanlıurfa','Şırnak','Tekirdağ','Tokat','Trabzon','Tunceli','Uşak','Van','Yalova','Yozgat','Zonguldak'
  ];

  function n(v, fb) { var x = Number(v); return Number.isFinite(x) ? x : (fb !== undefined ? fb : 0); }
  function clone(x) { return JSON.parse(JSON.stringify(x || {})); }
  function normCity(c) { return String(c || '').trim().toLocaleLowerCase('tr-TR'); }

  function resolveCity(city) {
    var key = normCity(city);
    if (YIELD[key] !== undefined) {
      var coords = COORDS[key] || [null, null];
      return {
        key:key,
        data:{lat:coords[0],lon:coords[1],rainfallMm:RAINFALL[key] !== undefined ? RAINFALL[key] : null,yieldKwhKwp:YIELD[key]},
        source:'CITY_TABLE_81_PVGIS_V52'
      };
    }
    /* Backward-compatible partial matching for Turkish spellings / user text. */
    for (var k in YIELD) {
      if (key.indexOf(k) !== -1 || k.indexOf(key) !== -1) {
        var c = COORDS[k] || [null,null];
        return {key:k,data:{lat:c[0],lon:c[1],rainfallMm:RAINFALL[k] !== undefined ? RAINFALL[k] : null,yieldKwhKwp:YIELD[k]},source:'CITY_TABLE_81_PVGIS_V52_PARTIAL'};
      }
    }
    return {key:key || null,data:{lat:null,lon:null,rainfallMm:600,yieldKwhKwp:1430},source:'DEFAULT_FALLBACK'};
  }

  function completeInputs(raw) {
    raw = clone(raw || {});
    var sources = {};
    var missing = [];
    var notes = [];
    var cityRes = resolveCity(raw.city);
    sources.city = cityRes.source;
    sources.coords = cityRes.data.lat != null ? cityRes.source : 'NOT_AVAILABLE_CITY_COORDS';
    sources.specificYieldKwhKwp = cityRes.source;
    sources.rainfallMm = cityRes.data.rainfallMm != null ? 'CITY_RAINFALL_REFERENCE' : 'DEFAULT_RAINFALL_FALLBACK';
    var roof = n(raw.roofAreaM2, 0);
    var land = n(raw.landAreaM2, 0);
    var isRoof = roof > 0;
    var roofLoss = isRoof ? 0.20 : 0;
    sources.roofOrientationLossPct = isRoof ? 'ASSUMPTION_ROOF_ORIENTATION_20PCT' : 'NOT_APPLICABLE';
    if (!raw.city || !String(raw.city).trim()) missing.push({ key:'city', label:'Tesis şehri' });
    if (roof <= 0 && land <= 0 && !raw.landAvailable) missing.push({ key:'area', label:'Çatı veya arazi alanı' });
    if (!n(raw.monthlyConsumptionKwh,0) && !n(raw.annualConsumptionKwh,0)) missing.push({ key:'consumption', label:'Aylık veya yıllık elektrik tüketimi' });

    var input = clone(raw);
    input.lat = cityRes.data.lat;
    input.lon = cityRes.data.lon;
    input.rainfallMm = n(raw.rainfallMm, cityRes.data.rainfallMm != null ? cityRes.data.rainfallMm : 600);
    input.specificYieldKwhKwp = n(raw.specificYieldKwhKwp, cityRes.data.yieldKwhKwp);
    input.roofOrientationLossPct = roofLoss * 100;
    input.systemLossFactorOverride = isRoof ? Math.max(0.1, 0.85 * (1 - roofLoss)) : undefined;
    input.greywaterSelected = raw.greywaterSelected === true || n(raw.monthlyWaterM3,0) > 0;
    input.rainwaterSelected = raw.rainwaterSelected === true || roof > 0;
    input._mitos = {
      version:VERSION,build:BUILD,sources:sources,cityResolved:cityRes.key,
      climateSource:'PVGIS_V5_2_81_PROVINCE_REFERENCE',
      rainfallSource:sources.rainfallMm,
      futureSources:['PVGIS_LIVE','NASA_POWER'],
      roofOrientationLossApplied:isRoof,notes:notes
    };
    return {
      version:VERSION,build:BUILD,status:missing.length?'INCOMPLETE_BUT_USABLE':'READY_FOR_VITA',readyForVita:true,
      input:input,sources:sources,missing:missing,
      rules:[
        'MITOS does not calculate engineering values.',
        'VITA Engine is the sole deterministic calculator.',
        '81-province solar climate defaults use the PVGIS v5.2 reference layer.',
        'Rainfall uses validated city references where available; otherwise the fallback is explicitly tagged.',
        'Roof systems carry a 20% orientation/roof loss assumption tag.'
      ]
    };
  }

  function propose(input) {
    input = clone(input);
    var scenarios = [];
    scenarios.push({id:'BASELINE',label:'Mevcut kullanıcı verisi',input:clone(input),reason:'Referans senaryo; kullanıcı girdileri değiştirilmez.'});
    var roof=n(input.roofAreaM2,0),cons=n(input.monthlyConsumptionKwh,0),night=n(input.nighttimeShare,0);
    if (roof>0) { var solarPlus=clone(input); solarPlus.roofAreaM2=roof*1.10; scenarios.push({id:'SOLAR_HEADROOM',label:'+10% çatı kullanım senaryosu',input:solarPlus,reason:'Çatı alanı kullanılabilirliği doğrulanırsa üretim kapasitesi etkisini test etmek.'}); }
    if (cons>0) { var efficiency=clone(input); efficiency.annualConsumptionKwh=cons*12*0.90; efficiency.monthlyConsumptionKwh=cons*0.90; scenarios.push({id:'EFFICIENCY',label:'%10 tüketim verimliliği senaryosu',input:efficiency,reason:'Enerji verimliliği varsayımının sistem boyutlandırmasına etkisini test etmek.'}); }
    if (night>0) { var storage=clone(input); storage.nighttimeShare=Math.min(1,night+0.10); scenarios.push({id:'LOAD_SHIFT',label:'+10 puan gece yükü / BESS senaryosu',input:storage,reason:'Yük kaydırmanın BESS ön değerlendirmesine etkisini test etmek.'}); }
    return {version:VERSION,build:BUILD,status:'PROPOSALS_ONLY',objective:'compare_candidate_scenarios_without_overriding_vita_math',scenarios:scenarios,rules:['MITOS does not calculate engineering values.','Every candidate must be evaluated by VITA Engine.','MITOS cannot override validated VITA outputs.','Human approval is required for project decisions.']};
  }

  window.MitosCore = {version:VERSION,build:BUILD,cityNames:CITY_NAMES,yieldByCity:YIELD,completeInputs:completeInputs,propose:propose,resolveCity:resolveCity};
})(typeof window !== 'undefined' ? window : global);
