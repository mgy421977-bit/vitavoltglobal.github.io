'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const file = path.join(__dirname, '../data/simulated/vita-anne-izmir-7d-15min.csv');
const raw = fs.readFileSync(file, 'utf8').trim().split(/\\r?\\n/);
const header = raw.shift().split(',');
const ix = Object.fromEntries(header.map((x,i)=>[x,i]));
const rows = raw.map(line => line.split(',').map((v,i)=>i===0?v:Number(v)));
const get = (r,k)=>r[ix[k]];
const numericColumns = header.slice(1);
const nonNegativeColumns = header.slice(2,10);

function validate(data) {
  const errors=[];
  const seen=new Set();
  let maxResidual=0, maxPower=0, minSoc=Infinity, maxSoc=-Infinity, simultaneous=0;
  for(let i=0;i<data.length;i++){
    const r=data[i], ts=Date.parse(get(r,'timestamp_local'));
    if(!Number.isFinite(ts)) errors.push('INVALID_TIMESTAMP');
    if(seen.has(get(r,'timestamp_local'))) errors.push('DUPLICATE_TIMESTAMP');
    seen.add(get(r,'timestamp_local'));
    if(i && ts-Date.parse(get(data[i-1],'timestamp_local'))!==15*60*1000) errors.push('INTERVAL_GAP_OR_ORDER');
    for(const k of numericColumns) if(!Number.isFinite(get(r,k))) errors.push('NON_FINITE:'+k);
    for(const k of nonNegativeColumns) if(get(r,k)<-1e-9) errors.push('NEGATIVE_POWER:'+k);
    const residual=Math.abs(get(r,'load_kw')+get(r,'bess_charge_kw')+get(r,'grid_export_with_bess_kw')-get(r,'pv_generation_kw')-get(r,'bess_discharge_kw')-get(r,'grid_import_with_bess_kw'));
    maxResidual=Math.max(maxResidual,residual);
    maxPower=Math.max(maxPower,get(r,'bess_charge_kw'),get(r,'bess_discharge_kw'));
    minSoc=Math.min(minSoc,get(r,'bess_soc_pct')); maxSoc=Math.max(maxSoc,get(r,'bess_soc_pct'));
    if(get(r,'bess_charge_kw')>0.001 && get(r,'bess_discharge_kw')>0.001) simultaneous++;
  }
  if(data.length!==672) errors.push('INTERVAL_COUNT');
  if(maxResidual>0.02) errors.push('ENERGY_BALANCE');
  if(minSoc<10-1e-6 || maxSoc>90+1e-6) errors.push('SOC_BOUNDS');
  if(maxPower>250+1e-6) errors.push('BESS_POWER_LIMIT');
  if(simultaneous>0) errors.push('SIMULTANEOUS_CHARGE_DISCHARGE');
  if(!data.some(r=>get(r,'pv_generation_kw')>0)) errors.push('NO_PV_GENERATION');
  if(!data.some(r=>get(r,'bess_charge_kw')>0)) errors.push('NO_BESS_CHARGING');
  if(!data.some(r=>get(r,'bess_discharge_kw')>0)) errors.push('NO_BESS_DISCHARGING');
  return {ok:errors.length===0,errors,maxResidual,maxPower,minSoc,maxSoc};
}

const clean=validate(rows);
assert(clean.ok,'base dataset must pass: '+clean.errors.join(','));
assert.strictEqual(rows.length,672,'7 days × 96 intervals');
console.log('PASS S2_PV_BESS: base dataset passes structural and physical invariants.');

// S3_DATA_GAP: one missing interval must fail interval count and continuity.
const gap=rows.filter((_,i)=>i!==100);
const gapResult=validate(gap);
assert(!gapResult.ok && gapResult.errors.includes('INTERVAL_COUNT') && gapResult.errors.includes('INTERVAL_GAP_OR_ORDER'),'missing interval must be detected');
console.log('PASS S3_DATA_GAP: missing interval detected.');

// S4_BALANCE_ERROR: corrupt one grid-import value by +10 kW.
const balance=rows.map(r=>r.slice());
balance[120][ix.grid_import_with_bess_kw]+=10;
const balanceResult=validate(balance);
assert(!balanceResult.ok && balanceResult.errors.includes('ENERGY_BALANCE'),'energy balance corruption must be detected');
console.log('PASS S4_BALANCE_ERROR: energy-balance corruption detected.');

// S5_SOC_BOUNDS: SOC > 90% must fail.
const soc=rows.map(r=>r.slice());
soc[200][ix.bess_soc_pct]=95;
const socResult=validate(soc);
assert(!socResult.ok && socResult.errors.includes('SOC_BOUNDS'),'SOC violation must be detected');
console.log('PASS S5_SOC_BOUNDS: SOC limit violation detected.');

// S6_DUPLICATE_TS: duplicate timestamp must fail uniqueness and interval continuity.
const duplicate=rows.map(r=>r.slice());
duplicate[250][ix.timestamp_local]=duplicate[249][ix.timestamp_local];
const duplicateResult=validate(duplicate);
assert(!duplicateResult.ok && duplicateResult.errors.includes('DUPLICATE_TIMESTAMP'),'duplicate timestamp must be detected');
console.log('PASS S6_DUPLICATE_TS: duplicate timestamp detected.');

console.log('ALL ENERGY DEMONSTRATOR DATA TESTS: PASS');
console.log(JSON.stringify({maxEnergyBalanceResidualKw:+clean.maxResidual.toFixed(6),maxBessPowerKw:+clean.maxPower.toFixed(3),minSocPct:+clean.minSoc.toFixed(3),maxSocPct:+clean.maxSoc.toFixed(3)},null,2));
