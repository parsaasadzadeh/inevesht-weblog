"use client";

import { useState, useEffect } from "react"; // useEffect added
import Link from "next/link";
import { sendContactMessage } from "../services/api";
import Errors from "@/app/components/errors";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ContactUs() {
    const [formData, setFormData] = useState({
        fullname: "",
        email: "",
        message: "",
        captcha: "",
    });

    const [message, setMessage] = useState({ type: "", text: "" });
    const [isLoading, setIsLoading] = useState(false);

    // Initialize with a fixed value to prevent hydration mismatch errors
    const [captchaKey, setCaptchaKey] = useState("init");

    // Update captcha key on client-side mount to bypass browser cache
    useEffect(() => {
        setCaptchaKey(Date.now());
    }, []);

    // Clear notification message
    const clearMessage = () => setMessage({ type: "", text: "" });

    // Handle form field changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Refresh captcha image by generating a new unique key
    const handleRefreshCaptcha = () => {
        setCaptchaKey(Date.now());
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: "", text: "" });

        try {
            // Send contact form data to API
            await sendContactMessage(formData);

            // Show success message
            setMessage({
                type: "success",
                text: "پیام شما با موفقیت ارسال شد. به زودی پاسخگوی شما خواهیم بود."
            });

            // Reset form fields
            setFormData({
                fullname: "",
                email: "",
                message: "",
                captcha: ""
            });

            // Refresh captcha after successful submission
            handleRefreshCaptcha();
        } catch (error) {
            // Show error message
            setMessage({
                type: "error",
                text: error.message || "خطا در ارسال پیام"
            });

            // Refresh captcha after failed submission
            handleRefreshCaptcha();
        } finally {
            // Stop loading state
            setIsLoading(false);
        }
    };

    // The rest of the component remains unchanged

    return (
        <>
            {/* Notification / Error Message Component */}
            <Errors
                message={message.text}
                type={message.type}
                onClose={clearMessage}
            />

            <div className="main">
                <div
                    className="login-wrapper"
                    style={{ maxWidth: "900px" }} // Slightly wider layout for contact form
                >
                    <div className="login-card">

                        {/* Contact Form Section */}
                        <div
                            className="form-section"
                            style={{ padding: "2rem" }}
                        >
                            <h2>ارتباط با ما</h2>
                            <p>نظرات، پیشنهادات و سوالات خود را با ما در میان بگذارید.</p>

                            <form onSubmit={handleSubmit}>

                                {/* Full Name Field */}
                                <div className="input-group">
                                    <label>نام و نام خانوادگی</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            name="fullname"
                                            value={formData.fullname}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="input-group">
                                    <label>آدرس ایمیل</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            dir="ltr"
                                            style={{ textAlign: "left" }}
                                        />
                                    </div>
                                </div>

                                {/* Message Text Area */}
                                <div className="input-group">
                                    <label>متن پیام</label>
                                    <div
                                        className="input-wrapper"
                                        style={{
                                            height: "auto",
                                            borderRadius: "15px"
                                        }}
                                    >
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows="4"
                                            style={{
                                                width: "100%",
                                                border: "none",
                                                background: "transparent",
                                                padding: "1rem",
                                                outline: "none",
                                                color: "#fff",
                                                resize: "vertical"
                                            }}
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Custom Captcha Section */}
                                <div className="input-group">
                                    <label>کد امنیتی</label>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            alignItems: "center"
                                        }}
                                    >
                                        {/* Captcha Input */}
                                        <div
                                            className="input-wrapper"
                                            style={{ flex: 1 }}
                                        >
                                            <input
                                                type="text"
                                                name="captcha"
                                                value={formData.captcha}
                                                onChange={handleChange}
                                                required
                                                dir="ltr"
                                                style={{
                                                    textAlign: "center",
                                                    letterSpacing: "3px"
                                                }}
                                                placeholder="کد تصویر..."
                                            />
                                        </div>

                                        {/* Captcha Image */}
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: "5px"
                                            }}
                                        >
                                            <img
                                                src={`${BASE_URL}/captcha.svg?key=${captchaKey}`}
                                                alt="Captcha"
                                                onClick={handleRefreshCaptcha}
                                                style={{
                                                    height: "45px",
                                                    borderRadius: "10px",
                                                    cursor: "pointer",
                                                    background: "#fff"
                                                }}
                                                title="Click to refresh captcha"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="submit-btn"
                                    style={{ marginTop: "2rem" }}
                                >
                                    {isLoading
                                        ? "در حال ارسال..."
                                        : "ارسال پیام"}
                                </button>

                            </form>
                        </div>

                        {/* Illustration / Branding Section */}
                        <div className="illustration-section">
                            <div
                                style={{
                                    fontSize: "36px",
                                    color: "#f6c046",
                                    opacity: "0.7",
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    lineHeight: "1.4"
                                }}
                            >
                                تماس <br /> با ما
                            </div>

                            {/* Brand Logo */}
                            <div className="brand-logo">Inevsht</div>
                        </div>

                    </div>

                    {/* Back to Home Link */}
                    <Link href="/" className="back-to-home">
                        بازگشت به خانه
                    </Link>
                </div>
            </div>
        </>
    );
}
