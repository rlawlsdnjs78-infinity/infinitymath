/**
 * MobileMenu.tsx
 * 작은 화면(휴대폰/태블릿) 전용 햄버거(≡) 메뉴 (Client Component)
 * - 헤더 좌측의 ≡ 버튼을 누르면 왼쪽에서 드로어가 슬라이드되어 나옴
 * - 카테고리(미니게임/브레인 서바이벌/동아리/요리조리)는 아코디언으로 펼침
 * - 하단에 로그인 / 회원가입 버튼 배치
 *
 * ※ 헤더에 backdrop-filter 가 걸려 있어 fixed 요소가 헤더 안에 갇히므로
 *    드로어는 createPortal 로 document.body 에 렌더링한다.
 */

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X, ChevronDown, LogIn, UserPlus, Brain, Gamepad2 } from "lucide-react";

type MenuGroup = {
  id: string;
  label: string;
  icon: ReactNode;
  items: { href: string; label: string }[];
};

const MENU_GROUPS: MenuGroup[] = [
  {
    id: "mini",
    label: "미니게임",
    icon: <Gamepad2 size={20} className="text-[var(--chalk-yellow)] flex-shrink-0" />,
    items: [{ href: "/speed-factorization", label: "스피드 소인수분해(개발 중)" }],
  },
  {
    id: "brain",
    label: "브레인 서바이벌",
    icon: <Brain size={20} className="text-[var(--chalk-yellow)] flex-shrink-0" />,
    items: [
      { href: "/formula-pyramid", label: "수식 피라미드" },
      { href: "/triple-dice", label: "트리플 다이스" },
    ],
  },
  {
    id: "club",
    label: "동아리",
    icon: (
      <span
        className="text-[var(--chalk-yellow)] flex-shrink-0"
        style={{ fontSize: "1.4rem", fontWeight: "bold", lineHeight: 1, width: 20, textAlign: "center" }}
      >
        ∞
      </span>
    ),
    items: [{ href: "#", label: "2026년 2학기" }],
  },
  {
    id: "yorio",
    label: "요리조리",
    icon: (
      <span
        className="text-[var(--chalk-yellow)] flex-shrink-0"
        style={{ fontSize: "1.2rem", lineHeight: 1, width: 20, textAlign: "center" }}
      >
        ✦
      </span>
    ),
    items: [{ href: "/triangle-centers", label: "삼각형의 외심과 내심" }],
  },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const close = () => setIsOpen(false);

  // 열려 있는 동안: ESC 로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  return (
    <>
      {/* ≡ 햄버거 버튼 */}
      <button
        id="mobile-menu-button"
        type="button"
        aria-label="메뉴 열기"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-drawer"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-11 h-11 rounded-xl transition-colors duration-200 hover:bg-black/5 active:bg-black/10"
        style={{ color: "var(--chalk-white)", background: "transparent", border: "none", cursor: "pointer" }}
      >
        <Menu size={28} strokeWidth={2.25} />
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] xl:hidden">
            {/* 어두운 배경 (클릭 시 닫힘) */}
            <div
              className="absolute inset-0"
              onClick={close}
              style={{
                background: "rgba(20, 16, 28, 0.35)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
                animation: "overlayFadeIn 0.2s ease forwards",
              }}
            />

            {/* 드로어 */}
            <aside
              id="mobile-menu-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="사이트 메뉴"
              className="absolute top-0 left-0 h-full flex flex-col shadow-2xl"
              style={{
                width: "min(82vw, 320px)",
                background: "rgba(255, 255, 255, 0.97)",
                borderTopRightRadius: "1.25rem",
                borderBottomRightRadius: "1.25rem",
                animation: "drawerInLeft 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards",
              }}
            >
              {/* 드로어 헤더 */}
              <div
                className="flex items-center justify-between px-5"
                style={{ minHeight: 72, borderBottom: "1px solid rgba(0,0,0,0.06)" }}
              >
                <Link href="/" onClick={close} style={{ textDecoration: "none" }} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: "var(--font-chalk)",
                      fontSize: "2rem",
                      lineHeight: 1,
                      color: "var(--chalk-yellow)",
                      fontWeight: "bold",
                    }}
                  >
                    ∞
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-chalk)",
                      fontSize: "1.35rem",
                      color: "var(--chalk-white)",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    무한대수학반
                  </span>
                </Link>
                <button
                  id="mobile-menu-close"
                  type="button"
                  aria-label="메뉴 닫기"
                  onClick={close}
                  className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-200 hover:bg-black/5"
                  style={{ color: "var(--chalk-white)", background: "transparent", border: "none", cursor: "pointer" }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* 메뉴 목록 (아코디언) */}
              <nav aria-label="모바일 네비게이션" className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="flex flex-col gap-1">
                  {MENU_GROUPS.map((group) => {
                    const isExpanded = expanded === group.id;
                    return (
                      <li key={group.id}>
                        <button
                          id={`mobile-menu-${group.id}`}
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => setExpanded(isExpanded ? null : group.id)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-150 hover:bg-gray-100"
                          style={{
                            fontFamily: "var(--font-chalk)",
                            fontSize: "1.25rem",
                            color: isExpanded ? "var(--chalk-yellow)" : "var(--chalk-white)",
                            background: isExpanded ? "rgba(203,167,210,0.12)" : "transparent",
                            border: "none",
                            cursor: "pointer",
                            letterSpacing: "0.04em",
                            textAlign: "left",
                          }}
                        >
                          {group.icon}
                          <span className="flex-1">{group.label}</span>
                          <ChevronDown
                            size={18}
                            className={`transition-transform duration-200 ${
                              isExpanded ? "rotate-180 text-[var(--chalk-yellow)]" : "text-gray-400"
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <ul
                            className="flex flex-col gap-0.5 pl-4 pr-1 pt-1 pb-2"
                            style={{ animation: "slideInUp 0.2s ease forwards" }}
                          >
                            {group.items.map((item) => (
                              <li key={item.label}>
                                <Link
                                  href={item.href}
                                  onClick={close}
                                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors duration-150 hover:bg-gray-100"
                                  style={{ textDecoration: "none" }}
                                >
                                  <span className="w-[0.6rem] h-[0.6rem] rounded-full bg-[var(--chalk-yellow)] inline-block flex-shrink-0" />
                                  <span
                                    className="text-[1rem] font-medium text-gray-600"
                                    style={{ fontFamily: "var(--font-body)" }}
                                  >
                                    {item.label}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* 하단: 로그인 / 회원가입 */}
              <div className="flex gap-2 px-4 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <Link
                  href="#"
                  onClick={close}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2.5 transition-colors duration-200 hover:bg-black/5"
                  style={{
                    fontFamily: "var(--font-chalk)",
                    fontSize: "1.05rem",
                    color: "var(--chalk-white)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <LogIn size={17} className="text-gray-500 flex-shrink-0" />
                  로그인
                </Link>
                <Link
                  href="#"
                  onClick={close}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2.5 transition-opacity duration-200 hover:opacity-90"
                  style={{
                    fontFamily: "var(--font-chalk)",
                    fontSize: "1.05rem",
                    color: "#ffffff",
                    background: "var(--chalk-yellow)",
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 6px -1px rgba(203, 167, 210, 0.3)",
                  }}
                >
                  <UserPlus size={17} className="flex-shrink-0" />
                  회원가입
                </Link>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
