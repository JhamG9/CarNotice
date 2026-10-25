-- Paso 1 de agregar-vehiculos: revisa de una vez si los carros pedidos ya están en public.vehicles. Solo lee.
-- Reemplazar la lista de "pedidos" por los carros que pidieron: (número, marca, modelo).
-- Compara sin tildes ni mayúsculas, y busca el modelo también en latam_name (el Seagull es el Dolphin Mini).
-- Una fila por coincidencia; los pedidos sin ninguna salen una vez con "nuevo".
-- "nombre parecido: revisar" es solo un candidato ("Kona" encuentra "Kona Electric", pero "Dolphin Mini" también
-- encuentra "Dolphin", que es otro carro): la sesión principal decide si es el mismo.

with pedidos(n, marca, modelo) as (values
  (1, 'BYD', 'Seagull'),
  (2, 'Xpeng', 'G6')
),
norm as (
  select n, marca, modelo,
    lower(translate(marca, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')) as m,
    lower(translate(modelo, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')) as mo
  from pedidos
),
v as (
  select slug, brand, model, version, model_year, market, latam_name, published,
    lower(translate(brand, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')) as b,
    lower(translate(model, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')) as mod,
    lower(translate(coalesce(latam_name, ''), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')) as alt
  from public.vehicles
)
select p.n, p.marca as pedido_marca, p.modelo as pedido_modelo,
  case
    when v.slug is null then 'nuevo'
    when v.mod = p.mo then 'mismo modelo'
    when v.alt like '%' || p.mo || '%' then 'otro nombre (latam_name)'
    else 'nombre parecido: revisar'
  end as hallazgo,
  v.slug, v.brand, v.model, v.version, v.model_year, v.market, v.latam_name, v.published
from norm p
left join v
  on v.b = p.m
 and (v.mod = p.mo or v.mod like '%' || p.mo || '%' or p.mo like '%' || v.mod || '%' or v.alt like '%' || p.mo || '%')
order by p.n, v.market, v.version;
