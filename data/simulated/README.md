# VITA–ANNE Synthetic GES+BESS Demonstrator Dataset

**Dataset:** `VITA-ANNE-SIM-IZMIR-001`  
**Status:** Synthetic, deterministic test fixture — not measured field data.  
**Period:** 2–8 November 2026, Europe/Istanbul (UTC+03:00).  
**Resolution:** 15 minutes; 672 intervals.  
**Site archetype:** Synthetic light-industrial facility in İzmir.

## Files
- `vita-anne-izmir-7d-15min.csv`: interval dataset.
- `scenario-catalog.json`: scenario definitions and acceptance criteria.
- `../../tests/energy-demonstrator.test.js`: Node.js dataset integrity tests.

## Plant assumptions
- PV: 500 kWp DC.
- BESS: 500 kWh usable capacity, 250 kW charge/discharge limit.
- SOC limits: 10–90%.
- Charge efficiency: 95%; discharge efficiency: 95%; implied round-trip efficiency: 90.25%.
- Dispatch: charge from PV surplus; discharge to cap net grid import at 180 kW when SOC and power limits permit.
- No tariff, emissions factor, degradation, warranty, inverter clipping or grid export limit is modelled.

## CSV columns
- `timestamp_local`: ISO 8601 timestamp with +03:00 offset.
- `interval_minutes`: 15.
- `load_kw`, `pv_generation_kw`: average power over interval.
- `baseline_grid_import_kw`, `baseline_grid_export_kw`: PV-only case without BESS.
- `bess_charge_kw`, `bess_discharge_kw`: AC-side battery power.
- `grid_import_with_bess_kw`, `grid_export_with_bess_kw`: grid exchange after battery dispatch.
- `bess_soc_pct`: end-of-interval SOC.

## Sign convention and energy balance
For each interval (all powers are average kW over the same 15-minute interval):

`load + battery_discharge + grid_import = PV_generation + battery_charge + grid_export`

Charge and discharge are non-negative and never simultaneous. SOC is bounded between 10% and 90%.

## Reproduction
From the repository root:

`node tests/energy-demonstrator.test.js`

The test validates timestamp continuity, finite/non-negative data, interval count, energy balance, BESS power/SOC limits, and mutually exclusive charge/discharge.

## Important limitations
This fixture is intentionally synthetic. Its PV and load profiles are shaped for software integration tests, not derived from PVGIS, a real site, weather station, meter, inverter or BMS. Results are not a production forecast, bankable yield, optimised dispatch schedule, guaranteed savings, financial return or verified carbon reduction. Tariff and emissions analysis must wait for verified inputs and separately validated methods.
