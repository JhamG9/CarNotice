-- Auditoría de completitud de public.vehicles. Solo lee.
-- Una fila por vehículo con los campos que le faltan según su motorización.
-- Las reglas (qué campo aplica a qué motorización) están explicadas en campos.md.
-- airbags, ground_clearance_mm, panoramic_roof y ventilated_seats son opcionales: no cuentan aquí.
-- Para auditar un solo vehículo, descomentar el filtro por slug al final.

with reglas(col, grupo) as (values
  -- Todos los vehículos
  ('warranty_years', 'todos'), ('warranty_km', 'todos'),
  ('image_url', 'todos'), ('image_credit', 'todos'), ('image_source_url', 'todos'),
  ('power_kw', 'todos'), ('torque_nm', 'todos'), ('acceleration_0_100_s', 'todos'),
  ('top_speed_kmh', 'todos'), ('drivetrain', 'todos'), ('transmission', 'todos'),
  ('co2_g_km', 'todos'),
  ('length_mm', 'todos'), ('width_mm', 'todos'), ('height_mm', 'todos'),
  ('wheelbase_mm', 'todos'), ('trunk_l', 'todos'), ('curb_weight_kg', 'todos'),
  ('seats', 'todos'),
  ('autonomous_emergency_braking', 'todos'),
  ('adaptive_cruise_control', 'todos'), ('lane_keeping_assist', 'todos'),
  ('blind_spot_monitor', 'todos'), ('camera_360', 'todos'), ('isofix', 'todos'),
  ('screen_inches', 'todos'), ('apple_carplay', 'todos'), ('android_auto', 'todos'),
  ('heated_seats', 'todos'),
  ('wireless_charger', 'todos'),
  -- Con motor eléctrico (todo menos gasolina y diésel)
  ('motor_count', 'electrificado'),
  -- Con batería enchufable
  ('battery_kwh', 'enchufable'), ('battery_chemistry', 'enchufable'),
  ('consumption_kwh_100km', 'enchufable'),
  ('battery_warranty_years', 'enchufable'), ('battery_warranty_km', 'enchufable'),
  ('dc_charge_kw', 'enchufable'), ('ac_charge_kw', 'enchufable'),
  ('dc_charge_from_pct', 'enchufable'), ('dc_charge_to_pct', 'enchufable'),
  ('dc_charge_min', 'enchufable'), ('connector', 'enchufable'), ('v2l', 'enchufable'),
  ('heat_pump', 'enchufable'),
  -- Híbridos enchufables y rango extendido
  ('electric_range_km', 'hibrido_enchufable'), ('electric_range_cycle', 'hibrido_enchufable'),
  ('combined_range_km', 'hibrido_enchufable'),
  -- Con motor de combustión (todo menos eléctrico)
  ('displacement_cc', 'combustion'), ('cylinder_count', 'combustion'), ('turbo', 'combustion'),
  ('gear_count', 'combustion'), ('fuel_consumption_l_100km', 'combustion'),
  ('fuel_tank_l', 'combustion'), ('emission_standard', 'combustion')
),
grupos(grupo, powertrain) as (
  select 'todos', p from unnest(array['electric','range_extender','plug_in_hybrid','hybrid','mild_hybrid','gasoline','diesel']) p
  union all select 'electrificado', p from unnest(array['electric','range_extender','plug_in_hybrid','hybrid','mild_hybrid']) p
  union all select 'enchufable', p from unnest(array['electric','range_extender','plug_in_hybrid']) p
  union all select 'hibrido_enchufable', p from unnest(array['range_extender','plug_in_hybrid']) p
  union all select 'combustion', p from unnest(array['range_extender','plug_in_hybrid','hybrid','mild_hybrid','gasoline','diesel']) p
),
v as (select x.slug, x.powertrain, x.market, x.published, to_jsonb(x) j from public.vehicles x),
faltan as (
  select v.slug, r.col
  from v
  join grupos g on g.powertrain = v.powertrain
  join reglas r on r.grupo = g.grupo
  where v.j -> r.col = 'null'::jsonb
    -- Una garantía sin límite no es un faltante: el número queda vacío a propósito.
    -- coalesce: si la marca de sin límite está vacía, la comparación da null y not(null) descartaría la fila.
    and not coalesce(r.col = 'warranty_km' and v.j ->> 'warranty_km_unlimited' = 'true', false)
    and not coalesce(r.col in ('battery_warranty_years', 'battery_warranty_km') and v.j ->> 'battery_warranty_unlimited' = 'true', false)
  union all
  -- Eléctricos: autonomía en el ciclo del mercado (EU → WLTP, CN → CLTC, US → EPA);
  -- en los demás mercados basta con un ciclo cualquiera.
  select v.slug,
    case v.market when 'CN' then 'range_cltc_km' when 'US' then 'range_epa_km'
      when 'EU' then 'range_wltp_km' else 'range_* (cualquier ciclo)' end
  from v
  where v.powertrain = 'electric'
    and case
      when v.market = 'CN' then v.j -> 'range_cltc_km' = 'null'::jsonb
      when v.market = 'US' then v.j -> 'range_epa_km' = 'null'::jsonb
      when v.market in ('EU','DE','FR','ES','IT','NL','BE','AT','PT','SE','NO','DK','FI','IE','PL','CH','GB')
        then v.j -> 'range_wltp_km' = 'null'::jsonb
      -- ->> devuelve null de SQL; con -> coalesce se quedaría con el null de JSON del primer ciclo.
      else coalesce(v.j ->> 'range_wltp_km', v.j ->> 'range_cltc_km', v.j ->> 'range_epa_km', v.j ->> 'range_nedc_km') is null
    end
),
aplicables as (
  select v.slug, count(*) + case when v.powertrain = 'electric' then 1 else 0 end as n
  from v join grupos g on g.powertrain = v.powertrain join reglas r on r.grupo = g.grupo
  group by v.slug, v.powertrain
)
select v.slug, v.powertrain, v.market, v.published,
  a.n as campos_aplicables,
  count(f.col) as faltantes,
  round(100.0 * (a.n - count(f.col)) / a.n) as pct_completo,
  coalesce(array_agg(f.col order by f.col) filter (where f.col is not null), '{}') as campos_faltantes,
  v.j ->> 'source_url' as source_url
from v
join aplicables a on a.slug = v.slug
left join faltan f on f.slug = v.slug
-- where v.slug = 'slug-del-vehiculo'
group by v.slug, v.powertrain, v.market, v.published, a.n, v.j
order by pct_completo, v.slug;
