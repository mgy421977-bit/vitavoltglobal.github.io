/* Vitavolt Global — ANNE CORE Offline Orchestrator | build 2026-09-17-v3 */
(function (window) {
  'use strict';
  var VERSION = '0.3.0-offline', BUILD = '2026-09-17-anne-v3';
  function finite(v) { return Number.isFinite(Number(v)); }
  function present(v) { return v !== undefined && v !== null && String(v).trim() !== '' && !(finite(v) && Number(v) === 0); }
  function unique(list) { return list.filter(function (v, i, a) { return a.indexOf(v) === i; }); }
  function buildAssessment(input, result, mitos) {
    input = input || {}; result = result || {};
    var missing = [], supplied = [], factors = [], evidence = [];
    function req(key, label) { if (present(input[key])) supplied.push(label); else missing.push({ key: key, label: label, reason: 'required_for_higher_confidence_assessment' }); }
    req('monthlyConsumptionKwh', 'Aylık elektrik tüketimi'); req('city', 'Tesis şehri');
    if (present(input.peakDemandKw)) { supplied.push('Pik talep'); factors.push({ id:'peak_demand', label:'Pik talep optimizasyonu', reason:'Pik güç verisi mevcut.' }); }
    if (present(input.nighttimeShare)) { supplied.push('Gece tüketim payı'); factors.push({ id:'load_shift', label:'Yük kaydırma / BESS optimizasyonu', reason:'Gece tüketim profili mevcut.' }); }
    if (present(input.monthlyWaterM3)) { supplied.push('Aylık su tüketimi'); factors.push({ id:'water', label:'Su verimliliği ve yeniden kullanım', reason:'Su tüketim verisi mevcut.' }); factors.push({ id:'wastewater', label:'Atık su / gri su geri kazanımı', reason:'Proses doğrulanmalı.' }); }
    if (present(input.facilityType)) evidence.push({ type:'facility', value:input.facilityType, source:'USER_SUPPLIED' });
    if (present(input.processDescription)) { evidence.push({ type:'process', value:input.processDescription, source:'USER_SUPPLIED' }); factors.push({ id:'process_specific', label:'Tesis prosesine özel optimizasyon', reason:'Proses açıklaması mevcut.' }); }
    if (present(input.emissionData)) factors.push({ id:'carbon', label:'Karbon / emisyon optimizasyonu', reason:'Emisyon verisi mevcut.' });
    if (present(input.etsData)) factors.push({ id:'ets', label:'ETS maruziyeti ve karbon yükümlülüğü', reason:'Güncel mevzuat doğrulanmalı.' });
    return { version:VERSION, build:BUILD, status:'ANNE_VITA_VALIDATED', facility:{ type:input.facilityType||input.tesisTipi||null, city:input.city||null }, suppliedData:unique(supplied), missingData:missing, optimizationFactors:unique(factors.map(function(x){return JSON.stringify(x);})).map(function(x){return JSON.parse(x);}), evidence:evidence, regulation:{ status:present(input.etsData)?'REQUIRES_CURRENT_REGULATION_VERIFICATION':'NOT_ASSESSED', sourcesRequired:present(input.etsData)?['current official ETS/regulation source']:[], mustNotInventFactors:true }, mitos:mitos||{status:'NOT_LOADED'}, outputPlan:{ executiveSummary:true, technicalReport:true, bom:!!(result.pricing&&result.pricing.bom), charts:['energy','cost','carbon','water'], presentation:{requested:false,formats:['PPTX','PDF'],status:'CAPABILITY_READY'} }, confidence:missing.length===0?'DATA_COMPLETE_FOR_CURRENT_SCOPE':'PRELIMINARY_MISSING_DATA', principle:'MITOS proposes; VITA Engine calculates; Validator verifies; ANNE reviews; Human approves.' };
  }
  function ensureMitos() {
    if (window.MitosCore && typeof window.MitosCore.propose === 'function') return Promise.resolve();
    return new Promise(function(resolve,reject){ var s=document.createElement('script'); s.src='js/mitos-core.js?v=2026-09-17-mitos-v1'; s.onload=resolve; s.onerror=function(){reject(new Error('MITOS Core yüklenemedi'));}; document.head.appendChild(s); });
  }
  function assess(input, options) {
    options=options||{};
    if (!window.VitaEngine || typeof window.VitaEngine.calculate!=='function') throw new Error('VITA Engine is required by ANNE Core');
    var mitos=(window.MitosCore&&typeof window.MitosCore.propose==='function')?window.MitosCore.propose(input||{}):null;
    var result=window.VitaEngine.calculate(input||{}, options.vitaConfig||{});
    if (!result||!result.solar||!result.pricing||!result.validation) throw new Error('ANNE Core: VITA Engine returned an incomplete result');
    var evaluated=[];
    if(mitos&&mitos.scenarios){ mitos.scenarios.slice(1).forEach(function(s){ try{ var c=window.VitaEngine.calculate(s.input, options.vitaConfig||{}); evaluated.push({id:s.id,label:s.label,reason:s.reason,validation:c.validation||null,solar:c.solar||null,bess:c.bess||null,pricing:c.pricing||null,water:c.water||null}); } catch(e){ evaluated.push({id:s.id,label:s.label,reason:s.reason,status:'REJECTED',error:e.message}); } }); }
    result.anne=buildAssessment(input||{},result,{status:mitos?'EVALUATED_BY_VITA':'NOT_LOADED',version:mitos?mitos.version:null,build:mitos?mitos.build:null,proposalCount:mitos?mitos.scenarios.length:0,scenarios:evaluated});
    result.contracts=result.contracts||{};
    result.contracts.anne={role:'orchestration_review',version:VERSION,mustNot:'recompute_engineering_or_override_vita_result'};
    result.contracts.mitos={role:'scenario_generation_and_optimization_proposal',mustNot:'override_vita_math_or_validation',humanApprovalRequired:true};
    result.mitos={status:mitos?'SCENARIOS_GENERATED_AND_VITA_EVALUATED':'NOT_LOADED',proposal:mitos,evaluatedScenarioCount:evaluated.length};
    result.flow=['USER_INPUT','ANNE_CORE','MITOS_SCENARIO_PROPOSAL','VITA_ENGINE_EVALUATION','VALIDATOR','ANNE_REVIEW','HUMAN_APPROVAL'];
    return result;
  }
  function proposeScenario(input,objective){return{status:'PROPOSAL_ONLY',objective:objective||'optimize_total_project_outcome',source:'ANNE_CORE',input:input||{},nextStep:'MITOS proposes candidates → VITA evaluates → Validator verifies.',humanApprovalRequired:true};}
  function outputPlan(result,audience){return{audience:audience||'management',dataSource:'validated_result',sections:['executive_summary','technical_design','bom','direct_cost','project_cost','sales_price','carbon','water','validation','mitos_scenarios'],presentation:{formats:['PPTX','PDF'],status:'CAPABILITY_READY'},rule:'Do not fabricate numerical values; use validated VITA outputs.'};}
  window.AnneCore={version:VERSION,build:BUILD,assess:assess,proposeScenario:proposeScenario,outputPlan:outputPlan,buildAssessment:buildAssessment,ensureMitos:ensureMitos};
})(typeof window!=='undefined'?window:global);
