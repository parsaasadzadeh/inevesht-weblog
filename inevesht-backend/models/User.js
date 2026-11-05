const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { schema } = require("./secure/userValidation");

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, "نام و نام خانوادگی الزامی می باشد"],
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        // ایمیل همیشه کوچک و بدون فاصله ذخیره می‌شود تا ورود با "Test@x.com" و "test@x.com" یکی باشد
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 255,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.statics.userValidation = function (body) {
    return schema.validate(body, { abortEarly: false });
};

// جستجوی ایمیل بدون حساسیت به حروف بزرگ/کوچک؛ برای کاربرانی که قبلاً با ایمیل
// حروف‌بزرگ‌دار ثبت‌نام کرده‌اند هم کار می‌کند (بدون نیاز به مهاجرت دیتابیس)
userSchema.statics.findByEmail = function (email) {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) return Promise.resolve(null);
    return this.findOne({ email: normalized }).collation({
        locale: "en",
        strength: 2,
    });
};

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("User", userSchema);
