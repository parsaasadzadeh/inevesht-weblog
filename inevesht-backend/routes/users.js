const { Router } = require("express");
const rateLimit = require("express-rate-limit");

const userController = require("../controllers/userController");

const router = new Router();

// جلوگیری از حمله‌ی حدس رمز (brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "تعداد تلاش‌ها زیاد است، چند دقیقه بعد دوباره امتحان کنید" },
});

//  @desc   Login Handle
//  @route  POST /users/login
router.post("/login", authLimiter, userController.handleLogin);

//  @desc   Handle Forget Password
//  @route  POST /users/forget-password
router.post("/forget-password", authLimiter, userController.handleForgetPassword);

//  @desc   Handle reset Password
//  @route  POST /users/reset-password/:token
router.post("/reset-password/:token", authLimiter, userController.handleResetPassword);

//  @desc   Register Handle
//  @route  POST /users/register
router.post("/register", authLimiter, userController.createUser);

module.exports = router;
