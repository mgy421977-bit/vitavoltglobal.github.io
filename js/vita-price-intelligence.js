/* Vitavolt Global — VITA Price Intelligence v1
 * Purpose: keep market-price research independent from VITA engineering calculations.
 * No price is invented. Research results become PRICE_RECORDs and require review before BOM application.
 */
(function(){
'use strict';
var VERSION='1.0.0';

function now(){return new Date().toISOString();}
function norm(v){return String(v==null?'':v).trim().toLowerCase();}
function isDerived(row){return row && row.source==='DERIVED';}
function candidates(bom){
 return (bom||[]).map(function(row,index){
   return {bomIndex:index,item:String(row.item||''),category:String(row.category||''),quantity:Number(row.quantity||0),unit:String(row.unit||'')};
 }).filter(function(x){
   var row=(bom||[])[x.bomIndex];
   return x.quantity>0 && row && !isDerived(row) && row.unitCost==null && row.costStatus!=='NOT_APPLICABLE' && row.costStatus!=='SUPERSEDED';
 });
}
function makeResearchPackage(bom,context){
 return {
   schema:'VITA_PRICE_RESEARCH_REQUEST',
   schemaVersion:'1.0',
   requestedAt:now(),
   market:'Türkiye',
   targetYear:new Date().getFullYear(),
   currencyPreference:'TRY',
   context:context||{},
   items:candidates(bom)
 };
}
function validateRecord(record){
 var errors=[];
 if(!record||!record.item)errors.push('item');
 if(record.unitPrice!=null && !(Number(record.unitPrice)>0))errors.push('unitPrice');
 if(record.unitPrice!=null && !record.currency)errors.push('currency');
 if(record.unitPrice!=null && !record.sourceUrl)errors.push('sourceUrl');
 if(record.unitPrice!=null && !record.sourceDate)errors.push('sourceDate');
 if(record.unitPrice!=null && !record.confidence)errors.push('confidence');
 return {ok:errors.length===0,errors:errors};
}
function acceptRecords(bom,records){
 var accepted=[],rejected=[];
 (records||[]).forEach(function(record){
   var check=validateRecord(record);
   var idx=Number(record.bomIndex);
   var row=Number.isInteger(idx)?bom[idx]:null;
   if(!row && record.item){
     row=(bom||[]).find(function(x){return norm(x.item)===norm(record.item)&&x.unitCost==null&&!isDerived(x);});
     if(row)idx=bom.indexOf(row);
   }
   if(!check.ok || !row || isDerived(row) || row.unitCost!=null){
     rejected.push({record:record,reason:check.errors.length?check.errors:['BOM row unavailable or already priced']});
     return;
   }
   accepted.push({
     bomIndex:idx,
     item:row.item,
     unitPrice:Number(record.unitPrice),
     currency:record.currency||'TRY',
     unit:record.unit||row.unit,
     priceBasis:record.priceBasis||'WEB_RETAIL',
     sourceUrl:record.sourceUrl,
     sourceDate:record.sourceDate,
     supplier:record.supplier||'',
     product:record.product||'',
     confidence:record.confidence||'MEDIUM',
     evidence:record.evidence||'',
     notes:record.notes||''
   });
 });
 return {accepted:accepted,rejected:rejected};
}
function applyVerified(bom,records){
 var result=acceptRecords(bom,records),applied=[];
 result.accepted.forEach(function(r){
   var row=bom[r.bomIndex];
   row.unitCost=r.unitPrice;
   row.priceCurrency=r.currency;
   row.totalCost=Number((Number(row.quantity||0)*r.unitPrice).toFixed(2));
   row.costStatus='PRICED';
   row.priceBasis=r.priceBasis;
   row.priceSource=r.sourceUrl;
   row.priceSourceDate=r.sourceDate;
   row.priceSupplier=r.supplier;
   row.researchedProduct=r.product;
   row.priceConfidence=r.confidence;
   row.priceEvidence=r.evidence;
   row.priceNotes=r.notes;
   row.source='PRICE_INTELLIGENCE_VERIFIED';
   applied.push(r.bomIndex);
 });
 return {bom:bom,applied:applied,rejected:result.rejected};
}
window.VitaPriceIntelligence={
 version:VERSION,
 candidates:candidates,
 makeResearchPackage:makeResearchPackage,
 validateRecord:validateRecord,
 acceptRecords:acceptRecords,
 applyVerified:applyVerified
};
})();