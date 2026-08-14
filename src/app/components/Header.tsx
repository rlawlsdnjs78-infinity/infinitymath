"use client";

/**
 * Header.tsx
 * 단일 행(1줄) 헤더
 *
 * [좌우 여백 완벽 유지]
 * - 좌측 여백(로고) & 우측 여백(회원가입): paddingLeft/Right inline clamp(1rem, 4vw, 5rem) 로 넉넉하게 유지
 * - 중앙: '브레인 서바이벌' (전체 헤더 기준 absolute 수학적 정중앙)
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavMenu from "./NavMenu";

export default function Header() {
  const pathname = usePathname();

  // '수식 피라미드' 페이지에서는 전역 헤더 숨김
  if (pathname === "/formula-pyramid") {
    return null;
  }

  return (
    <header
      id="header"
      className="w-full relative z-30 flex items-center justify-between py-3.5"
      style={{
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
        minHeight: "72px",
      }}
    >
      {/* ── [좌측] 로고 ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 z-10">
        <Link href="/" style={{ textDecoration: "none" }}>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              style={{
                fontFamily: "var(--font-chalk)",
                fontSize: "2.4rem",
                lineHeight: 1,
                color: "var(--chalk-yellow)",
                textShadow:
                  "0 0 12px rgba(203,167,210,0.5), 0 0 24px rgba(203,167,210,0.2)",
                userSelect: "none",
              }}
            >
              ∞
            </span>
            <span
              className="chalk-flicker"
              style={{
                fontFamily: "var(--font-chalk)",
                fontSize: "1.65rem",
                color: "var(--chalk-white)",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
            >
              무한대수학반
            </span>
          </div>
        </Link>
      </div>

      {/* ── [중앙] 브레인 서바이벌 (전체 헤더 기준 수학적 정중앙) ── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <NavMenu mode="center" />
      </div>

      {/* ── [우측] 로그인 & 회원가입 버튼 ───────────────────── */}
      <div className="flex items-center gap-4 z-10">
        <NavMenu mode="auth" />
      </div>
    </header>
  );
}
