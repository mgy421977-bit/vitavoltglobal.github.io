/* Vitavolt Global — VITA Offer Renderer | data + photo template layer */
(function(window){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
  function setField(name,value){document.querySelectorAll('[data-field="'+name+'"]').forEach(function(el){el.textContent=value==null||value===''?'—':value;});}
  function setPhoto(slot,src){document.querySelectorAll('[data-photo="'+slot+'"]').forEach(function(img){if(src){img.src=src;img.style.display='block';}else{img.removeAttribute('src');img.style.display='none';}});}
  function render(data){
    data=data||{}; var s=data.solar||{}, p=data.pricing||{}, inv=p.inverter||{}, b=p.battery||data.bess||{}, w=data.water||{}, a=data.customer||{}, photos=data.photos||{};
    setField('title',data.title||'Enerji Altyapısı Ön Fizibilitesi'); setField('customer',a.name||data.customerName||'Müşteri'); setField('facility',a.facilityType||data.facilityType||'Tesis'); setField('city',a.city||data.city||'—');
    setField('dcKwp',s.dcCapacityKwp!=null?s.dcCapacityKwp+' kWp':'—'); setField('dcKwp2',s.dcCapacityKwp!=null?s.dcCapacityKwp+' kWp':'—'); setField('dcKwp3',s.dcCapacityKwp!=null?s.dcCapacityKwp+' kWp':'—');
    setField('panelCount',s.panelCount); setField('panelWp',data.panelWp||data.assumptions&&data.assumptions.panelPowerWp); setField('annualProduction',s.annualProductionKwh!=null?Number(s.annualProductionKwh).toLocaleString('tr-TR')+' kWh/yıl':'—'); setField('annualProduction2',s.annualProductionKwh!=null?Number(s.annualProductionKwh).toLocaleString('tr-TR')+' kWh/yıl':'—'); setField('co2',s.co2ReductionKg!=null?Number(s.co2ReductionKg).toLocaleString('tr-TR')+' kg/yıl':'—'); setField('co2_2',s.co2ReductionKg!=null?Number(s.co2ReductionKg).toLocaleString('tr-TR')+' kg/yıl':'—');
    setField('inverterCount',inv.count); setField('inverterKw',inv.powerKw); setField('inverterSummary',(inv.count||'—')+' × '+(inv.powerKw||'—')+' kW');
    var installed=b.installedCapacityKwh!=null?b.installedCapacityKwh:(data.bess&&data.bess.installedKwh); var modules=b.batteryModuleCount!=null?b.batteryModuleCount:(data.bess&&data.bess.units);
    setField('bess',Number(modules||0)>0?modules+' × 2.4 kWh = '+installed+' kWh kurulu kapasite':'BESS ön değerlendirmesinde tetiklenmedi');
    var rw=w.rainfall&&w.rainfall.selected?w.rainfall.annualUsableM3+' m³/yıl':'Seçilmedi'; var gw=w.greywater&&w.greywater.selected?w.greywater.annualUsableM3+' m³/yıl':'Seçilmedi'; setField('rainwater',rw);setField('greywater',gw);setField('rainwater2',rw);setField('greywater2',gw);
    setField('selfConsumption',s.selfConsumptionKwh!=null?Number(s.selfConsumptionKwh).toLocaleString('tr-TR')+' kWh/yıl':'—');setField('gridExport',s.gridExportKwh!=null?Number(s.gridExportKwh).toLocaleString('tr-TR')+' kWh/yıl':'—');
    var list=document.querySelector('[data-list="components"]'); if(list){var bom=p.bom||data.bom||[];list.innerHTML=bom.filter(function(x){return Number(x.quantity||0)>0 && x.category!=='WATER';}).map(function(x){return '<li><b>'+esc(x.item)+'</b> — '+esc(x.quantity)+' '+esc(x.unit)+'</li>';}).join('');}
    Object.keys(photos).forEach(function(k){setPhoto(k,photos[k]);});
    return data;
  }
  window.VitaOfferRenderer={render:render,setPhoto:setPhoto};
})(typeof window!=='undefined'?window:this);
