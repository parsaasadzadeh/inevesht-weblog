'use client'

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function Custom404() {
  useEffect(() => {
    document.title = "صفحه پیدا نشد | وبلاگ من";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 font-sans" dir="rtl">
      <div className="flex flex-col items-center gap-8 px-14 py-12 bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_10px_40px_rgba(0,100,255,0.1)]">
        <Image
          src="/img/404.png"
          alt="404 Not Found"
          width={350}
          height={350}
          className="w-full max-w-[350px] h-auto object-contain drop-shadow-md"
        />

        <h2 className="text-2xl font-bold text-[#1a3c6e] m-0">
          صفحه پیدا نشد
        </h2>

        <Link
          href="/"
          className="px-9 py-3.5 bg-gradient-to-br from-blue-500 to-blue-700 text-white no-underline rounded-full text-base font-bold shadow-[0_8px_15px_rgba(0,123,255,0.3)] transition-all duration-300 hover:from-blue-700 hover:to-blue-900 hover:shadow-[0_12px_20px_rgba(0,123,255,0.4)] hover:-translate-y-1 active:translate-y-0.5 active:shadow-[0_4px_10px_rgba(0,123,255,0.3)]"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}