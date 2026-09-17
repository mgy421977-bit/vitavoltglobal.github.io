/* Vitavolt Global — VITA Engine web adapter
 * Browser-safe VITA Engine contract.
 * Water + market pricing + proportional project cost + BOM/report data.
 * All derived costs are explicitly marked as preliminary/oransal.
 */
(function (window) {
  'use strict';

  var CONFIG = {
    water: {
      rainfallMmByCity: { 'Aydın':660.6, 'Kuşadası':660.6, 'İzmir':700, 'Ankara':450, 'İstanbul':850 },
      defaultRainfallMm: 600,
      roofRunoffCoefficient: { Metal:0.90, Concrete:0.80, Tile:0.75 },
      defaultRoofType: 'Tile',
      firstFlushAndOverflowFactor: 0.80,
      greywaterRecoverableRatio: 0.35,
      greywaterOperatingLossFactor: 0.70
    },
    pricing: {
      markup_pct:15, currency:'USD',
      tax_note:'Maliyet referansı KDV hariçtir. %15 Vitavolt fiyat katmanı maliyet referansının üzerine uygulanır; KDV hesaplanmaz.',
      panel_options:[
        {power_wp:620,base_usd_per_w:0.18,source:'user_catalog'},
        {power_wp:655,base_usd_per_w:0.18,source:'user_catalog'}
      ],
      inverter_options:[
        {power_kw:6.2,type:'mppt',base_usd:290,source:'user_catalog'},
        {power_kw:8,type:'mppt',base_usd:374.19,source:'derived_from_6.2kw_user_price',confidence:'derived'},
        {power_kw:11,type:'inverter',base_usd:650,source:'user_catalog'},
        {power_kw:50,type:'inverter',base_usd:3000,source:'user_catalog'},
        {power_kw:100,type:'inverter',base_usd:3600,source:'user_catalog'}
      ],
      battery_options:[{capacity_kwh:5,base_usd_per_kwh:99.49596774,source:'proportional_model',confidence:'derived'}],
      cost_model:{
        market_quote_discount_pct:10,
        proportional_model:{battery_usd_per_kwh:99.49596774,bos_usd_per_kwp:241.07855208,fixed_bos_usd:604.19354839},
        bom_ratios:{dc_cable_m_per_panel:6.19,ac_cable_m_per_panel:1.67,mc4_pairs_per_panel:4,dc_spd_sets_per_reference:2,fuse_sets_per_reference:4},
        reference_packages:[]
      }
    }
  };

  function finite(v,f){var n=Number(v);return Number.isFinite(n)?n:(f||0);}
  function nonNegative(v){return Math.max(0,finite(v,0));}
  function cityRainfall(city){var n=String(city||'').trim();return CONFIG.water.rainfallMmByCity[n]||CONFIG.water.defaultRainfallMm;}

  function calculateWater(input){
    input=input||{};
    var roof=nonNegative(input.roofAreaM2), monthly=nonNegative(input.monthlyWaterM3);
    var rainfall=nonNegative(input.rainfallMm||cityRainfall(input.city));
    var roofType=input.roofType||CONFIG.water.defaultRoofType;
    var runoff=CONFIG.water.roofRunoffCoefficient[roofType]||0.75;
    var collection=CONFIG.water.firstFlushAndOverflowFactor;
    var theoretical=roof*rainfall/1000*runoff, usable=theoretical*collection;
    var monthlyGrey=monthly*CONFIG.water.greywaterRecoverableRatio, annualGrey=monthlyGrey*12*CONFIG.water.greywaterOperatingLossFactor, demand=monthly*12;
    return {rainfall:{city:input.city||null,rainfallMm:Number(rainfall.toFixed(1)),roofAreaM2:Number(roof.toFixed(1)),roofType:roofType,annualTheoreticalM3:Number(theoretical.toFixed(1)),annualUsableM3:Number(usable.toFixed(1)),demandCoveragePct:demand>0?Number(Math.min(100,usable/demand*100).toFixed(1)):0},greywater:{monthlySourceM3:Number(monthlyGrey.toFixed(2)),annualUsableM3:Number(annualGrey.toFixed(1)),demandCoveragePct:demand>0?Number(Math.min(100,annualGrey/demand*100).toFixed(1)):0},assumptions:{runoffCoefficient:runoff,firstFlushAndOverflowFactor:collection,greywaterRecoverableRatio:CONFIG.water.greywaterRecoverableRatio,greywaterOperatingLossFactor:CONFIG.water.greywaterOperatingLossFactor,note:'Yağmur ve gri su miktarı ön fizibilitedir; aylık su dengesi, depo hacmi ve tesisat ayrımı sahada doğrulanmalıdır.'}};
  }

  function panelOption(power,pricing){var a=(pricing&&pricing.panel_options)||[],t=finite(power,0);for(var i=0;i<a.length;i++)if(Number(a[i].power_wp)===t)return a[i];return a[0]||null;}
  function inverterOption(power,pricing){var a=(pricing&&pricing.inverter_options)||[],t=finite(power,0);if(!t||String(power)==='auto')return null;for(var i=0;i<a.length;i++)if(Number(a[i].power_kw)===t)return a[i];return null;}
  function autoInverter(dc,pricing){var a=((pricing&&pricing.inverter_options)||[]).slice().sort(function(x,y){return Number(x.power_kw)-Number(y.power_kw);});if(!a.length)return null;for(var i=0;i<a.length;i++)if(Number(a[i].power_kw)>=dc)return a[i];return a[a.length-1];}
  function nearestPackage(dc,bess,pricing){var p=pricing&&pricing.cost_model&&pricing.cost_model.reference_packages||[];p=p.filter(function(x){return x&&x.comparable!==false&&Number(x.cost_usd)>0;});if(!p.length||dc<=0||bess<=0)return null;return p.reduce(function(best,x){if(!best)return x;var a=Math.abs(Number(best.dc_kwp)-dc)/dc+Math.abs(Number(best.bess_kwh)-bess)/bess;var b=Math.abs(Number(x.dc_kwp)-dc)/dc+Math.abs(Number(x.bess_kwh)-bess)/bess;return b<a?x:best;},null);}

  function bomFor(input,dc,panelCount,panelPower,inverter,bessKwh,pricing){
    var ratios=(pricing.cost_model&&pricing.cost_model.bom_ratios)||{};
    var units=Math.max(1,Math.ceil(panelCount/42));
    var batteryUnits=bessKwh>0?Math.ceil(bessKwh/5):0;
    return [
      {category:'GES',item:panelPower+' Wp güneş paneli',quantity:panelCount,unit:'adet',basis:'user_catalog'},
      {category:'GES',item:(inverter?inverter.power_kw:0)+' kW '+(inverter&&inverter.type==='mppt'?'MPPT':'inverter'),quantity:inverter?Math.max(1,Math.ceil(dc/Number(inverter.power_kw))):0,unit:'adet',basis:inverter?inverter.source:'not_configured'},
      {category:'BESS',item:'5 kWh batarya modülü',quantity:batteryUnits,unit:'adet',basis:'proportional_model'},
      {category:'DC',item:'Solar DC kablo',quantity:Math.ceil(panelCount*Number(ratios.dc_cable_m_per_panel||6.19)),unit:'m',basis:'reference_ratio'},
      {category:'AC',item:'AC kablo',quantity:Math.ceil(panelCount*Number(ratios.ac_cable_m_per_panel||1.67)),unit:'m',basis:'reference_ratio'},
      {category:'Bağlantı',item:'MC4 çifti',quantity:Math.ceil(panelCount*Number(ratios.mc4_pairs_per_panel||4)),unit:'çift',basis:'reference_ratio'},
      {category:'Koruma',item:'DC SPD seti',quantity:Math.max(1,Math.ceil(units*Number(ratios.dc_spd_sets_per_reference||2))),unit:'set',basis:'reference_ratio'},
      {category:'Koruma',item:'Sigorta seti',quantity:Math.max(1,Math.ceil(units*Number(ratios.fuse_sets_per_reference||4))),unit:'set',basis:'reference_ratio'},
      {category:'Pano',item:'GES panosu',quantity:1,unit:'set',basis:'BOS/EPC allowance'},
      {category:'Mekanik',item:'Alt konstrüksiyon sistemi',quantity:1,unit:'set',basis:'BOS/EPC allowance'},
      {category:'Saha',item:'Nakliye + montaj + devreye alma',quantity:1,unit:'set',basis:'BOS/EPC allowance'}
    ];
  }

  function calculatePricing(input,pricingSource){
    input=input||{};var pricing=pricingSource||CONFIG.pricing, markupPct=Math.max(0,finite(pricing.markup_pct,15)), markup=1+markupPct/100;
    var panelPower=Math.max(1,finite(input.panelPowerWp,620)), panelCount=Math.max(0,Math.floor(finite(input.panelCount,0))), dc=Math.max(0,finite(input.dcCapacityKwp,panelCount*panelPower/1000));
    var po=panelOption(panelPower,pricing), panelRate=po?Math.max(0,finite(po.base_usd_per_w,0)):0, panelBase=panelCount*panelPower*panelRate;
    var requested=input.inverterPowerKw, io=(requested&&requested!=='auto')?inverterOption(requested,pricing):autoInverter(dc,pricing);
    var inverterCount=io&&dc>0?Math.max(1,Math.ceil(dc/Number(io.power_kw))):0, inverterBase=inverterCount*(io?Math.max(0,finite(io.base_usd,0)):0);
    var bess=Math.max(0,finite(input.bessCapacityKwh,0)), model=pricing.cost_model||{}, pm=model.proportional_model||{};
    var packageRef=nearestPackage(dc,bess,pricing);
    var batteryBase=bess*finite(pm.battery_usd_per_kwh,0);
    var bosBase=Math.max(0,dc*finite(pm.bos_usd_per_kwp,0)+finite(pm.fixed_bos_usd,0));
    var componentBase=panelBase+inverterBase+batteryBase+bosBase;
    var projectCost=packageRef?Number(packageRef.cost_usd):Number(componentBase.toFixed(2));
    var basis=packageRef?'market_quote_minus_10pct_nearest_package':'user_catalog_plus_proportional_bom_model';
    var estimatedPrice=projectCost*markup;
    var bom=bomFor(input,dc,panelCount,panelPower,io,bess,pricing);
    return {
      currency:pricing.currency||'USD',markupPct:markupPct,taxNote:pricing.tax_note||'KDV hesaplanmaz.',
      panel:{powerWp:panelPower,count:panelCount,baseUsdPerW:panelRate,baseUsd:Number(panelBase.toFixed(2)),sellUsd:Number((panelBase*markup).toFixed(2)),source:po?po.source:'not_available'},
      inverter:{selection:requested||'auto',powerKw:io?Number(io.power_kw):0,type:io?io.type:null,count:inverterCount,baseUnitUsd:io?Number(io.base_usd):0,baseUsd:Number(inverterBase.toFixed(2)),sellUsd:Number((inverterBase*markup).toFixed(2)),source:io?io.source:'not_available'},
      battery:{capacityKwh:Number(bess.toFixed(1)),unitCapacityKwh:5,baseUsd:Number(batteryBase.toFixed(2)),baseUsdPerKwh:Number(finite(pm.battery_usd_per_kwh,0).toFixed(2)),sellUsd:Number((batteryBase*markup).toFixed(2)),basis:'proportional_model'},
      bos:{baseUsd:Number(bosBase.toFixed(2)),sellUsd:Number((bosBase*markup).toFixed(2)),basis:'proportional_model'},
      total:{baseUsd:Number(componentBase.toFixed(2)),sellUsd:Number((componentBase*markup).toFixed(2)),scope:'GES+BESS+BOS/EPC preliminary model'},
      projectCost:{usd:Number(projectCost.toFixed(2)),estimatedPriceUsd:Number(estimatedPrice.toFixed(2)),bessCapacityKwh:Number(bess.toFixed(1)),basis:basis,marketReference:packageRef?{id:packageRef.id,name:packageRef.name,dcKwp:Number(packageRef.dc_kwp),bessKwh:Number(packageRef.bess_kwh),quotedCostUsd:Number(packageRef.quoted_cost_usd),costUsd:Number(packageRef.cost_usd),discountPct:Number(model.market_quote_discount_pct||10),source:packageRef.source}:null},
      bom:bom,
      model:{batteryUsdPerKwh:Number(finite(pm.battery_usd_per_kwh,0).toFixed(2)),bosUsdPerKwp:Number(finite(pm.bos_usd_per_kwp,0).toFixed(2)),fixedBosUsd:Number(finite(pm.fixed_bos_usd,0).toFixed(2)),status:'preliminary_proportional'},
      verification:{status:'market_reference_plus_proportional_model',note:'Kullanıcı fiyatları doğrudan maliyet girdisidir. Dış tekliflerin %10 altı maliyet referansı olarak kullanılabilir. Oransal BOM kalemleri ön fizibilitedir; nihai satın alma ve saha metrajı değildir.'}
    };
  }

  function calculate(input,configSource){
    input=input||{};var config=Object.assign({},CONFIG,configSource||{});config.solar=Object.assign({},CONFIG.solar||{},(configSource&&configSource.solar)||{});config.battery=Object.assign({},CONFIG.battery||{},(configSource&&configSource.battery)||{});config.pricing=Object.assign({},CONFIG.pricing, (configSource&&configSource.pricing)||{});
    var roof=nonNegative(input.roofAreaM2),land=nonNegative(input.landAreaM2),useLand=input.landAvailable===true,area=roof+(useLand?land:0),monthly=nonNegative(input.monthlyConsumptionKwh),annual=nonNegative(input.annualConsumptionKwh)||monthly*12;
    if(area<=0)throw new Error('En az bir geçerli çatı veya arazi alanı girilmelidir.');
    var panelArea=Math.max(0.5,finite(config.solar.panel_area_m2,2.6)),requestedPower=nonNegative(input.panelPowerWp)||finite(config.solar.default_panel_power,620),po=panelOption(requestedPower,config.pricing),panelPower=po?Number(po.power_wp):requestedPower;
    var loss=Math.min(1,Math.max(0.1,finite(config.solar.system_loss_factor,0.85))),pr=Math.min(1,Math.max(0.1,finite(config.solar.performance_ratio,0.8))),yieldKwh=Math.max(300,finite(config.solar.default_specific_yield_kwh_kwp,1450)),margin=Math.min(2,Math.max(0.5,finite(config.solar.design_margin,1.1))),co2=Math.max(0,finite(config.solar.co2_factor,0.42));
    var panels=Math.max(0,Math.floor(area/panelArea)),dc=Number((panels*panelPower/1000).toFixed(2)),production=Math.round(dc*yieldKwh*loss*pr),selfRatio=annual>0?Math.min(1,Math.max(0,(annual*margin)/Math.max(production,1))):0,self=Math.min(annual,production,Math.round(production*selfRatio)),exportKwh=Math.max(0,production-self),co2Kg=Math.round(production*co2);
    var daily=annual/365,night=input.nighttimeShare!=null?Math.min(1,Math.max(0,finite(input.nighttimeShare,0))):0.35,peak=nonNegative(input.peakDemandKw),bessRec=night>=0.40||peak>=Math.max(20,dc*0.35),bess=0;
    if(bessRec&&daily>0){var target=daily*night*0.75,dod=Math.min(1,Math.max(0.5,finite(config.battery.depth_of_discharge,0.9))),rte=Math.min(1,Math.max(0.5,finite(config.battery.round_trip_efficiency,0.95)));bess=Number((target/Math.max(dod*rte,0.25)).toFixed(1));}
    var water=window.VitaEngine&&typeof window.VitaEngine.calculateWater==='function'?calculateWater({city:input.city,roofAreaM2:roof,monthlyWaterM3:nonNegative(input.monthlyWaterM3),roofType:input.roofType}):null;
    var pricing=calculatePricing(Object.assign({},input,{panelPowerWp:panelPower,bessCapacityKwh:bess}),config.pricing);
    return {inputs:{roofAreaM2:roof,landAreaM2:land,landAvailable:useLand,annualConsumptionKwh:annual},solar:{panelCount:panels,dcCapacityKwp:dc,annualProductionKwh:production,selfConsumptionKwh:self,gridExportKwh:exportKwh,co2ReductionKg:co2,co2Verification:{status:'assumption_based',factorKgPerKwh:co2,aiScore:null},estimatedAreaM2:panels*panelArea},bess:{recommended:bessRec,suggestedCapacityKwh:bess,depthOfDischarge:Math.min(1,Math.max(0.5,finite(config.battery.depth_of_discharge,0.9))),roundTripEfficiency:Math.min(1,Math.max(0.5,finite(config.battery.round_trip_efficiency,0.95))),verification:{status:'preliminary',basis:peak>0||input.nighttimeShare!=null?'user_profile_inputs':'default_assumptions',aiScore:null}},pricing:pricing,water:water,assumptions:{panelPowerWp:panelPower,panelAreaM2:panelArea,specificYieldKwhKwp:yieldKwh,systemLossFactor:loss,performanceRatio:pr,co2FactorKgPerKwh:co2,designMargin:margin},warning:'Bu sonuç ön fizibilite amaçlı yaklaşık hesaplamadır. Nihai sistem tasarımı saha, tüketim ve teknik analiz sonrasında belirlenir.'};
  }

  function loadMarketData(){if(window.__vitavoltMarketPricing)return Promise.resolve(window.__vitavoltMarketPricing);return fetch('/database/calculations.json',{credentials:'same-origin'}).then(function(res){if(!res.ok)throw new Error('market data fetch failed');return res.json();}).then(function(json){window.__vitavoltMarketPricing=json.pricing||CONFIG.pricing;CONFIG.pricing=window.__vitavoltMarketPricing;return CONFIG.pricing;}).catch(function(){window.__vitavoltMarketPricing=CONFIG.pricing;return CONFIG.pricing;});}
  window.VitaEngine={version:'web-contract-1.3',config:CONFIG,calculate:calculate,calculateWater:calculateWater,calculatePricing:calculatePricing,cityRainfall:cityRainfall,loadMarketData:loadMarketData,getPricing:function(){return window.__vitavoltMarketPricing||CONFIG.pricing;}};
})(window);
