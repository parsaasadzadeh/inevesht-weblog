const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// env باید قبل از require بقیه‌ی فایل‌ها لود شود
dotenv.config();

const { connectDB, ensureDB } = require("./config/db");
const { errorHandler } = require("./middlewares/errors");

// بدون این متغیرها ورود/ثبت‌نام اصلاً کار نمی‌کند؛ بهتر است همان ابتدا واضح خطا بدهیم
const missing = ["MONGODB_URI", "JWT_SECRET"].filter((k) => !process.env[k]);
if (missing.length) {
    console.error(`متغیرهای محیطی تنظیم نشده‌اند: ${missing.join(", ")}`);
}



const app = express();

// پشت پروکسی (Vercel / Runflare) برای ریت‌لیمیت و IP واقعی لازم است
app.set("trust proxy", 1);
app.disable("x-powered-by");

// CORS: اگر CORS_ORIGINS تنظیم شود فقط همان دامنه‌ها مجازند، وگرنه همه
const origins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
app.use(
    cors({
        origin: origins.length ? origins : true,
        exposedHeaders: ["X-Captcha-Token"],
    })
);



// Body Parsers (express.json خودش جایگزین body-parser است)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// سلامت سرویس (بدون نیاز به دیتابیس)
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

// اتصال دیتابیس قبل از هر درخواست تضمین می‌شود
app.use(ensureDB);

// Routes
app.use("/", require("./routes/blog"));
app.use("/users", require("./routes/users"));
app.use("/dashboard", require("./routes/dashboard"));

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// Error Handler
app.use(errorHandler);

// اجرای مستقیم (node app.js)؛ در Vercel خود app export می‌شود و listen لازم نیست
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    connectDB().catch((err) => console.error("DB connection error:", err.message));
    app.listen(PORT, "0.0.0.0", () => {
        console.log(
            `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
        );
    });
}

module.exports = app;
