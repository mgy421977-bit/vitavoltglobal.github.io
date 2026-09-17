/* Unified VITA Intelligence form: ANNE → MITOS → VITA deterministic pipeline. */
(function(){
  'use strict';
  var KEY='vitavolt_vita_selection';
  var defs={
    ges:{title:'GES / Güneş Enerjisi',note:'Çatı veya arazi alanı, tüketim ve seçilen ekipman bilgileri VITA Engine ön fizibilitesine aktarılır.'},
    bess:{title:'BESS / Enerji Depolama',note:'Pik talep ve gece tüketim payı, BESS ön değerlendirmesinde kullanılır.'},
    epc:{title:'Endüstriyel EPC',note:'Mühendislik, tedarik ve uygulama kapsamı proje notlarıyla birlikte değerlendirilir.'},
    carbon:{title:'Karbon & ESG',note:'Karbon/ESG kapsamı bilgi toplama aşamasındadır; doğrulanmış canlı karbon muhasebesi sonucu üretilmez.'},
    water:{title:'Su Yönetimi',note:'Çatı alanı, şehir ve aylık su tüketimi VITA WATER ön fizibilite çekirdeğine aktarılabilir.'},
    feasibility:{title:'Genel Ön Fizibilite',note:'Seçilen hizmetlerin ortak proje bağlamını oluşturur.'}
  };
  function selected(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(function(x){return Object.prototype.hasOwnProperty.call(defs,x);}):[];}catch(e){return[];}}
  function init(){
    var form=document.getElementById('vitaIntelligenceForm'),box=document.getElementById('vitaDynamicSections');
    if(!form||!box)return;
    function draw(){var items=selected();box.innerHTML='';if(!items.length){box.innerHTML='<div class="vita-select-empty">Önce hizmet kartlarından <strong>VITA Intelligence’a Ekle</strong> seçimi yapın.</div>';return;}items.forEach(function(key){var d=defs[key],sec=document.createElement('section');sec.className='vita-dynamic-section';sec.dataset.vitaSection=key;sec.innerHTML='<h3></h3><p></p>';sec.querySelector('h3').textContent=d.title;sec.querySelector('p').textContent=d.note;box.appendChild(sec);});}
    function optionalNumber(name){var el=form.elements[name];if(!el||String(el.value).trim()==='')return null;var x=Number(el.value);return Number.isFinite(x)&&x>=0?x:null;}
    function number(name){var x=optionalNumber(name);return x===null?0:x;}
    function text(name){var el=form.elements[name];return el?String(el.value||'').trim():'';}
    function renderResult(message,isError){var out=document.getElementById('vitaUnifiedResult');if(!out)return;out.hidden=false;out.textContent=message;out.style.borderColor=isError?'rgba(248,113,113,.25)':'rgba(74,222,128,.2)';}
    function addField(name,label,html){if(form.elements[name])return;var wrap=document.createElement('div');wrap.className='vita-form-field';wrap.innerHTML='<label for="vita_'+name+'">'+label+'</label>'+html;var grid=form.querySelector('.vita-form-grid');if(grid){var notes=form.elements.projectNotes&&form.elements.projectNotes.closest('.vita-form-field');grid.insertBefore(wrap,notes||null);}}
    function setupEquipment(config){
      var pricing=config&&config.pricing||{},panels=Array.isArray(pricing.panel_options)?pricing.panel_options:[],inverters=Array.isArray(pricing.inverter_options)?pricing.inverter_options:[];
      if(!panels.length&&!inverters.length)return;
      addField('panelPowerWp','Panel gücü','<select id="vita_panelPowerWp" name="panelPowerWp"></select>');
      addField('inverterPowerKw','İnverter tercihi','<select id="vita_inverterPowerKw" name="inverterPowerKw"><option value="0">Otomatik — VITA Engine seçsin</option></select>');
      var ps=form.elements.panelPowerWp,is=form.elements.inverterPowerKw;
      if(ps)panels.forEach(function(p){var o=document.createElement('option');o.value=String(p.power_wp);o.textContent=p.power_wp+' Wp';if(Number(p.power_wp)===Number(config.solar.default_panel_power))o.selected=true;ps.appendChild(o);});
      if(is)inverters.slice().sort(function(a,b){return Number(a.power_kw)-Number(b.power_kw);}).forEach(function(v){var o=document.createElement('option');o.value=String(v.power_kw);o.textContent=v.power_kw+' kW';is.appendChild(o);});
      var note=document.createElement('p');note.className='vita-form-note';note.textContent='Ekipman seçenekleri ön fizibilite girdisidir. Müşteriye fiyat veya iç maliyet gösterilmez; nihai marka/model ve teknik seçim mühendislik çalışmasıyla kesinleşir.';var grid=form.querySelector('.vita-form-grid');if(grid)grid.appendChild(note);
    }
    function loadScript(src,ready){return new Promise(function(resolve,reject){if(ready())return resolve();var s=document.createElement('script');s.src=src;s.async=false;s.onload=function(){ready()?resolve():reject(new Error('Modül yüklenemedi: '+src));};s.onerror=function(){reject(new Error('Modül yüklenemedi: '+src));};document.head.appendChild(s);});}
    function ensurePipeline(){
      return loadScript('js/vita-engine-sizing.js?v=2026-09-17-consumption-sizing-v2',function(){return !!(window.VitaEngine&&window.VitaEngine.__consumptionSizingInstalled);})
      .then(function(){return loadScript('js/mitos-core.js?v=2026-09-17-mitos-v2',function(){return !!(window.MitosCore&&typeof window.MitosCore.completeInputs==='function');});})
      .then(function(){return loadScript('js/anne-core.js?v=2026-09-17-anne-v4',function(){return !!(window.AnneCore&&typeof window.AnneCore.assess==='function');});})
      .then(function(){return window.AnneCore.ensureMitos?window.AnneCore.ensureMitos():Promise.resolve();});
    }
    draw();window.addEventListener('storage',function(e){if(e.key===KEY)draw();});
    function runWithConfig(config){
      var items=selected();if(!items.length){renderResult('Analiz kapsamı seçilmedi. Önce services.html üzerinden en az bir hizmet seçin.',true);return;}
      var nighttime=optionalNumber('nighttimeSharePct');
      var input={city:text('city'),roofAreaM2:number('roofAreaM2'),landAreaM2:number('landAreaM2'),landAvailable:text('landAvailable')==='true',monthlyConsumptionKwh:number('monthlyConsumptionKwh'),annualConsumptionKwh:number('monthlyConsumptionKwh')*12,peakDemandKw:number('peakDemandKw'),monthlyWaterM3:number('monthlyWaterM3'),panelPowerWp:number('panelPowerWp'),inverterPowerKw:number('inverterPowerKw'),facilityType:'VITA Intelligence'};
      if(nighttime!==null)input.nighttimeShare=nighttime/100;
      input.greywaterSelected=input.monthlyWaterM3>0;input.rainwaterSelected=input.roofAreaM2>0;
      ensurePipeline().then(function(){
        var calc=window.AnneCore.assess(input,{vitaConfig:config||{}});
        if(!calc||!calc.anne||calc.anne.status!=='ANNE_VITA_VALIDATED')throw new Error('ANNE → MITOS → VITA doğrulama zinciri tamamlanamadı');
        var s=calc.solar||{},p=calc.pricing||{},b=p.battery||{},water=calc.water||{},sz=calc.sizing||{};
        var lines=['VITA Intelligence ön fizibilite sonucu','GES: '+s.dcCapacityKwp+' kWp · '+s.panelCount+' × '+((calc.assumptions&&calc.assumptions.panelPowerWp)||'-')+' Wp','İnverter: '+((p.inverter&&p.inverter.powerKw)||'-')+' kW × '+((p.inverter&&p.inverter.count)||'-'),'Yıllık üretim: '+Number(s.annualProductionKwh||0).toLocaleString('tr-TR')+' kWh','CO₂ azaltımı: '+Number(s.co2ReductionKg||0).toLocaleString('tr-TR')+' kg/yıl','BESS: '+(calc.bess&&calc.bess.recommended?'öneriliyor':'tetiklenmedi')+(b.installedCapacityKwh?' · '+b.installedCapacityKwh+' kWh kurulu · '+b.batteryModuleCount+' modül':'' )];
        if(water.rainfall&&water.rainfall.selected)lines.push('Yağmur suyu: '+water.rainfall.annualUsableM3+' m³/yıl');
        if(water.greywater&&water.greywater.selected)lines.push('Gri su: '+water.greywater.annualUsableM3+' m³/yıl');
        if(sz&&sz.note)lines.push('Boyutlandırma: '+sz.note);
        lines.push('ANNE testi: '+((calc.anne.test&&calc.anne.test.status)||'CHECK')+' · değerlendirilen MITOS senaryosu: '+(calc.mitos&&calc.mitos.evaluatedScenarioCount||0));
        lines.push('Bu çıktı ön fizibilitedir; nihai mühendislik sonucu değildir.');
        renderResult(lines.join('\n'),false);
        try{sessionStorage.setItem('vitavolt_vita_payload',JSON.stringify({selected:items,input:input,result:calc}));}catch(err){}
      }).catch(function(err){renderResult(err&&err.message?err.message:'Analiz yüklenemedi. Sayfayı yenileyin.',true);});
    }
    if(window.VitavoltCalculator&&typeof window.VitavoltCalculator.loadConfig==='function')window.VitavoltCalculator.loadConfig().then(setupEquipment).catch(function(){setupEquipment(window.VitavoltCalculator.defaultConfig?window.VitavoltCalculator.defaultConfig():{});});
    form.addEventListener('submit',function(e){e.preventDefault();if(typeof form.reportValidity==='function'&&!form.reportValidity())return;var run=function(config){runWithConfig(config||{});};if(window.VitavoltCalculator&&typeof window.VitavoltCalculator.loadConfig==='function')window.VitavoltCalculator.loadConfig().then(run);else run({});});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
