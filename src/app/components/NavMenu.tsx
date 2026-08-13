/**
 * NavMenu.tsx
 * 네비게이션 메뉴 (Client Component)
 * - mode="auth": 상단 헤더 우측 '로그인', '회원가입' 버튼
 * - mode="center": 하단 메뉴 바 중앙 '브레인 서바이벌' 드롭다운 메뉴
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogIn, UserPlus, Brain } from "lucide-react";

export default function NavMenu({ mode }: { mode: "center" | "auth" }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // mode="center": 중앙 브레인 서바이벌
  if (mode === "center") {
    return (
      <nav aria-label="메인 네비게이션" className="relative">
        <div
          className="relative py-1"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-1.5 rounded-md transition-all duration-200 hover:bg-teal-900/60"
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
              className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50 min-w-[200px]"
              style={{ animation: "slideInUp 0.2s ease forwards" }}
            >
              <div
                className="chalk-box-straight shadow-2xl p-3 rounded flex flex-col gap-1.5"
                style={{
                  background: "rgba(20, 48, 48, 0.98)",
                  backdropFilter: "blur(12px)",
                  border: "2px dashed var(--chalk-yellow)",
                }}
              >
                <Link
                  href="/formula-pyramid"
                  className="flex items-center gap-2.5 px-4 py-3 text-lg rounded transition-colors duration-150 hover:bg-teal-800/90"
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
    );
  }

  // mode="auth": 우측 로그인 / 회원가입 버튼
  return (
    <div className="flex items-center gap-4">
      {/* 로그인 버튼 */}
      <Link
        href="#"
        className="rounded-md transition-all duration-200 hover:bg-white/15 hover:border-yellow-300"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "9px 22px",
          fontFamily: "var(--font-chalk)",
          fontSize: "1.15rem",
          lineHeight: 1,
          color: "var(--chalk-white)",
          border: "1.5px dashed var(--chalk-border-bright)",
          textDecoration: "none",
          background: "rgba(255, 255, 255, 0.08)",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        }}
      >
        <LogIn size={18} className="text-gray-300 flex-shrink-0" />
        <span>로그인</span>
      </Link>

      {/* 회원가입 버튼 */}
      <Link
        href="#"
        className="rounded-md transition-all duration-200 hover:scale-105 hover:bg-yellow-300"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "9px 22px",
          fontFamily: "var(--font-chalk)",
          fontSize: "1.15rem",
          lineHeight: 1,
          color: "#122a2a",
          background: "var(--chalk-yellow)",
          fontWeight: 700,
          border: "1.5px solid var(--chalk-yellow)",
          textDecoration: "none",
          boxShadow: "0 0 12px rgba(245, 230, 66, 0.4)",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        }}
      >
        <UserPlus size={18} className="flex-shrink-0" />
        <span>회원가입</span>
      </Link>
    </div>
  );
}
