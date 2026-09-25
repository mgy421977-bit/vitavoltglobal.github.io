/* Vitavolt Global — Vita Intelligence Report & Proposal Studio v1 | 2026-09-25 */
(function(){
'use strict';
var cities=['Adana','Adıyaman','Afyonkarahisar','Ağrı','Aksaray','Amasya','Ankara','Antalya','Ardahan','Artvin','Aydın','Balıkesir','Bartın','Batman','Bayburt','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Düzce','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Iğdır','Isparta','İstanbul','İzmir','Kahramanmaraş','Karabük','Karaman','Kars','Kastamonu','Kayseri','Kilis','Kırıkkale','Kırklareli','Kırşehir','Kocaeli','Konya','Kütahya','Malatya','Manisa','Mardin','Mersin','Muğla','Muş','Nevşehir','Niğde','Ordu','Osmaniye','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas','Şanlıurfa','Şırnak','Tekirdağ','Tokat','Trabzon','Tunceli','Uşak','Van','Yalova','Yozgat','Zonguldak'];
var ids=['company','facility','sector','city','annualConsumption','peakDemand','roofArea','landArea','monthlyWater','annualTco2e','annex1','facilityType','notes'];
function $(id){return document.getElementById(id);}
function val(id){return $(id)?String($(id).value||'').trim():'';}
function num(id){var x=Number(val(id));return Number.isFinite(x)?Math.max(0,x):0;}
function selectedModules(){return Array.prototype.slice.call(document.querySelectorAll('.vi-module input[type=checkbox][value]:checked')).map(function(x){return x.value;});}
function prices(){var a=[];document.querySelectorAll('[data-price]').forEach(function(i){var n=Number(i.value);if(Number.isFinite(n)&&n>0)a.push({item:i.dataset.price,amount:n});});return a;}
function total(){return prices().reduce(function(s,x){return s+x.amount;},0);}
function fmt(n){return Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:2});}
function setStatus(t,cls){var e=$('analysisStatus');e.textContent=t;e.className='vi-status '+(cls||'');}
function renderMetrics(r,reg){
 var map=reg&&reg.outputs&&reg.outputs.ets&&reg.outputs.ets.annex1Mapping;
 if(map){
   var mapText=(map.status==='CANDIDATE'?'ADAY: ':'')+(map.activityName||map.activityCode||'Belirlenmedi');
   var el=document.getElementById('analysisDetails');
   if(el) el.setAttribute('data-annex1',mapText);
 }
 var s=r&&r.solar||{},b=r&&r.bess||{},w=r&&r.water||{},m=[
 ['GES',fmt(s.dcCapacityKwp)+' kWp'],['Üretim',fmt(s.annualProductionKwh)+' kWh/yıl'],['CO₂ azaltımı',fmt(s.co2ReductionKg)+' kg/yıl'],
 ['BESS',b.recommended?'Öneriliyor':'Tetiklenmedi'],['Yağmur suyu',w.rainfall&&w.rainfall.selected?fmt(w.rainfall.annualUsableM3)+' m³/yıl':'Seçilmedi'],['ETS',reg&&reg.outputs&&reg.outputs.ets?reg.outputs.ets.etsScope:'Ön değerlendirme']
 ];
 $('metrics').innerHTML=m.map(function(x){return '<div class="vi-metric"><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>';}).join('');
 var p=r.pricing||{},inv=p.inverter||{},d=r.validation||{};
 $('analysisDetails').innerHTML='<table class="vi-table"><tr><th>Kalem</th><th>Sonuç</th></tr>'+
 '<tr><td>Panel</td><td>'+fmt(s.panelCount)+' × '+fmt((r.assumptions||{}).panelPowerWp)+' Wp</td></tr>'+
 '<tr><td>İnverter</td><td>'+((inv.configuration||((inv.count||1)+' × '+(inv.powerKw||'-')+' kW')))+' · AC/DC '+fmt(inv.actualAcDcRatio||0)+'</td></tr>'+
 '<tr><td>BESS</td><td>'+fmt((b.installedCapacityKwh||0))+' kWh · '+fmt(b.batteryModuleCount||0)+' modül</td></tr>'+
 '<tr><td>VITA doğrulama</td><td class="'+(d.ok?'vi-check':'vi-warning')+'">'+(d.ok?'OK':'KONTROL GEREKLİ')+'</td></tr>'+
 '<tr><td>Teknik uyarı</td><td>'+((r.warning)||'Ön fizibilite çıktısı')+'</td></tr></table>';
}
function inverterOptionsFor(dc){
 var pricing=(window.VitaEngine&&window.VitaEngine.config&&window.VitaEngine.config.pricing)||{};
 var list=(pricing.inverter_options||[]).filter(function(x){return Number(x.power_kw)>0;});
 var target=Number(dc||0)*0.8, out=[{value:'auto',label:'Otomatik — DC’nin %80’i'}];
 list.forEach(function(x){
   var p=Number(x.power_kw); if(!p)return;
   var count=Math.max(1,Math.ceil(target/p));
   var total=count*p;
   if(total<=Number(dc||0)+0.01 || Math.abs(total-target)<=Math.max(p,5)){
     out.push({value:String(p),label:count+' × '+p+' kW '+(x.type||'inverter')+' — '+total.toFixed(1)+' kW'});
   }
 });
 var seen={}; return out.filter(function(x){if(seen[x.value])return false;seen[x.value]=true;return true;});
}
function populateEquipmentSelectors(r){
 var s=r&&r.solar||{}, dc=Number(s.dcCapacityKwp||0);
 var ps=$('bomPanelSelect'), is=$('bomInverterSelect');
 if(ps){
   var current=String((r.assumptions&&r.assumptions.panelPowerWp)||620);
   ps.value=current;
 }
 if(is){
   var opts=inverterOptionsFor(dc);
   is.innerHTML=opts.map(function(o){return '<option value="'+o.value+'">'+o.label+'</option>';}).join('');
   var selected=r&&r.sizing&&r.sizing.inverter&&r.sizing.inverter.configuration;
   if(selected){
     var found=opts.find(function(o){return o.value!=='auto'&&selected.indexOf(o.value+' kW')!==-1;});
     if(found)is.value=found.value;
   }
 }
}
function renderBom(r){
 var box=$('bomEditor'); if(!box) return;
 var bom=(r&&r.pricing&&r.pricing.bom)||[];
 populateEquipmentSelectors(r);
 if(!bom.length){box.innerHTML='<p class="vi-print-note">Henüz BOM oluşmadı.</p>';if($('bomSummary'))$('bomSummary').innerHTML='<div><small>BOM durumu</small><strong>Bekliyor</strong></div><div><small>Fiyatlandırılan</small><strong>0</strong></div><div><small>Eksik fiyat</small><strong>0</strong></div>';return;}
 box.innerHTML='<div style="overflow:auto"><table class="vi-table"><thead><tr><th>Kategori</th><th>Kalem</th><th>Miktar</th><th>Birim</th><th>Birim fiyat</th><th>Toplam</th><th>Kaynak</th></tr></thead><tbody>'+
 bom.map(function(x,i){
   var cost=x.unitCost==null?'':x.unitCost;
   var qty=Number(x.quantity||0);
   return '<tr><td>'+x.category+'</td><td>'+x.item+'</td><td><input class="bom-qty" data-bom-index="'+i+'" type="number" min="0" step="0.01" value="'+qty+'"></td><td>'+x.unit+'</td><td><input class="bom-price" data-bom-index="'+i+'" type="number" min="0" step="0.01" value="'+cost+'" placeholder="Gir"></td><td class="bom-total" data-bom-total="'+i+'">'+(x.totalCost==null?'—':fmt(x.totalCost))+'</td><td>'+x.source+'</td></tr>';
 }).join('')+'</tbody></table></div>';
 function updateRow(i){
   var row=bom[i], qi=box.querySelector('.bom-qty[data-bom-index="'+i+'"]'), pi=box.querySelector('.bom-price[data-bom-index="'+i+'"]');
   var q=Number(qi&&qi.value), v=Number(pi&&pi.value);
   row.quantity=Number.isFinite(q)&&q>=0?q:0;
   if(Number.isFinite(v)&&v>=0){row.unitCost=v;row.totalCost=Number((row.quantity*v).toFixed(2));row.costStatus='PRICED';}
   else {row.unitCost=null;row.totalCost=null;row.costStatus='NOT_PRICED';}
   var t=box.querySelector('[data-bom-total="'+i+'"]');if(t)t.textContent=row.totalCost==null?'—':fmt(row.totalCost);
   window.__vitaStudio.bom=bom;
   updateBomSummary(bom);
 }
 box.querySelectorAll('.bom-qty').forEach(function(inp){inp.addEventListener('input',function(){updateRow(Number(inp.dataset.bomIndex));});});
 box.querySelectorAll('.bom-price').forEach(function(inp){inp.addEventListener('input',function(){updateRow(Number(inp.dataset.bomIndex));});});
 updateBomSummary(bom);
}
function updateBomSummary(bom){
 var priced=0,missing=0;
 (bom||[]).forEach(function(x){if(x.source==='DERIVED')return;if(x.costStatus==='PRICED'&&x.unitCost!=null)priced++;else if(x.costStatus!=='NOT_APPLICABLE'&&x.costStatus!=='SUPERSEDED')missing++;});
 if($('bomSummary'))$('bomSummary').innerHTML='<div><small>BOM durumu</small><strong>'+(bom||[]).length+' kalem</strong></div><div><small>Fiyatlandırılan</small><strong class="bom-priced">'+priced+'</strong></div><div><small>Eksik fiyat</small><strong class="bom-missing">'+missing+'</strong></div>';
}
function applyBomPrices(){
 var p=window.__vitaStudio;
 if(!p||!p.result||!p.result.pricing||!p.bom){setStatus('Önce hesaplamayı çalıştır; ardından BOM fiyatlarını uygula.','vi-warning');return;}
 var bom=p.bom, known=0, missing=0;
 bom.forEach(function(row){
   if(row.source==='DERIVED'||row.costStatus==='NOT_APPLICABLE'||row.costStatus==='SUPERSEDED')return;
   var v=Number(row.unitCost);
   if(Number.isFinite(v)&&v>=0){row.totalCost=Number(row.quantity||0)*v;known+=row.totalCost||0;}
   else missing++;
 });
 p.result.pricing.bom=bom;
 p.result.pricing.bomKnownCost=Number(known.toFixed(2));
 p.result.pricing.bomPricingStatus=missing?'PARTIAL':'COMPLETE';
 p.result.pricing.bomMissingPriceCount=missing;
 p.result.pricing.projectCost=p.result.pricing.projectCost||{};
 p.result.pricing.projectCost.bomKnownCost=p.result.pricing.bomKnownCost;
 p.result.pricing.projectCost.bomPricingStatus=p.result.pricing.bomPricingStatus;
 p.bomPriceAppliedAt=new Date().toISOString();
 window.__vitaStudio=p;
 renderBom(p.result);
 setStatus(missing?'BOM fiyatları uygulandı. '+missing+' kalem hâlâ fiyat bekliyor.':'BOM fiyatları hesaplamaya uygulandı. Tüm fiyatlandırılabilir kalemler dolu.','');
}
function applyEquipmentSelection(){
 var p=window.__vitaStudio;
 if(!p||!p.input){setStatus('Önce hesaplamayı çalıştır.','vi-warning');return;}
 var panel=Number(val('bomPanelSelect'))||620, inv=val('bomInverterSelect')||'auto';
 p.input.panelPowerWp=panel;
 p.input.inverterPowerKw=inv==='auto'?0:Number(inv);
 run();
 setStatus(inv==='auto'?'Panel seçimi uygulandı. İnverter VITA tarafından DC’nin %80 hedefiyle yeniden seçildi.':'Panel ve inverter seçimi uygulandı. İnverter adedi seçilen güç üzerinden yeniden hesaplandı.');
}
function openWebPriceSearch(){
 var p=window.__vitaStudio||{}, bom=p.bom||((p.result&&p.result.pricing&&p.result.pricing.bom)||[]);
 if(!bom.length){setStatus('Önce hesaplamayı çalıştır; ardından BOM kalemleri için internet araması açılır.','vi-warning');return;}
 var q=bom.filter(function(x){return x.costStatus==='NOT_PRICED';}).slice(0,1)[0];
 if(!q){setStatus('BOM içindeki tüm kalemlerin birim fiyatı girilmiş.');return;}
 var query='Türkiye '+q.item+' birim fiyat 2026 '+q.unit;
 window.open('https://www.google.com/search?q='+encodeURIComponent(query),'_blank','noopener');
 setStatus('İnternet araması açıldı: '+q.item+'. Bulduğun ortalama değeri BOM tablosundaki Birim fiyat alanına gir.');
}
function buildInput(){
 var selectedPanel=Number(val('bomPanelSelect'))||620, selectedInv=val('bomInverterSelect')||'auto';
 return {panelPowerWp:selectedPanel,inverterPowerKw:selectedInv==='auto'?0:Number(selectedInv),city:val('city'),roofAreaM2:num('roofArea'),landAreaM2:num('landArea'),landAvailable:num('landArea')>0,annualConsumptionKwh:num('annualConsumption'),monthlyConsumptionKwh:num('annualConsumption')/12,peakDemandKw:num('peakDemand'),monthlyWaterM3:num('monthlyWater'),annualTco2e:num('annualTco2e'),facilityType:val('facilityType'),annex1Activity:val('annex1')===''?undefined:val('annex1')==='true',sector:val('sector'),company:val('company'),facility:val('facility'),facilityActivityDescription:val('facilityActivityDescription'),annualCapacity:num('annualCapacity'),capacityUnit:val('capacityUnit')};
}
function run(){
 if(!window.VitaEngine||typeof window.VitaEngine.calculate!=='function'){setStatus('VITA Engine yüklenemedi. Sayfayı yenileyin.','vi-warning');return;}
 var input=buildInput(), modules=selectedModules();
 input.forceBessSelected=modules.indexOf('bess')!==-1;
 input.rainwaterSelected=modules.indexOf('rainwater')!==-1;
 input.rainwaterSelected=modules.indexOf('rainwater')!==-1;
 input.greywaterSelected=modules.indexOf('greywater')!==-1;
 if(!input.roofAreaM2&&!input.landAreaM2){setStatus('GES hesabı için çatı veya arazi alanı girin. Diğer raporlar yine veri toplama aşamasında hazırlanabilir.','vi-warning');return;}
 try{
  var r=window.VitaEngine.calculate(input,{});
 if(input.forceBessSelected && r.bess && !(Number(r.bess.suggestedCapacityKwh)>0)) { var dailyForce=(Number(input.annualConsumptionKwh)||0)/365; var forcedKwh=Number((dailyForce*0.35*0.75/(0.9*0.95)).toFixed(1)); r.bess.recommended=true; r.bess.suggestedCapacityKwh=forcedKwh; r.bess.requestedCapacityKwh=forcedKwh; var recalc=window.VitaEngine.calculate(Object.assign({},input,{bessCapacityKwh:forcedKwh}),{}); r=recalc; }
  var regInput={systemYear:new Date().getFullYear(),annualTco2e:input.annualTco2e,annex1Activity:input.annex1Activity,facilityType:input.facilityType,sector:input.sector,facilityActivityDescription:input.facilityActivityDescription,annualCapacity:input.annualCapacity,capacityUnit:input.capacityUnit};
  var reg=window.VitaRegulatoryEngine&&typeof window.VitaRegulatoryEngine.assess==='function'?window.VitaRegulatoryEngine.assess({ets:regInput,taxonomy:{sector:input.sector,facilityType:input.facilityType}},{}):null;
  window.__vitaStudio={input:input,modules:modules,result:r,regulatory:reg,prices:prices(),currency:val('currency')||'TRY',locked:false,bom:r.pricing&&r.pricing.bom||[]};
  renderMetrics(r,reg); renderBom(r);
  var msg='Hesaplama tamamlandı.\nVITA: '+(r.engine&&r.engine.version||'-')+' · Validator: '+(r.validation&&r.validation.ok?'OK':'KONTROL GEREKLİ');
  if(reg)msg+='\nETS: '+reg.outputs.ets.etsScope+' · Taksonomi: '+reg.outputs.taxonomy.alignment;
  setStatus(msg);
 }catch(e){setStatus('Hesaplama hatası: '+(e&&e.message?e.message:e),'vi-warning');}
}
function save(){
 var p=window.__vitaStudio||{input:buildInput(),modules:selectedModules(),prices:prices(),currency:val('currency')};
 p.savedAt=new Date().toISOString();
 localStorage.setItem('vitavolt_vita_project_draft',JSON.stringify(p));
 setStatus('Proje taslağı bu tarayıcıya kaydedildi.');
}
function load(){
 var raw=localStorage.getItem('vitavolt_vita_project_draft');if(!raw)return;
 try{var p=JSON.parse(raw),i=p.input||{};var map={company:'company',facility:'facility',sector:'sector',city:'city',annualConsumption:'annualConsumptionKwh',peakDemand:'peakDemandKw',roofArea:'roofAreaM2',landArea:'landAreaM2',monthlyWater:'monthlyWaterM3',annualTco2e:'annualTco2e',facilityType:'facilityType',facilityActivityDescription:'facilityActivityDescription',annualCapacity:'annualCapacity',capacityUnit:'capacityUnit'};
 Object.keys(map).forEach(function(k){if($(k)&&i[map[k]]!=null)$(k).value=i[map[k]];});
 if(i.annex1Activity!==undefined)$('annex1').value=String(i.annex1Activity);
 if($('bomPanelSelect')&&i.panelPowerWp)$('bomPanelSelect').value=i.panelPowerWp;
 if($('bomInverterSelect')&&i.inverterPowerKw)$('bomInverterSelect').value=i.inverterPowerKw;
 if(p.currency)$('currency').value=p.currency;
 document.querySelectorAll('[data-price]').forEach(function(el){var q=(p.prices||[]).find(function(x){return x.item===el.dataset.price;});if(q)el.value=q.amount;});
 if(p.result){window.__vitaStudio=p;window.__vitaStudio.bom=p.bom||((p.result.pricing||{}).bom||[]);renderMetrics(p.result,p.regulatory); renderBom(p.result);setStatus('Kayıtlı proje taslağı yüklendi.');}
 }catch(e){}
}
function photos(){
 var box=$('photoPreview');box.innerHTML='';
 Array.prototype.slice.call($('photos').files||[]).forEach(function(file,idx){var url=URL.createObjectURL(file),d=document.createElement('div');d.className='vi-photo';d.innerHTML='<img alt="Proje fotoğrafı '+(idx+1)+'"><span>PHOTO_'+String(idx+1).padStart(2,'0')+'</span>';d.querySelector('img').src=url;box.appendChild(d);});
}
function quote(){
 var t=total();$('quoteTotal').textContent=fmt(t)+' '+val('currency');
}
function lock(){
 if(!window.__vitaStudio)run();
 if(window.__vitaStudio&&window.__vitaStudio.bom)applyBomPrices();
 var p=window.__vitaStudio||{};p.prices=prices();p.currency=val('currency')||'TRY';p.quoteTotal=total();p.locked=true;window.__vitaStudio=p;
 setStatus('Teklif fiyatları kilitlendi. Nihai ticari bedel kullanıcı tarafından girilmiş fiyatlardan oluşur.');
}
function payload(){
 var p=window.__vitaStudio||{input:buildInput(),modules:selectedModules(),result:null,regulatory:null};
 p.prices=prices();p.currency=val('currency')||'TRY';p.quoteTotal=total();
 navigator.clipboard&&navigator.clipboard.writeText(JSON.stringify(p,null,2)).then(function(){setStatus('Proje verisi panoya kopyalandı.');}).catch(function(){setStatus('Pano erişimi engellendi.');});
}
function loadAiSettings(){
 try{
  var p=sessionStorage.getItem('vitavolt_ai_settings');
  if(!p)return;
  var x=JSON.parse(p); if($('aiProvider')&&x.provider)$('aiProvider').value=x.provider; if($('aiModel')&&x.model)$('aiModel').value=x.model;
  if($('aiApiKey')&&x.apiKey)$('aiApiKey').value=x.apiKey;
  if($('aiStatus'))$('aiStatus').textContent='API ayarı bu tarayıcı oturumunda mevcut.';
 }catch(e){}
}
function saveAiSettings(){
 var x={provider:val('aiProvider')||'gemini',apiKey:val('aiApiKey'),model:val('aiModel')};
 sessionStorage.setItem('vitavolt_ai_settings',JSON.stringify(x));
 if($('aiStatus'))$('aiStatus').textContent=x.apiKey?'API ayarı oturuma kaydedildi.':'API anahtarı boş.';
}
function clearAiSettings(){sessionStorage.removeItem('vitavolt_ai_settings');if($('aiApiKey'))$('aiApiKey').value='';if($('aiModel'))$('aiModel').value='';if($('aiStatus'))$('aiStatus').textContent='API ayarı temizlendi.';}

function init(){
 var c=$('city');cities.forEach(function(x){var o=document.createElement('option');o.value=x;o.textContent=x;c.appendChild(o);});
 if($('runAnalysis'))$('runAnalysis').addEventListener('click',run);
 if($('webPriceSearch'))$('webPriceSearch').addEventListener('click',openWebPriceSearch);
 if($('bomPanelSelect'))$('bomPanelSelect').addEventListener('change',applyEquipmentSelection);
 if($('bomInverterSelect'))$('bomInverterSelect').addEventListener('change',applyEquipmentSelection);
 if($('applyBomPrices'))$('applyBomPrices').addEventListener('click',applyBomPrices);
 if($('saveAiSettings'))$('saveAiSettings').addEventListener('click',saveAiSettings);
 if($('clearAiSettings'))$('clearAiSettings').addEventListener('click',clearAiSettings);
 loadAiSettings();
 $('saveProject').addEventListener('click',save);$('photos').addEventListener('change',photos);
 document.querySelectorAll('[data-price]').forEach(function(i){i.addEventListener('input',quote);});$('currency').addEventListener('change',quote);
 $('lockQuote').addEventListener('click',lock);$('copyPayload').addEventListener('click',payload);$('printPackage').addEventListener('click',function(){if(!window.__vitaStudio)run();window.print();});
 load();quote();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();