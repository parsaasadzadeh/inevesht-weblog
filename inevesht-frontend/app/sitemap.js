import { getAllPosts } from "./services/api";

// این خط خیلی مهمه: باعث می‌شه سایت‌مپ هر ۶۰ ثانیه رفرش بشه (ISR)
// بدون این، سایت‌مپ فقط یک‌بار موقع build ساخته می‌شه و پست جدید توش نمیاد
export const revalidate = 60;

export default async function sitemap() {
  const baseUrl = "https://inevesht.ir"; // دامنه واقعی سایت (بدون اسلش آخر)

  // صفحات ثابت
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    // اینجا صفحات ثابت دیگه رو هم اضافه کنید (درباره ما، تماس با ما و ...)
  ];

  // گرفتن پست‌ها از بک‌اند
  let postRoutes = [];
  try {
    const data = await getAllPosts();
    const posts = data?.posts || [];

    postRoutes = posts
      .filter((post) => post?.slug) // فقط پست‌هایی که slug دارن
      .map((post) => ({
        // توجه: چون فایل صفحه‌ی پست توی app/post/[slug]/page.js هست،
        // آدرس واقعی هر پست باید /post/اسم-پست باشه، نه فقط /اسم-پست
        url: `${baseUrl}/post/${post.slug}`,
        lastModified: post.updatedAt || post.createdAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
  } catch (err) {
    console.error("sitemap: fetching posts failed", err);
  }

  return [...staticRoutes, ...postRoutes];
}
