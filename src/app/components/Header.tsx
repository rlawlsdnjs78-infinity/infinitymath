/**
 * Header.tsx
 * 전역 헤더 — layout.tsx 에 등록되어 모든 페이지에 항상 표시됩니다.
 *
 * [여백 처리 방식]
 * layout.tsx 래퍼의 px-* 패딩이 이 헤더에도 그대로 적용됩니다.
 * Header 안에 별도의 max-width / mx-auto 를 두지 않아
 * 항상 래퍼와 동일한 좌우 여백을 공유합니다.
 */

import NavMenu from "./NavMenu";

export default function Header() {
  return (
    <header
      id="header"
      className="relative z-20 w-full flex items-center justify-between py-4"
      style={{
        borderBottom: "2px dashed rgba(240,237,232,0.2)",
        background: "rgba(26,58,58,0.85)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* ── 로고 영역 ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/*
         * 무한대 기호 로고 (∞)
         * - 테두리 없음
         * - 분필 느낌의 노란 glow 효과
         */}
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

        {/* 사이트명 */}
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

      {/* ── 네비게이션 — Client Component ──────────────────────── */}
      <NavMenu />
    </header>
  );
}
