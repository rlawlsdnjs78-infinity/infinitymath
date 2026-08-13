/**
 * layout.tsx
 * 루트 레이아웃 - App Router
 * 🏫 아날로그 칠판 & 노트 스타일 (따뜻한 교실 감성)
 */

import type { Metadata } from "next";
import "./globals.css";

/* ─── 페이지 메타데이터 (SEO) ──────────────────────────────────── */
export const metadata: Metadata = {
  title: "∞ 무한대수학반 | 따뜻한 아날로그 교실 칠판",
  description:
    "분필과 칠판 감성으로 만나는 수학과 코딩. 무한대수학반 교육용 웹앱.",
  keywords: ["수학", "교육", "칠판", "분필", "무한대수학반", "웹앱"],
  authors: [{ name: "무한대수학반" }],
  openGraph: {
    title: "∞ 무한대수학반 | 따뜻한 아날로그 교실 칠판",
    description: "분필과 칠판 감성으로 만나는 수학과 코딩",
    type: "website",
  },
};

/* ─── 루트 레이아웃 컴포넌트 ──────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* Google Fonts 사전 연결 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased bg-[#11382d]">
        {children}
      </body>
    </html>
  );
}
