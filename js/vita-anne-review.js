/* Vitavolt Global — ANNE Review Layer v1
 * Deterministic review queue for external market-price evidence.
 * It never invents prices, never changes VITA calculations, and never auto-approves.
 */
(function(){
'use strict';
function median(a){
 var x=a.filter(function(v){return Number.isFinite(v)&&v>0;}).sort(function(a,b){return a-b;});
 if(!x.length)return null;
 var m=Math.floor(x.length/2);
 return x.length%2?x[m]:(x[m-1]+x[m])/2;
}
function review(records,bom){
 var flags=[], reviewed=[];
 (records||[]).forEach(function(r){
   var idx=Number(r.bomIndex), row=Number.isInteger(idx)&&bom?bom[idx]:null;
   var item=String(r.item||'').trim().toLowerCase();
   var rowItem=row?String(row.item||'').trim().toLowerCase():'';
   var issues=[];
   if(!r.sourceUrl)issues.push('SOURCE_MISSING');
   if(!r.sourceDate)issues.push('SOURCE_DATE_MISSING');
   if(row&&row.source==='DERIVED')issues.push('DERIVED_ROW');
   if(Number(r.unitPrice)>0&&(!r.currency||!r.unit))issues.push('PRICE_METADATA_INCOMPLETE');
   if(row&&!item)issues.push('ITEM_MISSING');
   if(row&&item&&rowItem&&item!==rowItem)issues.push('ITEM_MISMATCH');
   reviewed.push(Object.assign({},r,{
     reviewStatus:issues.length?'FLAGGED':'REVIEW_REQUIRED',
     reviewIssues:issues
   }));
   if(issues.length)flags.push({bomIndex:idx,item:r.item,issues:issues});
 });
 var groups={};
 reviewed.forEach(function(r){
   var k=String(r.bomIndex);
   if(Number(r.unitPrice)>0)(groups[k]||(groups[k]=[])).push(Number(r.unitPrice));
 });
 reviewed.forEach(function(r){
   var arr=groups[String(r.bomIndex)]||[], med=median(arr);
   if(med&&Number(r.unitPrice)>0){
     var deviation=Math.abs(Number(r.unitPrice)-med)/med;
     if(deviation>0.35){
       r.reviewStatus='FLAGGED';
       r.reviewIssues=(r.reviewIssues||[]).concat(['PRICE_OUTLIER_GT_35_PERCENT']);
       flags.push({bomIndex:r.bomIndex,item:r.item,issues:['PRICE_OUTLIER_GT_35_PERCENT'],median:med});
     }
   }
 });
 return {
   status:reviewed.length?'REVIEW_REQUIRED':'NO_EVIDENCE',
   autoVerified:false,
   reviewedAt:new Date().toISOString(),
   recordCount:reviewed.length,
   flagCount:flags.length,
   flags:flags,
   records:reviewed
 };
}
window.VitaAnneReview={version:'1.0.0',review:review};
})();