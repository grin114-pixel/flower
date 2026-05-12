-- 꽃사전 테이블
-- Supabase SQL Editor에서 실행하세요.

-- 기본 테이블 생성
create table if not exists public.flowers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists flowers_created_at_idx on public.flowers (created_at desc);
create index if not exists flowers_name_idx on public.flowers (name);
create index if not exists flowers_user_id_idx on public.flowers (user_id);

-- =============================================
-- 기존 테이블에 user_id 컬럼 추가 (이미 테이블이 있는 경우)
-- =============================================
-- alter table public.flowers add column if not exists user_id uuid references auth.users(id) on delete cascade;
-- create index if not exists flowers_user_id_idx on public.flowers (user_id);

-- =============================================
-- Row Level Security (RLS) 활성화 및 정책 설정
-- =============================================
alter table public.flowers enable row level security;

-- 기존 정책 삭제 (재실행 시 오류 방지)
drop policy if exists "flowers_select_own" on public.flowers;
drop policy if exists "flowers_insert_own" on public.flowers;
drop policy if exists "flowers_update_own" on public.flowers;
drop policy if exists "flowers_delete_own" on public.flowers;

-- 자신의 꽃만 조회
create policy "flowers_select_own" on public.flowers
  for select using (auth.uid() = user_id);

-- 자신의 user_id로만 등록
create policy "flowers_insert_own" on public.flowers
  for insert with check (auth.uid() = user_id);

-- 자신의 꽃만 수정
create policy "flowers_update_own" on public.flowers
  for update using (auth.uid() = user_id);

-- 자신의 꽃만 삭제
create policy "flowers_delete_own" on public.flowers
  for delete using (auth.uid() = user_id);

-- =============================================
-- /sample 페이지: 누구나 grin114@naver.com 데이터 조회 가능
-- =============================================
-- SECURITY DEFINER 함수 (anon은 auth.users 직접 접근 불가하므로 우회)
create or replace function public.sample_user_id()
returns uuid
language sql
security definer
set search_path = public, auth
as $$
  select id from auth.users where email = 'grin114@naver.com' limit 1
$$;

grant execute on function public.sample_user_id() to anon, authenticated;

drop policy if exists "flowers_select_sample" on public.flowers;
create policy "flowers_select_sample" on public.flowers
  for select
  to anon, authenticated
  using (user_id = public.sample_user_id());
