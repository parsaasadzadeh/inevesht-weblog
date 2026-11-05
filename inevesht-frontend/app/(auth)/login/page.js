"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "../../services/api"; // Import login service
import Errors from "@/app/components/errors"; // Import reusable error/alert component

export default function LoginPage() {
    const router = useRouter();

    // Individual form field states for email and password
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Controls token persistence: localStorage (remember me) vs sessionStorage (session only)
    const [rememberMe, setRememberMe] = useState(false);

    // Feedback state: drives the Errors component with a type ("error" | "success") and message text
    const [message, setMessage] = useState({ type: "", text: "" });

    // Loading state: disables the submit button while the API request is in flight
    const [isLoading, setIsLoading] = useState(false);

    // Clears the current feedback message (passed as the onClose handler to Errors)
    const clearMessage = () => setMessage({ type: "", text: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation: ensure neither field is empty before hitting the API
        if (!email || !password) {
            return setMessage({ type: "error", text: "لطفاً ایمیل و رمز عبور را وارد کنید" });
        }

        setIsLoading(true);
        setMessage({ type: "", text: "" }); // Clear any previous feedback before the new request

        try {
            // Send login credentials to the backend
            const data = await loginUser({ email: email.trim(), password, rememberMe });

            // Persist the token based on the "remember me" checkbox:
            // localStorage survives browser restarts; sessionStorage is cleared when the tab closes
            if (!data || !data.token) {
                throw new Error("پاسخ نامعتبر از سرور");
            }

            // توکن قدیمی را از هر دو محل پاک می‌کنیم؛ وگرنه توکن منقضی‌شده‌ی localStorage
            // (که اول خوانده می‌شود) جلوی توکن جدید را می‌گیرد و ورود دوباره "کار نمی‌کند"
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");

            {
                if (rememberMe) {
                    localStorage.setItem("token", data.token);
                } else {
                    sessionStorage.setItem("token", data.token);
                }
            }

            // Show success feedback
            setMessage({ type: "success", text: data.message || "ورود با موفقیت انجام شد" });

            // Redirect to the dashboard after a short delay so the user can read the success message
            setTimeout(() => router.push("/dashboard"), 1500);

        } catch (error) {
            setMessage({ type: "error", text: error.message || "ایمیل یا رمز عبور اشتباه است" });
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

                        {/* ── Form section (right / top) ── */}
                        <div className="form-section">
                            <h2>ورود به پورتال</h2>
                            <p>لطفاً برای ورود به حساب کاربری، اطلاعات خود را وارد کنید</p>

                            <form onSubmit={handleSubmit}>

                                {/* Email field — autofocused for faster UX */}
                                <div className="input-group">
                                    <label>آدرس ایمیل</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="email"
                                            autoFocus
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                        {/* Envelope / email icon */}
                                        <svg viewBox="0 0 24 24">
                                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                        </svg>
                                    </div>
                                </div>

                                {/* Password field */}
                                <div className="input-group">
                                    <label>رمز عبور</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        {/* Eye / visibility icon */}
                                        <svg viewBox="0 0 24 24">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                        </svg>
                                    </div>
                                </div>

                                {/* Remember me checkbox and forgot password link */}
                                <div className="form-options">
                                    <label className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                        />
                                        <span>مرا به خاطر بسپار</span>
                                    </label>
                                    {/* Navigates to the forgot password flow */}
                                    <Link href="/forgot-password" className="forgot-password">
                                        فراموشی رمز عبور؟
                                    </Link>
                                </div>

                                {/* Link for users who don't have an account yet */}
                                <div className="signup-text">
                                    حساب کاربری ندارید؟ <Link href="/register">ثبت نام کنید</Link>
                                </div>

                                {/* Submit button: disabled while the API request is in flight */}
                                <button type="submit" disabled={isLoading} className="submit-btn">
                                    {isLoading ? "در حال ورود..." : "ورود"}
                                </button>

                            </form>
                        </div>

                        {/* ── Illustration / branding section (left / bottom) ── */}
                        <div className="illustration-section">
                            {/* Decorative heading shown on the visual side of the card;
                                replace this div with an <img> tag if you have an illustration */}
                            <div style={{ fontSize: '40px', color: '#f6c046', opacity: '0.7', fontWeight: 'bold', textAlign: 'center' }}>
                                ورود <br/> به حساب
                            </div>
                            {/* <img src="/your-image-path.png" alt="Login Illustration" className="illustration-image" /> */}

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