/* Vitavolt Global — VITA Regulatory Pre-Assessment Layer | 2026-09-25 */
(function (window) {
  'use strict';

  var BUILD = '2026-09-25-regulatory-v1';
  var VERSION = '1.0.0';

  function n(v, fallback) {
    var x = Number(v);
    return Number.isFinite(x) ? x : (fallback === undefined ? 0 : fallback);
  }

  function normalize(v) {
    return String(v || '').trim().toLowerCase();
  }

  function classifyCategory(annualTco2e) {
    var x = n(annualTco2e, NaN);
    if (!Number.isFinite(x) || x < 0) return { category: null, status: 'INSUFFICIENT_DATA' };
    if (x <= 50000) return { category: 'A', status: 'CALCULATED' };
    if (x <= 500000) return { category: 'B', status: 'CALCULATED' };
    return { category: 'C', status: 'CALCULATED' };
  }

  function assessETS(input, rules) {
    input = input || {};
    rules = rules || {};
    var year = Math.floor(n(input.systemYear, new Date().getFullYear()));
    var category = classifyCategory(input.annualTco2e);
    var exclusions = input.exclusions || {};
    var explicitExclusion =
      exclusions.rdOrNewProcess === true ||
      exclusions.exclusiveBiomass === true ||
      exclusions.military === true;

    var institutionExclusion = ['school', 'university', 'hospital', 'defence', 'defense', 'savunma']
      .indexOf(normalize(input.facilityType)) !== -1;

    var annexKnown = typeof input.annex1Activity === 'boolean';
    var annex1 = input.annex1Activity === true;

    var result = {
      engine: 'VITA_REGULATORY',
      engineVersion: VERSION,
      build: BUILD,
      regulation: 'TR_ETS_REG_2026',
      systemYear: year,
      annex1Activity: annexKnown ? annex1 : null,
      annex1Status: annexKnown ? 'USER_OR_DOCUMENT_CONFIRMED' : 'REQUIRES_ACTIVITY_MAPPING',
      category: category.category,
      categoryStatus: category.status,
      explicitExclusion: explicitExclusion,
      institutionExclusion: institutionExclusion,
      etsScope: 'UNDETERMINED',
      permitRequired: false,
      mrvRequired: false,
      pilot: { status: 'NOT_EVALUATED' },
      warnings: [],
      nextActions: []
    };

    if (!annexKnown) {
      result.warnings.push('EK-1 faaliyet eşleştirmesi doğrulanmadan ETS kapsamı kesinleştirilemez.');
      result.nextActions.push('EK-1 faaliyet kodunu ve tesis faaliyet tanımını belge ile doğrula.');
      return result;
    }

    if (!annex1) {
      result.etsScope = 'OUT_OF_SCOPE_BASED_ON_INPUT';
      result.mrvRequired = false;
      return result;
    }

    result.mrvRequired = true;

    if (explicitExclusion || institutionExclusion) {
      result.etsScope = 'OUT_OF_ETS_SCOPE_MRV_CONTINUES';
      result.warnings.push('Bu istisna ETS kapsamını kaldırsa da EK-1 kaynaklı MRV yükümlülükleri devam edebilir.');
    } else if (category.category === 'B' || category.category === 'C') {
      result.etsScope = 'ETS_IN_SCOPE';
      result.permitRequired = true;
    } else {
      result.etsScope = 'MRV_ONLY_CATEGORY_A';
    }

    var pilotSectors = ['electricity_generation', 'cement', 'iron_steel', 'aluminium', 'fertilizer'];
    var sector = normalize(input.pilotSector);
    if ((year === 2026 || year === 2027) && pilotSectors.indexOf(sector) !== -1 && (category.category === 'B' || category.category === 'C')) {
      result.pilot.status = 'PILOT_IN_SCOPE';
      result.pilot.year2026ReportingOnly = year === 2026;
      result.pilot.priceMechanism = year === 2027;
      if (year === 2026) result.warnings.push('2026 pilot sistemi için mevcut karar çerçevesinde fiyat mekanizması uygulanmaz; yıl raporlama odaklıdır.');
      if (year === 2027) result.warnings.push('2027 fiyat mekanizması başlar; ayrıntılı pilot usul ve esasları ayrıca kontrol edilmelidir.');
    } else {
      result.pilot.status = 'NOT_CONFIRMED_FROM_CURRENT_PILOT_RULE';
    }

    return result;
  }

  function findTaxonomyActivity(input, data) {
    input = input || {};
    data = data || {};
    var activities = data.confirmedEnergyActivitiesFromCurrentPublishedReferences || [];
    var code = String(input.taxonomyActivityCode || '').trim();
    var name = normalize(input.taxonomyActivityName);
    var match = null;

    for (var i = 0; i < activities.length; i++) {
      if ((code && activities[i].id === code) || (name && normalize(activities[i].name) === name)) {
        match = activities[i];
        break;
      }
    }

    if (!match) {
      return {
        status: 'NOT_MAPPED',
        activity: null,
        warning: 'Bu veri setinde eşleşen faaliyet yok. Bu, faaliyetin Taksonomi dışında olduğu anlamına gelmez; veri seti kısmi kapsamlıdır.'
      };
    }

    return {
      status: 'MAPPED_PARTIAL_DATASET',
      activity: match,
      warning: 'Teknik tarama kriterleri ayrıca doğrulanmadan taksonomi uyumluluğu sonucu üretilemez.'
    };
  }

  function assessTaxonomy(input, data) {
    var activity = findTaxonomyActivity(input, data);
    var sc = input.substantialContribution === true;
    var dnsh = input.dnsh === true;
    var social = input.minimumSocialSafeguards === true;

    var result = {
      engine: 'VITA_REGULATORY',
      engineVersion: VERSION,
      build: BUILD,
      regulation: 'TR_GREEN_TAXONOMY_REG_2026',
      activityMapping: activity,
      substantialContribution: { value: sc, status: sc ? 'INPUT_CONFIRMED' : 'REQUIRES_TECHNICAL_CRITERIA' },
      dnsh: { value: dnsh, status: dnsh ? 'INPUT_CONFIRMED' : 'REQUIRES_TECHNICAL_CRITERIA' },
      minimumSocialSafeguards: { value: social, status: social ? 'INPUT_CONFIRMED' : 'REQUIRES_EVIDENCE' },
      alignment: 'UNDETERMINED',
      kpi: {
        revenueRatio: input.revenueRatio == null ? null : n(input.revenueRatio),
        capexRatio: input.capexRatio == null ? null : n(input.capexRatio),
        opexRatio: input.opexRatio == null ? null : n(input.opexRatio)
      },
      warnings: [],
      nextActions: []
    };

    if (activity.status === 'NOT_MAPPED') {
      result.warnings.push(activity.warning);
      result.nextActions.push('Faaliyeti güncel Ek-1 veri setine eşleştir.');
    }

    if (activity.status !== 'NOT_MAPPED' && sc && dnsh && social) {
      result.alignment = 'PROVISIONALLY_ALIGNED_PENDING_CRITERIA_EVIDENCE';
      result.warnings.push('Bu sonuç teknik tarama kriterlerinin ve kanıtların VITAVOLT tarafından doğrulanmasına tabidir.');
    } else {
      result.warnings.push('Ek-1 uygunluğu tek başına uyumluluk değildir; SC + DNSH + asgari sosyal koruma birlikte değerlendirilmelidir.');
      result.nextActions.push('Güncel teknik tarama kriterlerini yükle ve kanıtları bağla.');
    }

    return result;
  }

  function assess(input, regulatoryData) {
    input = input || {};
    regulatoryData = regulatoryData || {};
    var ets = assessETS(input.ets || input, regulatoryData.ets);
    var taxonomy = assessTaxonomy(input.taxonomy || input, regulatoryData.taxonomy);

    return {
      engine: 'VITA_REGULATORY',
      engineVersion: VERSION,
      build: BUILD,
      scenarioId: input.scenarioId || null,
      inputs: input,
      outputs: {
        ets: ets,
        taxonomy: taxonomy
      },
      technicalValidity: {
        status: 'PRE_ASSESSMENT',
        deterministicRulesLoaded: true,
        fullAnnex1Loaded: false,
        fullTaxonomyTechnicalCriteriaLoaded: false
      },
      validation: {
        humanReviewRequired: true,
        finalComplianceDecision: 'NOT_AUTOMATICALLY_GRANTED'
      },
      provenance: {
        etsRegulation: 'TR_ETS_REG_2026',
        greenTaxonomyRegulation: 'TR_GREEN_TAXONOMY_REG_2026',
        registryBuild: BUILD
      },
      warnings: [
        'Bu katman hukuki uygunluk kararı değil, mevzuat tabanlı ön değerlendirmedir.',
        'Eksik mevzuat veri setleri doldurulmadan kapsam dışı veya uyumlu sonucu çıkarılamaz.'
      ],
      nextActions: {
        anneReview: 'REQUIRED',
        humanApproval: 'REQUIRED',
        mitosOptimization: 'AVAILABLE_AFTER_REGULATORY_BASELINE'
      }
    };
  }

  window.VitaRegulatoryEngine = {
    version: VERSION,
    build: BUILD,
    classifyCategory: classifyCategory,
    assessETS: assessETS,
    assessTaxonomy: assessTaxonomy,
    assess: assess
  };
})(typeof window !== 'undefined' ? window : global);
