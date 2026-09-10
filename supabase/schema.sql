-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: the app uses the public anon key in the browser,
-- so only allow read access. No insert/update/delete from the client.
alter table public.bookings enable row level security;

create policy "Allow public read of bookings"
  on public.bookings
  for select
  to anon
  using (true);

-- Example seed row:
-- insert into public.bookings (booking_id, name) values ('UD-0001', 'Jane Doe');

insert into public.bookings (booking_id, name)
values ('udaanxydg5', 'Debadattagadanayak')
on conflict (booking_id) do update set name = excluded.name;

