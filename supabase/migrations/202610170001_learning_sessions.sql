create table public.learning_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  completed integer not null check (completed between 0 and 10),
  xp integer not null check (xp between 0 and 100 and xp % 10 = 0),
  mistakes integer not null check (mistakes between 0 and 5),
  duration_seconds integer not null check (duration_seconds between 0 and 86400),
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) <= 15 and octet_length(answers::text) <= 20000)
);
create index learning_sessions_owner_date on public.learning_sessions(user_id, created_at desc);
alter table public.learning_sessions enable row level security;
revoke all on public.learning_sessions from anon, authenticated;
grant select, insert, delete on public.learning_sessions to authenticated;
create policy own_read on public.learning_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.learning_sessions for insert to authenticated with check ((select auth.uid()) = user_id and created_at between now() - interval '1 minute' and now() + interval '1 minute');
create policy own_delete on public.learning_sessions for delete to authenticated using ((select auth.uid()) = user_id);
