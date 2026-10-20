-- 로그인한 사람의 '저장한 소식'을 보관해요.
-- 본인 것만 보고 고칠 수 있어요(RLS). 계정을 지우면 함께 지워져요(on delete cascade).
create table if not exists public.saved_stories (
  user_id   uuid        not null references auth.users (id) on delete cascade default auth.uid(),
  date      text        not null,          -- 브리핑 날짜 YYYY-MM-DD
  anchor    text        not null,          -- 그날 소식 번호(블로그의 anchor)
  tag       text        not null default '',
  color     text        not null default '',
  title     text        not null default '',
  thumb     text,
  saved_at  timestamptz not null default now(),
  primary key (user_id, date, anchor)
);

alter table public.saved_stories enable row level security;

create policy "본인 저장 소식 보기" on public.saved_stories
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "본인 저장 소식 넣기" on public.saved_stories
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "본인 저장 소식 고치기" on public.saved_stories
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "본인 저장 소식 지우기" on public.saved_stories
  for delete to authenticated using ((select auth.uid()) = user_id);
