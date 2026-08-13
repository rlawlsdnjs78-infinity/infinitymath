/**
 * Header.tsx
 * 전역 헤더 — layout.tsx 에 등록되어 모든 페이지에 항상 표시됩니다.
 *
 * [레이아웃 규칙]
 * - layout.tsx 의 래퍼가 좌우 padding 을 담당합니다.
 * - Header 는 래퍼 안에 자연스럽게 배치되어 동일한 좌우 여백을 공유합니다.
 */

import NavMenu from "./NavMenu";

export default function Header() {
  return (
    <header
      id="header"
      className="relative z-20 w-full"
      style={{
        borderBottom: "2px dashed rgba(240,237,232,0.2)",
        background: "rgba(26,58,58,0.85)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* 내부 콘텐츠 — max-width 로 과도하게 넓어지지 않도록 제한 */}
      <div className="max-w-6xl mx-auto flex items-center justify-between py-4">

        {/* ── 로고 영역 ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/*
           * 무한대 기호 로고
           * - 테두리 없음
           * - lucide-react 대신 텍스트 기반 ∞ 사용
           * - 분필 느낌의 옅은 glow 효과 적용
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

          {/* 사이트명 — ∞ 기호 없이 한글만 표시 */}
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

        {/* ── 네비게이션 — Client Component (마우스 이벤트 포함) ──── */}
        <NavMenu />
      </div>
    </header>
  );
}
