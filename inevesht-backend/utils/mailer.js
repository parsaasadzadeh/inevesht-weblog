const nodeMailer = require("nodemailer");

let transporter = null;

const isConfigured = () =>
    Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
    if (!transporter) {
        const port = Number(process.env.SMTP_PORT) || 465;
        transporter = nodeMailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
};

exports.escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

/**
 * ارسال ایمیل. اطلاعات SMTP فقط از متغیرهای محیطی خوانده می‌شود
 * (قبلاً یوزر و پسورد داخل کد بود). اگر SMTP تنظیم نشده باشد، ارسال رد می‌شود.
 * Promise برمی‌گرداند تا خطاها قابل مدیریت باشند.
 */
exports.sendEmail = async (email, fullname, subject, message, options = {}) => {
    if (!isConfigured()) {
        console.warn("SMTP تنظیم نشده است؛ ایمیل ارسال نشد:", subject);
        return { skipped: true };
    }

    const safeName = exports.escapeHtml(fullname);

    return getTransporter().sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject,
        replyTo: options.replyTo,
        // message از سمت کد خودمان می‌آید و HTML مجاز است؛ نام کاربر escape می‌شود
        html: `<h1> سلام ${safeName}</h1>
            <p>${message}</p>`,
    });
};

exports.isMailConfigured = isConfigured;
