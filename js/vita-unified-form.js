/* Unified VITA Intelligence form sections driven by service-card selections. */
(function(){
  'use strict';
  var KEY='vitavolt_vita_selection';
  var defs={
    ges:{title:'GES / Güneş Enerjisi',fields:[['text','ges_cati','Çatı alanı (m²)'],['number','ges_tuketim','Aylık elektrik tüketimi (kWh)']]},
    bess:{title:'BESS / Enerji Depolama',fields:[['number','bess_pik','Pik talep (kW)'],['number','bess_gece','Gece tüketim payı (%)']]},
    epc:{title:'Endüstriyel EPC',fields:[['text','epc_tesis','Tesis / proje tanımı'],['text','epc_ihtiyac','Planlanan mühendislik kapsamı']]},
    carbon:{title:'Karbon & ESG',fields:[['number','carbon_tuketim','Yıllık elektrik tüketimi (kWh)'],['text','carbon_kapsam','Bilinen emisyon / raporlama kapsamı']]},
    water:{title:'Su Yönetimi',fields:[['number','water_tuketim','Aylık su tüketimi (m³)'],['text','water_ihtiyac','Yağmur suyu / gri su ihtiyacı']]},
    feasibility:{title:'Genel Ön Fizibilite',fields:[['text','feasibility_hedef','Proje hedefiniz']]}
  };
  function selected(){try{return JSON.parse(localStorage.getItem(KEY)||'[]').filter(Boolean);}catch(e){return[];}}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function init(){
    var form=document.getElementById('vitaIntelligenceForm'); if(!form)return;
    var box=document.getElementById('vitaDynamicSections'); if(!box)return;
    function draw(){
      var items=selected(); box.innerHTML='';
      if(!items.length){box.innerHTML='<div class="vita-select-empty">Önce hizmet kartlarından <strong>VITA Intelligence’a Ekle</strong> seçimi yapın.</div>';return;}
      items.forEach(function(key){var d=defs[key];if(!d)return;var sec=document.createElement('section');sec.className='vita-dynamic-section';sec.dataset.vitaSection=key;var html='<h3>'+esc(d.title)+'</h3><p>Bu bölüm yalnızca seçtiğiniz analiz kapsamında kullanılır.</p><div class="vita-dynamic-grid">';d.fields.forEach(function(f){html+='<label><span>'+esc(f[2])+'</span><input type="'+f[0]+'" name="'+esc(f[1])+'" min="0"></label>';});html+='</div></section>';sec.innerHTML=html;box.appendChild(sec);});
    }
    draw();
    window.addEventListener('storage',function(e){if(e.key===KEY)draw();});
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var data={selected:selected(),fields:{}};
      Array.prototype.forEach.call(form.querySelectorAll('[name]'),function(el){data.fields[el.name]=el.value;});
      var out=document.getElementById('vitaUnifiedResult'); if(out){out.hidden=false;out.textContent='VITA Intelligence ön analiz girdileri hazırlandı. Seçilen kapsam: '+data.selected.map(function(x){return defs[x]?defs[x].title:x;}).join(', ')+'. Mevcut deterministik hesap motoru desteklediği alanlarda hesaplama yapar; eksik teknik veriler nihai mühendislik sonucu değildir.';}
      try{sessionStorage.setItem('vitavolt_vita_payload',JSON.stringify(data));}catch(err){}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
