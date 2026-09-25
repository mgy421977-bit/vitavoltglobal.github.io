/* Vitavolt Global — Vita Intelligence Report & Proposal Studio v1 | 2026-09-25-v17-price-research-legacy-web-plugin */
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
 ['BESS',(b.installedCapacityKwh&&Number(b.installedCapacityKwh)>0)?(fmt(b.installedCapacityKwh)+' kWh · '+fmt(b.batteryModuleCount||0)+' modül'):(b.recommended?'Öneriliyor':'Tetiklenmedi')],['Yağmur suyu',w.rainfall&&w.rainfall.selected?fmt(w.rainfall.annualUsableM3)+' m³/yıl':'Seçilmedi'],['ETS',reg&&reg.outputs&&reg.outputs.ets?reg.outputs.ets.etsScope:'Ön değerlendirme']
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
 if(!bom.length){
   box.innerHTML='<p class="vi-print-note">Henüz BOM oluşmadı.</p>';
   if($('bomSummary'))$('bomSummary').innerHTML='<div><small>BOM durumu</small><strong>Bekliyor</strong></div><div><small>Fiyatlandırılan</small><strong>0</strong></div><div><small>Eksik fiyat</small><strong>0</strong></div><div><small>Bilinen toplam</small><strong>—</strong></div>';
   return;
 }
 var defaultCurrency=(r.pricing&&r.pricing.currency)||'USD';
 var knownTotal=0;
 bom.forEach(function(x){if(x.source!=='DERIVED'&&Number.isFinite(Number(x.totalCost)))knownTotal+=Number(x.totalCost);});

 box.innerHTML='<div class="vi-bom-list">'+bom.map(function(x,i){
   var cost=x.unitCost==null?'':x.unitCost;
   var qty=Number(x.quantity||0);
   var cur=x.priceCurrency||defaultCurrency;
   var totalCell=x.source==='DERIVED'?'<span class="bom-derived">Hesaplanan</span>':(x.totalCost==null?'<span class="bom-pending">Fiyat bekliyor</span>':fmt(x.totalCost)+' '+cur);
   return '<div class="vi-bom-row">'+
     '<div class="vi-bom-item"><span class="vi-bom-category">'+x.category+'</span><strong>'+x.item+'</strong>'+(x.researchedProduct?'<small>Ürün: '+x.researchedProduct+'</small>':'')+'<small>Kaynak: '+x.source+'</small></div>'+
     '<label class="vi-bom-cell"><span>Miktar</span><input class="bom-qty" data-bom-index="'+i+'" type="number" min="0" step="0.01" value="'+qty+'"><em>'+x.unit+'</em></label>'+
     '<div class="vi-bom-cell"><span>Birim fiyat</span>'+(x.source==='DERIVED'?'<strong class="bom-derived">Hesaplanan</strong>':'<input class="bom-price" data-bom-index="'+i+'" type="number" min="0" step="0.01" value="'+cost+'" placeholder="Fiyat gir / ara"><em>'+(x.priceCurrency||defaultCurrency)+'</em>')+'</div>'+
     '<div class="vi-bom-cell vi-bom-total-cell"><span>Toplam</span><strong class="bom-total" data-bom-total="'+i+'">'+totalCell+'</strong></div>'+
   '</div>';
 }).join('')+'</div><div class="vi-bom-total"><span><small>BOM BİLİNEN TOPLAM</small><strong>'+fmt(knownTotal)+' '+defaultCurrency+'</strong></span><em>Fiyatı olmayan kalemler toplamın dışında tutulur.</em></div>';

 function updateRow(i){
   var row=bom[i], qi=box.querySelector('.bom-qty[data-bom-index="'+i+'"]'), pi=box.querySelector('.bom-price[data-bom-index="'+i+'"]');
   var q=Number(qi&&qi.value), v=Number(pi&&pi.value);
   row.quantity=Number.isFinite(q)&&q>=0?q:0;
   if(Number.isFinite(v)&&v>=0&&String(pi.value).trim()!==''){
     row.unitCost=v;
     row.totalCost=Number((row.quantity*v).toFixed(2));
     row.costStatus='PRICED';
   } else {
     row.unitCost=null;
     row.totalCost=null;
     row.costStatus='NOT_PRICED';
   }
   var t=box.querySelector('[data-bom-total="'+i+'"]');
   if(t)t.innerHTML=row.totalCost==null?'<span class="bom-pending">Fiyat bekliyor</span>':fmt(row.totalCost)+' '+(row.priceCurrency||defaultCurrency);
   window.__vitaStudio.bom=bom;
   updateBomSummary(bom);
   renderBomTotal(bom,defaultCurrency);
 }
 box.querySelectorAll('.bom-qty').forEach(function(inp){inp.addEventListener('input',function(){updateRow(Number(inp.dataset.bomIndex));});});
 box.querySelectorAll('.bom-price').forEach(function(inp){inp.addEventListener('input',function(){updateRow(Number(inp.dataset.bomIndex));});});
 updateBomSummary(bom);
}
function renderBomTotal(bom,currency){
 var el=document.querySelector('.vi-bom-total strong');
 if(!el)return;
 var total=0;
 (bom||[]).forEach(function(x){if(x.source!=='DERIVED'&&Number.isFinite(Number(x.totalCost)))total+=Number(x.totalCost);});
 el.textContent=fmt(total)+' '+(currency||'USD');
}
function updateBomSummary(bom){
 var priced=0,missing=0,knownTotal=0,currency='USD';
 (bom||[]).forEach(function(x){
   if(x.priceCurrency)currency=x.priceCurrency;
   if(x.source==='DERIVED')return;
   if(x.costStatus==='PRICED'&&x.unitCost!=null){priced++;if(Number.isFinite(Number(x.totalCost)))knownTotal+=Number(x.totalCost);}
   else if(x.costStatus!=='NOT_APPLICABLE'&&x.costStatus!=='SUPERSEDED')missing++;
 });
 if($('bomSummary'))$('bomSummary').innerHTML='<div><small>BOM durumu</small><strong>'+(bom||[]).length+' kalem</strong></div><div><small>Fiyatlandırılan</small><strong class="bom-priced">'+priced+'</strong></div><div><small>Eksik fiyat</small><strong class="bom-missing">'+missing+'</strong></div><div><small>Bilinen toplam</small><strong>'+fmt(knownTotal)+' '+currency+'</strong></div>';
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
 function getAiSettings(){
  var saved={};
  try{saved=JSON.parse(sessionStorage.getItem('vitavolt_ai_settings')||'{}')||{};}catch(e){}
  // Do not require a separate save click: use the visible form values first.
  var form={
   geminiApiKey:val('geminiApiKey'),
   openrouterApiKey:val('openrouterApiKey'),
   geminiModel:val('geminiModel'),
   openrouterModel:val('openrouterModel')
  };
  return {
   geminiApiKey:form.geminiApiKey||saved.geminiApiKey||'',
   openrouterApiKey:form.openrouterApiKey||saved.openrouterApiKey||'',
   geminiModel:form.geminiModel||saved.geminiModel||'gemini-2.5-flash',
   openrouterModel:form.openrouterModel||saved.openrouterModel||'openai/gpt-4o'
  };
}
function extractJson(text){
 if(text&&typeof text==='object'&&!Array.isArray(text))return text;
 if(Array.isArray(text)){
   text=text.map(function(x){return typeof x==='string'?x:(x&&typeof x.text==='string'?x.text:'');}).join('\n');
 }
 var t=String(text||'').trim();
 var fence=String.fromCharCode(96).repeat(3);
 if(t.indexOf(fence)===0)t=t.slice(3).replace(/^json/i,'').trim();
 if(t.slice(-3)===fence)t=t.slice(0,-3).trim();
 try{return JSON.parse(t);}catch(e){}
 var a=t.indexOf('{'),b=t.lastIndexOf('}');
 if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1));}catch(e){}}
 a=t.indexOf('[');b=t.lastIndexOf(']');
 if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1));}catch(e){}}
 return null;
}
async function researchPrices(){
 var p=window.__vitaStudio||{}, bom=p.bom||((p.result&&p.result.pricing&&p.result.pricing.bom)||[]);
 var candidates=bom.map(function(x,i){
   return {bomIndex:i,item:String(x.item||''),quantity:Number(x.quantity||0),unit:String(x.unit||''),category:String(x.category||'')};
 }).filter(function(x){
   return x.quantity>0&&bom[x.bomIndex]&&bom[x.bomIndex].unitCost==null&&bom[x.bomIndex].source!=='DERIVED';
 });
 if(!candidates.length){setStatus('Araştırılacak eksik BOM fiyatı kalmadı.');return;}
 var ai=getAiSettings(), key=ai.openrouterApiKey, model=ai.openrouterModel||'openai/gpt-4o';
 if(!key){setStatus('Önce API Ayarları bölümüne OpenRouter API Key gir.','vi-warning');return;}
 var btn=$('webPriceSearch');if(btn){btn.disabled=true;btn.textContent='FİYATLAR ARAŞTIRILIYOR…';}
 try{
   var applied=0, requestCount=0, batches=[];
   for(var bi=0;bi<candidates.length;bi++)batches.push(candidates.slice(bi,bi+1));

   for(var b=0;b<batches.length;b++){
     var batch=batches[b];
     setStatus('Web fiyat araştırması sürüyor: '+(b+1)+'/'+batches.length+' grup…');
     var prompt='VITAVOLT GLOBAL BOM PRICE INTELLIGENCE\\n'+
       'Türkiye piyasasında 2026 yılı için aşağıdaki satın alınabilir BOM kaleminin güncel piyasa birim fiyatını ARAŞTIR.\\n'+
       'ZORUNLU: Web search kullan. En az bir gerçek ürün/tedarikçi fiyatı bulduysan unitPrice alanına mutlaka kullanılabilir birim fiyat yaz; farklı fiyatların makul ortalamasını al, null döndürme. Fiyatı uydurma.\\n'+
       'Gerçek ürün adı/modeli ve mümkünse kaynak URL ver. Kaynak yalnız TL ise güncel web bilgisini kullanarak yaklaşık USD karşılığını hesapla ve notes alanında kaynak para birimini belirt.\\n'+
       'DERIVED/hacim/hesaplama satırları bu isteğe dahil edilmez ve fiyatlandırılmaz.\\n'+
       'ÇIKTIYI SADECE aşağıdaki şemaya uygun JSON olarak döndür. bomIndex değerini GİRDİDEKİYLE AYNI bırak.\\n'+
       '{"prices":[{"bomIndex":0,"item":"...","unitPrice":0,"currency":"USD","priceBasis":"...","source":"https://...","confidence":"HIGH|MEDIUM|LOW","notes":"..."}]}\\n'+
       'Hiçbir gerçek fiyat bulunamazsa ancak o zaman unitPrice null ver. JSON dışında açıklama yazma.\\nBOM: '+JSON.stringify(batch);

     var controller=new AbortController();
     var timer=setTimeout(function(){controller.abort();},90000);
     var body={
       model:model,
       messages:[
         {role:'system',content:'You are Vitavolt Global BOM market-price research agent. Use the supplied web search results as evidence. Never invent a price. Return only the requested JSON.'},
         {role:'user',content:prompt}
       ],
       plugins:[{id:'web',engine:'exa',max_results:5,search_prompt:'Find current Turkish supplier or product prices for this exact BOM item.'}],
       max_tokens:1200,
       temperature:0
     };
     try{
       var res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
         method:'POST',
         headers:{
           'Authorization':'Bearer '+key,
           'Content-Type':'application/json',
           'HTTP-Referer':'https://vitavoltglobal.com/',
           'X-OpenRouter-Title':'Vitavolt Global VITA Price Intelligence'
         },
         body:JSON.stringify(body),
         signal:controller.signal
       });
       var data=await res.json();
       requestCount++;
       if(!res.ok)throw new Error((data&&data.error&&data.error.message)||('OpenRouter API hatası HTTP '+res.status));
       var message=data&&data.choices&&data.choices[0]&&data.choices[0].message||{};
       var content=message.content;
       if(Array.isArray(content))content=content.map(function(part){return typeof part==='string'?part:(part&&typeof part.text==='string'?part.text:'');}).join('\n');
       var rows=extractJson(content);
       if(rows&&Array.isArray(rows.prices))rows=rows.prices;
       if(!Array.isArray(rows)){
         var finish=(data&&data.choices&&data.choices[0]&&data.choices[0].finish_reason)||'unknown';
         throw new Error('AI web araştırması JSON fiyat listesi döndürmedi. finish_reason='+finish+'. Model yanıtı: '+String(content||'').slice(0,240));
       }
       rows.forEach(function(x){
         var idx=Number(x.bomIndex);
         var row=Number.isInteger(idx)?bom[idx]:null;
         if(!row){
           row=bom.find(function(z){return z&&String(z.item||'').trim().toLowerCase()===String(x.item||'').trim().toLowerCase()&&z.unitCost==null&&z.source!=='DERIVED';});
           if(row)idx=bom.indexOf(row);
         }
         if(!row||row.unitCost!=null||row.source==='DERIVED')return;
         var raw=x.unitPrice;
         var rawText=String(raw==null?'':raw).trim();
         var v=typeof raw==='number'?raw:Number(rawText.replace(/[^0-9,.-]/g,'').replace(/\\.(?=\\d{3}(?:,|$))/g,'').replace(',','.'));
         if(Number.isFinite(v)&&v>0){
           row.unitCost=v;
           row.totalCost=Number((Number(row.quantity||0)*v).toFixed(2));
           row.costStatus='PRICED';
           row.priceCurrency=x.currency||'USD';
           row.priceBasis=x.priceBasis||'WEB_RESEARCH';
           row.priceSource=x.source||'OPENROUTER_WEB';
           row.priceConfidence=x.confidence||'MEDIUM';
           row.priceNotes=x.notes||'';
           row.researchedProduct=x.product||x.productName||x.model||x.brand||'';
           row.source='OPENROUTER_WEB';
           applied++;
         }
       });
       p.bom=bom;
       if(p.result&&p.result.pricing)p.result.pricing.bom=bom;
       window.__vitaStudio=p;
       renderBom(p.result);
       setStatus('Araştırıldı: '+(b+1)+'/'+batches.length+' kalem. Bulunan fiyatlar BOM listesine işlendi; sıradaki kalem araştırılıyor…');
     } finally {
       clearTimeout(timer);
     }
   }

   p.bom=bom;
   p.result.pricing.bom=bom;
   p.result.pricing.marketPriceResearch={
     provider:'OpenRouter',
     model:model,
     webSearch:true,
     webSearchEngine:'exa',
     researchedAt:new Date().toISOString(),
     requestCount:requestCount,
     candidateCount:candidates.length,
     appliedCount:applied
   };
   window.__vitaStudio=p;
   renderBom(p.result);
   setStatus(applied+' BOM kaleminin piyasa fiyatı web araştırmasıyla bulundu. '+(candidates.length-applied)+' kalem hâlâ fiyat bekliyor. Fiyatları kontrol edip “BOM FİYATLARINI HESAPLAMAYA UYGULA” ile onaylayabilirsin.');
 }catch(e){
   var msg=(e&&e.name==='AbortError')?'Web fiyat araştırması zaman aşımına uğradı (90 sn).':(e&&e.message?e.message:e);
   setStatus('Fiyat araştırması başarısız: '+msg,'vi-warning');
 }finally{
   if(btn){btn.disabled=false;btn.textContent='İNTERNETTEN ORTALAMA FİYAT ARA';}
 }
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
  var previousBom=(window.__vitaStudio&&window.__vitaStudio.bom)||[];
  var previousBomMap={};
  previousBom.forEach(function(x){previousBomMap[String(x.category)+'|'+String(x.item)]=x;});
  var r=window.VitaEngine.calculate(input,{});
  var freshBom=(r.pricing&&r.pricing.bom)||[];
  freshBom.forEach(function(row){
    var oldRow=previousBomMap[String(row.category)+'|'+String(row.item)];
    if(oldRow && oldRow.unitCost!=null){
      row.unitCost=oldRow.unitCost;
      row.totalCost=Number((Number(row.quantity||0)*Number(oldRow.unitCost||0)).toFixed(2));
      row.costStatus='PRICED';
      if(oldRow.priceCurrency)row.priceCurrency=oldRow.priceCurrency;
      if(oldRow.priceBasis)row.priceBasis=oldRow.priceBasis;
      if(oldRow.priceSource)row.priceSource=oldRow.priceSource;
      if(oldRow.priceConfidence)row.priceConfidence=oldRow.priceConfidence;
      if(oldRow.priceNotes)row.priceNotes=oldRow.priceNotes;
      if(oldRow.source)row.source=oldRow.source;
    }
  });
  r.pricing.bom=freshBom;
 if(input.forceBessSelected && r.bess && !(Number(r.bess.suggestedCapacityKwh)>0)) { var dailyForce=(Number(input.annualConsumptionKwh)||0)/365; var forcedKwh=Number((dailyForce*0.35*0.75/(0.9*0.95)).toFixed(1)); r.bess.recommended=true; r.bess.suggestedCapacityKwh=forcedKwh; r.bess.requestedCapacityKwh=forcedKwh; var recalc=window.VitaEngine.calculate(Object.assign({},input,{bessCapacityKwh:forcedKwh}),{}); r=recalc; }
  r.bess=r.bess||{}; r.bess.selectedByUser=input.forceBessSelected===true;
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
  var p=sessionStorage.getItem('vitavolt_ai_settings');if(!p)return;
  var x=JSON.parse(p);
  if($('geminiApiKey'))$('geminiApiKey').value=x.geminiApiKey||'';
  if($('openrouterApiKey'))$('openrouterApiKey').value=x.openrouterApiKey||'';
  if($('geminiModel'))$('geminiModel').value=x.geminiModel||'gemini-2.5-flash';
  if($('openrouterModel'))$('openrouterModel').value=x.openrouterModel||'openai/gpt-4o';
  if($('aiStatus'))$('aiStatus').textContent='AI API ayarları bu tarayıcı oturumunda mevcut.';
 }catch(e){}
}
async function verifyOpenRouter(){
 var ai=getAiSettings(), key=ai.openrouterApiKey, model=ai.openrouterModel||'openai/gpt-4o';
 var el=$('openrouterStatus'), btn=$('verifyOpenRouter');
 function status(htmlValue,cls){
   if(el){el.innerHTML=htmlValue;el.className='vi-ai-status '+(cls||'');}
 }
 if(!key){status('<span class="vi-ai-dot bad"></span><span>OpenRouter API Key girilmedi.</span>','bad');setStatus('OpenRouter doğrulaması için API Key gerekli.','vi-warning');return false;}
 if(btn){btn.disabled=true;btn.textContent='DOĞRULANIYOR…';}
 status('<span class="vi-ai-dot"></span><span>1/2 · API anahtarı doğrulanıyor…</span>','');
 try{
   var keyRes=await fetch('https://openrouter.ai/api/v1/key',{method:'GET',headers:{'Authorization':'Bearer '+key}});
   var keyData=await keyRes.json();
   if(!keyRes.ok)throw new Error((keyData&&keyData.error&&keyData.error.message)||('API Key HTTP '+keyRes.status));
   var kd=keyData&&keyData.data||{};
   var remaining=kd.limit_remaining;
   var remainingText=Number.isFinite(Number(remaining))?(' · Kalan limit: '+Number(remaining).toFixed(2)+' USD'):'';
   status('<span class="vi-ai-dot ok"></span><span>1/2 · API Key geçerli'+remainingText+'</span><br><span class="vi-ai-dot"></span><span>2/2 · '+model+' sorgulanıyor…</span>','ok');
   var res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
     method:'POST',
     headers:{
       'Authorization':'Bearer '+key,
       'Content-Type':'application/json',
       'HTTP-Referer':'https://vitavoltglobal.com/',
       'X-OpenRouter-Title':'Vitavolt Global VITA API Verification'
     },
     body:JSON.stringify({
       model:model,
       messages:[{role:'user',content:'Reply only with OK.'}],
       max_tokens:8,
       temperature:0
     })
   });
   var data=await res.json();
   if(!res.ok){
     var err=(data&&data.error&&data.error.message)||('HTTP '+res.status);
     if(res.status===402){
       status('<span class="vi-ai-dot ok"></span><span>1/2 · API Key geçerli'+remainingText+'</span><br><span class="vi-ai-dot bad"></span><span>2/2 · Model çalışmadı: OpenRouter kredi/limit yetersiz.</span>','bad');
       setStatus('OpenRouter API Key geçerli; ancak '+model+' sorgusu kredi/limit nedeniyle çalışmadı. Bu nedenle internet fiyat araştırması da çalışmaz.','vi-warning');
       return false;
     }
     throw new Error(err);
   }
   status('<span class="vi-ai-dot ok"></span><span>1/2 · API Key geçerli'+remainingText+'</span><br><span class="vi-ai-dot ok"></span><span>2/2 · '+model+' sorgusu başarılı</span>','ok');
   setStatus('✓ OpenRouter bağlantısı ve seçili model doğrulandı. Fiyat araştırmasına geçilebilir.');
   return true;
 }catch(e){
   status('<span class="vi-ai-dot bad"></span><span>OpenRouter doğrulaması başarısız: '+(e&&e.message?e.message:e)+'</span>','bad');
   setStatus('OpenRouter doğrulaması başarısız: '+(e&&e.message?e.message:e),'vi-warning');
   return false;
 }finally{
   if(btn){btn.disabled=false;btn.textContent='OPENROUTER TEST ET';}
 }
}


function saveAiSettings(){
 var x={geminiApiKey:val('geminiApiKey'),openrouterApiKey:val('openrouterApiKey'),geminiModel:val('geminiModel'),openrouterModel:val('openrouterModel')};
 sessionStorage.setItem('vitavolt_ai_settings',JSON.stringify(x));
 if($('aiStatus'))$('aiStatus').textContent=(x.geminiApiKey||x.openrouterApiKey)?'AI API ayarları oturuma kaydedildi. OpenRouter modeli: '+(x.openrouterModel||'openai/gpt-4o'):'API anahtarları boş.';
}
function clearAiSettings(){
 sessionStorage.removeItem('vitavolt_ai_settings');
 ['geminiApiKey','openrouterApiKey','geminiModel','openrouterModel'].forEach(function(id){if($(id))$(id).value='';});
 if($('aiStatus'))$('aiStatus').textContent='AI API ayarları temizlendi.';
}

function init(){
 var c=$('city');cities.forEach(function(x){var o=document.createElement('option');o.value=x;o.textContent=x;c.appendChild(o);});
 if($('runAnalysis'))$('runAnalysis').addEventListener('click',run);
 if($('webPriceSearch'))$('webPriceSearch').addEventListener('click',researchPrices);
 if($('bomPanelSelect'))$('bomPanelSelect').addEventListener('change',applyEquipmentSelection);
 if($('bomInverterSelect'))$('bomInverterSelect').addEventListener('change',applyEquipmentSelection);
 if($('applyBomPrices'))$('applyBomPrices').addEventListener('click',applyBomPrices);
 if($('saveAiSettings'))$('saveAiSettings').addEventListener('click',saveAiSettings);
 if($('verifyOpenRouter'))$('verifyOpenRouter').addEventListener('click',verifyOpenRouter);
 if($('clearAiSettings'))$('clearAiSettings').addEventListener('click',clearAiSettings);
 loadAiSettings();
 $('saveProject').addEventListener('click',save);$('photos').addEventListener('change',photos);
 document.querySelectorAll('[data-price]').forEach(function(i){i.addEventListener('input',quote);});$('currency').addEventListener('change',quote);
 $('lockQuote').addEventListener('click',lock);$('copyPayload').addEventListener('click',payload);$('printPackage').addEventListener('click',function(){if(!window.__vitaStudio)run();window.print();});
 load();quote();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
