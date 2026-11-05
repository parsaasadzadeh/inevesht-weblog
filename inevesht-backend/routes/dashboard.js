const { Router } = require("express");
const fileUpload = require("express-fileupload");
const { authenticated } = require("../middlewares/auth");

const adminController = require("../controllers/adminController");

const router = new Router();

// پردازش فایل فقط برای مسیرهای داشبورد (و فقط بعد از احراز هویت) فعال می‌شود
const upload = fileUpload({
    useTempFiles: false, // در Vercel دیسک قابل نوشتن نیست؛ فایل در RAM می‌ماند
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
    abortOnLimit: true,
    limitHandler: (req, res) =>
        res.status(413).json({ message: "حجم عکس ارسالی نباید بیشتر از 4 مگابایت باشد" }),
});

router.use(authenticated, upload);

//  @desc   Dashboard
//  @route  GET /dashboard
router.get("/", adminController.getDashboard);

//  @desc   Dashboard Delete Post
//  @route  DELETE /dashboard/delete-post/:slug
router.delete("/delete-post/:slug", adminController.deletePost);

//  @desc   Dashboard Handle Post Creation
//  @route  POST /dashboard/add-post
router.post("/add-post", adminController.createPost);

//  @desc   Dashboard Handle Post Edit
//  @route  PUT /dashboard/edit-post/:slug
router.put("/edit-post/:slug", adminController.editPost);

//  @desc   Dashboard Handle Image Upload
//  @route  POST /dashboard/image-upload
router.post("/image-upload", adminController.uploadImage);

module.exports = router;
