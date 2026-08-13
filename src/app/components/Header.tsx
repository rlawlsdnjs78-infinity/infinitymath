/**
 * Header.tsx
 * 전역 헤더
 */

import Link from "next/link";
import NavMenu from "./NavMenu";

export default function Header() {
  return (
    <header
      id="header"
      style={{
        /* ── 좌우 여백: clamp 로 반응형 padding 직접 적용 ── */
        paddingLeft:  "clamp(1rem, 4vw, 5rem)",
        paddingRight: "clamp(1rem, 4vw, 5rem)",
        paddingTop:    "1rem",
        paddingBottom: "1rem",
        /* ── 칠판 스타일 ── */
        borderBottom: "2px dashed rgba(240,237,232,0.2)",
        background:   "rgba(26,58,58,0.85)",
        backdropFilter: "blur(10px)",
        /* ── 헤더 내부 flex ── */
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        position:       "relative",
        zIndex:          20,
        width:          "100%",
      }}
    >
      {/* ── 로고 ──────────────────────────────────────────────── */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* ∞ 무한대 기호 로고 — 테두리 없음, 노란 glow */}
          <span
            aria-hidden="true"
            style={{
              fontFamily: "var(--font-chalk)",
              fontSize:   "2.4rem",
              lineHeight:  1,
              color:       "var(--chalk-yellow)",
              textShadow:
                "0 0 12px rgba(245,230,66,0.5), 0 0 24px rgba(245,230,66,0.2)",
              userSelect: "none",
            }}
          >
            ∞
          </span>

          {/* 사이트명 */}
          <span
            className="chalk-flicker"
            style={{
              fontFamily:    "var(--font-chalk)",
              fontSize:      "1.6rem",
              color:         "var(--chalk-white)",
              letterSpacing: "0.04em",
              whiteSpace:    "nowrap",
            }}
          >
            무한대 수학반
          </span>
        </div>
      </Link>

      {/* ── 네비게이션 (Client Component) ──────────────────────── */}
      <NavMenu />
    </header>
  );
}
