const jwt = require("jsonwebtoken");

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// استخراج و بررسی توکن؛ در صورت نامعتبر بودن null برمی‌گرداند و خطای مناسب را throw می‌کند
const readUserId = (req) => {
    const authHeader = req.get("Authorization");
    if (!authHeader) return null;

    const [scheme, token] = authHeader.split(" ");
    if (!token || !/^Bearer$/i.test(scheme)) {
        throw httpError("فرمت توکن صحیح نیست", 401);
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        // قبلاً توکن منقضی‌شده/خراب به خطای 500 تبدیل می‌شد
        if (err.name === "TokenExpiredError") {
            throw httpError("نشست شما منقضی شده است، دوباره وارد شوید", 401);
        }
        throw httpError("توکن نامعتبر است، دوباره وارد شوید", 401);
    }

    // توکن‌های ریست رمز عبور ساختار متفاوتی دارند و نباید به‌عنوان توکن ورود پذیرفته شوند
    if (!decoded || !decoded.user || !decoded.user.userId) {
        throw httpError("توکن نامعتبر است، دوباره وارد شوید", 401);
    }
    return decoded.user.userId;
};

exports.authenticated = (req, res, next) => {
    try {
        const userId = readUserId(req);
        if (!userId) throw httpError("مجوز کافی نیست، ابتدا وارد شوید", 401);
        req.userId = userId;
        next();
    } catch (err) {
        next(err);
    }
};

// برای مسیرهای عمومی که اگر کاربر لاگین بود رفتار متفاوتی دارند (مثلاً دیدن پست خصوصی خودش)
exports.optionalAuth = (req, res, next) => {
    try {
        req.userId = readUserId(req) || null;
    } catch (err) {
        req.userId = null;
    }
    next();
};
