-- =====================================================================
--  DARLA · Dear Darling — Cơ sở dữ liệu Supabase
--  Cách dùng: Supabase Dashboard → SQL Editor → New query → dán toàn bộ
--  file này → Run. Chạy 1 lần duy nhất cho project mới.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Hồ sơ nhân sự + phân quyền (admin / editor)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

-- Người dùng đầu tiên được tạo sẽ tự động là ADMIN, các tài khoản sau là EDITOR
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when exists (select 1 from public.profiles where role = 'admin')
         then 'editor'
         else 'admin' end
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------
-- 2. Nội dung website
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  brand_name text, tagline text, season_label text,
  hero_title text, hero_subtitle text, about text,
  instagram text, phone text, address text, hours text, marquee text,
  hero_image jsonb,
  updated_at timestamptz default now()
);
insert into public.settings (id, brand_name, tagline) values (1, 'Darla', 'Dear Darling')
on conflict (id) do nothing;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  silhouette text,
  material text,
  sizes text,
  price_rent bigint,
  price_sale bigint,
  price_note text,
  short_desc text,
  description text,
  images jsonb not null default '[]'::jsonb,   -- [{ "url": "...", "thumb": "..." }]
  is_featured boolean not null default false,
  is_new boolean not null default false,
  status text not null default 'published' check (status in ('published', 'draft')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'makeup' check (kind in ('makeup', 'venue', 'photo', 'other')),
  name text not null,
  price_from bigint,
  price_note text,
  description text,
  features text[] not null default '{}',
  image jsonb,                                  -- { "url": "...", "thumb": "..." }
  status text not null default 'published' check (status in ('published', 'draft')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  highlight text,
  description text,
  terms text,
  start_date date,
  end_date date,
  image jsonb,
  status text not null default 'published' check (status in ('published', 'draft')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 3. Bảo mật (Row Level Security)
--    Khách: chỉ xem nội dung đã đăng
--    Editor: thêm / sửa nội dung
--    Admin: toàn quyền (xoá, cài đặt website, quản lý nhân sự)
-- ---------------------------------------------------------------------
alter table public.profiles   enable row level security;
alter table public.settings   enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.services   enable row level security;
alter table public.offers     enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings read" on public.settings;
create policy "settings read" on public.settings for select using (true);
drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "categories read" on public.categories;
create policy "categories read" on public.categories for select using (true);
drop policy if exists "categories staff insert" on public.categories;
create policy "categories staff insert" on public.categories for insert with check (public.is_staff());
drop policy if exists "categories staff update" on public.categories;
create policy "categories staff update" on public.categories for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "categories admin delete" on public.categories;
create policy "categories admin delete" on public.categories for delete using (public.is_admin());

do $$
declare t text;
begin
  foreach t in array array['products', 'services', 'offers'] loop
    execute format('drop policy if exists "%1$s read" on public.%1$s', t);
    execute format('create policy "%1$s read" on public.%1$s for select using (status = ''published'' or public.is_staff())', t);
    execute format('drop policy if exists "%1$s staff insert" on public.%1$s', t);
    execute format('create policy "%1$s staff insert" on public.%1$s for insert with check (public.is_staff())', t);
    execute format('drop policy if exists "%1$s staff update" on public.%1$s', t);
    execute format('create policy "%1$s staff update" on public.%1$s for update using (public.is_staff()) with check (public.is_staff())', t);
    execute format('drop policy if exists "%1$s admin delete" on public.%1$s', t);
    execute format('create policy "%1$s admin delete" on public.%1$s for delete using (public.is_admin())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3b. Ảnh trang chủ (đổi trong admin → Ảnh trang chủ)
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- 3c. Bộ sưu tập trong danh mục + Bộ lọc váy
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- 4. Kho ảnh (Storage) — bucket công khai "media"
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media staff insert" on storage.objects;
create policy "media staff insert" on storage.objects for insert with check (bucket_id = 'media' and public.is_staff());
drop policy if exists "media staff update" on storage.objects;
create policy "media staff update" on storage.objects for update using (bucket_id = 'media' and public.is_staff());
drop policy if exists "media staff delete" on storage.objects;
create policy "media staff delete" on storage.objects for delete using (bucket_id = 'media' and public.is_staff());
