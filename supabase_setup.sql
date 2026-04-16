-- 꽃사전 테이블
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.flowers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists flowers_created_at_idx on public.flowers (created_at desc);
create index if not exists flowers_name_idx on public.flowers (name);

