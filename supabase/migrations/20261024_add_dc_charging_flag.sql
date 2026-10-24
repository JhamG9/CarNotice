-- Some city cars (JMEV 2, FAW Bestune Xiaoma) only charge on AC: they have no DC fast charging at all.
-- An empty dc_charge_* means "unknown"; this flag says "does not have it", so the comparator can show
-- "No tiene" and score fast charging as 0 instead of "sin datos".
alter table public.vehicles
  add column dc_charging boolean,
  add constraint vehicles_dc_charging_check
    check (dc_charging is not false or (dc_charge_kw is null and dc_charge_from_pct is null and dc_charge_to_pct is null and dc_charge_min is null));

comment on column public.vehicles.dc_charging is 'False when the vehicle has no DC fast charging (AC only). The dc_charge_* columns stay empty. Null means unknown or that it has DC charging (then dc_charge_* hold the data).';
