const crypto = require("crypto");
const { put, del } = require("@vercel/blob");
const sharp = require("sharp");

// عکس‌های بزرگ‌تر از این ابعاد کوچک می‌شوند (حجم کمتر = بارگذاری سریع‌تر)
const MAX_DIMENSION = 1600;

// نام فایل کاربر می‌تواند فاصله، فارسی یا کاراکتر خطرناک داشته باشد
const safeName = (name = "image") =>
    String(name)
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 40) || "image";

/**
 * آپلود عکس روی Vercel Blob بعد از بهینه‌سازی با sharp
 * نیازمند متغیر محیطی BLOB_READ_WRITE_TOKEN
 */
exports.uploadImage = async (file, folder = "uploads") => {
    if (!file || !file.data) {
        const error = new Error("فایلی برای آپلود ارسال نشده است");
        error.statusCode = 422;
        throw error;
    }

    let optimizedBuffer;
    try {
        optimizedBuffer = await sharp(file.data)
            .rotate() // اعمال جهت EXIF (عکس‌های موبایل)
            .resize({
                width: MAX_DIMENSION,
                height: MAX_DIMENSION,
                fit: "inside",
                withoutEnlargement: true,
            })
            .flatten({ background: "#ffffff" }) // PNG شفاف روی زمینه‌ی سفید (نه سیاه)
            .jpeg({ quality: 70, mozjpeg: true })
            .toBuffer();
    } catch (e) {
        const error = new Error("فایل ارسالی یک عکس معتبر نیست");
        error.statusCode = 422;
        throw error;
    }

    const fileName = `${folder}/${crypto.randomBytes(6).toString("hex")}_${safeName(file.name)}.jpg`;

    return put(fileName, optimizedBuffer, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false,
    });
};

/**
 * حذف فایل از Vercel Blob؛ خطا عمداً throw نمی‌شود تا حذف پست به خاطر
 * یک مشکل جانبی متوقف نشود.
 */
exports.deleteImage = async (url) => {
    if (!url) return;
    try {
        await del(url);
    } catch (err) {
        console.log("خطا در حذف فایل از Vercel Blob:", err.message);
    }
};
