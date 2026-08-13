/**
 * NavMenu.tsx
 * 네비게이션 메뉴 — 마우스 이벤트 핸들러를 사용하므로 Client Component
 */

"use client";

/** 네비게이션 메뉴 아이템 목록 */
const NAV_ITEMS = ["수업 소개", "강사 소개", "수강 신청", "문의하기"] as const;

export default function NavMenu() {
  return (
    <nav id="main-nav" aria-label="주 메뉴">
      <ul className="hidden md:flex items-center gap-6 list-none">
        {NAV_ITEMS.map((item) => (
          <li key={item}>
            <a
              href="#"
              className="nav-link transition-all duration-200"
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--chalk-dim)",
                fontSize: "0.95rem",
                textDecoration: "none",
                paddingBottom: "2px",
                borderBottom: "1px dashed transparent",
              }}
              onMouseOver={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = "var(--chalk-white)";
                el.style.borderBottomColor = "var(--chalk-white)";
              }}
              onMouseOut={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = "var(--chalk-dim)";
                el.style.borderBottomColor = "transparent";
              }}
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
