/**
 * Header.tsx
 * 전역 헤더 컴포넌트 — layout.tsx 에 등록되어 모든 페이지에 표시됩니다.
 * 이벤트 핸들러가 없는 Server Component 입니다.
 * 마우스 인터랙션이 필요한 nav 부분은 NavMenu (Client Component) 를 사용합니다.
 */

import { Calculator } from "lucide-react";
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
        /* 헤더는 래퍼의 좌우 padding 을 무시하고 꽉 차도록 */
        marginLeft: "calc(-1 * var(--page-px))",
        marginRight: "calc(-1 * var(--page-px))",
        paddingLeft: "var(--page-px)",
        paddingRight: "var(--page-px)",
      }}
    >
      {/* 내부 콘텐츠는 max-width 제한 */}
      <div
        className="max-w-6xl mx-auto flex items-center justify-between py-4"
      >
        {/* 로고 */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-sm flex-shrink-0"
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
              /* 텍스트가 너무 길 때 줄바꿈 방지 */
              whiteSpace: "nowrap",
            }}
          >
            ∞ 무한대 수학반
          </span>
        </div>

        {/* 네비게이션 — Client Component */}
        <NavMenu />
      </div>
    </header>
  );
}
