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
const pricingDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/calculations.json'), 'utf8'));

assert(engine, 'VitaEngine adapter yüklenmeli');
assert(calculator, 'GES calculator yüklenmeli');

const water = engine.calculateWater({ city: 'Kuşadası', roofAreaM2: 150, monthlyWaterM3: 12, roofType: 'Tile' });
assert.strictEqual(water.rainfall.rainfallMm, 660.6);
assert(water.rainfall.annualUsableM3 > 50 && water.rainfall.annualUsableM3 < 60);
assert(water.greywater.annualUsableM3 > 34 && water.greywater.annualUsableM3 < 36);
assert(water.rainfall.demandCoveragePct <= 100);
assert(water.greywater.demandCoveragePct <= 100);

const solar = calculator.calculate({ roofAreaM2: 150, monthlyConsumptionKwh: 300, nighttimeShare: 0.35, peakDemandKw: 5, city: 'Kuşadası', monthlyWaterM3: 12 }, calculator.defaultConfig);
assert.strictEqual(solar.inputs.annualConsumptionKwh, 3600);
assert(solar.solar.selfConsumptionKwh <= solar.inputs.annualConsumptionKwh, 'öz tüketim yıllık tüketimi aşmamalı');
assert.strictEqual(solar.water.rainfall.annualUsableM3, water.rainfall.annualUsableM3);
assert.strictEqual(solar.water.greywater.annualUsableM3, water.greywater.annualUsableM3);

const packageCalc = engine.calculatePricing({ panelPowerWp: 655, panelCount: 10, dcCapacityKwp: 6.55, inverterPowerKw: 6.2, bessCapacityKwh: 14.4 }, pricingDb.pricing);
assert.strictEqual(packageCalc.projectCost.usd, 5085, 'Standart paket %10 altı referans maliyeti kullanılmalı');
assert.strictEqual(packageCalc.projectCost.marketReference.discountPct, 10);
assert(packageCalc.bom.some(x => x.item.indexOf('655 Wp') >= 0));
assert(packageCalc.bom.some(x => x.item.indexOf('2.4 kWh') >= 0));
assert.strictEqual(packageCalc.battery.referenceUnitKwh, 2.4);
assert.strictEqual(packageCalc.battery.referenceUnitUsd, 800);
assert.strictEqual(packageCalc.battery.baseUsdPerKwh, 333.33);
assert.strictEqual(pricingDb.pricing.panel_options.find(x => x.power_wp === 655).base_usd_per_w, 0.18);
assert.strictEqual(pricingDb.pricing.inverter_options.find(x => x.power_kw === 50).base_usd, 3000);
assert.strictEqual(pricingDb.pricing.inverter_options.find(x => x.power_kw === 100).base_usd, 3600);
assert.strictEqual(pricingDb.pricing.battery_options.find(x => x.capacity_kwh === 2.4).base_usd, 800);
assert.strictEqual(pricingDb.pricing.cost_model.proportional_model.battery_usd_per_kwh, 333.33333333);

const directBatteryCalc = engine.calculatePricing({ panelPowerWp: 655, panelCount: 10, dcCapacityKwp: 6.55, inverterPowerKw: 6.2, bessCapacityKwh: 2.4 }, pricingDb.pricing);
assert.strictEqual(directBatteryCalc.battery.baseUsd, 800);

const largeCalc = engine.calculatePricing({ panelPowerWp: 655, panelCount: 153, dcCapacityKwp: 100.22, inverterPowerKw: 100, bessCapacityKwh: 50 }, pricingDb.pricing);
assert.strictEqual(largeCalc.projectCost.marketReference, null, 'Uzak ölçekli proje küçük paket referansına zorlanmamalı');
assert(largeCalc.bom.length >= 10);
assert(largeCalc.projectCost.usd > 0);
assert(largeCalc.bom.some(x => x.item.indexOf('2.4 kWh') >= 0));

assert.throws(() => calculator.calculate({ roofAreaM2: 0, landAreaM2: 0 }), /geçerli/);
console.log('VITA web adapter + BOM pricing tests: PASS');
