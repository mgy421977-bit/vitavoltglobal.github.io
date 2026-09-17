/* Unified VITA Intelligence form: service scope + existing deterministic feasibility core. */
(function(){
  'use strict';
  var KEY='vitavolt_vita_selection';
  var defs={
    ges:{title:'GES / Güneş Enerjisi',note:'Çatı veya arazi alanı ve tüketim bilgileri mevcut GES ön fizibilite motoruna aktarılır.'},
    bess:{title:'BESS / Enerji Depolama',note:'Pik talep ve gece tüketim payı, mevcut BESS ön değerlendirmesinde kullanılır.'},
    epc:{title:'Endüstriyel EPC',note:'Mühendislik, tedarik ve uygulama kapsamı proje notlarıyla birlikte değerlendirilir.'},
    carbon:{title:'Karbon & ESG',note:'Karbon/ESG kapsamı bilgi toplama aşamasındadır; doğrulanmış canlı karbon muhasebesi sonucu üretilmez.'},
    water:{title:'Su Yönetimi',note:'Çatı alanı, şehir ve aylık su tüketimi mevcut yağmur/gri su ön fizibilite çekirdeğine aktarılabilir.'},
    feasibility:{title:'Genel Ön Fizibilite',note:'Seçilen hizmetlerin ortak proje bağlamını oluşturur.'}
  };
  function selected(){
    try{
      var a=JSON.parse(localStorage.getItem(KEY)||'[]');
      if(!Array.isArray(a))return [];
      return a.filter(function(x){return Object.prototype.hasOwnProperty.call(defs,x);});
    }catch(e){return[];}
  }
  function init(){
    var form=document.getElementById('vitaIntelligenceForm');
    var box=document.getElementById('vitaDynamicSections');
    if(!form||!box)return;

    function draw(){
      var items=selected();
      box.innerHTML='';
      if(!items.length){
        box.innerHTML='<div class="vita-select-empty">Önce hizmet kartlarından <strong>VITA Intelligence’a Ekle</strong> seçimi yapın.</div>';
        return;
      }
      items.forEach(function(key){
        var d=defs[key];
        var sec=document.createElement('section');
        sec.className='vita-dynamic-section';
        sec.dataset.vitaSection=key;
        sec.innerHTML='<h3></h3><p></p>';
        sec.querySelector('h3').textContent=d.title;
        sec.querySelector('p').textContent=d.note;
        box.appendChild(sec);
      });
    }

    function number(name){
      var el=form.elements[name];
      if(!el)return 0;
      var n=Number(el.value);
      return Number.isFinite(n)&&n>=0?n:0;
    }
    function text(name){
      var el=form.elements[name];
      return el?String(el.value||'').trim():'';
    }
    function renderResult(message, isError){
      var out=document.getElementById('vitaUnifiedResult');
      if(!out)return;
      out.hidden=false;
      out.textContent=message;
      out.style.borderColor=isError?'rgba(248,113,113,.25)':'rgba(74,222,128,.2)';
    }

    draw();
    window.addEventListener('storage',function(e){if(e.key===KEY)draw();});

    form.addEventListener('submit',function(e){
      e.preventDefault();
      var items=selected();
      if(!items.length){renderResult('Analiz kapsamı seçilmedi. Önce services.html üzerinden en az bir hizmet seçin.',true);return;}

      var input={
        city:text('city'),
        roofAreaM2:number('roofAreaM2'),
        landAreaM2:number('landAreaM2'),
        landAvailable:text('landAvailable')==='true',
        monthlyConsumptionKwh:number('monthlyConsumptionKwh'),
        nighttimeShare:number('nighttimeSharePct')/100,
        peakDemandKw:number('peakDemandKw'),
        monthlyWaterM3:number('monthlyWaterM3')
      };

      var result=null;
      var hasArea=input.roofAreaM2>0 || (input.landAvailable && input.landAreaM2>0);
      if(hasArea && window.VitavoltCalculator && typeof window.VitavoltCalculator.calculate==='function'){
        try{result=window.VitavoltCalculator.calculate(input,window.VitavoltCalculator.defaultConfig);}catch(err){renderResult('Ön fizibilite çalıştırılamadı: '+(err.message||'geçersiz girdi'),true);return;}
      }

      var scope=items.map(function(x){return defs[x].title;}).join(', ');
      var message='VITA Intelligence kapsamı: '+scope+'. ';
      if(result){
        message+='GES ön fizibilite: '+result.solar.dcCapacityKwp+' kWp, '+result.solar.panelCount+' panel, yıllık yaklaşık '+result.solar.annualProductionKwh.toLocaleString('tr-TR')+' kWh üretim. ';
        message+='Öz tüketim yaklaşık '+result.solar.selfConsumptionKwh.toLocaleString('tr-TR')+' kWh; şebeke ihracı yaklaşık '+result.solar.gridExportKwh.toLocaleString('tr-TR')+' kWh. ';
        message+='BESS: '+(result.bess.recommended?'ön değerlendirmede öneriliyor':'ön değerlendirmede tetiklenmedi')+(result.bess.suggestedCapacityKwh>0?' ('+result.bess.suggestedCapacityKwh+' kWh)':'')+'. ';
        if(result.water){message+='Su ön fizibilitesi de üretildi.';}
      }else{
        message+='GES hesaplaması için çatı alanı veya arazi GES seçeneğiyle birlikte geçerli alan girilmedi; mevcut veriyle yalnızca analiz kapsamı oluşturuldu.';
      }
      message+=' Bu çıktı ön fizibilitedir; nihai mühendislik sonucu değildir.';
      renderResult(message,false);

      try{sessionStorage.setItem('vitavolt_vita_payload',JSON.stringify({selected:items,input:input,projectNotes:text('projectNotes')}));}catch(err){}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
