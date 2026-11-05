export default function robots() {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://inevesht.ir";
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}


