-- =====================================================================
--  CẬP NHẬT 03 — Ảnh sống (video ngắn 2–3 giây cho váy)
--  Cho phép kho ảnh "media" nhận thêm file video MP4 đã nén.
--  Supabase → SQL Editor → New query → dán file này → Run. Chạy lại không sao.
-- =====================================================================
update storage.buckets
set allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png', 'video/mp4'],
    file_size_limit = 5242880
where id = 'media';
