import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginPromptModal from "@/components/LoginPromptModal";
import RouteLoader from "@/components/RouteLoader";
import NgoVerificationModal from "@/components/NgoVerificationModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TheSecondStory",
  description: "A Smart Platform for Donating Unused Items",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Font Awesome for social icons */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} m-0 p-0 antialiased`}
      >
        <RouteLoader>
          <Navbar />
          <main className="w-full">{children}</main>
          <Footer />
        </RouteLoader>
        <LoginPromptModal />
        <NgoVerificationModal />

        {/* react-hot-toast Toaster */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            // Default options for all toasts
            duration: 4000,
            style: {
              background: "#1f2937",
              color: "#fff",
              border: "1px solid #374151",
              borderRadius: "0.75rem",
              padding: "16px",
              fontSize: "14px",
            },
            // Custom styles for different types
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
              style: {
                background: "#1f2937",
                border: "1px solid #10b981",
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
              style: {
                background: "#1f2937",
                border: "1px solid #ef4444",
              },
            },
            loading: {
              iconTheme: {
                primary: "#3b82f6",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
