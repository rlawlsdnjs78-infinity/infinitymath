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
import MobileMenu from "./MobileMenu";

export default function Header() {
  const pathname = usePathname();

  // '수식 피라미드' 및 '트리플 다이스' 페이지에서는 전역 헤더 숨김
  if (pathname === "/formula-pyramid" || pathname === "/triple-dice") {
    return null;
  }

  return (
    <header
      id="header"
      className="site-header w-full relative z-30 py-3.5"
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
        minHeight: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      {/* ── [모바일 좌측] ≡ 메뉴 버튼 (xl 미만에서만 표시) ───────── */}
      <div className="xl:hidden z-10">
        <MobileMenu />
      </div>

      {/* ── 로고: 모바일에서는 정중앙, 데스크톱(xl+)에서는 좌측 ───── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 xl:static xl:translate-x-0 xl:translate-y-0 flex items-center gap-3 z-10">
          <Link href="/" style={{ textDecoration: "none" }}>
            <div className="flex items-center gap-2 xl:gap-3">
              <span
                aria-hidden="true"
                className="text-[2rem] xl:text-[2.5rem]"
                style={{
                  fontFamily: "var(--font-chalk)",
                  lineHeight: 1,
                  color: "var(--chalk-yellow)",
                  textShadow:
                    "0 0 12px rgba(203,167,210,0.5), 0 0 24px rgba(203,167,210,0.2)",
                  userSelect: "none",
                  fontWeight: "bold",
                }}
              >
                ∞
              </span>
              <span
                className="chalk-flicker text-[1.4rem] xl:text-[1.65rem]"
                style={{
                  fontFamily: "var(--font-chalk)",
                  color: "var(--chalk-white)",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                  fontWeight: "bold",
                }}
              >
                무한대수학반
              </span>
            </div>
          </Link>
        </div>

        {/* ── [중앙] 메인 메뉴 (데스크톱 xl+ 에서만, 전체 헤더 기준 수학적 정중앙) ── */}
        <div className="hidden xl:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <NavMenu mode="center" />
        </div>

        {/* ── [우측] 로그인 & 회원가입 버튼 (데스크톱 xl+ 에서만) ── */}
        <div className="hidden xl:flex items-center gap-4 z-10">
          <NavMenu mode="auth" />
        </div>
      </header>
  );
}
