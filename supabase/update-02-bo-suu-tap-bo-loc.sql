-- =====================================================================
--  CẬP NHẬT 02 — Bộ sưu tập trong từng danh mục + Bộ lọc váy
--  Dành cho project ĐÃ chạy schema.sql (và update-01) trước đó.
--  Supabase → SQL Editor → New query → dán toàn bộ file này → Run.
--  Chạy lại nhiều lần cũng không sao.
-- =====================================================================

-- 1. Bộ sưu tập: nhóm nhiều váy cùng phân khúc, tên tự đặt
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  tagline text,                     -- một câu ngắn hiện dưới tên
  description text,
  cover jsonb,                      -- ảnh bìa (không bắt buộc)
  launched_on date,                 -- ngày ra mắt
  is_new boolean not null default false,
  status text not null default 'published' check (status in ('published', 'draft')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 2. Lựa chọn cho bộ lọc (dáng váy, chất liệu, kiểu cổ…)
create table if not exists public.attributes (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('silhouette', 'material', 'neckline', 'sleeve', 'train', 'color', 'style', 'occasion')),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (kind, name)
);

-- 3. Gắn váy vào bộ sưu tập và các lựa chọn lọc
alter table public.products add column if not exists collection_id uuid references public.collections(id) on delete set null;
alter table public.products add column if not exists attrs uuid[] not null default '{}';

-- 4. Phân quyền: khách xem, nhân sự thêm/sửa, quản trị viên xoá
alter table public.collections enable row level security;
alter table public.attributes enable row level security;

drop policy if exists "collections read" on public.collections;
create policy "collections read" on public.collections for select using (status = 'published' or public.is_staff());
drop policy if exists "collections staff insert" on public.collections;
create policy "collections staff insert" on public.collections for insert with check (public.is_staff());
drop policy if exists "collections staff update" on public.collections;
create policy "collections staff update" on public.collections for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "collections admin delete" on public.collections;
create policy "collections admin delete" on public.collections for delete using (public.is_admin());

drop policy if exists "attributes read" on public.attributes;
create policy "attributes read" on public.attributes for select using (true);
drop policy if exists "attributes staff insert" on public.attributes;
create policy "attributes staff insert" on public.attributes for insert with check (public.is_staff());
drop policy if exists "attributes staff update" on public.attributes;
create policy "attributes staff update" on public.attributes for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "attributes admin delete" on public.attributes;
create policy "attributes admin delete" on public.attributes for delete using (public.is_admin());

grant select on public.collections, public.attributes to anon, authenticated;
grant insert, update, delete on public.collections, public.attributes to authenticated;

-- 5. Lựa chọn lọc gợi ý (sửa, thêm, xoá trong admin → Bộ lọc)
insert into public.attributes (kind, name, sort_order)
select v.kind, v.name, v.ord from (values
  ('silhouette', 'Chữ A', 1), ('silhouette', 'Đuôi cá', 2), ('silhouette', 'Xòe công chúa', 3),
  ('silhouette', 'Suông', 4), ('silhouette', 'Ôm body', 5), ('silhouette', 'Ngắn & midi', 6),
  ('material', 'Satin', 1), ('material', 'Lụa', 2), ('material', 'Mikado', 3), ('material', 'Ren', 4),
  ('material', 'Tulle', 5), ('material', 'Organza', 6), ('material', 'Crepe', 7), ('material', 'Tweed', 8),
  ('neckline', 'Cúp ngực', 1), ('neckline', 'Trễ vai', 2), ('neckline', 'Cổ vuông', 3), ('neckline', 'Cổ tim', 4),
  ('neckline', 'Cổ yếm', 5), ('neckline', 'Cổ thuyền', 6), ('neckline', 'Cổ cao', 7),
  ('sleeve', 'Không tay', 1), ('sleeve', 'Hai dây', 2), ('sleeve', 'Tay ngắn', 3), ('sleeve', 'Tay dài', 4), ('sleeve', 'Tay phồng', 5),
  ('train', 'Không đuôi', 1), ('train', 'Đuôi ngắn', 2), ('train', 'Đuôi dài', 3), ('train', 'Đuôi hoàng gia', 4),
  ('color', 'Trắng tinh', 1), ('color', 'Trắng ngà', 2), ('color', 'Champagne', 3), ('color', 'Hồng phấn', 4),
  ('style', 'Tối giản', 1), ('style', 'Cổ điển', 2), ('style', 'Quyến rũ', 3), ('style', 'Công chúa', 4), ('style', 'Phóng khoáng', 5),
  ('occasion', 'Lễ nhà thờ', 1), ('occasion', 'Tiệc trong nhà', 2), ('occasion', 'Tiệc ngoài trời', 3),
  ('occasion', 'Chụp ngoại cảnh', 4), ('occasion', 'Lễ gia tiên', 5)
) as v(kind, name, ord)
on conflict (kind, name) do nothing;

-- 6. Chuyển dáng váy / chất liệu đã nhập dạng chữ sang lựa chọn lọc (nếu khớp tên)
update public.products p
set attrs = (
  select coalesce(array_agg(distinct a.id), '{}')
  from public.attributes a
  where (a.kind = 'silhouette' and lower(coalesce(p.silhouette, '')) like '%' || lower(a.name) || '%')
     or (a.kind = 'material'   and lower(coalesce(p.material, ''))   like '%' || lower(a.name) || '%')
)
where p.attrs = '{}';

-- 7. Bộ sưu tập mẫu cho các váy mẫu (chỉ tạo khi chưa có bộ sưu tập nào)
do $$
begin
  if not exists (select 1 from public.collections) then
    insert into public.collections (name, slug, category_id, tagline, description, launched_on, is_new, sort_order) values
      ('Lumière', 'lumiere', (select id from public.categories where slug = 'vay-cuoi'),
       'Lụa trơn, phom sạch, ánh sáng tự nhiên',
       'Những chiếc váy tối giản bằng lụa và satin, dành cho cô dâu yêu sự nhẹ nhàng.', current_date, true, 1),
      ('Héritage', 'heritage', (select id from public.categories where slug = 'vay-cuoi'),
       'Cổ điển, đứng phom, dành cho lễ cưới lớn',
       'Mikado, tà dài và đường cắt kinh điển châu Âu.', current_date - 180, false, 2),
      ('Soirée', 'soiree', (select id from public.categories where slug = 'vay-di-ban'),
       'Gọn nhẹ để đi chào khách',
       'Váy midi và set tweed cho phần tiệc tối.', current_date, true, 3);
    update public.products set collection_id = (select id from public.collections where slug = 'lumiere') where slug in ('amelie', 'odette');
    update public.products set collection_id = (select id from public.collections where slug = 'heritage') where slug in ('celine', 'margaux');
    update public.products set collection_id = (select id from public.collections where slug = 'soiree') where slug in ('colette', 'noemie');
    -- Gắn thêm vài lựa chọn lọc cho váy mẫu để bộ lọc có dữ liệu ngay
    update public.products set attrs = array(select distinct unnest(attrs || array(
      select id from public.attributes where (kind, name) in
      (('neckline','Cổ vuông'),('style','Tối giản'),('occasion','Lễ nhà thờ'),('color','Trắng ngà'),('train','Đuôi ngắn'),('sleeve','Không tay'))))) where slug = 'amelie';
    update public.products set attrs = array(select distinct unnest(attrs || array(
      select id from public.attributes where (kind, name) in
      (('neckline','Cổ yếm'),('style','Quyến rũ'),('occasion','Tiệc trong nhà'),('color','Trắng tinh'),('train','Đuôi ngắn'),('sleeve','Không tay'))))) where slug = 'celine';
    update public.products set attrs = array(select distinct unnest(attrs || array(
      select id from public.attributes where (kind, name) in
      (('neckline','Trễ vai'),('style','Công chúa'),('occasion','Lễ nhà thờ'),('color','Trắng ngà'),('train','Đuôi hoàng gia'),('material','Tulle'))))) where slug = 'margaux';
    update public.products set attrs = array(select distinct unnest(attrs || array(
      select id from public.attributes where (kind, name) in
      (('neckline','Cổ thuyền'),('style','Phóng khoáng'),('occasion','Chụp ngoại cảnh'),('occasion','Tiệc ngoài trời'),('color','Trắng tinh'),('sleeve','Tay phồng'),('train','Không đuôi'))))) where slug = 'odette';
    update public.products set attrs = array(select distinct unnest(attrs || array(
      select id from public.attributes where (kind, name) in
      (('color','Champagne'),('neckline','Cổ tim'),('sleeve','Hai dây'),('style','Tối giản'))))) where slug = 'colette';
    update public.products set attrs = array(select distinct unnest(attrs || array(
      select id from public.attributes where (kind, name) in
      (('color','Trắng ngà'),('neckline','Cổ thuyền'),('sleeve','Tay ngắn'),('style','Cổ điển'))))) where slug = 'noemie';
  end if;
end $$;
