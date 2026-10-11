-- Replaces the test table with the real comparator table.
drop table if exists public.cars;

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,

  -- Identity
  brand text not null,
  model text not null,
  version text not null,
  model_year int not null check (model_year between 1990 and 2100),
  market text not null check (market ~ '^[A-Z]{2}$'),
  segment text not null check (segment in
    ('mini', 'small', 'compact', 'midsize', 'large', 'luxury')),
  body_style text not null check (body_style in
    ('hatchback', 'sedan', 'suv', 'coupe_suv', 'wagon', 'coupe', 'convertible', 'pickup', 'minivan', 'van')),
  powertrain text not null check (powertrain in
    ('electric', 'range_extender', 'plug_in_hybrid', 'hybrid', 'mild_hybrid', 'gasoline', 'diesel')),
  warranty_years int check (warranty_years > 0),
  warranty_km int check (warranty_km > 0),
  image_url text,
  source_url text,
  article_slug text,

  -- Performance
  power_kw numeric(5,1) check (power_kw > 0),
  power_hp int generated always as (round(power_kw * 1.34102)::int) stored,
  torque_nm int check (torque_nm > 0),
  acceleration_0_100_s numeric(4,2) check (acceleration_0_100_s > 0),
  top_speed_kmh int check (top_speed_kmh > 0),
  drivetrain text check (drivetrain in ('fwd', 'rwd', 'awd')),
  motor_count int check (motor_count > 0),

  -- Battery and range (one column per test cycle: figures are only comparable within the same cycle)
  battery_kwh numeric(5,1) check (battery_kwh > 0),
  battery_chemistry text check (battery_chemistry in
    ('LFP', 'NMC', 'NCA', 'LMFP', 'sodium_ion', 'solid_state', 'other')),
  range_wltp_km int check (range_wltp_km > 0),
  range_cltc_km int check (range_cltc_km > 0),
  range_epa_km int check (range_epa_km > 0),
  range_nedc_km int check (range_nedc_km > 0),
  consumption_kwh_100km numeric(4,1) check (consumption_kwh_100km > 0),
  battery_warranty_years int check (battery_warranty_years > 0),
  battery_warranty_km int check (battery_warranty_km > 0),

  -- Combustion and hybrids
  displacement_cc int check (displacement_cc > 0),
  cylinder_count int check (cylinder_count > 0),
  turbo boolean,
  transmission text check (transmission in
    ('manual', 'automatic', 'cvt', 'dual_clutch', 'single_speed')),
  gear_count int check (gear_count > 0),
  fuel_consumption_l_100km numeric(4,1) check (fuel_consumption_l_100km > 0),
  fuel_consumption_city_l_100km numeric(4,1) check (fuel_consumption_city_l_100km > 0),
  fuel_consumption_highway_l_100km numeric(4,1) check (fuel_consumption_highway_l_100km > 0),
  fuel_tank_l numeric(4,1) check (fuel_tank_l > 0),
  electric_range_km int check (electric_range_km > 0),
  electric_range_cycle text check (electric_range_cycle in ('WLTP', 'CLTC', 'EPA', 'NEDC')),
  combined_range_km int check (combined_range_km > 0),
  co2_g_km int check (co2_g_km >= 0),
  emission_standard text check (emission_standard in
    ('euro_4', 'euro_5', 'euro_6', 'euro_7', 'china_6', 'epa_tier_3', 'other')),

  -- Charging
  dc_charge_kw int check (dc_charge_kw > 0),
  ac_charge_kw numeric(4,1) check (ac_charge_kw > 0),
  dc_charge_from_pct int check (dc_charge_from_pct between 0 and 100),
  dc_charge_to_pct int check (dc_charge_to_pct between 0 and 100),
  dc_charge_min int check (dc_charge_min > 0),
  connector text check (connector in
    ('CCS1', 'CCS2', 'GBT', 'NACS', 'CHAdeMO', 'Type1', 'Type2')),
  v2l boolean,

  -- Dimensions (millimetres, as in the manufacturer's spec sheet)
  length_mm int check (length_mm > 0),
  width_mm int check (width_mm > 0),
  height_mm int check (height_mm > 0),
  wheelbase_mm int check (wheelbase_mm > 0),
  trunk_l int check (trunk_l > 0),
  front_trunk_l int check (front_trunk_l > 0),
  curb_weight_kg int check (curb_weight_kg > 0),
  ground_clearance_mm int check (ground_clearance_mm > 0),
  seats int check (seats > 0),

  -- Safety (null means unknown, false means the car does not have it)
  airbags int check (airbags >= 0),
  autonomous_emergency_braking boolean,
  adaptive_cruise_control boolean,
  lane_keeping_assist boolean,
  blind_spot_monitor boolean,
  camera_360 boolean,
  isofix boolean,
  ncap_stars int check (ncap_stars between 0 and 5),
  ncap_body text check (ncap_body in
    ('euro_ncap', 'latin_ncap', 'c_ncap', 'ancap', 'asean_ncap', 'global_ncap', 'nhtsa')),

  -- Comfort and technology
  screen_inches numeric(3,1) check (screen_inches > 0),
  apple_carplay boolean,
  android_auto boolean,
  panoramic_roof boolean,
  ventilated_seats boolean,
  heated_seats boolean,
  wireless_charger boolean,
  heat_pump boolean,

  -- Control
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (brand, model, version, model_year, market),
  check (dc_charge_from_pct is null or dc_charge_to_pct is null or dc_charge_from_pct < dc_charge_to_pct)
);

comment on table public.vehicles is 'Spec sheets for the car comparator. One row per version, model year and market.';
comment on column public.vehicles.market is 'ISO 3166-1 alpha-2 code of the market this spec sheet applies to (CN, CO, DE...). Use EU for a Europe-wide sheet.';
comment on column public.vehicles.segment is 'Size class. The body shape goes in body_style.';
comment on column public.vehicles.power_kw is 'Maximum system power in kW. Source of truth for power.';
comment on column public.vehicles.power_hp is 'Mechanical horsepower, calculated from power_kw.';
comment on column public.vehicles.range_wltp_km is 'Total range under WLTP. Compare only against other WLTP figures.';
comment on column public.vehicles.range_cltc_km is 'Total range under CLTC (China). Usually higher than WLTP for the same car.';
comment on column public.vehicles.electric_range_km is 'Electric-only range, for plug-in hybrids and range extenders.';
comment on column public.vehicles.combined_range_km is 'Total range with battery and fuel tank, for plug-in hybrids and range extenders.';
comment on column public.vehicles.dc_charge_min is 'Minutes to fast charge from dc_charge_from_pct to dc_charge_to_pct.';
comment on column public.vehicles.trunk_l is 'Rear trunk volume with the rear seats up.';
comment on column public.vehicles.curb_weight_kg is 'Curb weight: the car empty, without passengers or cargo.';
comment on column public.vehicles.source_url is 'Where the spec sheet came from.';
comment on column public.vehicles.article_slug is 'Slug of the related magazine article, if any.';

-- Keeps updated_at current on every change.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row
  execute function public.set_updated_at();

alter table public.vehicles enable row level security;

-- The site can only read published vehicles. No insert, update or delete policy exists for public roles.
create policy "Published vehicles are readable by everyone"
  on public.vehicles
  for select
  to anon, authenticated
  using (published);
