-- =====================================================================
--  CẬP NHẬT 01 — Ảnh trang chủ
--  Dành cho project ĐÃ chạy schema.sql trước đó.
--  Supabase → SQL Editor → New query → dán toàn bộ file này → Run.
--  Chạy lại nhiều lần cũng không sao.
-- =====================================================================

create table if not exists public.home_media (
  slot text primary key,             -- vị trí ảnh trên trang chủ
  image jsonb,                       -- { "url": "...", "thumb": "..." }
  focus text not null default 'center' check (focus in ('top', 'center', 'bottom')),
  caption text,
  updated_at timestamptz not null default now()
);

alter table public.home_media enable row level security;

drop policy if exists "home_media read" on public.home_media;
create policy "home_media read" on public.home_media for select using (true);
drop policy if exists "home_media staff insert" on public.home_media;
create policy "home_media staff insert" on public.home_media for insert with check (public.is_staff());
drop policy if exists "home_media staff update" on public.home_media;
create policy "home_media staff update" on public.home_media for update using (public.is_staff()) with check (public.is_staff());

grant select on public.home_media to anon, authenticated;
grant insert, update on public.home_media to authenticated;

-- Chuyển ảnh đầu trang cũ (nếu đã tải trong "Thông tin website") sang vị trí mới
insert into public.home_media (slot, image)
select 'hero_detail', hero_image from public.settings where id = 1 and hero_image is not null
on conflict (slot) do nothing;

-- Bớt lặp tên thương hiệu trong nội dung mẫu (chỉ đổi nếu bạn chưa sửa các dòng này)
update public.settings
set about = 'Studio váy cưới theo đuổi vẻ đẹp tối giản: phom dáng sạch, chất liệu tốt, đường may tỉ mỉ. Chúng tôi đồng hành cùng cô dâu từ chiếc váy, lớp trang điểm đến không gian tiệc cưới.'
where id = 1 and about like 'Darla Dear Darling là studio váy cưới theo đuổi vẻ đẹp tối giản%';

update public.settings
set marquee = 'Váy cưới may đo,Makeup cô dâu,Rạp cưới,Thử váy tại showroom,Bộ sưu tập 2026'
where id = 1 and marquee = 'Váy cưới,Makeup cô dâu,Rạp cưới,Dear Darling,Bộ sưu tập 2026';

update public.offers set title = 'Combo trọn gói' where title = 'Combo Dear Darling';
