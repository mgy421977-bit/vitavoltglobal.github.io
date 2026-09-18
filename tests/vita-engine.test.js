const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const context = { window: {}, Number, Math, JSON, Date };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/vita-engine.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/calculator.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/mitos-core.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/anne-core.js'), 'utf8'), context);

const engine = context.window.VitaEngine;
const calculator = context.window.VitavoltCalculator;
const mitos = context.window.MitosCore;
const anne = context.window.AnneCore;
const pricingDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/calculations.json'), 'utf8'));

assert(engine, 'VitaEngine yüklenmeli');
assert(calculator, 'VitavoltCalculator adapter yüklenmeli');
assert(mitos, 'MITOS Core yüklenmeli');
assert(anne, 'ANNE Core yüklenmeli');
assert.strictEqual(engine.version, '4.0.0');

const water = engine.calculateWater({ city: 'Kuşadası', roofAreaM2: 150, monthlyWaterM3: 12, roofType: 'Tile', rainfallMm: 660.6 });
assert.strictEqual(water.rainfall.rainfallMm, 660.6);
assert(water.rainfall.annualUsableM3 > 50 && water.rainfall.annualUsableM3 < 60);
assert(water.greywater.annualUsableM3 > 34 && water.greywater.annualUsableM3 < 36);
assert(water.rainfall.demandCoveragePct <= 100);
assert(water.greywater.demandCoveragePct <= 100);

const solar = calculator.calculate({ roofAreaM2: 150, monthlyConsumptionKwh: 300, nighttimeShare: 0.35, peakDemandKw: 5, city: 'Kuşadası', monthlyWaterM3: 12 }, calculator.defaultConfig());
assert.strictEqual(solar.inputs.annualConsumptionKwh, 3600);
assert.strictEqual(solar.solar.panelCount, 57);
assert.strictEqual(solar.solar.dcCapacityKwp, 35.34);
assert(solar.solar.selfConsumptionKwh <= solar.inputs.annualConsumptionKwh, 'öz tüketim yıllık tüketimi aşmamalı');
assert.strictEqual(solar.water.rainfall.annualUsableM3, water.rainfall.annualUsableM3);
assert.strictEqual(solar.water.greywater.annualUsableM3, water.greywater.annualUsableM3);

const overrideCalc = engine.calculate({ roofAreaM2: 150, monthlyConsumptionKwh: 4000, panelPowerWp: 620, panelCountOverride: 57, city: 'Konya', rainfallMm: 350, specificYieldKwhKwp: 1550, systemLossFactorOverride: 0.68, monthlyWaterM3: 15 });
assert.strictEqual(overrideCalc.solar.panelCount, 57, 'tüketim boyutlandırma panel adedini override edebilmeli');
assert.strictEqual(overrideCalc.inputs.roofAreaM2, 150, 'fiziksel çatı alanı korunmalı');
assert.strictEqual(overrideCalc.water.rainfall.roofAreaM2, 150, 'su hesabı GES için seçilen panel alanına dönüşmemeli');
assert.strictEqual(overrideCalc.assumptions.specificYieldKwhKwp, 1550, 'MITOS/şehir verimi VITA tarafından kullanılmalı');
assert.strictEqual(overrideCalc.assumptions.systemLossFactor, 0.68, 'MITOS çatı kayıp varsayımı VITA tarafından kullanılmalı');
assert(overrideCalc.validation.ok, 'override sonrası VITA validation geçmeli');

const packageCalc = engine.calculatePricing({ panelPowerWp: 655, panelCount: 10, dcCapacityKwp: 6.55, bessCapacityKwh: 14.4 }, pricingDb.pricing);
assert.strictEqual(packageCalc.projectCost.usd, 8736.45);
assert.strictEqual(packageCalc.battery.referenceUnitKwh, 2.4);
assert.strictEqual(packageCalc.battery.referenceUnitUsd, 800);
assert.strictEqual(packageCalc.battery.baseUsdPerKwh, 333.33);
assert.strictEqual(packageCalc.inverter.powerKw, 8);
assert.strictEqual(packageCalc.inverter.count, 1);
assert.strictEqual(pricingDb.pricing.panel_options.find(x => x.power_wp === 655).base_usd_per_w, 0.18);
assert.strictEqual(pricingDb.pricing.inverter_options.find(x => x.power_kw === 50).base_usd, 3000);
assert.strictEqual(pricingDb.pricing.inverter_options.find(x => x.power_kw === 100).base_usd, 3600);
assert.strictEqual(pricingDb.pricing.battery_options.find(x => x.capacity_kwh === 2.4).base_usd, 800);
assert.strictEqual(pricingDb.pricing.cost_model.proportional_model.battery_usd_per_kwh, 333.33333333);

const selectedInverter = engine.calculatePricing({ panelPowerWp: 655, panelCount: 10, dcCapacityKwp: 6.55, inverterPowerKw: 6.2, bessCapacityKwh: 2.4 }, pricingDb.pricing);
assert.strictEqual(selectedInverter.inverter.powerKw, 6.2);
assert.strictEqual(selectedInverter.inverter.count, 2);
assert.strictEqual(selectedInverter.battery.baseUsd, 800);

const largeCalc = engine.calculatePricing({ panelPowerWp: 655, panelCount: 153, dcCapacityKwp: 100.22, bessCapacityKwh: 50 }, pricingDb.pricing);
assert(largeCalc.projectCost.usd > 0);
assert(largeCalc.bom.length >= 10);
assert(largeCalc.bom.some(x => x.item.indexOf('2.4 kWh') >= 0));
assert(largeCalc.inverter.powerKw === 50 && largeCalc.inverter.count === 3, '100.22 kWp için 3x50 kW katalog kombinasyonu seçilmeli');

const mitosPack = mitos.completeInputs({ city: 'Konya', roofAreaM2: 150, monthlyConsumptionKwh: 4000, monthlyWaterM3: 15 });
assert.strictEqual(mitosPack.status, 'READY_FOR_VITA');
assert.strictEqual(mitosPack.input.specificYieldKwhKwp, 1560);
assert.strictEqual(mitosPack.input.rainfallMm, 357.4);
assert.strictEqual(mitosPack.input.roofOrientationLossPct, 20);

const assessment = anne.assess({ city: 'Konya', roofAreaM2: 150, monthlyConsumptionKwh: 4000, annualConsumptionKwh: 48000, monthlyWaterM3: 15, facilityType: 'Konut' });
assert.strictEqual(assessment.anne.status, 'ANNE_VITA_VALIDATED');
assert.strictEqual(assessment.contracts.vita.role, 'sole_deterministic_calculation_engine');
assert(assessment.anne.test.ok, 'ANNE deterministic test geçmeli');
assert(assessment.mitos.proposal.scenarios.length >= 2, 'MITOS en az baseline + bir senaryo üretmeli');
assert(assessment.mitos.evaluatedScenarioCount >= 1, 'MITOS senaryoları VITA ile yeniden değerlendirilmelidir');
assert.strictEqual(assessment.inputs.roofAreaM2, 150);

assert.throws(() => calculator.calculate({ roofAreaM2: 0, landAreaM2: 0 }), /geçerli/);
console.log('VITA + sizing contract + water separation + ANNE/MITOS pipeline tests: PASS');
