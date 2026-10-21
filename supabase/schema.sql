begin;
-- Run in the dedicated Curd Supabase project SQL editor.
create table if not exists public.curd_progress_events (
  sequence bigint generated always as identity unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 262144),
  created_at timestamptz not null default now(),
  primary key (user_id,id)
);
create index if not exists curd_events_user_sequence on public.curd_progress_events(user_id,sequence);
alter table public.curd_progress_events enable row level security;
revoke all on public.curd_progress_events from anon, authenticated;
grant select, insert on public.curd_progress_events to authenticated;
grant usage, select on sequence public.curd_progress_events_sequence_seq to authenticated;
drop policy if exists "Read own Curd progress" on public.curd_progress_events;
create policy "Read own Curd progress" on public.curd_progress_events for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Append own Curd progress" on public.curd_progress_events;
create policy "Append own Curd progress" on public.curd_progress_events for insert to authenticated with check ((select auth.uid()) = user_id);
-- Immutable events: clients cannot update another device's event, or read another account.

commit;
