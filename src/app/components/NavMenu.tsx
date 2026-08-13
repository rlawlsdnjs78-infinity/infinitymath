/**
 * NavMenu.tsx
 * 네비게이션 메뉴 (Client Component)
 * - 중앙: '브레인 서바이벌' (호버 시 드롭다운 '수식 피라미드')
 * - 우측: '로그인', '회원가입' 버튼 (넉넉한 내부 및 외부 여백 적용)
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogIn, UserPlus, Brain } from "lucide-react";

export default function NavMenu() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex items-center gap-8 md:gap-14">
      {/* ── 중앙: 브레인 서바이벌 (드롭다운 메뉴) ────────────────── */}
      <nav aria-label="메인 네비게이션">
        <div
          className="relative py-2"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded transition-all duration-200 hover:bg-teal-900/40"
            style={{
              fontFamily: "var(--font-chalk)",
              fontSize: "1.45rem",
              color: isDropdownOpen ? "var(--chalk-yellow)" : "var(--chalk-white)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            <Brain size={22} className="text-yellow-400" />
            <span>브레인 서바이벌</span>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180 text-yellow-400" : "text-gray-300"
              }`}
            />
          </button>

          {/* 드롭다운 메뉴 (수식 피라미드) */}
          {isDropdownOpen && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50 min-w-[180px]"
              style={{ animation: "slideInUp 0.2s ease forwards" }}
            >
              <div
                className="chalk-box-straight shadow-2xl p-2.5 rounded flex flex-col gap-1.5"
                style={{
                  background: "rgba(20, 48, 48, 0.98)",
                  backdropFilter: "blur(12px)",
                  border: "2px dashed var(--chalk-yellow)",
                }}
              >
                <Link
                  href="/formula-pyramid"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-base rounded transition-colors duration-150 hover:bg-teal-800/90"
                  style={{
                    fontFamily: "var(--font-chalk)",
                    color: "var(--chalk-yellow)",
                    textDecoration: "none",
                  }}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block flex-shrink-0" />
                  <span>수식 피라미드</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── 우측: 로그인 & 회원가입 버튼 (여백 넉넉히 부여) ──────────────────────── */}
      <div className="flex items-center gap-4">
        {/* 로그인 버튼 */}
        <Link
          href="#"
          className="px-5 py-2.5 text-base rounded-md flex items-center gap-2 transition-all duration-200 hover:bg-white/10 hover:border-yellow-300"
          style={{
            fontFamily: "var(--font-chalk)",
            color: "var(--chalk-white)",
            border: "1.5px dashed var(--chalk-border-bright)",
            textDecoration: "none",
            background: "rgba(255, 255, 255, 0.06)",
            letterSpacing: "0.03em",
          }}
        >
          <LogIn size={18} className="text-gray-300" />
          <span>로그인</span>
        </Link>

        {/* 회원가입 버튼 */}
        <Link
          href="#"
          className="px-5 py-2.5 text-base rounded-md flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:bg-yellow-300"
          style={{
            fontFamily: "var(--font-chalk)",
            color: "#122a2a",
            background: "var(--chalk-yellow)",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 0 12px rgba(245, 230, 66, 0.4)",
            letterSpacing: "0.03em",
          }}
        >
          <UserPlus size={18} />
          <span>회원가입</span>
        </Link>
      </div>
    </div>
  );
}
