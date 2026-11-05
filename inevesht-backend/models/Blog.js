const mongoose = require("mongoose");
const crypto = require("crypto");
const { schema } = require("./secure/postValidation");

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 100,
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    body: {
        type: String,
        required: true,
    },

    status: {
        type: String,
        enum: ["private", "public"],
        default: "public",
    },

    thumbnail: {
        type: String,
        required: true,
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

blogSchema.index({ title: "text" });
// ایندکس‌های مورد نیاز کوئری‌های صفحه‌ی اصلی و داشبورد
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ user: 1, createdAt: -1 });

const makeSlug = (title) =>
    title
        .trim()
        .toLowerCase()
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

// اسلاگ فقط وقتی ساخته می‌شود که پست جدید است یا عنوان واقعاً عوض شده؛
// قبلاً با هر ذخیره دوباره ساخته می‌شد و لینک پست‌ها تغییر می‌کرد.
// اگر اسلاگ تکراری بود یک پسوند یکتا اضافه می‌شود (قبلاً خطای 500 می‌داد).
blogSchema.pre("validate", async function () {
    if (!this.title) return;
    if (!this.isNew && !this.isModified("title")) return;

    const base = makeSlug(this.title) || "post";
    let slug = base;

    const taken = await this.constructor.exists({
        slug,
        _id: { $ne: this._id },
    });
    if (taken) slug = `${base}-${crypto.randomBytes(3).toString("hex")}`;

    this.slug = slug;
});

blogSchema.statics.postValidation = function (body) {
    return schema.validate(body, { abortEarly: false });
};

module.exports = mongoose.model("Blog", blogSchema);
