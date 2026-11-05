// تبدیل خطاهای رایج به پاسخ مناسب (به‌جای 500 عمومی)
exports.errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);

    let status = error.statusCode || error.status || 500;
    let message = error.message;
    let data = error.data;

    if (error.name === "ValidationError" && Array.isArray(error.errors)) {
        // Yup
        status = 422;
        data = error.errors;
        message = error.errors[0] || "اطلاعات ارسالی معتبر نیست";
    } else if (error.name === "ValidationError") {
        // Mongoose
        status = 422;
        data = Object.values(error.errors || {}).map((e) => e.message);
        message = data[0] || "اطلاعات ارسالی معتبر نیست";
    } else if (error.code === 11000) {
        status = 422;
        message = "این مقدار قبلاً ثبت شده است";
    } else if (error.type === "entity.parse.failed") {
        status = 400;
        message = "بدنه‌ی درخواست معتبر نیست";
    }

    if (status >= 500) {
        console.error(error);
        if (process.env.NODE_ENV === "production") {
            message = "خطای داخلی سرور";
            data = undefined;
        }
    }

    res.status(status).json({ message, data });
};
