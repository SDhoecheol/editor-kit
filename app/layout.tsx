import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. 사이트 이름과 설명(메타데이터)을 에디터킷으로 수정했습니다.
export const metadata: Metadata = {
  title: "에디터킷 - 인쇄/디자인 실무자 커뮤니티",
  description: "2030 인쇄 및 편집 디자이너를 위한 유틸리티 및 커뮤니티",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 2. 한국어 사이트이므로 lang을 "ko"로 변경했습니다.
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 3. 드디어 메뉴바 부품을 화면 맨 위에 끼워 넣었습니다! */}
        <Navbar />
        {/* 4. 이 children이 바로 우리가 아까 만든 메인 화면(page.tsx)입니다. */}
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}