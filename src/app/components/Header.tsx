/**
 * Header.tsx
 * 전역 헤더
 *
 * [3단 분할 레이아웃]
 * - 좌측: 로고 (∞ 무한대 수학반)
 * - 중앙: '브레인 서바이벌' 메뉴 (호버 시 드롭다운 '수식 피라미드')
 * - 우측: '로그인' & '회원가입' 버튼 (넉넉한 여백)
 */

import Link from "next/link";
import NavMenu from "./NavMenu";

export default function Header() {
  return (
    <header
      id="header"
      style={{
        paddingLeft: "clamp(1rem, 4vw, 5rem)",
        paddingRight: "clamp(1rem, 4vw, 5rem)",
        paddingTop: "0.85rem",
        paddingBottom: "0.85rem",
        borderBottom: "2px dashed rgba(240,237,232,0.2)",
        background: "rgba(26,58,58,0.88)",
        backdropFilter: "blur(10px)",
        position: "relative",
        zIndex: 30,
        width: "100%",
      }}
    >
      {/* 3단 Grid 레이아웃: 좌(로고), 중(브레인 서바이벌), 우(로그인/회원가입) */}
      <div className="w-full max-w-[1700px] mx-auto grid grid-cols-3 items-center">
        {/* ── [좌측] 로고 ─────────────────────────────────────────── */}
        <div className="flex items-center justify-start">
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
                  fontSize: "1.6rem",
                  color: "var(--chalk-white)",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                무한대 수학반
              </span>
            </div>
          </Link>
        </div>

        {/* ── [중앙] 브레인 서바이벌 드롭다운 메뉴 (정중앙) ──────────── */}
        <div className="flex items-center justify-center">
          <NavMenu mode="center" />
        </div>

        {/* ── [우측] 로그인 & 회원가입 버튼 ─────────────────────────── */}
        <div className="flex items-center justify-end">
          <NavMenu mode="auth" />
        </div>
      </div>
    </header>
  );
}
