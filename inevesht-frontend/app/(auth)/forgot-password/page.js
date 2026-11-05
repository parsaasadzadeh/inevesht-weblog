"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "../../services/api"; // Import forgot password service
import Errors from "@/app/components/errors"; // Import reusable error/alert component

export default function ForgetPasswordPage() {

    // Holds the email address the user types into the input field
    const [email, setEmail] = useState("");

    // Feedback state: drives the Errors component with a type ("error" | "success") and message text
    const [message, setMessage] = useState({ type: "", text: "" });

    // Loading state: disables the submit button while the API request is in flight
    const [isLoading, setIsLoading] = useState(false);

    // Clears the current feedback message (passed as the onClose handler to Errors)
    const clearMessage = () => setMessage({ type: "", text: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation: ensure the email field is not empty before hitting the API
        if (!email) {
            return setMessage({ type: "error", text: "لطفاً ایمیل خود را وارد کنید" });
        }

        setIsLoading(true);
        setMessage({ type: "", text: "" }); // Clear any previous feedback before the new request

        try {
            // Send the email address to the backend to trigger the password reset email
            const data = await forgotPassword(email);
            setMessage({ type: "success", text: data.message || "لینک بازیابی با موفقیت به ایمیل شما ارسال شد" });

            // Clear the email field after a successful submission
            setEmail("");
        } catch (err) {
            setMessage({ type: "error", text: err.message || "خطا در برقراری ارتباط با سرور" });
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
                            <h2>فراموشی رمز عبور</h2>
                            <p>ایمیل خود را وارد کنید تا لینک تغییر رمز برای شما ارسال شود.</p>

                            <form onSubmit={handleSubmit}>

                                {/* Email field — autofocused, LTR direction for standard email format */}
                                <div className="input-group">
                                    <label>آدرس ایمیل</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="email"
                                            autoFocus
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            dir="ltr"
                                            style={{ textAlign: "left" }}
                                            placeholder="example@gmail.com"
                                        />
                                        {/* Envelope / email icon */}
                                        <svg viewBox="0 0 24 24">
                                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                        </svg>
                                    </div>
                                </div>

                                {/* Link for users who remember their password and want to go back to login */}
                                <div className="signup-text" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                                    یادتان آمد؟ <Link href="/login">ورود به حساب</Link>
                                </div>

                                {/* Submit button: disabled while the API request is in flight */}
                                <button type="submit" disabled={isLoading} className="submit-btn">
                                    {isLoading ? "در حال ارسال..." : "ارسال لینک بازیابی"}
                                </button>

                            </form>
                        </div>

                        {/* ── Illustration / branding section ── */}
                        <div className="illustration-section">
                            {/* Decorative heading shown on the visual side of the card;
                                replace this div with an <img> tag if you have an illustration */}
                            <div style={{ fontSize: '36px', color: '#f6c046', opacity: '0.7', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.4' }}>
                                بازیابی <br/> رمز عبور
                            </div>

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