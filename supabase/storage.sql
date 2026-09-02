grant execute on function public.expire_availability() to authenticated;
grant select on public.profile_ratings to authenticated;

-- Storage policies (run after creating bucket "profile-photos" as public)
-- insert into storage.buckets (id, name, public) values ('profile-photos', 'profile-photos', true);

create policy "photo_public_read" on storage.objects for select using (bucket_id = 'profile-photos');
create policy "photo_upload_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photo_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
