// تست‌های رفتاری ورود/ثبت‌نام بدون نیاز به MongoDB (مدل User با یک فروشگاه حافظه‌ای جایگزین می‌شود)
process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { schema } = require("../models/secure/userValidation");

// ── مدل User جعلی (همان منطق نرمال‌سازی ایمیل مدل واقعی) ──
const store = [];
const FakeUser = {
    userValidation: (b) => schema.validate(b, { abortEarly: false }),
    findByEmail: async (email) => {
        const e = String(email || "").trim().toLowerCase();
        return store.find((u) => u.email.toLowerCase() === e) || null;
    },
    create: async ({ fullname, email, password }) => {
        const u = {
            _id: { toString: () => String(store.length + 1) },
            fullname,
            email: email.toLowerCase().trim(),
            password: await bcrypt.hash(password, 4),
        };
        store.push(u);
        return u;
    },
    findById: async (id) => store.find((u) => u._id.toString() === String(id)) || null,
};
const userPath = require.resolve("../models/User");
require.cache[userPath] = { id: userPath, filename: userPath, loaded: true, exports: FakeUser };

const dbPath = require.resolve("../config/db");
require.cache[dbPath] = {
    id: dbPath, filename: dbPath, loaded: true,
    exports: { ensureDB: (q, s, n) => n(), connectDB: async () => {} },
};

const app = require("../app");
let server, base;
test.before(async () => {
    await new Promise((r) => { server = app.listen(0, r); });
    base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const post = (p, body, headers = {}) =>
    fetch(base + p, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
    });

const reg = { fullname: "Parsa Test", email: "Parsa@Example.com ", password: "abcd1234", confirmPassword: "abcd1234" };

test("ثبت‌نام با ایمیل حروف‌بزرگ و فاصله، سپس ورود با ایمیل کوچک", async () => {
    let r = await post("/users/register", reg);
    assert.equal(r.status, 201);
    r = await post("/users/login", { email: "parsa@example.com", password: "abcd1234" });
    assert.equal(r.status, 200);
    assert.ok((await r.json()).token);
});

test("ورود با همان ایمیل اولیه (حروف بزرگ + فاصله) هم کار می‌کند", async () => {
    const r = await post("/users/login", { email: "  PARSA@example.com", password: "abcd1234" });
    assert.equal(r.status, 200);
});

test("رمز اشتباه و کاربر ناموجود پیام یکسان می‌گیرند", async () => {
    const a = await post("/users/login", { email: "parsa@example.com", password: "wrong" });
    const b = await post("/users/login", { email: "nobody@example.com", password: "x1234" });
    assert.equal(a.status, 422);
    assert.equal(b.status, 422);
    assert.equal((await a.json()).message, (await b.json()).message);
});

test("ورود بدون بدنه یا با آبجکت NoSQL (تزریق) به 500 نمی‌رسد و کسی لاگین نمی‌شود", async () => {
    let r = await fetch(base + "/users/login", { method: "POST" });
    assert.equal(r.status, 422);
    r = await post("/users/login", { email: { $ne: null }, password: "abcd1234" });
    assert.equal(r.status, 422);
});

test("ثبت‌نام تکراری با ایمیل با حروف متفاوت رد می‌شود و خطای اعتبارسنجی 422 است", async () => {
    let r = await post("/users/register", { ...reg, email: "PARSA@EXAMPLE.COM" });
    assert.equal(r.status, 422);
    r = await post("/users/register", { fullname: "a" });
    assert.equal(r.status, 422);
});

test("توکن منقضی‌شده 401 می‌دهد (قبلاً 500)", async () => {
    const expired = jwt.sign({ user: { userId: "1" } }, "test-secret", { expiresIn: -10 });
    const r = await fetch(base + "/dashboard", { headers: { Authorization: `Bearer ${expired}` } });
    assert.equal(r.status, 401);
});

test("توکن خراب، بدون توکن و توکن ریست‌پسورد همگی 401 هستند", async () => {
    for (const h of [{ Authorization: "Bearer garbage" }, {}, { Authorization: "Bearer " + jwt.sign({ userId: "1" }, "test-secret") }]) {
        const r = await fetch(base + "/dashboard", { headers: h });
        assert.equal(r.status, 401);
    }
});

test("توکن ورود معتبر: عبور از احراز هویت (خطای بعدی فقط به‌خاطر نبود DB است نه 401)", async () => {
    const login = await (await post("/users/login", { email: "parsa@example.com", password: "abcd1234" })).json();
    const r = await fetch(base + "/dashboard/delete-post/x", {
        method: "DELETE", headers: { Authorization: `Bearer ${login.token}` },
    });
    assert.notEqual(r.status, 401);
});

test("فراموشی رمز: پاسخ یکسان برای ایمیل موجود/ناموجود", async () => {
    const a = await post("/users/forget-password", { email: "parsa@example.com" });
    const b = await post("/users/forget-password", { email: "ghost@example.com" });
    assert.equal(a.status, 200);
    assert.equal((await a.json()).message, (await b.json()).message);
});

test("کپچا: توکن امضاشده صحیح پذیرفته و اشتباه رد می‌شود", async () => {
    const res = await fetch(base + "/captcha.svg");
    const token = res.headers.get("x-captcha-token");
    const svg = await res.text();
    assert.ok(token && svg.startsWith("<svg"));
    const digits = [...svg.matchAll(/>(\d)<\/text>/g)].map((m) => m[1]).join("");
    const good = { fullname: "A B", email: "a@b.com", message: "hello", captcha: digits, captchaToken: token };
    assert.equal((await post("/contact", good)).status, 200);
    assert.equal((await post("/contact", { ...good, captcha: "0000" })).status, 422);
});
