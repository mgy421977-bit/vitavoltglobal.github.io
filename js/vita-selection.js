/* VITA Intelligence selection bridge: service cards -> unified VITA form */
(function () {
  'use strict';
  var KEY = 'vitavolt_vita_selection';
  var LEGACY_KEY = 'vv_vita_selection';
  var labels = { ges:'GES', bess:'BESS', epc:'Endüstriyel EPC', carbon:'Karbon & ESG', water:'Su Yönetimi', feasibility:'VITA Intelligence' };

  function normalize(items){
    if(!Array.isArray(items))return [];
    var seen={};
    return items.filter(function(x){return Object.prototype.hasOwnProperty.call(labels,x)&&!seen[x]&&(seen[x]=true);});
  }
  function migrate(){
    try{
      if(localStorage.getItem(KEY)!==null)return;
      var legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'[]');
      var items=normalize(legacy);
      if(items.length)localStorage.setItem(KEY,JSON.stringify(items));
    }catch(e){}
  }
  function get(){
    migrate();
    try { return normalize(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch(e){ return []; }
  }
  function set(items){ try { localStorage.setItem(KEY, JSON.stringify(normalize(items))); } catch(e){} }
  function toggle(item, checked){ var a=get().filter(function(x){return x!==item;}); if(checked)a.push(item); set(a); render(); }
  function render(){
    var items=get();
    document.querySelectorAll('[data-vita-select]').forEach(function(cb){ cb.checked=items.indexOf(cb.getAttribute('data-vita-select'))!==-1; });
    var old=document.getElementById('vv-vita-tray'); if(old)old.remove();
    if(!items.length)return;
    var tray=document.createElement('aside'); tray.id='vv-vita-tray'; tray.setAttribute('aria-label','VITA Intelligence seçimleri');
    var itemWrap=document.createElement('div');
    itemWrap.className='vv-vita-tray-items';
    items.forEach(function(x){var span=document.createElement('span');span.textContent=labels[x];itemWrap.appendChild(span);});
    var title=document.createElement('div');title.className='vv-vita-tray-title';title.textContent='VITA Intelligence ';
    var count=document.createElement('span');count.textContent=items.length+' seçim';title.appendChild(count);
    var actions=document.createElement('div');actions.className='vv-vita-tray-actions';
    var link=document.createElement('a');link.href='/vita-energy-intelligence.html#vita-form';link.textContent='Analize Git';
    var clear=document.createElement('button');clear.type='button';clear.setAttribute('data-vita-clear','');clear.textContent='Temizle';
    actions.appendChild(link);actions.appendChild(clear);
    tray.appendChild(title);tray.appendChild(itemWrap);tray.appendChild(actions);document.body.appendChild(tray);
    clear.addEventListener('click',function(){set([]);try{localStorage.removeItem(LEGACY_KEY);}catch(e){}render();});
  }
  function init(){
    document.querySelectorAll('[data-vita-select]').forEach(function(cb){ cb.addEventListener('change',function(){toggle(cb.getAttribute('data-vita-select'),cb.checked);}); });
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.VitaSelection={get:get,set:set,clear:function(){set([]);render()}};
})();
