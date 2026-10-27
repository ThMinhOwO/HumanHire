-- Public profiles: the display name other users see (auth.users isn't readable
-- from the client). One row per user, created automatically on signup.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Logged-in users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      'HumanHire user'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for accounts created before this migration.
insert into public.profiles (id, display_name)
select
  id,
  coalesce(
    nullif(raw_user_meta_data ->> 'full_name', ''),
    nullif(raw_user_meta_data ->> 'name', ''),
    'HumanHire user'
  )
from auth.users
on conflict (id) do nothing;


-- A conversation between a client and a Hire (the owner of a Hire page).
-- The same two people can have two conversations if each hires the other.
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  hire_id uuid not null references public.hire_pages (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (client_id, hire_id),
  check (client_id <> hire_id)
);

create index conversations_hire_id_idx on public.conversations (hire_id);

alter table public.conversations enable row level security;

create policy "Participants can view their conversations"
  on public.conversations for select
  to authenticated
  using ((select auth.uid()) in (client_id, hire_id));

-- Only the client starts a conversation, with themselves as client.
create policy "Users can start conversations as the client"
  on public.conversations for insert
  to authenticated
  with check ((select auth.uid()) = client_id);


create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id, id);

alter table public.messages enable row level security;

create policy "Participants can view messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (select auth.uid()) in (c.client_id, c.hire_id)
    )
  );

create policy "Participants can send messages as themselves"
  on public.messages for insert
  to authenticated
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (select auth.uid()) in (c.client_id, c.hire_id)
    )
  );

-- Keep conversations.last_message_at current so the chat list sorts by activity.
create or replace function public.bump_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_bump_conversation
  after insert on public.messages
  for each row execute function public.bump_conversation();

-- Stream new messages to participants (Realtime applies the policies above).
alter publication supabase_realtime add table public.messages;
