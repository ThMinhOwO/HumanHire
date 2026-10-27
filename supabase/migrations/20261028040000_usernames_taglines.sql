-- Unique @usernames. Stored lowercase: 3-20 characters of a-z, 0-9, "_" and
-- ".", no dot at either end and no two dots in a row. Nullable because
-- accounts created before this migration haven't picked one yet.
alter table public.profiles add column username text unique;

alter table public.profiles
  add constraint profiles_username_format
  check (
    username ~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$'
    and username !~ '\.\.'
  );

alter table public.profiles
  add constraint profiles_username_not_reserved
  check (
    username not in (
      'admin', 'administrator', 'root', 'support', 'help', 'moderator', 'mod',
      'staff', 'system', 'humanhire', 'official', 'security', 'null', 'undefined'
    )
  );

-- Lets the signup form check a name before the account exists, so anon can
-- call it. Mirrors the constraints above.
create or replace function public.username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select candidate ~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$'
    and candidate !~ '\.\.'
    and candidate not in (
      'admin', 'administrator', 'root', 'support', 'help', 'moderator', 'mod',
      'staff', 'system', 'humanhire', 'official', 'security', 'null', 'undefined'
    )
    and not exists (select 1 from public.profiles where username = candidate);
$$;

grant execute on function public.username_available(text) to anon, authenticated;

-- New accounts take the username chosen at signup. If someone grabbed it in
-- the meantime, the account is still created without one and the app asks
-- the user to pick another.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display text := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    'HumanHire user'
  );
begin
  begin
    insert into public.profiles (id, display_name, username)
    values (new.id, display, nullif(lower(new.raw_user_meta_data ->> 'username'), ''));
  exception when unique_violation or check_violation then
    insert into public.profiles (id, display_name) values (new.id, display);
  end;
  return new;
end;
$$;

-- Lets a Hire page show its owner's @username. Every user already has a
-- profile, so this second key on user_id always holds.
alter table public.hire_pages
  add constraint hire_pages_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;


-- One-line description shown next to the location on the board.
alter table public.hire_pages add column tagline text
  check (char_length(tagline) between 1 and 80);
