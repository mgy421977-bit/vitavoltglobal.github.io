const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const context = { window: {}, Number, Math };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/vita-engine.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/calculator.js'), 'utf8'), context);

const engine = context.window.VitaEngine;
const calculator = context.window.VitavoltCalculator;

assert(engine, 'VitaEngine adapter yüklenmeli');
assert(calculator, 'GES calculator yüklenmeli');

const water = engine.calculateWater({
  city: 'Kuşadası', roofAreaM2: 150, monthlyWaterM3: 12, roofType: 'Tile'
});
assert.strictEqual(water.rainfall.rainfallMm, 660.6);
assert(water.rainfall.annualUsableM3 > 50 && water.rainfall.annualUsableM3 < 60);
assert(water.greywater.annualUsableM3 > 34 && water.greywater.annualUsableM3 < 36);
assert(water.rainfall.demandCoveragePct <= 100);
assert(water.greywater.demandCoveragePct <= 100);

const solar = calculator.calculate({
  roofAreaM2: 150, monthlyConsumptionKwh: 300, nighttimeShare: 0.35,
  peakDemandKw: 5, city: 'Kuşadası', monthlyWaterM3: 12
}, calculator.defaultConfig);
assert.strictEqual(solar.inputs.annualConsumptionKwh, 3600);
assert(solar.solar.selfConsumptionKwh <= solar.inputs.annualConsumptionKwh,
  'öz tüketim yıllık tüketimi aşmamalı');
assert.strictEqual(solar.water.rainfall.annualUsableM3, water.rainfall.annualUsableM3);
assert.strictEqual(solar.water.greywater.annualUsableM3, water.greywater.annualUsableM3);

assert.throws(() => calculator.calculate({ roofAreaM2: 0, landAreaM2: 0 }), /geçerli/);
console.log('VITA web adapter tests: PASS');
