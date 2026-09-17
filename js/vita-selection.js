/* VITA Intelligence selection bridge: service cards -> unified VITA form */
(function () {
  'use strict';
  var KEY = 'vitavolt_vita_selection';
  var labels = { ges:'GES', bess:'BESS', epc:'Endüstriyel EPC', carbon:'Karbon & ESG', water:'Su Yönetimi', feasibility:'VITA Intelligence' };
  var links = { ges:'ges', bess:'bess', epc:'epc', carbon:'carbon', water:'water', feasibility:'feasibility' };
  function get(){ try { return JSON.parse(localStorage.getItem(KEY) || '[]').filter(Boolean); } catch(e){ return []; } }
  function set(items){ try { localStorage.setItem(KEY, JSON.stringify(items)); } catch(e){} }
  function toggle(item, checked){ var a=get().filter(function(x){return x!==item;}); if(checked)a.push(item); set(a); render(); }
  function render(){
    var items=get();
    document.querySelectorAll('[data-vita-select]').forEach(function(cb){ cb.checked=items.indexOf(cb.getAttribute('data-vita-select'))!==-1; });
    var old=document.getElementById('vv-vita-tray'); if(old)old.remove();
    if(!items.length)return;
    var tray=document.createElement('aside'); tray.id='vv-vita-tray'; tray.setAttribute('aria-label','VITA Intelligence seçimleri');
    tray.innerHTML='<div class="vv-vita-tray-title">VITA Intelligence <span>'+items.length+' seçim</span></div><div class="vv-vita-tray-items">'+items.map(function(x){return '<span>'+ (labels[x]||x) +'</span>';}).join('')+'</div><div class="vv-vita-tray-actions"><a href="/vita-energy-intelligence.html#vita-form">Analize Git</a><button type="button" data-vita-clear>Temizle</button></div>';
    document.body.appendChild(tray);
    tray.querySelector('[data-vita-clear]').addEventListener('click',function(){set([]);render();});
  }
  function init(){
    document.querySelectorAll('[data-vita-select]').forEach(function(cb){ cb.addEventListener('change',function(){toggle(cb.getAttribute('data-vita-select'),cb.checked);}); });
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.VitaSelection={get:get,set:set,clear:function(){set([]);render()}};
})();
