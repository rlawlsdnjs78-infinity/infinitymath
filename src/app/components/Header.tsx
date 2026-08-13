/**
 * Header.tsx
 * 전역 헤더 — 상단 영역과 메뉴 바 영역을 물리적으로 완전 분리
 *
 * Layer 1 (상단 헤더): 좌측 로고 <-------------------> 우측 로그인/회원가입
 * Layer 2 (하단 메뉴 바): ---------------- [중앙 브레인 서바이벌] ----------------
 */

import Link from "next/link";
import NavMenu from "./NavMenu";

export default function Header() {
  return (
    <header
      id="header"
      className="w-full relative z-30"
      style={{
        background: "rgba(26, 58, 58, 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "2px dashed rgba(240, 237, 232, 0.2)",
      }}
    >
      {/* ── Layer 1: 상단 헤더 (좌: 로고, 우: 로그인/회원가입) ─────────────── */}
      <div
        className="w-full flex items-center justify-between py-3"
        style={{
          paddingLeft: "clamp(1rem, 4vw, 5rem)",
          paddingRight: "clamp(1rem, 4vw, 5rem)",
          borderBottom: "1px dashed rgba(240, 237, 232, 0.1)",
        }}
      >
        {/* 좌측 로고 */}
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
                  "0 0 12px rgba(245,230,66,0.5), 0 0 24px rgba(245,230,66,0.2)",
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
              무한대 수학반
            </span>
          </div>
        </Link>

        {/* 우측 로그인 / 회원가입 버튼 영역 (독립 배치) */}
        <NavMenu mode="auth" />
      </div>

      {/* ── Layer 2: 하단 네비게이션 메뉴 바 (중앙 브레인 서바이벌 단독) ──── */}
      <div className="w-full flex justify-center py-1.5 bg-teal-950/40">
        <NavMenu mode="center" />
      </div>
    </header>
  );
}
