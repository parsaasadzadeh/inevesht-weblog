
import Link from "next/link";
import { getAllPosts } from "./services/api";
import SearchBox from "./components/searchBox";
import { Suspense } from "react";

const siteUrl = "https://inevesht.ir";
const siteName = "inevesht";

export const metadata = {
  
  title: {
    default: `${siteName} | مرجع آموزش، تحلیل و ایده‌های کاربردی`,
    template: `%s | ${siteName}`, 
  },

  description:
    "وبلاگ inevesht، منبعی برای یادگیری و الهام‌گرفتن: از آموزش‌های عملی و تحلیل‌های تخصصی تا یادداشت‌های سبک زندگی. هر هفته مطالب تازه برای کسانی که دوست دارن بهتر یاد بگیرن و بهتر زندگی کنن.",

  keywords: [
    "inevesht",
    "وبلاگ آموزشی",
    "مقالات تحلیلی",
    "آموزش آنلاین",
    "محتوای کاربردی",
    "ایده و الهام",
  ],

  authors: [{ name: "inevesht" }],
  creator: "inevesht",
  publisher: "inevesht",

  metadataBase: new URL(siteUrl),

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: siteUrl,
    siteName: siteName,
    title: `${siteName} | مرجع آموزش، تحلیل و ایده‌های کاربردی`,
    description:
      "جدیدترین مطالب آموزشی، تحلیلی و کاربردی وبلاگ inevesht را اینجا بخوانید.",
    images: [
      {
        url: "/og-image.jpg", 
        width: 1200,
        height: 630,
        alt: "inevesht",
      },
    ],
  },

  
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | مرجع آموزش، تحلیل و ایده‌های کاربردی`,
    description:
      "جدیدترین مطالب آموزشی، تحلیلی و کاربردی وبلاگ inevesht را اینجا بخوانید.",
    images: ["/og-image.jpg"],   
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },

  
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};



export const revalidate = 60;

export default async function HomePage({ searchParams }) {
  
  const params = await searchParams;
  const filter = params?.filter || "";

  // گرفتن همه پست‌ها از API
  const data = await getAllPosts();
  const posts = data?.posts || [];

  // اگه data نال باشه یعنی سرور خاموشه یا خطا داده
  const isOffline = !data;

  // فیلتر کردن پست‌ها بر اساس متن جستجو (بدون حساسیت به حروف بزرگ/کوچک)
  const filteredPosts = posts.filter((post) =>
    post.title?.toLowerCase().includes(filter.toLowerCase())
  );

  // حذف تگ‌های HTML از متن پست و کوتاه کردنش برای نمایش خلاصه
  // نکته مهم: علاوه بر حذف تگ‌ها، باید موجودیت‌های HTML مثل &nbsp; هم دیکود شوند
  // وگرنه به جای فاصله، خودِ متن &nbsp; توی باکس‌ها نمایش داده می‌شه (همون مشکلی که داشتی)
  function stripHtml(html) {
    if (!html) return "";

    const decoded = html
      .replace(/<[^>]+>/g, "")   // حذف تگ‌های HTML
      .replace(/&nbsp;/g, " ")   // فاصله غیرشکسته -> فاصله معمولی
      .replace(/&amp;/g, "&")    // علامت &
      .replace(/&lt;/g, "<")     // علامت کوچک‌تر
      .replace(/&gt;/g, ">")     // علامت بزرگ‌تر
      .replace(/&quot;/g, '"')   // گیومه
      .replace(/&#39;/g, "'")    // آپاستروف
      .replace(/\s+/g, " ")      // چند فاصله پشت‌سرهم -> یک فاصله
      .trim();

    return decoded.substring(0, 110);
  }

  return (
    <div className="hp-page" dir="rtl">
      {/* بخش هرو - عنوان و باکس جستجو */}
      <div className="hp-hero">
        <h1 className="hp-hero-title">آخرین مقالات وبلاگ</h1>
        <p className="hp-hero-sub">جدیدترین مطالب آموزشی و تحلیلی را اینجا بخوانید</p>

        {/* SearchBox توی Suspense پیچیده شده چون از useSearchParams استفاده می‌کنه */}
        <Suspense fallback={null}>
          <SearchBox />
        </Suspense>
      </div>

      <div className="hp-container">
        {isOffline ? (
          // سرور در دسترس نیست
          <div className="hp-empty">
            <p>⏳ سرور در حال بروزرسانی است، به زودی برمی‌گردیم</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          // نمایش کارت‌های مقاله
          <div className="hp-grid">
            {filteredPosts.map((post) => (
              <article key={post._id} className="hp-card">
                {/* تامبنیل پست */}
                <div className="hp-card-img-wrap">
                  <img
                    src={`${post.thumbnail}`}
                    alt={post.title}
                    className="hp-card-img"
                    loading="lazy" // لیزی لود برای عملکرد بهتر
                  />
                </div>

                <div className="hp-card-body">
                  <h2 className="hp-card-title">{post.title}</h2>

                  {/* خلاصه پست با تگ‌ها و موجودیت‌های HTML پاک‌سازی شده */}
                  <p className="hp-card-excerpt">{stripHtml(post.body)}...</p>

                  <div className="hp-card-footer">
                    {/* تاریخ انتشار به صورت شمسی */}
                    <span className="hp-card-meta">
                      {new Date(post.createdAt).toLocaleDateString("fa-IR")}
                    </span>

                    <Link href={`/post/${post.slug}`} className="hp-read-more">
                      ادامه مطلب ←
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          // هیچ نتیجه‌ای برای این فیلتر پیدا نشد
          <div className="hp-empty">
            <p>هیچ نتیجه‌ای برای &ldquo;{filter}&rdquo; یافت نشد</p>
          </div>
        )}
      </div>
    </div>
  );
}
