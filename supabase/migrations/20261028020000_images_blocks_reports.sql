-- Helpers used by policies. The private schema isn't exposed through the API,
-- so these can't be called directly from the browser.
create schema if not exists private;
grant usage on schema private to authenticated;


-- Blocks: either side blocking stops all messaging between the two users.
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "Users can view their own blocks"
  on public.blocks for select
  to authenticated
  using ((select auth.uid()) = blocker_id);

create policy "Users can block others"
  on public.blocks for insert
  to authenticated
  with check ((select auth.uid()) = blocker_id);

create policy "Users can unblock others"
  on public.blocks for delete
  to authenticated
  using ((select auth.uid()) = blocker_id);

create or replace function private.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- Takes text because it's fed storage folder names; non-uuids just return false.
create or replace function private.is_conversation_participant(conversation text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations
    where id = case
        when conversation ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then conversation::uuid
      end
      and (select auth.uid()) in (client_id, hire_id)
  );
$$;

grant execute on function private.is_blocked_between(uuid, uuid) to authenticated;
grant execute on function private.is_conversation_participant(text) to authenticated;

-- The caller's relationship with another user: 'none', 'you_blocked' or 'blocked_you'.
create or replace function public.block_status(other uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.blocks
      where blocker_id = (select auth.uid()) and blocked_id = other
    ) then 'you_blocked'
    when exists (
      select 1 from public.blocks
      where blocker_id = other and blocked_id = (select auth.uid())
    ) then 'blocked_you'
    else 'none'
  end;
$$;

revoke execute on function public.block_status(uuid) from public, anon;
grant execute on function public.block_status(uuid) to authenticated;

-- Blocked pairs can't start new conversations...
drop policy "Users can start conversations as the client" on public.conversations;
create policy "Users can start conversations as the client"
  on public.conversations for insert
  to authenticated
  with check (
    (select auth.uid()) = client_id
    and not private.is_blocked_between(client_id, hire_id)
  );

-- ...or send messages in existing ones.
drop policy "Participants can send messages as themselves" on public.messages;
create policy "Participants can send messages as themselves"
  on public.messages for insert
  to authenticated
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (select auth.uid()) in (c.client_id, c.hire_id)
        and not private.is_blocked_between(c.client_id, c.hire_id)
    )
  );


-- Image messages. A message has text, an image, or both.
alter table public.messages add column image_path text;
alter table public.messages alter column body drop not null;
alter table public.messages
  add constraint messages_has_content check (body is not null or image_path is not null);
-- Images live under "<conversation id>/" in storage, so they can't point elsewhere.
alter table public.messages
  add constraint messages_image_in_conversation
  check (image_path is null or image_path like conversation_id::text || '/%');

-- Private bucket: images are served through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-images',
  'chat-images',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

create policy "Participants can upload chat images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-images'
    and private.is_conversation_participant((storage.foldername(name))[1])
  );

create policy "Participants can view chat images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-images'
    and private.is_conversation_participant((storage.foldername(name))[1])
  );


-- Reports. Users can file and see their own; review them in the dashboard.
create table public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  reason text not null
    check (reason in ('harassment', 'scam', 'inappropriate', 'safety', 'fake', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create index reports_status_idx on public.reports (status, created_at);

alter table public.reports enable row level security;

create policy "Users can file reports"
  on public.reports for insert
  to authenticated
  with check (
    (select auth.uid()) = reporter_id
    and status = 'open'
    and (
      conversation_id is null
      or private.is_conversation_participant(conversation_id::text)
    )
  );

create policy "Users can view their own reports"
  on public.reports for select
  to authenticated
  using ((select auth.uid()) = reporter_id);
