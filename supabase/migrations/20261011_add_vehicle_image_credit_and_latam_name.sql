alter table public.vehicles
  add column image_credit text,
  add column image_source_url text,
  add column latam_name text;

comment on column public.vehicles.image_credit is 'Photo author and license, e.g. "Alexander Migl, CC BY-SA 4.0". If the photo shows a sister model, it starts with that model name.';
comment on column public.vehicles.image_source_url is 'Page where the photo was published (e.g. its Wikimedia Commons page).';
comment on column public.vehicles.latam_name is 'Name this vehicle is sold under in Latin America, only when it differs from brand + model.';
