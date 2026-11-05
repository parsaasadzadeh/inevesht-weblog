import Link from "next/link";
import { getSinglePost, getAllPosts } from "../../services/api";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  try {
    const data = await getAllPosts();
    const posts = data?.posts || [];
    return posts
      .filter((post) => post?.slug)
      .map((post) => ({
        slug: post.slug,
      }));
  } catch (err) {
    console.error("generateStaticParams failed:", err);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const data = await getSinglePost(slug);
    const post = data?.post;
    if (!post) {
      return { title: "مقاله یافت نشد" };
    }
    const plainText = (post.body || "").replace(/<[^>]+>/g, "").substring(0, 160);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    return {
      title: `${post.title} | وبلاگ من`,
      description: plainText,
      openGraph: {
        title: post.title,
        images: post.thumbnail ? [`${post.thumbnail}`] : [],
      },
    };
  } catch (err) {
    console.error("generateMetadata failed for slug:", slug, err);
    return { title: "مقاله یافت نشد" };
  }
}

export const revalidate = 60;

export default async function SinglePost({ params }) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }
  let post = null;
  try {
    const data = await getSinglePost(slug);
    post = data?.post || null;
  } catch (err) {
    console.error("SinglePost fetch failed for slug:", slug, err);
    notFound();
  }
  if (!post) {
    notFound();
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: post.thumbnail ? `${baseUrl}/uploads/thumbnails/${post.thumbnail}` : undefined,
    datePublished: post.createdAt,
    author: { "@type": "Person", name: post.user?.fullname || "مدیر سایت" },
  };
  let formattedDate = "";
  try {
    formattedDate = post.createdAt
      ? new Date(post.createdAt).toLocaleDateString("fa-IR")
      : "";
  } catch {
    formattedDate = "";
  }
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="sp-page" dir="rtl">
        <div className="sp-body">
          <aside className="sp-sidebar">
            <div className="sp-sidebar-card">
              <h2 className="sp-sidebar-title">عضویت در خبرنامه</h2>
              <input className="sp-input" type="text" placeholder="نام" aria-label="نام" />
              <input className="sp-input" type="email" placeholder="ایمیل" aria-label="ایمیل" />
              <button className="sp-subscribe-btn">ثبت</button>
            </div>
          </aside>
          <main className="sp-main">
            {post.thumbnail && (
              <figure className="sp-hero-figure">
                <img
                  src={post.thumbnail}
                  alt={post.title || ""}
                  className="sp-hero-img"
                />
              </figure>
            )}
            <article className="sp-article">
              <h1 className="sp-article-title">{post.title}</h1>
              <div className="sp-article-meta">
                <span>توسط {post.user?.fullname || "مدیر سایت"}</span>
                {formattedDate && <span>{formattedDate}</span>}
              </div>
              <div
                className="sp-content"
                dangerouslySetInnerHTML={{ __html: post.body || "" }}
              />
            </article>
            <Link href="/" className="sp-back-link">
              → بازگشت به لیست مقالات
            </Link>
          </main>
        </div>
      </div>
    </>
  );
}
