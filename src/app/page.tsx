/**
 * page.tsx
 * 메인 홈 페이지 (Server Component)
 * ─ 상단 헤더 (로고 + 네비게이션)
 * ─ Hero Section (환영 문구 + 설명 + CTA 버튼)
 * ─ 하단 푸터 (카피라이트)
 *
 * 디자인 컨셉: 아날로그 칠판 & 노트 감성
 * 색상: 짙은 칠판색 배경 + 분필 느낌 텍스트
 * 폰트: Nanum Pen Script / Gowun Dodum
 */

import { BookOpen, Star, Pencil, ChevronRight, Calculator } from "lucide-react";
import NavMenu from "./components/NavMenu";

/* ─────────────────────────────────────────────────────────────────────────
   서브 컴포넌트들 (Server Component — 이벤트 핸들러 없음)
───────────────────────────────────────────────────────────────────────── */

/** 칠판 먼지 장식 (분필 가루 파티클) */
function ChalkDust() {
  // 먼지 파티클 데이터 정의
  const particles = [
    { left: "12%", top: "20%", delay: "0s",   size: 3, color: "rgba(240,237,232,0.4)" },
    { left: "25%", top: "65%", delay: "0.8s", size: 2, color: "rgba(245,230,66,0.35)" },
    { left: "45%", top: "15%", delay: "1.4s", size: 4, color: "rgba(240,237,232,0.3)" },
    { left: "70%", top: "45%", delay: "0.3s", size: 2, color: "rgba(125,211,252,0.4)" },
    { left: "85%", top: "25%", delay: "2s",   size: 3, color: "rgba(249,168,212,0.35)" },
    { left: "60%", top: "80%", delay: "1.1s", size: 2, color: "rgba(240,237,232,0.25)" },
    { left: "90%", top: "70%", delay: "0.6s", size: 3, color: "rgba(245,230,66,0.3)" },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full dust-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

/** 칠판 격자 배경선 */
function ChalkboardGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 47px,
            rgba(240,237,232,0.06) 47px,
            rgba(240,237,232,0.06) 48px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 47px,
            rgba(240,237,232,0.03) 47px,
            rgba(240,237,232,0.03) 48px
          )
        `,
      }}
    />
  );
}

/** 기능 카드 (가짜 placeholder 카드) */
function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  delay,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  description: string;
  color: string;
  delay: string;
}) {
  return (
    <div
      className="chalk-box p-5 flex flex-col gap-3 slide-in-up"
      style={{
        animationDelay: delay,
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(2px)",
      }}
    >
      {/* 아이콘 + 제목 */}
      <div className="flex items-center gap-2" style={{ color }}>
        <Icon size={24} strokeWidth={1.5} />
        <span
          className="text-lg font-medium"
          style={{ fontFamily: "var(--font-chalk)", color }}
        >
          {title}
        </span>
      </div>
      {/* 설명 */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}
      >
        {description}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   헤더 컴포넌트
───────────────────────────────────────────────────────────────────────── */
function Header() {
  return (
    <header
      id="header"
      className="relative z-20 w-full px-6 py-4"
      style={{
        borderBottom: "2px dashed rgba(240,237,232,0.2)",
        background: "rgba(26,58,58,0.8)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-sm"
            style={{
              border: "2px dashed var(--chalk-yellow)",
              color: "var(--chalk-yellow)",
            }}
          >
            <Calculator size={20} strokeWidth={1.5} />
          </div>
          <span
            className="text-2xl chalk-flicker"
            style={{
              fontFamily: "var(--font-chalk)",
              color: "var(--chalk-white)",
              letterSpacing: "0.05em",
            }}
          >
            ∞ 무한대 수학반
          </span>
        </div>

        {/* 네비게이션 — Client Component (마우스 이벤트 포함) */}
        <NavMenu />
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Hero Section
───────────────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <main
      id="hero"
      className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 overflow-hidden"
    >
      {/* 배경 그리드 & 먼지 */}
      <ChalkboardGrid />
      <ChalkDust />

      {/* 칠판 프레임 영역 */}
      <div
        className="relative z-10 chalkboard-frame w-full max-w-4xl mx-auto p-10 md:p-14"
        style={{ background: "rgba(20, 50, 50, 0.9)" }}
      >
        {/* 칠판 상단 장식선 */}
        <div
          aria-hidden="true"
          className="absolute top-3 left-6 right-6 h-px"
          style={{ background: "rgba(240,237,232,0.15)" }}
        />
        <div
          aria-hidden="true"
          className="absolute top-5 left-6 right-6 h-px"
          style={{ background: "rgba(240,237,232,0.08)" }}
        />

        {/* 별 아이콘 장식 */}
        <div
          aria-hidden="true"
          className="absolute top-8 right-10 float-anim"
          style={{ color: "var(--chalk-yellow)", opacity: 0.7 }}
        >
          <Star size={28} strokeWidth={1} />
        </div>
        <div
          aria-hidden="true"
          className="absolute top-14 right-20 float-anim"
          style={{ color: "var(--chalk-pink)", opacity: 0.5, animationDelay: "1s" }}
        >
          <Star size={16} strokeWidth={1} />
        </div>

        {/* 소제목 */}
        <p
          className="slide-in-left mb-4 text-base md:text-lg"
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--chalk-green)",
            letterSpacing: "0.1em",
          }}
        >
          ✦ Welcome to ∞ 무한대 수학반
        </p>

        {/* 메인 타이틀 — h1 (페이지당 1개) */}
        <h1
          className="slide-in-left mb-6 leading-snug"
          style={{
            fontFamily: "var(--font-chalk)",
            fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
            color: "var(--chalk-white)",
            animationDelay: "0.1s",
          }}
        >
          나만의{" "}
          <span className="chalk-underline" style={{ color: "var(--chalk-yellow)" }}>
            교육용 웹앱
          </span>{" "}
          만들기
        </h1>

        {/* 설명 텍스트 (notebook 줄 느낌) */}
        <div
          className="slide-in-up mb-8 p-5 notebook-lines rounded-sm"
          style={{
            animationDelay: "0.2s",
            border: "1px dashed var(--chalk-border)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <p
            className="text-base md:text-lg leading-loose"
            style={{ fontFamily: "var(--font-body)", color: "var(--chalk-dim)" }}
          >
            수학을 사랑하는 모든 학생을 위한 공간입니다.{" "}
            <span style={{ color: "var(--chalk-blue)" }}>문제 풀이</span>부터{" "}
            <span style={{ color: "var(--chalk-pink)" }}>개념 학습</span>까지,
            <br className="hidden md:block" />
            칠판 앞에 앉은 것처럼 편안하게 배워봐요. 지금 시작해보세요! 🎓
          </p>
        </div>

        {/* CTA 버튼 영역 */}
        <div
          className="slide-in-up flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ animationDelay: "0.35s" }}
        >
          {/* 메인 CTA 버튼 (Placeholder) */}
          <button
            id="cta-start-btn"
            type="button"
            className="btn-chalk flex items-center gap-2"
          >
            <Pencil size={18} strokeWidth={1.5} />
            수업 시작하기
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>

          {/* 부가 링크 */}
          <a
            href="#features"
            className="flex items-center gap-1 transition-opacity duration-200 hover:opacity-80"
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--chalk-dim)",
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            <BookOpen size={14} strokeWidth={1.5} />
            기능 둘러보기 →
          </a>
        </div>
      </div>

      {/* 기능 카드 섹션 */}
      <section
        id="features"
        className="relative z-10 w-full max-w-4xl mx-auto mt-12"
        aria-label="주요 기능"
      >
        <h2
          className="text-center mb-8"
          style={{
            fontFamily: "var(--font-chalk)",
            fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
            color: "var(--chalk-dim)",
          }}
        >
          ─ 무엇을 배울 수 있나요? ─
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <FeatureCard
            icon={BookOpen}
            title="개념 강의"
            description="핵심 수학 개념을 분필로 칠판에 쓰듯 차근차근 설명해드립니다."
            color="var(--chalk-blue)"
            delay="0s"
          />
          <FeatureCard
            icon={Pencil}
            title="문제 풀이"
            description="단계별 풀이 과정을 통해 문제 해결 능력을 키워보세요."
            color="var(--chalk-green)"
            delay="0.1s"
          />
          <FeatureCard
            icon={Star}
            title="성취 배지"
            description="학습 목표를 달성할 때마다 특별한 분필 배지를 획득하세요!"
            color="var(--chalk-yellow)"
            delay="0.2s"
          />
        </div>
      </section>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   푸터 컴포넌트
───────────────────────────────────────────────────────────────────────── */
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="footer"
      className="relative z-10 w-full px-6 py-5 text-center"
      style={{
        borderTop: "2px dashed rgba(240,237,232,0.15)",
        background: "rgba(20,45,45,0.9)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--chalk-dim)",
          fontSize: "0.85rem",
        }}
      >
        © {year} ∞ 무한대 수학반. All rights reserved.
        <span className="mx-2" aria-hidden="true">✦</span>
        수학으로 무한한 가능성을 열어드립니다.
      </p>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   메인 페이지 컴포넌트 (default export)
───────────────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <Footer />
    </>
  );
}
