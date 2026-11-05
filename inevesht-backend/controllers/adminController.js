const User = require("../models/User");
const Blog = require("../models/Blog");
const {
    uploadImage: uploadToBlob,
    deleteImage: deleteFromBlob,
} = require("../utils/blobStorage");

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// فقط فیلدهای مجاز از بدنه‌ی درخواست برداشته می‌شود (جلوگیری از Mass Assignment)
const pickPostFields = (body = {}) => ({
    title: body.title,
    body: body.body,
    status: body.status,
});

//  @desc   ساخت پست جدید (عکس روی Vercel Blob آپلود می‌شود)
exports.createPost = async (req, res, next) => {
    try {
        const thumbnail = req.files ? req.files.thumbnail : null;
        if (!thumbnail) throw httpError("عکس بند انگشتی الزامی است", 422);

        const fields = pickPostFields(req.body);
        await Blog.postValidation({ ...fields, thumbnail });

        const blob = await uploadToBlob(thumbnail, "thumbnails");

        try {
            await Blog.create({
                ...fields,
                status: fields.status || undefined,
                user: req.userId,
                thumbnail: blob.url,
            });
        } catch (err) {
            // اگر ذخیره‌ی پست شکست خورد، عکس آپلودشده یتیم نماند
            await deleteFromBlob(blob.url);
            throw err;
        }

        res.status(201).json({ message: "پست جدید با موفقیت ساخته شد" });
    } catch (err) {
        next(err);
    }
};

//  @desc   ویرایش پست (در صورت ارسال عکس جدید، عکس قبلی از Blob حذف می‌شود)
exports.editPost = async (req, res, next) => {
    try {
        const thumbnail = req.files ? req.files.thumbnail : null;
        const fields = pickPostFields(req.body);

        await Blog.postValidation({
            ...fields,
            thumbnail: thumbnail || {
                name: "placeholder",
                size: 0,
                mimetype: "image/jpeg",
            },
        });

        const post = await Blog.findOne({ slug: req.params.slug });
        if (!post) throw httpError("پستی با این شناسه یافت نشد", 404);

        if (post.user.toString() !== req.userId) {
            throw httpError("شما مجوز ویرایش این پست را ندارید", 403);
        }

        post.title = fields.title;
        post.body = fields.body;
        if (fields.status) post.status = fields.status;

        let oldThumbnailUrl = null;
        if (thumbnail) {
            oldThumbnailUrl = post.thumbnail;
            const blob = await uploadToBlob(thumbnail, "thumbnails");
            post.thumbnail = blob.url;
        }

        await post.save();

        // عکس قدیمی فقط بعد از ذخیره‌ی موفق پست حذف می‌شود
        if (oldThumbnailUrl) await deleteFromBlob(oldThumbnailUrl);

        res.status(200).json({
            message: "پست شما با موفقیت ویرایش شد",
            slug: post.slug,
        });
    } catch (err) {
        next(err);
    }
};

//  @desc   حذف پست به همراه حذف عکس آن از Vercel Blob (فقط توسط صاحب پست)
exports.deletePost = async (req, res, next) => {
    try {
        // قبلاً هر کاربر لاگین‌شده می‌توانست پست هر کس دیگری را حذف کند
        const post = await Blog.findOneAndDelete({
            slug: req.params.slug,
            user: req.userId,
        });

        if (!post) throw httpError("پستی با این آدرس یافت نشد", 404);

        await deleteFromBlob(post.thumbnail);

        res.status(200).json({ message: "پست شما با موفقیت پاک شد" });
    } catch (err) {
        next(err);
    }
};

//  @desc   داشبورد کاربر
exports.getDashboard = async (req, res, next) => {
    try {
        const [user, posts] = await Promise.all([
            User.findById(req.userId).select("fullname").lean(),
            Blog.find({ user: req.userId }).sort({ createdAt: -1 }).lean(),
        ]);

        res.status(200).json({
            posts,
            fullname: user ? user.fullname : "کاربر عزیز",
        });
    } catch (err) {
        next(err);
    }
};

//  @desc   آپلود مستقل یک عکس (مثلا برای استفاده داخل بدنه‌ی پست)
exports.uploadImage = async (req, res, next) => {
    try {
        const image = req.files ? req.files.image : null;

        if (!image) throw httpError("جهت آپلود باید عکسی انتخاب کنید", 400);

        if (image.size > 4000000) {
            throw httpError("حجم عکس ارسالی نباید بیشتر از 4 مگابایت باشد", 422);
        }

        if (image.mimetype !== "image/jpeg" && image.mimetype !== "image/png") {
            throw httpError("تنها پسوندهای jpeg و png پشتیبانی می‌شوند", 422);
        }

        const blob = await uploadToBlob(image, "uploads");

        res.status(200).json({ image: blob.url });
    } catch (err) {
        next(err);
    }
};
