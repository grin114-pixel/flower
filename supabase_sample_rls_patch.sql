-- 이미 supabase_setup.sql 을 예전 버전으로 적용했다면, SQL Editor에서 한 번 실행하세요.
-- 로그인한 사용자도 /sample 에서 grin114@naver.com 꽃 목록을 볼 수 있게 합니다.

drop policy if exists "flowers_select_sample" on public.flowers;
create policy "flowers_select_sample" on public.flowers
  for select
  to anon, authenticated
  using (user_id = public.sample_user_id());
