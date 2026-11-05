"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Link from "next/link";
import { resetPassword } from "../../../services/api"; // Import reset password service
import Errors from "@/app/components/errors"; // Import reusable error/alert component

export default function ResetPasswordPage({ params }) {
    const router = useRouter();

    // Unwrap the async params object using React's `use()` hook to access the reset token
    const unwrappedParams = use(params);
    const token = unwrappedParams.token;

    // Form state: holds the new password and its confirmation value
    const [formData, setFormData] = useState({ password: "", confirmPassword: "" });

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

        // Client-side validation: enforce minimum password length
        if (formData.password.length < 6) {
            return setMessage({ type: "error", text: "رمز عبور باید حداقل ۶ کاراکتر باشد" });
        }

        setIsLoading(true);
        setMessage({ type: "", text: "" }); // Clear any previous feedback before the new request

        try {
            // Send the URL token alongside the new password to the reset password endpoint
            const data = await resetPassword(token, formData.password);
            setMessage({ type: "success", text: data.message || "رمز عبور با موفقیت تغییر کرد. در حال انتقال..." });

            // Redirect to the login page after 3 seconds so the user can read the success message
            setTimeout(() => router.push("/login"), 3000);
        } catch (err) {
            // Covers both network errors and expired/invalid reset tokens
            setMessage({ type: "error", text: err.message || "خطا در ارتباط با سرور یا لینک منقضی شده است" });
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
                            <h2>تعیین رمز عبور جدید</h2>
                            <p>لطفاً رمز عبور جدید خود را وارد کرده و آن را به خاطر بسپارید.</p>

                            <form onSubmit={handleSubmit}>

                                {/* New password field — autofocused for faster UX; LTR direction for password chars */}
                                <div className="input-group">
                                    <label>رمز عبور جدید</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="password"
                                            autoFocus
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            dir="ltr"
                                            style={{ textAlign: "left" }}
                                        />
                                        {/* Eye / visibility icon */}
                                        <svg viewBox="0 0 24 24">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                        </svg>
                                    </div>
                                </div>

                                {/* Confirm password field — must match the field above to pass client-side validation */}
                                <div className="input-group">
                                    <label>تکرار رمز عبور جدید</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            required
                                            dir="ltr"
                                            style={{ textAlign: "left" }}
                                        />
                                        {/* Eye / visibility icon */}
                                        <svg viewBox="0 0 24 24">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                        </svg>
                                    </div>
                                </div>

                                {/* Submit button: disabled while the API request is in flight */}
                                <button type="submit" disabled={isLoading} className="submit-btn" style={{ marginTop: '2rem' }}>
                                    {isLoading ? "در حال ثبت..." : "ذخیره رمز عبور"}
                                </button>

                            </form>
                        </div>

                        {/* ── Illustration / branding section ── */}
                        <div className="illustration-section">
                            {/* Decorative heading shown on the visual side of the card */}
                            <div style={{ fontSize: '36px', color: '#f6c046', opacity: '0.7', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.4' }}>
                                تغییر <br/> رمز عبور
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