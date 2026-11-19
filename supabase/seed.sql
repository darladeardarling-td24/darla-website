-- Dữ liệu mẫu (có thể chạy sau schema.sql để web có sẵn nội dung; sửa/xoá trong trang admin)

update public.settings set brand_name = 'Darla', tagline = 'Dear Darling', season_label = 'Bộ sưu tập Xuân Hè 2026', hero_title = 'Em mặc gì, em sẽ là người ấy', hero_subtitle = 'Váy cưới may đo tinh giản theo tinh thần châu Âu — cho cô dâu yêu sự thanh lịch, nhẹ nhàng và vượt thời gian.', about = 'Studio váy cưới theo đuổi vẻ đẹp tối giản: phom dáng sạch, chất liệu tốt, đường may tỉ mỉ. Chúng tôi đồng hành cùng cô dâu từ chiếc váy, lớp trang điểm đến không gian tiệc cưới.', instagram = 'darla.deardarling', phone = '0900 000 000', address = 'Địa chỉ showroom — cập nhật trong trang quản trị', hours = '09:00 – 21:00, tất cả các ngày trong tuần', marquee = 'Váy cưới may đo,Makeup cô dâu,Rạp cưới,Thử váy tại showroom,Bộ sưu tập 2026' where id = 1;
insert into public.categories (name,slug,sort_order) values ('Váy cưới','vay-cuoi',1) on conflict (slug) do nothing;
insert into public.categories (name,slug,sort_order) values ('Váy đi bàn','vay-di-ban',2) on conflict (slug) do nothing;
insert into public.categories (name,slug,sort_order) values ('Áo dài cưới','ao-dai-cuoi',3) on conflict (slug) do nothing;
insert into public.categories (name,slug,sort_order) values ('Vest chú rể','vest-chu-re',4) on conflict (slug) do nothing;
insert into public.products (category_id,code,name,slug,silhouette,material,sizes,price_rent,price_sale,price_note,short_desc,description,is_featured,is_new,sort_order) values ((select id from public.categories where slug='vay-cuoi'),'DL-001','Amélie','amelie','Chữ A','Lụa satin Ý','XS – L (may đo theo số đo)',8500000,32000000,'Giá thuê trọn gói 3 ngày','Lụa satin trơn, cổ vuông, lưng thắt nơ dài.','Amélie là tinh thần Paris tối giản: phom chữ A mềm, cổ vuông thanh mảnh và chiếc nơ lụa buông dài phía sau. Phù hợp cô dâu yêu sự nhẹ nhàng, tổ chức tiệc trong nhà hoặc lễ nhà thờ.',true,true,1) on conflict (slug) do nothing;
insert into public.products (category_id,code,name,slug,silhouette,material,sizes,price_rent,price_sale,price_note,short_desc,description,is_featured,is_new,sort_order) values ((select id from public.categories where slug='vay-cuoi'),'DL-002','Céline','celine','Đuôi cá','Crepe co giãn, lót lụa','XS – L',9500000,36000000,'Giá thuê trọn gói 3 ngày','Đuôi cá ôm dáng, cổ yếm, lưng trần.','Céline tôn đường cong với phom đuôi cá ôm vừa vặn, cổ yếm cao và lưng trần sâu. Chất crepe dày rủ đẹp, gần như không nhăn khi di chuyển.',true,false,2) on conflict (slug) do nothing;
insert into public.products (category_id,code,name,slug,silhouette,material,sizes,price_rent,price_sale,price_note,short_desc,description,is_featured,is_new,sort_order) values ((select id from public.categories where slug='vay-cuoi'),'DL-003','Margaux','margaux','Xòe công chúa','Mikado & tulle Pháp','XS – XL',12000000,null,'Giá thuê trọn gói 3 ngày','Xòe bồng, vạt mikado đứng phom, tà dài 2m.','Margaux dành cho lễ cưới lớn: chân váy mikado đứng phom, lớp tulle mỏng bên trong và tà dài 2m. Thân áo corset cài khuy bọc vải.',true,true,3) on conflict (slug) do nothing;
insert into public.products (category_id,code,name,slug,silhouette,material,sizes,price_rent,price_sale,price_note,short_desc,description,is_featured,is_new,sort_order) values ((select id from public.categories where slug='vay-cuoi'),'DL-004','Odette','odette','Suông','Lụa organza','XS – L',7500000,26000000,'Giá thuê trọn gói 3 ngày','Suông nhẹ, tay phồng organza, hợp chụp ngoại cảnh.','Odette nhẹ như gió với phom suông, tay phồng organza trong và chân váy hai lớp. Lựa chọn lý tưởng cho chụp ảnh ngoại cảnh và tiệc cưới ngoài trời.',true,false,4) on conflict (slug) do nothing;
insert into public.products (category_id,code,name,slug,silhouette,material,sizes,price_rent,price_sale,price_note,short_desc,description,is_featured,is_new,sort_order) values ((select id from public.categories where slug='vay-di-ban'),'DL-011','Colette','colette','Midi','Satin champagne','S – L',2500000,9000000,'Giá thuê 1 ngày','Váy midi satin màu champagne, cổ đổ.','Colette là chiếc váy đi bàn gọn gàng, cổ đổ mềm, dài qua gối để cô dâu dễ di chuyển chào khách.',false,true,5) on conflict (slug) do nothing;
insert into public.products (category_id,code,name,slug,silhouette,material,sizes,price_rent,price_sale,price_note,short_desc,description,is_featured,is_new,sort_order) values ((select id from public.categories where slug='vay-di-ban'),'DL-012','Noémie','noemie','Chữ A ngắn','Tweed trắng ngà','S – L',2200000,null,'Giá thuê 1 ngày','Set tweed ngắn, khuy ngọc trai.','Noémie mang hơi thở cổ điển Pháp với chất tweed trắng ngà, khuy ngọc trai và phom chữ A ngắn trẻ trung.',false,false,6) on conflict (slug) do nothing;
insert into public.products (category_id,code,name,slug,silhouette,material,sizes,price_rent,price_sale,price_note,short_desc,description,is_featured,is_new,sort_order) values ((select id from public.categories where slug='ao-dai-cuoi'),'DL-021','Ngọc Lan','ngoc-lan','Áo dài truyền thống','Gấm thêu tay','May đo',3500000,12000000,'Giá thuê 1 ngày, kèm khăn đóng','Gấm trắng ngà thêu hoa ngọc lan.','Áo dài Ngọc Lan may từ gấm trắng ngà, thêu tay hoa ngọc lan dọc thân, kèm khăn đóng cùng tông — dành cho lễ gia tiên.',false,false,7) on conflict (slug) do nothing;
insert into public.products (category_id,code,name,slug,silhouette,material,sizes,price_rent,price_sale,price_note,short_desc,description,is_featured,is_new,sort_order) values ((select id from public.categories where slug='vest-chu-re'),'DL-031','Laurent','laurent','Slim fit','Len pha Ý','S – XXL',2000000,8500000,'Giá thuê trọn gói 3 ngày','Vest đen ve sa-tanh, kèm nơ.','Laurent là bộ vest đen kinh điển, ve áo sa-tanh bóng nhẹ, may slim fit. Kèm sơ mi trắng và nơ cổ.',false,false,8) on conflict (slug) do nothing;
insert into public.services (kind,name,price_from,price_note,description,features,sort_order) values ('makeup','Makeup cô dâu ngày cưới',2500000,'Trọn buổi sáng hoặc chiều','Trang điểm và làm tóc theo phong cách trong trẻo, bền màu suốt buổi lễ.',array['Trang điểm + làm tóc','Mi giả & phụ kiện tóc','Dặm lại 1 lần']::text[],1);
insert into public.services (kind,name,price_from,price_note,description,features,sort_order) values ('makeup','Makeup theo trọn ngày',4500000,'Đi theo từ sáng đến tiệc tối','Chuyên viên đi cùng cô dâu suốt ngày cưới, đổi layout tóc cho từng phần lễ.',array['2 layout tóc','Dặm không giới hạn','Makeup mẹ cô dâu -30%']::text[],2);
insert into public.services (kind,name,price_from,price_note,description,features,sort_order) values ('venue','Rạp cưới tối giản',15000000,'Rạp 6 – 8 bàn','Rạp tông trắng – be, khung sắt sơn tĩnh điện, hoa tươi theo mùa.',array['Cổng hoa tươi','Bàn gia tiên','Lắp đặt & tháo dỡ']::text[],3);
insert into public.services (kind,name,price_from,price_note,description,features,sort_order) values ('venue','Rạp cưới cao cấp',35000000,'Rạp 15 – 20 bàn','Không gian tiệc trọn gói: rạp, bàn ghế, khăn trải, ánh sáng và hoa trang trí.',array['Thiết kế 3D trước khi dựng','Đèn & âm thanh','Hoa tươi toàn rạp']::text[],4);
insert into public.offers (title,highlight,description,terms,end_date,sort_order) values ('Combo trọn gói','-20%','Thuê váy cưới + makeup ngày cưới + rạp tối giản trong cùng một gói.','Áp dụng cho lịch cưới đến hết 06/2027.','2027-06-30',1);
insert into public.offers (title,highlight,description,terms,end_date,sort_order) values ('Tặng váy đi bàn','Miễn phí','Thuê váy cưới từ 9.500.000đ được tặng 1 váy đi bàn bất kỳ.','Không cộng dồn với ưu đãi khác.',null,2);
insert into public.offers (title,highlight,description,terms,end_date,sort_order) values ('Đặt sớm 3 tháng','-10%','Đặt lịch thử váy và cọc trước ngày cưới từ 3 tháng.','Áp dụng cho tất cả váy cưới.',null,3);

-- Bộ sưu tập mẫu & lựa chọn lọc cho váy mẫu
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
