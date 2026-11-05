const { Router } = require("express");

const blogController = require("../controllers/blogController");
const { optionalAuth } = require("../middlewares/auth");

const router = new Router();

//  @desc   Weblog Index Page
//  @route  GET /
router.get("/", blogController.getIndex);

//  @desc   Weblog Post Page (پست خصوصی فقط برای صاحبش)
//  @route  GET /post/:slug
router.get("/post/:slug", optionalAuth, blogController.getSinglePost);

//  @desc   Weblog SVG Captcha
//  @route  GET /captcha.svg
router.get("/captcha.svg", blogController.getCaptcha);

//  @desc   Handle Contact Page
//  @route  POST /contact
router.post("/contact", blogController.handleContactPage);

module.exports = router;
