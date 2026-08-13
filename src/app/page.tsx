/**
 * src/app/page.tsx
 * 🏫 무한대수학반 메인 홈페이지 (아날로그 교실 칠판 감성)
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Pencil, ChevronRight, GraduationCap } from "lucide-react";

/* ─── 타이핑 효과 훅 ─────────────────────────────────────────────── */
function useTypingEffect(text: string, speed: number = 80) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

/* ─── 헤더 컴포넌트 ────────────────────────────────────────────── */
function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      id="site-header"
      className={`fixed top-0 left-0 right-0 w-full z-50 header-board transition-all duration-300 ${
        scrolled ? "shadow-[0_4px_20px_rgba(0,0,0,0.5)]" : ""
      }`}
    >
      <div className="header-full-bar">
        {/* ── 1. 좌측 로고 (3.5rem / 56px 고정 좌측 여백) ── */}
        <Link
          href="/"
          id="logo-link"
          className="flex items-center gap-3 group shrink-0 select-none"
          aria-label="무한대수학반 홈"
        >
          <span
            className="chalk-text-yellow text-3xl sm:text-4xl leading-none group-hover:scale-110 transition-transform duration-200"
            aria-hidden="true"
          >
            ∞
          </span>

          <div className="flex items-center gap-2.5">
            <span className="chalk-font chalk-text-white text-xl sm:text-2xl font-bold tracking-wide">
              INFINITY MATH CLASS
            </span>
            <span className="chalk-font chalk-text-yellow text-xl sm:text-2xl font-bold tracking-wide">
              무한대수학반
            </span>
          </div>
        </Link>

        {/* ── 2. 수식 피라미드 버튼 (화면 100vw의 50% 진짜 중앙) ── */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative group">
            <Link
              href="/pyramid"
              id="nav-pyramid-btn"
              className="btn-chalk text-sm py-1.5 px-4 rounded-lg flex items-center gap-2"
            >
              <span>수식 피라미드</span>
            </Link>

            {/* 여유있는 테두리 패딩의 호버 툴팁 */}
            <div
              className="absolute top-full mt-3 left-1/2 -translate-x-1/2 
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                         pointer-events-none whitespace-nowrap bg-[#0a251e] border-2 border-dashed border-[#fef08a] 
                         text-[#fef08a] chalk-font text-lg px-5 py-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.7)] rounded-xl z-50"
              role="tooltip"
            >
              🎮 클릭하여 입장하기
            </div>
          </div>
        </div>

        {/* ── 3. 우측 보조 공간 ── */}
        <div className="w-16 shrink-0 hidden sm:block" />
      </div>
    </header>
  );
}

/* ─── 히어로 섹션 ───────────────────────────────────────────────── */
function HeroSection() {
  const { displayed, done } = useTypingEffect("나만의 교육용 웹앱 만들기", 80);

  return (
    <section
      id="hero"
      className="w-full max-w-4xl mx-auto py-6 px-4 flex flex-col items-center justify-center text-center"
      aria-label="히어로 섹션"
    >
      {/* 아날로그 교실 뱃지 */}
      <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 chalk-border bg-[#0a251e]/60">
        <GraduationCap size={18} className="text-[#fef08a]" />
        <span className="chalk-font chalk-text-yellow text-base sm:text-lg tracking-wide">
          🏫 아날로그 교실 칠판 — v1.0
        </span>
      </div>

      {/* 오늘의 수업 메모 */}
      <div className="w-full max-w-md mx-auto mb-5 p-5 chalk-border bg-[#0a251e]/80 text-left relative">
        <div className="flex items-center justify-between border-b border-dashed border-slate-600 pb-2 mb-2">
          <span className="chalk-font chalk-text-green text-base">
            [오늘의 수학 수업 메모]
          </span>
          <span className="chalk-font chalk-text-pink text-xs">
            ★ 중요 공식
          </span>
        </div>
        <p className="chalk-font chalk-text-white text-lg sm:text-xl">
          <span className="chalk-text-yellow">Q.</span> 코딩으로 수학을 배운다면?
        </p>
        <p className="chalk-font chalk-text-green text-lg sm:text-xl mt-1">
          <span className="chalk-text-yellow">A.</span> f(x) = ∞ (무한한 가능성!)
        </p>
      </div>

      {/* 메인 타이틀 (타이핑) */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 leading-tight text-center">
        <span className="chalk-text-yellow tracking-wider">{displayed}</span>
        <span className="animate-pulse text-[#fef08a] ml-1" aria-hidden="true">
          |
        </span>
      </h1>

      {/* 서브 설명 */}
      <p className="chalk-font chalk-text-white text-xl sm:text-2xl max-w-lg mx-auto mb-3 text-center leading-relaxed">
        칠판에 분필로 적어가듯 쉽고 따뜻하게,
        <br />
        <span className="chalk-text-green">
          나만의 멋진 교육용 웹앱을 완성해보세요.
        </span>
      </p>

      {/* 서브 태그라인 */}
      <p className="chalk-font chalk-text-pink text-lg sm:text-xl mb-6 text-center tracking-widest">
        ~ 교실 칠판 · 손글씨 노트 · 수학 & 코딩 ~
      </p>

      {/* CTA 버튼 */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          id="cta-main-btn"
          className="btn-chalk text-lg sm:text-xl py-3 px-8 rounded-xl flex items-center gap-2"
          onClick={() => alert("✏️ 칠판 수업 기능 준비 중입니다!")}
        >
          <Pencil size={20} />
          <span>학습 시작하기</span>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 스탯 카운터 */}
      <div className="grid grid-cols-3 gap-8 w-full max-w-md mx-auto border-t-2 border-dashed border-slate-600/60 pt-5 text-center">
        {[
          { value: "100+", label: "칠판 예제" },
          { value: "∞", label: "무한 수학" },
          { value: "24/7", label: "자유 학습" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="chalk-font chalk-text-yellow text-3xl font-bold">
              {stat.value}
            </div>
            <div className="chalk-font chalk-text-white text-base mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── 푸터 ─────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t-2 border-dashed border-slate-600/40 py-5 w-full mt-auto text-center">
      <p className="chalk-font chalk-text-white text-base">
        &copy; {new Date().getFullYear()} 무한대수학반. All rights reserved.
      </p>
    </footer>
  );
}

/* ─── 메인 페이지 ─────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between bg-[#11382d] text-[#f8fafc] overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full pt-24 pb-8 flex flex-col items-center justify-center">
        <HeroSection />
      </main>
      <Footer />
    </div>
  );
}
