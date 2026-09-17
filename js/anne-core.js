/* Vitavolt Global — ANNE CORE Offline Orchestrator | build 2026-09-17 */
(function (window) {
  'use strict';

  var VERSION = '0.1.0-offline';
  var BUILD = '2026-09-17-anne-v1';

  function finite(v) {
    return Number.isFinite(Number(v));
  }

  function present(v) {
    return v !== undefined && v !== null && String(v).trim() !== '' && !(finite(v) && Number(v) === 0);
  }

  function unique(list) {
    return list.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  /*
   * ANNE does not replace VITA Engine math. It structures the problem,
   * detects missing evidence, proposes dynamic assessment factors and
   * orchestrates VITA + validation + output planning.
   */
  function buildAssessment(input, result) {
    input = input || {};
    result = result || {};

    var missing = [];
    var supplied = [];
    var factors = [];
    var evidence = [];

    function requireData(key, label) {
      if (present(input[key])) supplied.push(label);
      else missing.push({ key: key, label: label, reason: 'required_for_higher_confidence_assessment' });
    }

    requireData('monthlyConsumptionKwh', 'Aylık elektrik tüketimi');
    requireData('city', 'Tesis şehri');

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
      factors.push({ id: 'wastewater', label: 'Atık su / gri su geri kazanımı', reason: 'Su tüketim verisi mevcut; tesis prosesi doğrulanmalı.' });
    }
    if (present(input.fuelConsumption)) {
      factors.push({ id: 'fuel', label: 'Yakıt / proses enerjisi optimizasyonu', reason: 'Yakıt verisi mevcut.' });
    }
    if (present(input.machineData)) {
      factors.push({ id: 'equipment', label: 'Makine ve proses ekipmanı optimizasyonu', reason: 'Ekipman verisi mevcut.' });
    }
    if (present(input.productionData)) {
      factors.push({ id: 'process_efficiency', label: 'Üretim prosesi enerji yoğunluğu', reason: 'Üretim verisi mevcut.' });
    }
    if (present(input.emissionData)) {
      factors.push({ id: 'carbon', label: 'Karbon / emisyon optimizasyonu', reason: 'Emisyon verisi mevcut.' });
    }
    if (present(input.etsData)) {
      factors.push({ id: 'ets', label: 'ETS maruziyeti ve karbon yükümlülüğü', reason: 'ETS ile ilgili veri sağlandı; güncel mevzuat ayrıca doğrulanmalı.' });
    }

    /* Dynamic sector/process discovery: sector is evidence, not a fixed recipe. */
    if (present(input.facilityType)) {
      evidence.push({ type: 'facility', value: input.facilityType, source: 'USER_SUPPLIED' });
    }
    if (present(input.processDescription)) {
      evidence.push({ type: 'process', value: input.processDescription, source: 'USER_SUPPLIED' });
      factors.push({ id: 'process_specific', label: 'Tesis prosesine özel optimizasyon', reason: 'Proses açıklaması mevcut; ANNE/MITOS sonraki aşamada alt faktörleri çıkarabilir.' });
    }

    var regulation = {
      status: present(input.etsData) ? 'REQUIRES_CURRENT_REGULATION_VERIFICATION' : 'NOT_ASSESSED',
      sourcesRequired: present(input.etsData) ? ['current official ETS/regulation source'] : [],
      mustNotInventFactors: true
    };

    var outputPlan = {
      executiveSummary: true,
      technicalReport: true,
      bom: !!(result.pricing && result.pricing.bom),
      charts: ['energy', 'cost', 'carbon', 'water'],
      presentation: { requested: false, formats: ['PPTX', 'PDF'], status: 'CAPABILITY_READY' },
      visuals: { requested: false, status: 'AI_IMAGE_GENERATION_REQUIRES_ONLINE_OUTPUT_LAYER' }
    };

    return {
      version: VERSION,
      build: BUILD,
      status: 'OFFLINE_ASSESSMENT',
      facility: { type: input.facilityType || input.tesisTipi || null, city: input.city || null },
      suppliedData: unique(supplied),
      missingData: missing,
      optimizationFactors: unique(factors.map(function (x) { return JSON.stringify(x); })).map(function (x) { return JSON.parse(x); }),
      evidence: evidence,
      regulation: regulation,
      outputPlan: outputPlan,
      confidence: missing.length === 0 ? 'DATA_COMPLETE_FOR_CURRENT_SCOPE' : 'PRELIMINARY_MISSING_DATA',
      principle: 'ANNE orchestrates and interprets; VITA Engine calculates; Validator verifies; Human approves.'
    };
  }

  function assess(input, options) {
    options = options || {};
    if (!window.VitaEngine || typeof window.VitaEngine.calculate !== 'function') {
      throw new Error('VITA Engine is required by ANNE Core');
    }
    var result = window.VitaEngine.calculate(input || {}, options.vitaConfig || {});
    var assessment = buildAssessment(input || {}, result);
    result.anne = assessment;
    result.contracts = result.contracts || {};
    result.contracts.anne = {
      role: 'orchestration_assessment_output',
      version: VERSION,
      mustNot: 'recompute_engineering_or_override_vita_result'
    };
    return result;
  }

  function proposeScenario(input, objective) {
    return {
      status: 'PROPOSAL_ONLY',
      objective: objective || 'optimize_total_project_outcome',
      source: 'ANNE_CORE',
      input: input || {},
      nextStep: 'Send candidate scenario to VITA Engine, then Validator.',
      humanApprovalRequired: true
    };
  }

  function outputPlan(result, audience) {
    result = result || {};
    return {
      audience: audience || 'management',
      dataSource: 'validated_result',
      sections: ['executive_summary', 'technical_design', 'bom', 'direct_cost', 'project_cost', 'sales_price', 'carbon', 'water', 'validation'],
      presentation: { formats: ['PPTX', 'PDF'], status: 'CAPABILITY_READY' },
      visuals: { charts: true, diagrams: true, aiImages: 'ONLINE_OUTPUT_LAYER' },
      rule: 'Do not fabricate numerical values; use validated VITA outputs.'
    };
  }

  window.AnneCore = {
    version: VERSION,
    build: BUILD,
    assess: assess,
    proposeScenario: proposeScenario,
    outputPlan: outputPlan,
    buildAssessment: buildAssessment
  };
})(typeof window !== 'undefined' ? window : global);
