/**
 * layout.tsx
 * 루트 레이아웃 — 손글씨 폰트(Nanum Pen Script / Gowun Dodum)를
 * next/font/google 을 통해 로드하고 전역 메타데이터를 설정합니다.
 */

import type { Metadata } from "next";
import { Nanum_Pen_Script, Gowun_Dodum } from "next/font/google";
import "./globals.css";

/* ─── 폰트 설정 ────────────────────────────────────────────────────────── */

/** 칠판 제목 / 강조 텍스트용 손글씨 폰트 */
const nanumPen = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-nanum-pen",
  display: "swap",
});

/** 본문용 고운돋움 (가독성 있는 손글씨 계열) */
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

/* ─── 레이아웃 컴포넌트 ────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${nanumPen.variable} ${gowunDodum.variable}`}
    >
      {/*
       * body에 두 폰트 CSS 변수를 적용.
       * globals.css 에서 --font-chalk / --font-body 가 이 변수를 참조합니다.
       */}
      <body>{children}</body>
    </html>
  );
}
