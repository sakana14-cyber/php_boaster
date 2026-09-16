import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
    variable: "--font-noto-sans-jp",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "給与タイマー",
    description: "出勤・退勤を記録し、勤務中の予測給与を確認できるアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="ja" className={`${notoSansJp.variable} h-full antialiased`}>
            <body className="min-h-full bg-gray-200 font-sans">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
