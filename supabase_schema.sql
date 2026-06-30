-- Run this in your Supabase project's SQL Editor (Dashboard > SQL Editor > New query)

create table if not exists kids (
  id bigint generated always as identity primary key,
  name text not null,
  parent_name text not null,
  status text check (status in ('yes', 'no')) default null,
  pickup_time text default '',
  picked_up boolean default false,
  updated_at timestamptz default now()
);

create table if not exists activity_log (
  id bigint generated always as identity primary key,
  text text not null,
  created_at timestamptz default now()
);

-- Seed your kids/parents here (edit names as needed)
insert into kids (name, parent_name) values
  ('Aanya Perera', 'Mrs. Perera'),
  ('Dinuk Silva', 'Mr. Silva'),
  ('Liyana Fonseka', 'Mrs. Fonseka'),
  ('Ruwan Jayasuriya', 'Mr. Jayasuriya'),
  ('Sithara Wickrama', 'Mrs. Wickrama');

-- Enable Row Level Security
alter table kids enable row level security;
alter table activity_log enable row level security;

-- Since this app has no login, allow anyone with the link (anon key) to read/write.
-- This is fine for a small private daycare link shared only with your families/staff,
-- but anyone with the URL could edit data. Add real auth later if you need stricter access.
create policy "Public read kids" on kids for select using (true);
create policy "Public update kids" on kids for update using (true);
create policy "Public insert kids" on kids for insert with check (true);

create policy "Public read log" on activity_log for select using (true);
create policy "Public insert log" on activity_log for insert with check (true);

-- Enable realtime on these tables
alter publication supabase_realtime add table kids;
alter publication supabase_realtime add table activity_log;
