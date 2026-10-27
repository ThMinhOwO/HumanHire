-- A user's public Hire page: the "channel" they offer services under.
-- One per user, keyed by their auth user id.
create table public.hire_pages (
  user_id uuid primary key references auth.users (id) on delete cascade,
  hire_name text not null check (char_length(hire_name) between 2 and 50),
  location text not null check (char_length(location) between 2 and 100),
  tos text not null check (char_length(tos) between 20 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hire_pages enable row level security;

-- Any logged-in user can view Hire pages.
create policy "Logged-in users can view hire pages"
  on public.hire_pages for select
  to authenticated
  using (true);

-- Users can only create, edit and delete their own.
create policy "Users can create their own hire page"
  on public.hire_pages for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own hire page"
  on public.hire_pages for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own hire page"
  on public.hire_pages for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Keep updated_at current on every edit.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger hire_pages_set_updated_at
  before update on public.hire_pages
  for each row execute function public.set_updated_at();
