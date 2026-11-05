// services/api.js

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === "production") {
    console.warn("NEXT_PUBLIC_API_URL تنظیم نشده؛ درخواست‌ها به localhost:5000 می‌روند");
}

// خطا را به‌جای قورت دادن، throw می‌کند تا صفحه‌ها (login/register/...) پیام واقعی را در catch نشان دهند.
// قبلاً null برمی‌گشت و صفحه‌ها با "Cannot read properties of null (reading 'token')" می‌شکستند.
async function fetchApi(endpoint, options = {}) {
    const method = (options.method || "GET").toUpperCase();

    let response;
    try {
        response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            // کش فقط برای درخواست‌های خواندنی؛ POST هرگز کش نمی‌شود
            ...(method === "GET" ? { next: { revalidate: 60 } } : { cache: "no-store" }),
        });
    } catch (error) {
        console.error(`خطا در اتصال به سرور (${endpoint}):`, error);
        throw new Error("ارتباط با سرور برقرار نشد. اینترنت یا آدرس سرور را بررسی کنید");
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const err = new Error((data && data.message) || "خطایی رخ داده است");
        err.status = response.status;
        throw err;
    }

    return data;
}

// درخواست‌های احراز هویت‌شده (داشبورد). خطای شبکه و خطای سرور هر دو با پیام واقعی و err.status
// throw می‌شوند؛ داشبورد با err.status === 401 کاربر را به صفحه‌ی ورود می‌فرستد.
async function authRequest(path, { token, method = "GET", body, fallback }) {
    let res;
    try {
        res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: { Authorization: `Bearer ${token}` },
            body,
            cache: "no-store",
        });
    } catch (error) {
        throw new Error("ارتباط با سرور برقرار نشد. اینترنت یا آدرس سرور را بررسی کنید");
    }

    const text = await res.text();
    let data = null;
    try {
        data = JSON.parse(text);
    } catch (e) {
        /* پاسخ JSON نبود */
    }

    if (!res.ok) {
        const err = new Error((data && data.message) || fallback);
        err.status = res.status;
        throw err;
    }
    if (data === null) throw new Error("پاسخ نامعتبر از سرور");
    return data;
}

// برای خواندن‌های عمومی (صفحه‌ی اصلی، sitemap، متادیتا) رفتار قبلی حفظ می‌شود:
// اگر سرور خاموش بود null برمی‌گردد و صفحه کرش نمی‌کند.
async function fetchApiSafe(endpoint, options) {
    try {
        return await fetchApi(endpoint, options);
    } catch (error) {
        return null;
    }
}


export const registerUser = async (userData) => {
    return await fetchApi("/users/register", {
        method: "POST",
        body: JSON.stringify(userData),
    });
};

export const loginUser = async (credentials) => {
    return await fetchApi("/users/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
};


export const forgotPassword = async (email) => {
    return await fetchApi("/users/forget-password", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
};

export const resetPassword = async (token, newPassword) => {
    return await fetchApi(`/users/reset-password/${token}`, {
        method: "POST",
        body: JSON.stringify({ password: newPassword, confirmPassword: newPassword }),
    });
};



// Fetch all public posts
export const getAllPosts = async () => {
    return await fetchApiSafe("/");
};

// token اختیاری است: برای دیدن/ویرایش پست «خصوصی» خود کاربر لازم است
export const getSinglePost = async (slug, token) => {
    return await fetchApiSafe(`/post/${slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        ...(token ? { cache: "no-store" } : {}),
    });
};

// Send a contact form message
export const sendContactMessage = async (data) => {
    return await fetchApi("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};

// Fetch dashboard posts (requires auth token)
export const getDashboardPosts = async (token) =>
    authRequest("/dashboard", { token, fallback: "خطا در دریافت مقالات داشبورد" });

// Fetch captcha
export const getCaptcha = async () => {
    const res = await fetch(`${BASE_URL}/captcha.svg`);
    const data = await res.text();
    return data;
};

// Dashboard
export const createPost = async (token, formData) =>
    authRequest("/dashboard/add-post", {
        token,
        method: "POST",
        body: formData,
        fallback: "خطا در ساخت پست",
    });

export const deletePost = async (token, slug) =>
    authRequest(`/dashboard/delete-post/${slug}`, {
        token,
        method: "DELETE",
        fallback: "خطا در حذف پست",
    });

export const editPost = async (token, slug, formData) =>
    authRequest(`/dashboard/edit-post/${slug}`, {
        token,
        method: "PUT",
        body: formData,
        fallback: "خطا در ویرایش پست",
    });

// آپلود عکس برای ادیتور؛ بک‌اند آدرس کامل (Vercel Blob) را در فیلد image برمی‌گرداند
export const uploadImage = async (token, file) => {
    const formData = new FormData();
    formData.append("image", file);

    const data = await authRequest("/dashboard/image-upload", {
        token,
        method: "POST",
        body: formData,
        fallback: "آپلود تصویر شکست خورد",
    });

    const imagePath = data.image || data.imageUrl || data.url;
    if (!imagePath) throw new Error("آدرس تصویر از سرور دریافت نشد");
    return imagePath;
};
