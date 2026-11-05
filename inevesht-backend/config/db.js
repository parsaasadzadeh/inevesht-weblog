const mongoose = require("mongoose");

// اتصال کش‌شده: در محیط‌های serverless (مثل Vercel) هر درخواست ممکن است روی
// یک instance تازه یا قدیمی اجرا شود؛ با کش کردن promise از اتصال‌های تکراری جلوگیری می‌شود.
let connectionPromise = null;

const connectDB = () => {
    if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose);

    if (!connectionPromise) {
        if (!process.env.MONGODB_URI) {
            return Promise.reject(new Error("MONGODB_URI تنظیم نشده است"));
        }

        connectionPromise = mongoose
            .connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 10000,
                maxPoolSize: 10,
            })
            .then((m) => {
                console.log(`MongoDB Connected: ${m.connection.host}`);
                return m;
            })
            .catch((err) => {
                connectionPromise = null; // اجازه‌ی تلاش دوباره در درخواست بعدی
                throw err;
            });
    }

    return connectionPromise;
};

// قبل از هر درخواست مطمئن می‌شویم دیتابیس وصل است
exports.ensureDB = async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("DB connection error:", err.message);
        const error = new Error("ارتباط با پایگاه داده برقرار نشد");
        error.statusCode = 503;
        next(error);
    }
};

exports.connectDB = connectDB;
