/**
 * layout.tsx
 * 루트 레이아웃
 *
 * [여백 전략]
 * - wrapper div 는 여백을 담당하지 않습니다.
 * - 각 섹션(Header, page content)이 자신의 px 를 직접 가집니다.
 * - 이 방식이 overflow, flex 등의 부작용 없이 가장 신뢰성이 높습니다.
 */

import type { Metadata } from "next";
import { Nanum_Pen_Script, Gowun_Dodum } from "next/font/google";
import Header from "./components/Header";
import "./globals.css";

/* ─── 폰트 ─────────────────────────────────────────────────────────────── */
const nanumPen = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-nanum-pen",
  display: "swap",
});

const gowunDodum = Gowun_Dodum({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gowun",
  display: "swap",
});

/* ─── 메타데이터 ───────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "무한대 수학반 | 나만의 교육용 웹앱",
  description:
    "칠판 감성의 교육용 웹앱 플랫폼. 무한대 수학반에서 즐겁게 수학을 배워보세요.",
  keywords: ["수학", "교육", "무한대수학반", "학습", "칠판"],
  authors: [{ name: "무한대 수학반" }],
};

/* ─── 레이아웃 ─────────────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${nanumPen.variable} ${gowunDodum.variable}`}>
      <body>
        {/*
         * wrapper: flex 컬럼만 담당. 여백은 각 섹션이 직접 관리합니다.
         */}
        <div className="min-h-screen flex flex-col">
          {/* 전역 헤더 — Header 컴포넌트 자체에 좌우 padding 있음 */}
          <Header />

          {/* 페이지 콘텐츠 */}
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
