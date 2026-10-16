-- Candado de publicación: dice qué áreas del comparador quedarían "sin datos" para cada vehículo.
-- Un vehículo solo se publica con `listo_para_publicar = true`, salvo que quien administra diga
-- expresamente lo contrario para ese vehículo. Solo lee.
-- Las reglas salen de src/lib/vehiculos.ts (calcularEjes): si cambian allí, cambiar aquí también.
-- Uso: reemplazar la lista de slugs del where final, o quitarlo para ver toda la tabla.

with v as (
  select
    slug, powertrain, published,
    -- Autonomía: total en algún ciclo; en rango extendido e híbridos enchufables vale la combinada con su ciclo
    case
      when coalesce(range_wltp_km, range_cltc_km, range_epa_km, range_nedc_km) is not null then true
      when powertrain in ('range_extender', 'plug_in_hybrid') and combined_range_km is not null and electric_range_cycle is not null then true
      else false
    end as autonomia,
    concat_ws(', ',
      case when range_wltp_km is not null then 'WLTP' end,
      case when range_cltc_km is not null then 'CLTC' end,
      case when range_epa_km is not null then 'EPA' end,
      case when range_nedc_km is not null then 'NEDC' end,
      case when powertrain in ('range_extender', 'plug_in_hybrid') and combined_range_km is not null
        then electric_range_cycle || ' (combinada)' end
    ) as ciclos,
    power_kw is not null as potencia,
    acceleration_0_100_s is not null as aceleracion,
    (dc_charge_from_pct is not null and dc_charge_to_pct is not null and dc_charge_min is not null) as carga_rapida,
    trunk_l is not null as espacio,
    -- Seguridad y confort se puntúan con al menos 3 de sus 6 datos conocidos
    (num_nonnulls(autonomous_emergency_braking, adaptive_cruise_control, lane_keeping_assist,
                  blind_spot_monitor, camera_360, isofix) >= 3) as seguridad,
    (num_nonnulls(apple_carplay, android_auto, panoramic_roof, ventilated_seats,
                  heated_seats, wireless_charger) >= 3) as confort,
    (image_url is not null and image_credit is not null) as foto
  from public.vehicles
)
select
  slug, powertrain, published, ciclos,
  array_remove(array[
    case when not autonomia then 'autonomía' end,
    case when not potencia then 'potencia (power_kw)' end,
    case when not aceleracion then 'aceleración (acceleration_0_100_s)' end,
    case when not carga_rapida then 'carga rápida (dc_charge_from_pct, dc_charge_to_pct, dc_charge_min)' end,
    case when not espacio then 'espacio (trunk_l)' end,
    case when not seguridad then 'seguridad (menos de 3 de 6 ayudas conocidas)' end,
    case when not confort then 'confort (menos de 3 de 6 equipos conocidos)' end,
    case when not foto then 'foto (image_url e image_credit)' end
  ], null) as faltan,
  (autonomia and potencia and aceleracion and carga_rapida and espacio and seguridad and confort and foto) as listo_para_publicar
from v
where slug in ('slug-del-vehiculo')
order by listo_para_publicar, slug;
