/**
 * NavMenu.tsx
 * 네비게이션 메뉴 (Client Component)
 * - 중앙: '브레인 서바이벌' (호버 시 드롭다운 '수식 피라미드')
 * - 우측: '로그인', '회원가입' 버튼
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogIn, UserPlus, Brain } from "lucide-react";

export default function NavMenu() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex items-center gap-6 md:gap-10">
      {/* ── 중앙: 브레인 서바이벌 (드롭다운 메뉴) ────────────────── */}
      <nav aria-label="메인 네비게이션">
        <div
          className="relative py-2"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <button
            type="button"
            className="flex items-center gap-1.5 transition-all duration-200"
            style={{
              fontFamily: "var(--font-chalk)",
              fontSize: "1.35rem",
              color: isDropdownOpen ? "var(--chalk-yellow)" : "var(--chalk-white)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.03em",
            }}
          >
            <Brain size={20} className="text-yellow-400" />
            <span>브레인 서바이벌</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180 text-yellow-400" : "text-gray-300"
              }`}
            />
          </button>

          {/* 드롭다운 메뉴 (수식 피라미드) */}
          {isDropdownOpen && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50 min-w-[160px]"
              style={{ animation: "slideInUp 0.2s ease forwards" }}
            >
              <div
                className="chalk-box-straight shadow-2xl p-2 rounded flex flex-col gap-1"
                style={{
                  background: "rgba(20, 48, 48, 0.95)",
                  backdropFilter: "blur(12px)",
                  border: "2px dashed var(--chalk-yellow)",
                }}
              >
                <Link
                  href="/formula-pyramid"
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors duration-150 hover:bg-teal-800/80"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "var(--chalk-yellow)",
                    textDecoration: "none",
                  }}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                  <span>수식 피라미드</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── 우측: 로그인 & 회원가입 버튼 ──────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="#"
          className="px-3.5 py-1.5 text-sm rounded flex items-center gap-1.5 transition-all duration-200 hover:opacity-90"
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--chalk-white)",
            border: "1px dashed var(--chalk-border-bright)",
            textDecoration: "none",
            background: "rgba(255, 255, 255, 0.05)",
          }}
        >
          <LogIn size={15} />
          <span>로그인</span>
        </Link>

        <Link
          href="#"
          className="px-3.5 py-1.5 text-sm rounded flex items-center gap-1.5 transition-all duration-200 hover:scale-105"
          style={{
            fontFamily: "var(--font-body)",
            color: "#1a3a3a",
            background: "var(--chalk-yellow)",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 0 8px rgba(245, 230, 66, 0.4)",
          }}
        >
          <UserPlus size={15} />
          <span>회원가입</span>
        </Link>
      </div>
    </div>
  );
}
