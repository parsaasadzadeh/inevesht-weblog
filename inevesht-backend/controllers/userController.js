const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { resetSchema } = require("../models/secure/userValidation");
const { sendEmail } = require("../utils/mailer");

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// فقط رشته‌ی غیرخالی قبول می‌شود (جلوگیری از NoSQL injection مثل {"$ne": null})
const asString = (value) => (typeof value === "string" ? value : "");

exports.handleLogin = async (req, res, next) => {
    try {
        const body = req.body || {};
        const email = asString(body.email).trim();
        const password = asString(body.password);
        const rememberMe = body.rememberMe === true || body.rememberMe === "true";

        if (!email || !password) {
            throw httpError("ایمیل و کلمه عبور را وارد کنید", 422);
        }

        const user = await User.findByEmail(email);
        const isEqual = user ? await bcrypt.compare(password, user.password) : false;

        // پیام یکسان برای «کاربر وجود ندارد» و «رمز اشتباه است» تا ایمیل‌های ثبت‌شده لو نروند
        if (!isEqual) {
            throw httpError("آدرس ایمیل یا کلمه عبور اشتباه است", 422);
        }

        const token = jwt.sign(
            {
                user: {
                    userId: user._id.toString(),
                    email: user.email,
                    fullname: user.fullname,
                },
            },
            process.env.JWT_SECRET,
            { expiresIn: rememberMe ? "30d" : "7d" }
        );

        res.status(200).json({ token, userId: user._id.toString() });
    } catch (err) {
        next(err);
    }
};

exports.createUser = async (req, res, next) => {
    try {
        const body = req.body || {};
        await User.userValidation(body);

        const fullname = asString(body.fullname).trim();
        const email = asString(body.email).trim().toLowerCase();
        const password = asString(body.password);

        if (await User.findByEmail(email)) {
            throw httpError("کاربری با این ایمیل در پایگاه داده موجود است", 422);
        }

        await User.create({ fullname, email, password });

        res.status(201).json({ message: "عضویت موفقیت آمیز بود" });
    } catch (err) {
        next(err);
    }
};

exports.handleForgetPassword = async (req, res, next) => {
    try {
        const email = asString((req.body || {}).email).trim();
        if (!email) throw httpError("ایمیل را وارد کنید", 422);

        const user = await User.findByEmail(email);

        if (user) {
            // توکن با «رمز فعلی کاربر» امضا می‌شود؛ بعد از تغییر رمز، همان لینک دیگر کار نمی‌کند
            const token = jwt.sign(
                { userId: user._id.toString(), purpose: "reset" },
                process.env.JWT_SECRET + user.password,
                { expiresIn: "1h" }
            );
            const base = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
            const resetLink = `${base}/reset-password/${token}`;

            // ارسال ایمیل در پس‌زمینه؛ خطای SMTP نباید پاسخ کاربر را خراب کند
            sendEmail(
                user.email,
                user.fullname,
                "فراموشی رمز عبور",
                `جهت تغییر رمز عبور فعلی روی لینک زیر کلیک کنید
                <a href="${resetLink}">لینک تغییر رمز عبور</a>`
            ).catch((e) => console.error("Reset email error:", e.message));
        }

        // پاسخ یکسان چه ایمیل وجود داشته باشد چه نه
        res.status(200).json({
            message: "اگر این ایمیل ثبت شده باشد، لینک ریست کلمه عبور برای آن ارسال می‌شود",
        });
    } catch (err) {
        next(err);
    }
};

exports.handleResetPassword = async (req, res, next) => {
    try {
        const token = req.params.token;
        await resetSchema.validate(req.body || {}, { abortEarly: false });

        const payload = jwt.decode(token);
        if (!payload || payload.purpose !== "reset" || !payload.userId) {
            throw httpError("لینک ریست نامعتبر است", 401);
        }

        const user = await User.findById(payload.userId);
        if (!user) {
            throw httpError("کاربری با این شناسه در پایگاه داده یافت نشد", 404);
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET + user.password);
        } catch (e) {
            throw httpError("لینک ریست نامعتبر یا منقضی شده است", 401);
        }

        user.password = req.body.password;
        await user.save();

        res.status(200).json({ message: "عملیات با موفقیت انجام شد" });
    } catch (err) {
        next(err);
    }
};
