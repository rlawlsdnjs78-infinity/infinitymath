/**
 * layout.tsx
 * 루트 레이아웃 — 전역 폰트, 메타데이터, 헤더, 좌우 여백 설정
 *
 * [전역 레이아웃 규칙]
 * ① 모든 페이지에서 좌우 여백이 항상 유지됩니다 (--page-px CSS 변수로 제어)
 * ② Header 가 이 레이아웃에 포함되어 모든 하위 페이지에서 항상 표시됩니다
 */

import type { Metadata } from "next";
import { Nanum_Pen_Script, Gowun_Dodum } from "next/font/google";
import Header from "./components/Header";
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
      <body>
        {/*
         * [전역 페이지 래퍼]
         * - overflow-x-hidden : 가로 스크롤 방지
         * - px-* 클래스 : 모든 화면 크기에서 좌우 여백 보장
         *   모바일: 16px / 태블릿: 32px / 데스크탑: 64px / 와이드: 96px
         * - --page-px CSS 변수 : Header 컴포넌트가 full-width로 펼쳐질 때 사용
         */}
        <div
          className="min-h-screen flex flex-col overflow-x-hidden
                     px-4 sm:px-8 md:px-16 lg:px-24"
          style={
            {
              "--page-px": "clamp(1rem, 5vw, 6rem)",
            } as React.CSSProperties
          }
        >
          {/* ① 전역 헤더 — 모든 페이지에서 항상 유지됩니다 */}
          <Header />

          {/*
           * ② 페이지 콘텐츠 영역
           * flex-1 로 남은 높이를 전부 차지해 Footer 를 바닥에 고정합니다.
           */}
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
