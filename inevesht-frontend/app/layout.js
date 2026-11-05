import './globals.css'
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Script from "next/script";




export const metadata = {
  title: {
    default: "Inevesht",
    template: "%s | Inevesht",
  },
  description: "Inevesht website",
   icons: {
    icon: "/img/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
    <head>
    <meta name="google-site-verification" content="DOajKIcdPAy8iXHtR35LNOFAmdoTQZ8_WByEIJcDERo" />
    </head>
        <Navbar />
        {children}
        <Footer />

        <Script src="/bootstrap.bundle.min.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
