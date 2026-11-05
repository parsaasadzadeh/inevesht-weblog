const crypto = require("crypto");
const Yup = require("yup");
const Blog = require("../models/Blog");
const { sendEmail, escapeHtml, isMailConfigured } = require("../utils/mailer");

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// ── کپچا ────────────────────────────────────────────────────────────────
// پاسخ کپچا داخل یک توکن امضاشده (HMAC) به کلاینت برمی‌گردد و هیچ state ای روی سرور
// نگه داشته نمی‌شود؛ پس با چند instance / serverless هم درست کار می‌کند.
// (قبلاً یک متغیر سراسری بود که بین همه‌ی کاربران مشترک بود.)
const CAPTCHA_TTL_MS = 10 * 60 * 1000;
const captchaSecret = () => process.env.JWT_SECRET || "dev-captcha-secret";

const signCaptcha = (answer, expires) =>
    crypto
        .createHmac("sha256", captchaSecret())
        .update(`${answer}.${expires}`)
        .digest("hex");

const makeCaptchaToken = (answer) => {
    const expires = Date.now() + CAPTCHA_TTL_MS;
    return `${expires}.${signCaptcha(answer, expires)}`;
};

const verifyCaptchaToken = (token, answer) => {
    const [expires, sig] = String(token || "").split(".");
    if (!expires || !sig || Number(expires) < Date.now()) return false;
    const expected = signCaptcha(String(answer).trim(), expires);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// سازگاری با فرانت‌اندی که هنوز توکن کپچا را نمی‌فرستد
let LEGACY_CAPTCHA_NUM;

exports.getIndex = async (req, res, next) => {
    try {
        const filter = { status: "public" };
        const query = Blog.find(filter).sort({ createdAt: -1 }).lean();

        // صفحه‌بندی اختیاری: بدون page/limit رفتار قبلی (همه‌ی پست‌ها) حفظ می‌شود
        const page = parseInt(req.query.page, 10);
        const limit = Math.min(parseInt(req.query.limit, 10) || 0, 100);
        if (page > 0 && limit > 0) query.skip((page - 1) * limit).limit(limit);

        const [posts, total] = await Promise.all([
            query,
            Blog.countDocuments(filter),
        ]);

        res.status(200).json({ posts, total });
    } catch (err) {
        next(err);
    }
};

exports.getSinglePost = async (req, res, next) => {
    try {
        // فقط نام نویسنده برگردانده می‌شود؛ قبلاً کل سند کاربر (شامل هش رمز و ایمیل) لو می‌رفت
        const post = await Blog.findOne({ slug: req.params.slug })
            .populate("user", "fullname")
            .lean();

        // پست خصوصی فقط برای صاحبش قابل مشاهده است
        const ownerId = post && post.user && String(post.user._id);
        if (!post || (post.status === "private" && ownerId !== req.userId)) {
            throw httpError("پستی با این آدرس یافت نشد", 404);
        }

        res.status(200).json({ post });
    } catch (err) {
        next(err);
    }
};

exports.handleContactPage = async (req, res, next) => {
    const schema = Yup.object().shape({
        fullname: Yup.string().trim().required("نام و نام خانوادگی الزامی می باشد"),
        email: Yup.string()
            .trim()
            .email("آدرس ایمیل صحیح نیست")
            .required("آدرس ایمیل الزامی می باشد"),
        message: Yup.string().trim().required("پیام اصلی الزامی می باشد"),
        captcha: Yup.string().required("کد امنیتی الزامی می باشد"),
    });

    try {
        const body = req.body || {};
        await schema.validate(body, { abortEarly: false });
        const { fullname, email, message, captcha } = body;

        const token = body.captchaToken || req.get("x-captcha-token");
        const captchaOk = token
            ? verifyCaptchaToken(token, captcha)
            : LEGACY_CAPTCHA_NUM !== undefined && parseInt(captcha, 10) === LEGACY_CAPTCHA_NUM;

        if (!captchaOk) throw httpError("کد امنیتی صحیح نیست", 422);

        if (isMailConfigured()) {
            try {
                await sendEmail(
                    process.env.CONTACT_EMAIL_TO || process.env.SMTP_USER,
                    fullname,
                    "پیام از طرف وبلاگ",
                    `${escapeHtml(message)} <br/> ایمیل کاربر : ${escapeHtml(email)}`,
                    { replyTo: email }
                );
            } catch (emailError) {
                console.log("Email Sending Error:", emailError.message);
                throw httpError(
                    "مشکلی در سرور ایمیل رخ داده است، لطفاً بعداً تلاش کنید.",
                    500
                );
            }
        } else {
            console.warn("SMTP تنظیم نشده؛ پیام تماس فقط لاگ شد:", { fullname, email });
        }

        res.status(200).json({ message: "پیام شما با موفقیت ارسال شد" });
    } catch (err) {
        next(err);
    }
};

// ── تابع کپچا با SVG خالص ───────────────────────────────────────────────
exports.getCaptcha = (req, res) => {
    const captchaNum = rand(1000, 9999);
    LEGACY_CAPTCHA_NUM = captchaNum;
    const digits = String(captchaNum).split("");

    const W = 120, H = 40;

    const noiseLines = Array.from({ length: 5 }, () => {
        const x1 = Math.random() * W;
        const y1 = Math.random() * H;
        const x2 = Math.random() * W;
        const y2 = Math.random() * H;
        const color = `rgb(${rand(100, 200)},${rand(100, 200)},${rand(100, 200)})`;
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="1.2"/>`;
    }).join("");

    const noiseDots = Array.from({ length: 30 }, () => {
        const cx = (Math.random() * W).toFixed(1);
        const cy = (Math.random() * H).toFixed(1);
        const color = `rgb(${rand(80, 180)},${rand(80, 180)},${rand(80, 180)})`;
        return `<circle cx="${cx}" cy="${cy}" r="1" fill="${color}"/>`;
    }).join("");

    const digitsSvg = digits.map((d, i) => {
        const x = 14 + i * 25 + rand(-3, 3);
        const y = 28 + rand(-4, 4);
        const rotate = rand(-18, 18);
        const color = `rgb(${rand(20, 80)},${rand(20, 80)},${rand(20, 80)})`;
        const size = rand(20, 26);
        return `<text x="${x}" y="${y}" font-size="${size}" font-family="monospace" font-weight="bold" fill="${color}" transform="rotate(${rotate},${x},${y})">${d}</text>`;
    }).join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#f0f0f0" rx="6"/>
  ${noiseLines}
  ${noiseDots}
  ${digitsSvg}
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    // فرانت می‌تواند این هدر را بخواند و همراه فرم تماس به‌صورت captchaToken بفرستد
    res.setHeader("X-Captcha-Token", makeCaptchaToken(captchaNum));
    res.send(svg);
};

function rand(min, max) {
    return crypto.randomInt(min, max + 1);
}
