# Inevesht Weblog — Frontend

رابط کاربری وبلاگ فارسی **Inevesht**؛ ساخته‌شده با Next.js (App Router). فرانت‌اند با [بک‌اند Inevesht](#) ارتباط دارد و صفحات عمومی، احراز هویت و پنل مدیریت مقالات را ارائه می‌دهد.

## امکانات

- **صفحات عمومی**: لیست مقاله‌ها با جستجو و فیلتر عنوان، صفحه‌ی تک‌مقاله، تماس با ما با کپچا، قوانین و مقررات
- **احراز هویت**: ورود (با «مرا به خاطر بسپار»)، ثبت‌نام، فراموشی و بازنشانی رمز عبور
- **پنل کاربری**: مشاهده‌ی مقاله‌های خود، ساخت، ویرایش و حذف مقاله، انتخاب وضعیت عمومی یا خصوصی
- **ویرایشگر متن غنی (Quill)** با آپلود تصویر داخل متن مقاله
- **سئو**: متادیتای پویا برای هر مقاله، داده‌ی ساخت‌یافته‌ی JSON-LD (BlogPosting)، `sitemap.xml` و `robots.txt` خودکار
- **عملکرد**: تولید استاتیک صفحات مقاله و بازتولید دوره‌ای (ISR)
- **رابط راست‌به‌چپ فارسی** و طراحی واکنش‌گرا (responsive)
- **مدیریت خطا**: نمایش پیام‌های واقعی سرور به کاربر، خروج خودکار هنگام منقضی شدن نشست

## تکنولوژی‌ها

Next.js (App Router، Turbopack) · React · Quill · CSS

## اجرا

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # ساخت نسخه‌ی production
```

فایل `.env` را بسازید:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

> بعد از تغییر متغیرهای `NEXT_PUBLIC_*` باید سرور توسعه را دوباره اجرا (و روی هاست دوباره build) کنید.

## ساختار پروژه

```
app/
  (auth)/        ورود، ثبت‌نام، فراموشی و ریست رمز
  dashboard/     پنل مدیریت و ساخت/ویرایش مقاله
  post/[slug]/   صفحه‌ی مقاله (SEO + JSON-LD)
  contact/       فرم تماس
  components/    Navbar، Footer، جستجو، اعلان‌ها
  services/api.js  لایه‌ی ارتباط با بک‌اند
```

## لایسنس

MIT


# Inevesht Weblog — Backend

REST API وبلاگ فارسی **Inevesht**؛ ساخته‌شده با Node.js، Express و MongoDB. این سرویس احراز هویت کاربران، مدیریت مقالات، آپلود تصویر و فرم تماس را برای فرانت‌اند (Next.js) فراهم می‌کند.

## امکانات

- **احراز هویت با JWT**: ثبت‌نام، ورود (با گزینه‌ی «مرا به خاطر بسپار»)، فراموشی و ریست رمز عبور با لینک یک‌بارمصرف و دارای انقضا
- **مدیریت مقاله‌ها**: ساخت، ویرایش، حذف و لیست؛ مقاله‌ی عمومی یا خصوصی، اسلاگ یکتای فارسی‌پشتیبان، صفحه‌بندی اختیاری
- **کنترل دسترسی**: فقط صاحب مقاله می‌تواند آن را ویرایش یا حذف کند؛ مقاله‌ی خصوصی فقط برای صاحبش قابل مشاهده است
- **آپلود تصویر**: بهینه‌سازی با `sharp` (تغییر اندازه، فشرده‌سازی، اصلاح جهت EXIF) و ذخیره روی Vercel Blob
- **فرم تماس** با کپچای SVG و ارسال ایمیل از طریق SMTP
- **امنیت**: هش رمز با bcrypt، اعتبارسنجی ورودی با Yup، محدودیت تعداد تلاش (rate limit) روی مسیرهای احراز هویت، محافظت در برابر NoSQL injection، پیام خطای یکسان برای ورود نادرست، تنظیم CORS با لیست دامنه‌های مجاز
- **آماده‌ی serverless**: اتصال کش‌شده به MongoDB و export شدن `app` برای استقرار روی Vercel

## تکنولوژی‌ها

Node.js · Express 5 · MongoDB / Mongoose · JWT · bcryptjs · Yup · sharp · Vercel Blob · Nodemailer · express-rate-limit

## ساختار پروژه

```
app.js            نقطه‌ی ورود و تنظیمات سرور
config/           اتصال به دیتابیس
controllers/      منطق کاربر، مقاله و داشبورد
middlewares/      احراز هویت، هندل خطا
models/           مدل‌های Mongoose و اعتبارسنجی Yup
routes/           تعریف مسیرها
utils/            آپلود تصویر، ارسال ایمیل
tests/            تست‌های خودکار
```

## اجرا

```bash
npm install
cp .env.example .env     # مقادیر را پر کنید
npm run dev              # حالت توسعه
npm start                # حالت production
npm test                 # اجرای تست‌ها
```

متغیرهای محیطی لازم (`MONGODB_URI`، `JWT_SECRET`، `BLOB_READ_WRITE_TOKEN` و ...) در فایل `.env.example` توضیح داده شده‌اند.

## مسیرهای اصلی API

| متد | مسیر | توضیح |
|---|---|---|
| POST | `/users/register` | ثبت‌نام |
| POST | `/users/login` | ورود و دریافت توکن |
| POST | `/users/forget-password` | درخواست لینک ریست رمز |
| POST | `/users/reset-password/:token` | تعیین رمز جدید |
| GET | `/` | لیست مقاله‌های عمومی |
| GET | `/post/:slug` | نمایش یک مقاله |
| GET | `/captcha.svg` | تصویر کپچا |
| POST | `/contact` | ارسال پیام تماس |
| GET | `/dashboard` | مقاله‌های کاربر (نیازمند توکن) |
| POST | `/dashboard/add-post` | ساخت مقاله |
| PUT | `/dashboard/edit-post/:slug` | ویرایش مقاله |
| DELETE | `/dashboard/delete-post/:slug` | حذف مقاله |
| POST | `/dashboard/image-upload` | آپلود تصویر برای ادیتور |
| GET | `/health` | بررسی سلامت سرویس |

## لایسنس

MIT
