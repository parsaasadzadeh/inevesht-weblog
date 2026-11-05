"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "../../services/api"; // Import register service
import Errors from "@/app/components/errors"; // Import reusable error/alert component

export default function RegisterPage() {
    const router = useRouter();

    // Form state: holds all fields required for user registration
    const [formData, setFormData] = useState({
        fullname: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    // Tracks whether the user has checked the terms and conditions checkbox
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Feedback state: drives the Errors component with a type ("error" | "success") and message text
    const [message, setMessage] = useState({ type: "", text: "" });

    // Loading state: disables the submit button while the API request is in flight
    const [isLoading, setIsLoading] = useState(false);

    // Clears the current feedback message (passed as the onClose handler to Errors)
    const clearMessage = () => setMessage({ type: "", text: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation: ensure both password fields match before hitting the API
        if (formData.password !== formData.confirmPassword) {
            return setMessage({ type: "error", text: "رمز عبور و تکرار آن یکسان نیستند" });
        }

        // Client-side validation: user must accept terms before submitting
        if (!acceptedTerms) {
            return setMessage({ type: "error", text: "لطفاً قوانین و مقررات را بپذیرید" });
        }

        setIsLoading(true);
        setMessage({ type: "", text: "" }); // Clear any previous feedback before the new request

        try {
            const data = await registerUser(formData);

            setMessage({ type: "success", text: data.message || "ثبت نام با موفقیت انجام شد" });
            // Redirect to login page after a short delay so the user can read the success message
            setTimeout(() => router.push("/login"), 2000);

        } catch (error) {
            setMessage({ type: "error", text: error.message || "خطا در ارتباط با سرور" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Global alert banner: renders error or success feedback above the card */}
            <Errors message={message.text} type={message.type} onClose={clearMessage} />

            <div className="main">
                <div className="login-wrapper">
                    <div className="login-card">

                        {/* ── Form section ── */}
                        <div className="form-section">
                            <h2>ایجاد حساب کاربری</h2>
                            <p>لطفاً برای ایجاد حساب کاربری جدید، اطلاعات زیر را تکمیل کنید</p>

                            <form onSubmit={handleSubmit}>

                                {/* Full name field — autofocused for faster UX */}
                                <div className="input-group">
                                    <label>نام و نام خانوادگی</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={formData.fullname}
                                            onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                                            required
                                        />
                                        {/* Person / user icon */}
                                        <svg viewBox="0 0 24 24">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Email field */}
                                <div className="input-group">
                                    <label>آدرس ایمیل</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                        {/* Envelope / email icon */}
                                        <svg viewBox="0 0 24 24">
                                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Password field */}
                                <div className="input-group">
                                    <label>رمز عبور</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                        {/* Eye / visibility icon */}
                                        <svg viewBox="0 0 24 24">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Confirm password field — must match the field above to pass client-side validation */}
                                <div className="input-group">
                                    <label>تکرار رمز عبور</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            required
                                        />
                                        {/* Eye / visibility icon */}
                                        <svg viewBox="0 0 24 24">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Terms and conditions checkbox — form cannot be submitted unless checked */}
                                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px", margin: "15px 0" }}>
                                    <input
                                        type="checkbox"
                                        id="terms-checkbox"
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        style={{ width: "14px", height: "14px", accentColor: "#f5c518", cursor: "pointer", margin: 0 }}
                                    />
                                    <label htmlFor="terms-checkbox" style={{ fontSize: "0.8rem", color: "#374151", cursor: "pointer", margin: 0, fontWeight: 600, display: "flex", alignItems: "center" }}>
                                        <span>
                                            {/* Link to the full terms and conditions page */}
                                            <Link href="/terms" style={{ color: "#f5c518", textDecoration: "none", marginLeft: "4px" }}>قوانین و مقررات</Link>
                                            سایت را مطالعه کرده و می‌پذیرم.
                                        </span>
                                    </label>
                                </div>

                                {/* Link for users who already have an account */}
                                <div className="signup-text">
                                    قبلا ثبت نام کرده اید؟ <Link href="/login">وارد شوید</Link>
                                </div>

                                {/* Submit button: disabled while the API request is in flight */}
                                <button type="submit" disabled={isLoading} className="submit-btn">
                                    {isLoading ? "در حال ثبت نام..." : "ثبت نام"}
                                </button>

                            </form>
                        </div>

                        {/* ── Illustration / branding section ── */}
                        <div className="illustration-section">
                            {/* Decorative heading shown on the visual side of the card;
                                replace this div with an <img> tag if you have an illustration */}
                            <div style={{ fontSize: '40px', color: '#f6c046', opacity: '0.7', fontWeight: 'bold', textAlign: 'center' }}>
                                ثبت نام
                            </div>
                            {/* <img src="/your-image-path.png" alt="Register Illustration" className="illustration-image" /> */}

                            {/* App brand name */}
                            <div className="brand-logo">Inevsht</div>
                        </div>

                    </div>

                    {/* Link back to the home page for users who arrived here by mistake */}
                    <Link href="/" className="back-to-home">بازگشت به خانه</Link>
                </div>
            </div>
        </>
    );
}
