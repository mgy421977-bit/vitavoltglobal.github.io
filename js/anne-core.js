/* Vitavolt Global — ANNE CORE | build 2026-09-17-anne-v4
 * Path: connect → analyze → task MITOS → VITA deterministic calc → ANNE test → human
 * ANNE does not recompute engineering. VITA is sole math authority.
 * This offline core is the socket for future ANNE AI.
 */
(function (window) {
  'use strict';
  var VERSION = '0.4.0-offline';
  var BUILD = '2026-09-17-anne-v4';

  function finite(v) { return Number.isFinite(Number(v)); }
  function present(v) { return v !== undefined && v !== null && String(v).trim() !== '' && !(finite(v) && Number(v) === 0); }
  function unique(list) { return list.filter(function (v, i, a) { return a.indexOf(v) === i; }); }
  function n(v, fb) { var x = Number(v); return Number.isFinite(x) ? x : (fb !== undefined ? fb : 0); }

  function analyzeSystem(raw) {
    raw = raw || {};
    var needs = [];
    if (n(raw.roofAreaM2, 0) > 0 || n(raw.landAreaM2, 0) > 0) needs.push('ges_sizing');
    if (n(raw.monthlyConsumptionKwh, 0) > 0 || n(raw.annualConsumptionKwh, 0) > 0) needs.push('load_match');
    if (n(raw.monthlyWaterM3, 0) > 0 || raw.rainwaterSelected || raw.greywaterSelected) needs.push('water');
    if (n(raw.nighttimeShare, 0) >= 0.4 || n(raw.peakDemandKw, 0) > 0) needs.push('bess_screen');
    return {
      domain: 'energy_prefeasibility',
      facilityType: raw.facilityType || raw.tesisTipi || null,
      city: raw.city || null,
      needs: needs,
      requiredEngine: 'VITA_ENGINE',
      mitosTasks: ['completeInputs', 'propose_scenarios'],
      principle: 'First ensure deterministic engine; then MITOS fills inputs; ANNE tests; human approves.'
    };
  }

  function buildAssessment(input, result, mitosMeta) {
    input = input || {}; result = result || {};
    var missing = [], supplied = [], factors = [], evidence = [];
    function req(key, label) {
      if (present(input[key])) supplied.push(label);
      else missing.push({ key: key, label: label, reason: 'required_for_higher_confidence_assessment' });
    }
    req('monthlyConsumptionKwh', 'Aylık elektrik tüketimi');
    req('city', 'Tesis şehri');
    if (present(input.peakDemandKw)) {
      supplied.push('Pik talep');
      factors.push({ id: 'peak_demand', label: 'Pik talep optimizasyonu', reason: 'Pik güç verisi mevcut.' });
    }
    if (present(input.nighttimeShare)) {
      supplied.push('Gece tüketim payı');
      factors.push({ id: 'load_shift', label: 'Yük kaydırma / BESS optimizasyonu', reason: 'Gece tüketim profili mevcut.' });
    }
    if (present(input.monthlyWaterM3)) {
      supplied.push('Aylık su tüketimi');
      factors.push({ id: 'water', label: 'Su verimliliği ve yeniden kullanım', reason: 'Su tüketim verisi mevcut.' });
    }
    if (present(input.facilityType) || present(input.tesisTipi)) {
      evidence.push({ type: 'facility', value: input.facilityType || input.tesisTipi, source: 'USER_SUPPLIED' });
    }
    return {
      version: VERSION, build: BUILD, status: 'ANNE_VITA_VALIDATED',
      facility: { type: input.facilityType || input.tesisTipi || null, city: input.city || null },
      suppliedData: unique(supplied), missingData: missing, optimizationFactors: factors, evidence: evidence,
      mitos: mitosMeta || { status: 'NOT_LOADED' },
      confidence: missing.length === 0 ? 'DATA_COMPLETE_FOR_CURRENT_SCOPE' : 'PRELIMINARY_MISSING_DATA',
      principle: 'MITOS completes inputs; VITA calculates; ANNE tests deterministically; Human approves.'
    };
  }

  function test(result, input) {
    var checks = [];
    function add(id, ok, detail) { checks.push({ id: id, ok: !!ok, detail: detail || '' }); }
    if (!result || !result.solar || !result.pricing) {
      return { ok: false, status: 'INCOMPLETE_RESULT', checks: [{ id: 'structure', ok: false, detail: 'missing solar/pricing' }] };
    }
    var s = result.solar, p = result.pricing;
    var pw = n(result.assumptions && result.assumptions.panelPowerWp, 620);
    var expectedDc = Math.round((n(s.panelCount) * pw) / 1000 * 100) / 100;
    add('PANEL_KWP', Math.abs(n(s.dcCapacityKwp) - expectedDc) < 0.05, 'dc=' + s.dcCapacityKwp + ' expected~' + expectedDc);
    var factor = n(result.assumptions && result.assumptions.co2FactorKgPerKwh, 0.42);
    var co2 = Math.round(n(s.annualProductionKwh) * factor);
    add('CO2', Math.abs(n(s.co2ReductionKg) - co2) <= 1, 'co2=' + s.co2ReductionKg + ' expected=' + co2);
    if (p.battery && n(p.battery.requestedCapacityKwh) > 0) {
      var units = Math.ceil(n(p.battery.requestedCapacityKwh) / 2.4);
      add('BESS_MODULES', n(p.battery.batteryModuleCount) === units, 'modules=' + p.battery.batteryModuleCount + ' expected=' + units);
    } else add('BESS_MODULES', true, 'no BESS request');
    if (p.inverter && n(s.dcCapacityKwp) > 0) {
      add('INVERTER_COVERS_DC', n(p.inverter.powerKw) * n(p.inverter.count, 1) + 1e-6 >= n(s.dcCapacityKwp), 'inv=' + p.inverter.powerKw + 'x' + p.inverter.count);
    }
    if (input && n(input.roofAreaM2, 0) > 0) {
      add('ROOF_LOSS_TAG', input.roofOrientationLossPct == null || n(input.roofOrientationLossPct) === 20, 'roofLossPct=' + input.roofOrientationLossPct);
    }
    if (result.water && result.water.rainfall && result.water.rainfall.selected) {
      var hasWaterBom = (p.bom || []).some(function (x) { return x.category === 'WATER'; });
      add('WATER_BOM', hasWaterBom, hasWaterBom ? 'WATER lines present' : 'missing WATER BOM');
    }
    add('VITA_VALIDATION', !!(result.validation && result.validation.ok), result.validation && result.validation.ok ? 'OK' : 'CHECK');
    var failed = checks.filter(function (c) { return !c.ok; });
    return { ok: failed.length === 0, status: failed.length === 0 ? 'PASSED' : 'FAILED', checks: checks, failedCount: failed.length, mustNot: 'recompute_or_override_vita_engineering' };
  }

  function ensureMitos() {
    if (window.MitosCore && typeof window.MitosCore.completeInputs === 'function') return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'js/mitos-core.js?v=2026-09-17-mitos-v2';
      s.onload = resolve;
      s.onerror = function () { reject(new Error('MITOS Core yüklenemedi')); };
      document.head.appendChild(s);
    });
  }

  function runPipeline(rawInput, options) {
    options = options || {};
    if (!window.VitaEngine || typeof window.VitaEngine.calculate !== 'function') {
      throw new Error('VITA Engine is required — deterministic motor must exist first');
    }
    var analysis = analyzeSystem(rawInput);
    var pack = (window.MitosCore && typeof window.MitosCore.completeInputs === 'function')
      ? window.MitosCore.completeInputs(rawInput)
      : { status: 'MITOS_MISSING', readyForVita: true, input: rawInput || {}, sources: {}, missing: [] };
    var input = pack.input || rawInput || {};
    var mitosProposal = (window.MitosCore && typeof window.MitosCore.propose === 'function')
      ? window.MitosCore.propose(input) : null;
    var result = window.VitaEngine.calculate(input, options.vitaConfig || {});
    if (!result || !result.solar || !result.pricing) throw new Error('ANNE: VITA Engine returned incomplete result');
    var evaluated = [];
    if (mitosProposal && mitosProposal.scenarios) {
      mitosProposal.scenarios.slice(1).forEach(function (s) {
        try {
          var c = window.VitaEngine.calculate(s.input, options.vitaConfig || {});
          evaluated.push({ id: s.id, label: s.label, reason: s.reason, validation: c.validation || null, solar: c.solar || null, bess: c.bess || null, pricing: c.pricing || null, water: c.water || null });
        } catch (e) {
          evaluated.push({ id: s.id, label: s.label, reason: s.reason, status: 'REJECTED', error: e.message });
        }
      });
    }
    var anneTest = test(result, input);
    var mitosMeta = { status: pack.status || 'UNKNOWN', version: pack.version || (mitosProposal && mitosProposal.version), build: pack.build || (mitosProposal && mitosProposal.build), sources: pack.sources || {}, missing: pack.missing || [], proposalCount: mitosProposal ? mitosProposal.scenarios.length : 0, scenarios: evaluated };
    result.anne = buildAssessment(input, result, mitosMeta);
    result.anne.systemAnalysis = analysis;
    result.anne.test = anneTest;
    result.anne.humanGate = { required: true, status: 'PENDING_HUMAN_APPROVAL', rule: 'No project decision without human approval' };
    result.contracts = result.contracts || {};
    result.contracts.anne = { role: 'analyze_orchestrate_test', version: VERSION, mustNot: 'recompute_engineering_or_override_vita_result' };
    result.contracts.mitos = { role: 'complete_inputs_and_propose_scenarios', mustNot: 'override_vita_math_or_validation', humanApprovalRequired: true };
    result.contracts.vita = { role: 'sole_deterministic_calculation_engine', mustNot: 'be_replaced_by_anne_or_mitos_math' };
    result.mitos = { status: mitosProposal ? 'INPUTS_COMPLETED_AND_SCENARIOS_EVALUATED' : 'INPUTS_ONLY', complete: pack, proposal: mitosProposal, evaluatedScenarioCount: evaluated.length };
    result.flow = ['SYSTEM_ANALYZE', 'MITOS_COMPLETE_INPUTS', 'VITA_DETERMINISTIC_CALC', 'ANNE_DETERMINISTIC_TEST', 'HUMAN_APPROVAL'];
    if (!anneTest.ok) result.anne.status = 'ANNE_TEST_FAILED';
    return result;
  }

  function assess(input, options) { return runPipeline(input, options); }

  function proposeScenario(input, objective) {
    return { status: 'PROPOSAL_ONLY', objective: objective || 'optimize_total_project_outcome', source: 'ANNE_CORE', input: input || {}, nextStep: 'MITOS completeInputs → VITA calculate → ANNE test → Human', humanApprovalRequired: true };
  }

  function outputPlan(result, audience) {
    return { audience: audience || 'management', dataSource: 'validated_vita_result', sections: ['executive_summary', 'technical_design', 'bom', 'carbon', 'water', 'anne_test', 'mitos_sources'], presentation: { formats: ['PPTX', 'PDF'], status: 'CAPABILITY_READY' }, rule: 'Do not fabricate numerical values; use validated VITA outputs only.' };
  }

  window.AnneCore = { version: VERSION, build: BUILD, analyzeSystem: analyzeSystem, test: test, runPipeline: runPipeline, assess: assess, proposeScenario: proposeScenario, outputPlan: outputPlan, buildAssessment: buildAssessment, ensureMitos: ensureMitos };
})(typeof window !== 'undefined' ? window : global);
