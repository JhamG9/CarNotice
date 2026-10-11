create table public.cars (
  id bigint generated always as identity primary key,
  name text not null,
  weight_kg numeric check (weight_kg > 0),
  torque_nm numeric check (torque_nm > 0),
  range_km numeric check (range_km > 0),
  created_at timestamptz not null default now()
);

comment on table public.cars is 'Test table for the car comparator.';
comment on column public.cars.weight_kg is 'Curb weight in kilograms.';
comment on column public.cars.torque_nm is 'Torque in newton metres.';
comment on column public.cars.range_km is 'Driving range in kilometres.';

alter table public.cars enable row level security;

-- The site can only read. No insert, update or delete policy exists for public roles.
create policy "Cars are readable by everyone"
  on public.cars
  for select
  to anon, authenticated
  using (true);
