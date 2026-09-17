/* Unified VITA Intelligence form: service scope + deterministic feasibility + market pricing. */
(function(){
  'use strict';
  var KEY='vitavolt_vita_selection';
  var defs={
    ges:{title:'GES / Güneş Enerjisi',note:'Çatı veya arazi alanı, tüketim ve seçilen ekipman bilgileri VITA Engine ön fizibilitesine aktarılır.'},
    bess:{title:'BESS / Enerji Depolama',note:'Pik talep ve gece tüketim payı, mevcut BESS ön değerlendirmesinde kullanılır.'},
    epc:{title:'Endüstriyel EPC',note:'Mühendislik, tedarik ve uygulama kapsamı proje notlarıyla birlikte değerlendirilir.'},
    carbon:{title:'Karbon & ESG',note:'Karbon/ESG kapsamı bilgi toplama aşamasındadır; doğrulanmış canlı karbon muhasebesi sonucu üretilmez.'},
    water:{title:'Su Yönetimi',note:'Çatı alanı, şehir ve aylık su tüketimi mevcut yağmur/gri su ön fizibilite çekirdeğine aktarılabilir.'},
    feasibility:{title:'Genel Ön Fizibilite',note:'Seçilen hizmetlerin ortak proje bağlamını oluşturur.'}
  };
  function selected(){
    try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(function(x){return Object.prototype.hasOwnProperty.call(defs,x);}):[];}catch(e){return[];}
  }
  function init(){
    var form=document.getElementById('vitaIntelligenceForm');
    var box=document.getElementById('vitaDynamicSections');
    if(!form||!box)return;

    function draw(){
      var items=selected(); box.innerHTML='';
      if(!items.length){box.innerHTML='<div class="vita-select-empty">Önce hizmet kartlarından <strong>VITA Intelligence’a Ekle</strong> seçimi yapın.</div>';return;}
      items.forEach(function(key){var d=defs[key],sec=document.createElement('section');sec.className='vita-dynamic-section';sec.dataset.vitaSection=key;sec.innerHTML='<h3></h3><p></p>';sec.querySelector('h3').textContent=d.title;sec.querySelector('p').textContent=d.note;box.appendChild(sec);});
    }
    function optionalNumber(name){var el=form.elements[name];if(!el||String(el.value).trim()==='')return null;var n=Number(el.value);return Number.isFinite(n)&&n>=0?n:null;}
    function number(name){var n=optionalNumber(name);return n===null?0:n;}
    function text(name){var el=form.elements[name];return el?String(el.value||'').trim():'';}
    function renderResult(message,isError){var out=document.getElementById('vitaUnifiedResult');if(!out)return;out.hidden=false;out.textContent=message;out.style.borderColor=isError?'rgba(248,113,113,.25)':'rgba(74,222,128,.2)';}
    function addField(name,label,html){
      if(form.elements[name])return;
      var wrap=document.createElement('div');wrap.className='vita-form-field';
      wrap.innerHTML='<label for="vita_'+name+'">'+label+'</label>'+html;
      var grid=form.querySelector('.vita-form-grid');
      if(grid){var notes=form.elements.projectNotes&&form.elements.projectNotes.closest('.vita-form-field');grid.insertBefore(wrap,notes||null);}
    }
    function setupPricing(config){
      var pricing=config&&config.pricing||{};
      var panels=Array.isArray(pricing.panel_options)?pricing.panel_options:[];
      var inverters=Array.isArray(pricing.inverter_options)?pricing.inverter_options:[];
      if(!panels.length&&!inverters.length)return;
      addField('panelPowerWp','Panel gücü', '<select id="vita_panelPowerWp" name="panelPowerWp"></select>');
      addField('inverterPowerKw','İnverter seçimi', '<select id="vita_inverterPowerKw" name="inverterPowerKw"><option value="0">Otomatik — kapasiteye göre</option></select>');
      var ps=form.elements.panelPowerWp, is=form.elements.inverterPowerKw;
      if(ps){
        panels.forEach(function(p){var o=document.createElement('option');o.value=String(p.power_wp);o.textContent=p.power_wp+' Wp';if(Number(p.power_wp)===Number(config.solar.default_panel_power))o.selected=true;ps.appendChild(o);});
      }
      if(is){
        inverters.slice().sort(function(a,b){return Number(a.power_kw)-Number(b.power_kw);}).forEach(function(v){var o=document.createElement('option');o.value=String(v.power_kw);o.textContent=v.power_kw+' kW'+(v.type==='hybrid'?' Hibrit':' İnverter');if(v.source!=='user_market_reference')o.textContent+=' · türetilmiş';is.appendChild(o);});
      }
      var note=document.createElement('p');note.className='vita-form-note';note.textContent='Fiyatlar VITA Engine içindeki piyasa referanslarından alınır ve yapılandırılmış %'+Number(pricing.markup_pct||15)+' fiyat katmanı eklenir. KDV hesaplanmaz. Panel + inverter tutarı ön tahmindir; konstrüksiyon, kablo, koruma, işçilik, mühendislik ve diğer EPC kalemleri dahil değildir.';
      var grid=form.querySelector('.vita-form-grid');if(grid)grid.appendChild(note);
    }

    draw();
    window.addEventListener('storage',function(e){if(e.key===KEY)draw();});

    function runWithConfig(config){
      var items=selected();
      if(!items.length){renderResult('Analiz kapsamı seçilmedi. Önce services.html üzerinden en az bir hizmet seçin.',true);return;}
      var nighttime=optionalNumber('nighttimeSharePct');
      var input={city:text('city'),roofAreaM2:number('roofAreaM2'),landAreaM2:number('landAreaM2'),landAvailable:text('landAvailable')==='true',monthlyConsumptionKwh:number('monthlyConsumptionKwh'),peakDemandKw:number('peakDemandKw'),monthlyWaterM3:number('monthlyWaterM3'),panelPowerWp:number('panelPowerWp'),inverterPowerKw:number('inverterPowerKw')};
      if(nighttime!==null)input.nighttimeShare=nighttime/100;
      var result=null,hasArea=input.roofAreaM2>0||(input.landAvailable&&input.landAreaM2>0);
      if(hasArea&&window.VitavoltCalculator&&typeof window.VitavoltCalculator.calculate==='function'){
        try{result=window.VitavoltCalculator.calculate(input,config);}catch(err){renderResult('Ön fizibilite çalıştırılamadı: '+(err.message||'geçersiz girdi'),true);return;}
      }
      var scope=items.map(function(x){return defs[x].title;}).join(', '),message='VITA Intelligence kapsamı: '+scope+'. ';
      if(result){
        message+='GES: '+result.solar.dcCapacityKwp+' kWp, '+result.solar.panelCount+' panel, yıllık yaklaşık '+result.solar.annualProductionKwh.toLocaleString('tr-TR')+' kWh üretim. ';
        message+='Öz tüketim yaklaşık '+result.solar.selfConsumptionKwh.toLocaleString('tr-TR')+' kWh; şebeke ihracı yaklaşık '+result.solar.gridExportKwh.toLocaleString('tr-TR')+' kWh. ';
        message+='BESS: '+(result.bess.recommended?'ön değerlendirmede öneriliyor':'ön değerlendirmede tetiklenmedi')+(result.bess.suggestedCapacityKwh>0?' ('+result.bess.suggestedCapacityKwh+' kWh)':'')+'. ';
        if(result.pricing){
          var panelInverterUsd=result.pricing.total&&Number.isFinite(Number(result.pricing.total.sellUsd))?Number(result.pricing.total.sellUsd):0;
          if(panelInverterUsd>0)message+='Piyasa referanslı panel + inverter tahmini: '+panelInverterUsd.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' '+result.pricing.currency+' (KDV hariç). ';
          if(result.pricing.projectCost&&result.pricing.projectCost.usd>0)message+='VITA ön maliyet referansı: '+Number(result.pricing.projectCost.usd).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' '+result.pricing.currency+'; baz: '+result.pricing.projectCost.basis+'. ';
        }
        if(result.water)message+='Su ön fizibilitesi de üretildi. ';
      }else message+='GES hesaplaması için çatı alanı veya arazi GES seçeneğiyle birlikte geçerli alan girilmedi; mevcut veriyle yalnızca analiz kapsamı oluşturuldu. ';
      message+='Bu çıktı ön fizibilitedir; nihai mühendislik sonucu değildir.';
      renderResult(message,false);
      try{sessionStorage.setItem('vitavolt_vita_payload',JSON.stringify({selected:items,input:input,projectNotes:text('projectNotes'),pricing:result&&result.pricing||null}));}catch(err){}
    }

    if(window.VitavoltCalculator&&typeof window.VitavoltCalculator.loadConfig==='function'){
      window.VitavoltCalculator.loadConfig().then(setupPricing).catch(function(){setupPricing(window.VitavoltCalculator.defaultConfig);});
    }
    form.addEventListener('submit',function(e){e.preventDefault();if(typeof form.reportValidity==='function'&&!form.reportValidity())return;var run=function(config){runWithConfig(config||window.VitavoltCalculator.defaultConfig);};if(window.VitavoltCalculator&&typeof window.VitavoltCalculator.loadConfig==='function')window.VitavoltCalculator.loadConfig().then(run);else run(null);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
