/**
 * NavMenu.tsx
 * 네비게이션 메뉴 (Client Component)
 * - mode="auth": 상단 헤더 우측 '로그인', '회원가입' 버튼
 * - mode="center": 하단 메뉴 바 중앙 '브레인 서바이벌' 드롭다운 메뉴
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogIn, UserPlus, Brain, Gamepad2 } from "lucide-react";

export default function NavMenu({ mode }: { mode: "center" | "auth" }) {
  const [isBrainOpen, setIsBrainOpen] = useState(false);
  const [isMiniOpen, setIsMiniOpen] = useState(false);
  const [isClubOpen, setIsClubOpen] = useState(false);

  // mode="center": 중앙 미니게임 & 브레인 서바이벌 & 동아리
  if (mode === "center") {
    return (
      <nav aria-label="메인 네비게이션" className="flex items-center gap-6 sm:gap-8">
        {/* ── 1. 미니게임 드롭다운 ── */}
        <div
          className="relative py-1"
          onMouseEnter={() => setIsMiniOpen(true)}
          onMouseLeave={() => setIsMiniOpen(false)}
        >
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 hover:bg-gray-100"
            style={{
              fontFamily: "var(--font-chalk)",
              fontSize: "1.45rem",
              color: isMiniOpen ? "var(--chalk-yellow)" : "var(--chalk-white)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            <Gamepad2 size={22} className="text-[var(--chalk-yellow)]" />
            <span>미니게임</span>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${
                isMiniOpen ? "rotate-180 text-[var(--chalk-yellow)]" : "text-gray-400"
              }`}
            />
          </button>

          {/* 미니게임 상세메뉴 드롭다운 (메뉴와 상세창 사이 여백 pt-3 적용) */}
          {isMiniOpen && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50 min-w-[200px]"
              style={{ animation: "slideInUp 0.2s ease forwards" }}
            >
              <div
                className="chalk-box-straight shadow-md p-3 flex flex-col gap-1.5"
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(0,0,0,0.05)",
                  borderRadius: "1rem",
                }}
              >
                <div
                  className="flex items-center gap-2.5 px-4 py-3 text-lg rounded text-gray-700"
                  style={{
                    fontFamily: "var(--font-chalk)",
                    letterSpacing: "-0.015em",
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--chalk-yellow)] inline-block flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-600" style={{ fontFamily: "var(--font-body)" }}>준비 중입니다</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 2. 브레인 서바이벌 드롭다운 ── */}
        <div
          className="relative py-1"
          onMouseEnter={() => setIsBrainOpen(true)}
          onMouseLeave={() => setIsBrainOpen(false)}
        >
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 hover:bg-gray-100"
            style={{
              fontFamily: "var(--font-chalk)",
              fontSize: "1.45rem",
              color: isBrainOpen ? "var(--chalk-yellow)" : "var(--chalk-white)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            <Brain size={22} className="text-[var(--chalk-yellow)]" />
            <span>브레인 서바이벌</span>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${
                isBrainOpen ? "rotate-180 text-[var(--chalk-yellow)]" : "text-gray-400"
              }`}
            />
          </button>

          {/* 브레인 서바이벌 상세메뉴 드롭다운 (메뉴와 상세창 사이 여백 pt-3 적용) */}
          {isBrainOpen && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50 min-w-[200px]"
              style={{ animation: "slideInUp 0.2s ease forwards" }}
            >
              <div
                className="chalk-box-straight shadow-md p-3 flex flex-col gap-1.5"
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(0,0,0,0.05)",
                  borderRadius: "1rem",
                }}
              >
                <Link
                  href="/formula-pyramid"
                  className="flex items-center gap-2.5 px-4 py-3 text-lg rounded transition-colors duration-150 hover:bg-gray-100"
                  style={{
                    fontFamily: "var(--font-chalk)",
                    color: "var(--chalk-yellow)",
                    textDecoration: "none",
                  }}
                  onClick={() => setIsBrainOpen(false)}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--chalk-yellow)] inline-block flex-shrink-0" />
                  <span>수식 피라미드</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. 동아리 드롭다운 ── */}
        <div
          className="relative py-1"
          onMouseEnter={() => setIsClubOpen(true)}
          onMouseLeave={() => setIsClubOpen(false)}
        >
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 hover:bg-gray-100"
            style={{
              fontFamily: "var(--font-chalk)",
              fontSize: "1.45rem",
              color: isClubOpen ? "var(--chalk-yellow)" : "var(--chalk-white)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            <span style={{ fontSize: "1.65rem", fontWeight: "bold", lineHeight: 1 }} className="text-[var(--chalk-yellow)]">∞</span>
            <span>동아리</span>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${
                isClubOpen ? "rotate-180 text-[var(--chalk-yellow)]" : "text-gray-400"
              }`}
            />
          </button>

          {/* 동아리 상세메뉴 드롭다운 */}
          {isClubOpen && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50 min-w-[200px]"
              style={{ animation: "slideInUp 0.2s ease forwards" }}
            >
              <div
                className="chalk-box-straight shadow-md p-3 flex flex-col gap-1.5"
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(0,0,0,0.05)",
                  borderRadius: "1rem",
                }}
              >
                <div
                  className="flex items-center gap-2.5 px-4 py-3 text-lg rounded text-gray-700"
                  style={{
                    fontFamily: "var(--font-chalk)",
                    letterSpacing: "-0.015em",
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--chalk-yellow)] inline-block flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-600" style={{ fontFamily: "var(--font-body)" }}>준비 중입니다</span>
                </div>
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
        className="rounded-full transition-all duration-200 hover:bg-black/5"
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
          border: "1px solid rgba(0,0,0,0.1)",
          textDecoration: "none",
          background: "rgba(0, 0, 0, 0.02)",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        }}
      >
        <LogIn size={18} className="text-gray-500 flex-shrink-0" />
        <span>로그인</span>
      </Link>

      {/* 회원가입 버튼 */}
      <Link
        href="#"
        className="rounded-full transition-all duration-200 hover:scale-105 hover:opacity-90"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "9px 22px",
          fontFamily: "var(--font-chalk)",
          fontSize: "1.15rem",
          lineHeight: 1,
          color: "#ffffff",
          background: "var(--chalk-yellow)",
          fontWeight: 700,
          border: "1px solid var(--chalk-yellow)",
          textDecoration: "none",
          boxShadow: "0 4px 6px -1px rgba(203, 167, 210, 0.3)",
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
