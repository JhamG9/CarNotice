-- Some warranties have no kilometre limit (Hyundai in Germany: 5 years, unlimited km)
-- or no limit at all (Deepal in China: battery for life for the first owner).
-- The numeric columns cannot store "unlimited", so these flags do.
alter table public.vehicles
  add column warranty_km_unlimited boolean,
  add column battery_warranty_unlimited boolean,
  add constraint vehicles_warranty_km_unlimited_check
    check (warranty_km_unlimited is not true or warranty_km is null),
  add constraint vehicles_battery_warranty_unlimited_check
    check (battery_warranty_unlimited is not true or (battery_warranty_years is null and battery_warranty_km is null));

comment on column public.vehicles.warranty_km_unlimited is 'True when the vehicle warranty has no kilometre limit. warranty_km stays empty; warranty_years still holds the years.';
comment on column public.vehicles.battery_warranty_unlimited is 'True when the battery warranty has no limit in years or kilometres (e.g. lifetime for the first owner). battery_warranty_years and battery_warranty_km stay empty.';
