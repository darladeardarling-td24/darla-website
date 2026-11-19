# Darla · Dear Darling — Website váy cưới

Website giới thiệu bộ sưu tập váy cưới, ưu đãi, makeup và rạp cưới, kèm trang quản trị để thêm, sửa sản phẩm.

- **Trang khách**: `/` trang chủ · `/bo-suu-tap` · `/bo-suu-tap/<tên-váy>` · `/uu-dai` · `/dich-vu`
- **Trang quản trị**: `/admin` (đăng nhập tại `/admin/dang-nhap`)
- Mọi nút tư vấn trên web đều mở tin nhắn Instagram của Darla. Ở trang chi tiết, mã váy được sao chép sẵn để khách dán vào tin nhắn.

Công nghệ: Next.js 16 (chạy trên Vercel) và Supabase (cơ sở dữ liệu, đăng nhập, kho ảnh). Cả hai dùng gói **miễn phí**.

---

## 1. Tạo cơ sở dữ liệu trên Supabase

1. Vào <https://supabase.com>, đăng nhập bằng GitHub, bấm **New project**.
   - Region: chọn **Southeast Asia (Singapore)** để web tải nhanh ở Việt Nam.
   - Đặt mật khẩu database và lưu lại.
2. Khi project đã tạo xong, vào **SQL Editor → New query**, mở file `supabase/schema.sql`, chép toàn bộ nội dung vào rồi bấm **Run**.
3. (Không bắt buộc) Tạo thêm một query mới, dán nội dung `supabase/seed.sql` rồi **Run** để có sẵn 8 mẫu váy, 4 dịch vụ và 3 ưu đãi mẫu. Bạn sửa hoặc xoá chúng trong trang quản trị sau.
4. **Tắt đăng ký tự do**: vào **Authentication → Sign In / Providers**, tắt **Allow new users to sign up**. Từ giờ chỉ quản trị viên mới tạo được tài khoản.
5. **Tạo tài khoản quản trị của bạn**: vào **Authentication → Users → Add user → Create new user**, nhập email, mật khẩu và tích **Auto Confirm User**.
   > Tài khoản **đầu tiên** được tạo sẽ tự động có quyền **quản trị viên**. Nhân sự tạo sau trong trang `/admin/nhan-su` sẽ là **nhân sự nội dung**.
6. Vào **Project Settings → API Keys** và chép 3 giá trị sau:
   - **Project URL** (dạng `https://xxxx.supabase.co`, xem ở **Project Settings → Data API**)
   - **Publishable key** (hoặc `anon` key ở tab *Legacy API Keys*)
   - **Secret key** (hoặc `service_role` key). Đây là khoá bí mật: không gửi cho ai, không dán vào code.

## 2. Đưa code lên GitHub

Cách dễ nhất là dùng **GitHub Desktop**:

1. Tạo repository mới trên <https://github.com/new>, ví dụ `darla-website`, để chế độ **Private**.
2. Mở GitHub Desktop → **File → Add local repository** → chọn thư mục `WEBDarla`. Khi được hỏi, bấm **create a repository**.
3. Bấm **Publish repository** và chọn tài khoản của bạn.

Hoặc dùng Terminal trong thư mục `WEBDarla`:

```bash
git init
git add .
git commit -m "Website Darla Dear Darling"
git branch -M main
git remote add origin https://github.com/<tài-khoản>/darla-website.git
git push -u origin main
```

> File `.env.local` (nếu có) đã nằm trong `.gitignore`, nên khoá bí mật không bị đẩy lên GitHub.

## 3. Đưa web lên mạng bằng Vercel

1. Vào <https://vercel.com>, đăng nhập bằng GitHub, bấm **Add New → Project** và chọn repo `darla-website`.
2. Mở mục **Environment Variables** và thêm 3 biến:

   | Tên | Giá trị |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (hoặc anon key) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Secret key (hoặc service_role key) |

3. Bấm **Deploy**. Sau khoảng 1–2 phút, web có địa chỉ dạng `darla-website.vercel.app`.
4. Mở `…vercel.app/admin`, đăng nhập bằng tài khoản ở bước 1.5, vào **Thông tin website** để nhập Instagram, số điện thoại, địa chỉ showroom và ảnh trang chủ.

Từ giờ, mỗi lần đẩy code mới lên GitHub, Vercel sẽ tự cập nhật web.

**Tên miền riêng** (nếu có): Vercel → Project → **Settings → Domains** → thêm tên miền, rồi làm theo hướng dẫn trỏ DNS.

## Cập nhật cho project đã chạy

Khi có bản cập nhật kèm file `supabase/update-…sql`, chạy file đó **một lần** trong Supabase → SQL Editor trước khi đẩy code mới lên GitHub.

| File | Nội dung |
| --- | --- |
| `update-01-anh-trang-chu.sql` | Thêm mục **Ảnh trang chủ** trong admin. Nếu nội dung mẫu còn nguyên thì bỏ bớt chữ "Darla Dear Darling" lặp lại. |
| `update-02-bo-suu-tap-bo-loc.sql` | Thêm **Bộ sưu tập** (nhóm váy trong từng danh mục) và **Bộ lọc** (dáng váy, chất liệu, kiểu cổ, tay áo, đuôi váy, màu sắc, phong cách, dịp cưới). Tự chuyển dáng váy/chất liệu đã nhập sang bộ lọc. |

## 4. Chạy thử trên máy tính (không bắt buộc)

Cần cài [Node.js 20+](https://nodejs.org).

```bash
npm install
cp .env.example .env.local   # rồi điền 3 giá trị Supabase vào .env.local
npm run dev                  # mở http://localhost:3000
```

Khi chưa điền Supabase, web vẫn chạy và hiển thị nội dung mẫu để bạn xem giao diện.

---

## Bộ sưu tập & bộ lọc

- **Bộ sưu tập** (admin → Bộ sưu tập): nhóm nhiều váy cùng phân khúc trong một danh mục, tên tự đặt (ví dụ Lumière, Héritage, Soirée). Bật **Mới ra** để bộ sưu tập hiện ở trang chủ. Gắn váy vào bộ sưu tập trong trang sửa sản phẩm.
- **Bộ lọc** (admin → Bộ lọc): sửa, thêm, xoá lựa chọn trong 8 nhóm. Trong trang sửa sản phẩm, bấm chọn các lựa chọn phù hợp cho từng váy. Nhóm nào chưa có váy nào được gắn thì tự ẩn trên web.
- Khách lọc theo danh mục, bộ sưu tập, giá thuê, mẫu mới và các nhóm trên; sắp xếp theo mới nhất hoặc giá. Bộ lọc nằm trên đường dẫn, ví dụ `…/bo-suu-tap?bst=lumiere` hay `…/bo-suu-tap?danh-muc=vay-cuoi&dang=duoi-ca`, nên có thể gửi thẳng cho khách qua Instagram.

## Phân quyền

| Việc | Quản trị viên | Nhân sự nội dung |
| --- | :---: | :---: |
| Thêm, sửa sản phẩm, bộ sưu tập, bộ lọc, ưu đãi, dịch vụ, danh mục | ✓ | ✓ |
| Tải ảnh lên | ✓ | ✓ |
| Xoá sản phẩm, bộ sưu tập, lựa chọn lọc, ưu đãi, dịch vụ, danh mục | ✓ | |
| Sửa thông tin website (Instagram, địa chỉ, chữ trang chủ) | ✓ | |
| Tạo, xoá tài khoản, đặt lại mật khẩu nhân sự | ✓ | |

Quyền được kiểm tra ngay trong cơ sở dữ liệu (Row Level Security), nên kể cả khi ai đó cố gọi thẳng vào Supabase cũng không vượt quyền được.

## Ảnh

- **Ảnh trang chủ**: trang chủ chỉ dùng một ảnh lớn ở đầu trang; phần còn lại là chữ (mục lục danh mục, tên các mẫu váy) dẫn khách vào bộ sưu tập. Vào admin → **Ảnh trang chủ** để đổi ảnh, bấm vào gương mặt cô dâu để chọn điểm giữ lại khi cắt, và chọn màu chữ trên ảnh (be, đen hoặc trắng). Nhân sự nội dung cũng đổi được mục này.
- Ảnh được **nén ngay trên trình duyệt** trước khi tải lên: bản lớn có cạnh dài 2000px, bản nhỏ 900px cho danh sách, định dạng WebP. Ảnh 8–15MB từ máy ảnh thường còn khoảng 300–600KB và vẫn giữ nét ren, voan.
- Nên dùng ảnh dọc tỉ lệ 3:4. Ảnh đầu tiên của mỗi sản phẩm là ảnh bìa.
- Gói miễn phí của Supabase có 1GB lưu ảnh, đủ cho khoảng 1.000–1.500 mẫu váy (mỗi mẫu 3–4 ảnh).

## Lưu ý về gói miễn phí

- **Supabase** tạm dừng project nếu **7 ngày liền** không có truy cập. Khi web có khách vào đều đặn thì không bị ảnh hưởng. Nếu bị tạm dừng, vào Supabase bấm **Restore project** là chạy lại, dữ liệu vẫn còn nguyên.
- **Vercel** gói Hobby đủ dùng cho website giới thiệu của một cửa hàng.
- Trang khách được lưu đệm tối đa 60 giây để tải nhanh. Khi nhân sự bấm **Lưu** trong admin, trang được làm mới ngay.

## Cấu trúc thư mục

```
app/(site)/           Trang cho khách
app/admin/            Trang quản trị (dang-nhap, san-pham, uu-dai, dich-vu, danh-muc, cai-dat, nhan-su)
app/admin/actions.ts  Thao tác phía máy chủ: làm mới web, quản lý tài khoản nhân sự
components/site/      Giao diện trang khách
components/admin/     Giao diện quản trị (form, tải ảnh)
lib/                  Kết nối Supabase, nén ảnh, định dạng giá, dữ liệu mẫu
supabase/             schema.sql (bảng + phân quyền), seed.sql (dữ liệu mẫu)
public/               Logo DARLA (đen và trắng)
```

## Giao diện

- Màu: be `#EAE3D6` làm nền chính, đen `#000000` theo logo, ngà `#F7F3EC`, be đậm `#D9CEBD` và nâu xám `#766B5F` cho chữ phụ. Đổi màu trong `tailwind.config.js`.
- Chữ: **Playfair Display** cho tiêu đề (cùng họ chữ Didone với logo DARLA) và **Be Vietnam Pro** cho nội dung. Cả hai hiển thị đầy đủ dấu tiếng Việt và được nhúng sẵn trong dự án, không phụ thuộc Google Fonts.
