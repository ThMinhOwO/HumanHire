-- Avatars for users and Hire pages, plus a poster image for each Hire page.
-- Paths point into the public-images bucket, always inside the owner's folder.
alter table public.profiles add column avatar_path text;
alter table public.profiles
  add constraint profiles_avatar_in_own_folder
  check (avatar_path is null or avatar_path like id::text || '/%');

alter table public.hire_pages add column avatar_path text;
alter table public.hire_pages add column poster_path text;
alter table public.hire_pages
  add constraint hire_pages_avatar_in_own_folder
  check (avatar_path is null or avatar_path like user_id::text || '/%');
alter table public.hire_pages
  add constraint hire_pages_poster_in_own_folder
  check (poster_path is null or poster_path like user_id::text || '/%');

-- Public bucket: anyone can view by URL, files live under "<user id>/".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-images',
  'public-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

create policy "Users can view their own public images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'public-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can upload to their own public folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'public-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can replace their own public images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'public-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'public-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own public images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'public-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
