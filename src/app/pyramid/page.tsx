/**
 * src/app/pyramid/page.tsx
 * 🎮 무한대수학반 - 수식 피라미드 게임 대기 화면
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";

/* ─── 상단 헤더 컴포넌트 ────────────────────────────────────────── */
function Header() {
  return (
    <header
      id="site-header"
      className="fixed top-0 left-0 right-0 w-full z-50 header-board shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
    >
      <div className="header-full-bar">
        {/* ── 1. 좌측 로고 (3.5rem 좌측 여백) ── */}
        <Link
          href="/"
          id="logo-link"
          className="flex items-center gap-3 group shrink-0 select-none"
          aria-label="무한대수학반 홈"
        >
          <span
            className="chalk-text-yellow text-3xl sm:text-4xl leading-none group-hover:scale-110 transition-transform duration-200"
            aria-hidden="true"
          >
            ∞
          </span>

          <div className="flex items-center gap-2.5">
            <span className="chalk-font chalk-text-white text-xl sm:text-2xl font-bold tracking-wide">
              INFINITY MATH CLASS
            </span>
            <span className="chalk-font chalk-text-yellow text-xl sm:text-2xl font-bold tracking-wide">
              무한대수학반
            </span>
          </div>
        </Link>

        {/* ── 2. 수식 피라미드 (화면 100vw의 50% 진짜 중앙) ── */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative group">
            <Link
              href="/pyramid"
              id="nav-pyramid-btn"
              className="btn-chalk text-sm py-1.5 px-4 rounded-lg flex items-center gap-2"
            >
              <span>수식 피라미드</span>
            </Link>

            <div
              className="absolute top-full mt-3 left-1/2 -translate-x-1/2 
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                         pointer-events-none whitespace-nowrap bg-[#0a251e] border-2 border-dashed border-[#fef08a] 
                         text-[#fef08a] chalk-font text-lg px-5 py-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.7)] rounded-xl z-50"
              role="tooltip"
            >
              🎮 수식 피라미드 대기실
            </div>
          </div>
        </div>

        {/* ── 3. 우측 공간 ── */}
        <div className="w-16 shrink-0 hidden sm:block" />
      </div>
    </header>
  );
}

/* ─── 정육각형 셀 SVG 컴포넌트 ─────────────────────────────────── */
function HexCell({
  cx,
  cy,
  label,
  outerR = 42,
  innerR = 17,
}: {
  cx: number;
  cy: number;
  label: string;
  outerR?: number;
  innerR?: number;
}) {
  const s3 = Math.sqrt(3);

  const pts = (r: number, ox: number, oy: number): string =>
    [
      [ox, oy - r],
      [ox + (r * s3) / 2, oy - r / 2],
      [ox + (r * s3) / 2, oy + r / 2],
      [ox, oy + r],
      [ox - (r * s3) / 2, oy + r / 2],
      [ox - (r * s3) / 2, oy - r / 2],
    ]
      .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");

  const innerCy = cy - outerR + innerR;

  return (
    <g>
      {/* 바깥 정육각형 (분필 점선 테두리) */}
      <polygon
        points={pts(outerR, cx, cy)}
        fill="rgba(10,37,30,0.85)"
        stroke="#fef08a"
        strokeWidth="1.8"
        strokeDasharray="5 2.5"
      />
      {/* 내부 작은 정육각형 (바깥 최상단 두 변 공유) */}
      <polygon
        points={pts(innerR, cx, innerCy)}
        fill="rgba(20,60,45,0.95)"
        stroke="#fef08a"
        strokeWidth="1.4"
      />
      {/* 칸 번호 레이블 */}
      <text
        x={cx}
        y={innerCy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fef08a"
        fontSize="14"
        fontWeight="bold"
        fontFamily="'Nanum Pen Script', Gaegu, cursive"
      >
        {label}
      </text>
    </g>
  );
}

/* ─── 수식 피라미드 SVG ─────────────────────────────────────────── */
function PyramidSVG() {
  const R = 42;
  const d = R * Math.sqrt(3);
  const v = R * 1.5;
  const cx = 170;

  const y = [52, 52 + v, 52 + 2 * v, 52 + 3 * v];

  const row: Record<string, [number, number]> = {
    A: [cx, y[0]],
    B: [cx - d / 2, y[1]],
    C: [cx + d / 2, y[1]],
    D: [cx - d, y[2]],
    E: [cx, y[2]],
    F: [cx + d, y[2]],
    G: [cx - (3 * d) / 2, y[3]],
    H: [cx - d / 2, y[3]],
    I: [cx + d / 2, y[3]],
    J: [cx + (3 * d) / 2, y[3]],
  };

  return (
    <svg
      viewBox="0 0 340 302"
      className="w-full max-w-[290px] mx-auto"
      aria-label="수식 피라미드 4줄 10칸"
    >
      {(Object.entries(row) as [string, [number, number]][]).map(
        ([label, [x, y_pos]]) => (
          <HexCell key={label} cx={x} cy={y_pos} label={label} outerR={R} />
        )
      )}
    </svg>
  );
}

/* ─── 플레이어 모드 콘텐츠 (가로 3분할, 넉넉한 내부 패딩 & 중앙 정렬) ──── */
function PlayerMode() {
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");

  return (
    <div className="pyramid-grid-layout">
      {/* ── 좌측: 입장 정보 (넉넉한 내부 여백 p-8 sm:p-10) ── */}
      <div className="chalk-border p-8 sm:p-10 flex flex-col gap-6 bg-[#0a251e]/60 min-h-[500px]">
        <h3 className="chalk-font chalk-text-yellow text-3xl font-bold border-b border-dashed border-yellow-200/30 pb-3 flex items-center gap-2">
          <span>✏️</span> 입장 정보
        </h3>

        {/* 닉네임 */}
        <div className="flex flex-col gap-2.5 mt-2">
          <label
            htmlFor="nickname"
            className="chalk-font chalk-text-white text-xl"
          >
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            maxLength={12}
            className="w-full bg-[#0a251e] border-2 border-dashed border-[#fef08a]/60
                       rounded-lg px-4 py-3 text-[#f8fafc] placeholder-[#86efac]/40
                       focus:outline-none focus:border-[#fef08a] transition-colors
                       font-['Gowun_Dodum'] text-base"
          />
        </div>

        {/* 입장 코드 */}
        <div className="flex flex-col gap-2.5">
          <label
            htmlFor="roomCode"
            className="chalk-font chalk-text-white text-xl"
          >
            입장 코드
          </label>
          <input
            id="roomCode"
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="딜러가 제공한 코드 입력"
            maxLength={8}
            className="w-full bg-[#0a251e] border-2 border-dashed border-[#fef08a]/60
                       rounded-lg px-4 py-3 text-[#f8fafc] placeholder-[#86efac]/40
                       focus:outline-none focus:border-[#fef08a] transition-colors
                       font-['Gowun_Dodum'] text-base tracking-widest uppercase"
          />
          <p className="chalk-font text-[#86efac]/80 text-sm mt-1 leading-relaxed">
            * 딜러 모드에서 생성된 코드로 입장하면 같은 방 인원과 실시간 게임이 시작됩니다.
          </p>
        </div>

        {/* 입장 버튼 */}
        <button
          className="btn-chalk mt-auto flex items-center justify-center gap-2 py-3.5 text-xl font-bold"
          onClick={() =>
            alert("🚧 실시간 멀티플레이 기능은 준비 중입니다!")
          }
        >
          <LogIn size={22} />
          <span>입장하기</span>
        </button>
      </div>

      {/* ── 중앙: 수식 피라미드 (상하좌우 완벽 센터 정렬) ── */}
      <div className="chalk-border p-8 sm:p-10 flex flex-col items-center justify-center text-center bg-[#0a251e]/60 min-h-[500px] gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="chalk-font chalk-text-yellow text-3xl font-bold">
            수식 피라미드
          </h2>
          <p className="chalk-font chalk-text-green text-lg">
            게임 시작을 기다리는 동안 연습해보세요.
          </p>
        </div>

        {/* SVG 정육각형 피라미드 */}
        <div className="w-full py-3 flex items-center justify-center">
          <PyramidSVG />
        </div>

        <p className="chalk-font text-[#fef08a]/80 text-base">
          각 칸(A~J)에 숫자를 채워 피라미드를 완성하세요.
        </p>
      </div>

      {/* ── 우측: 게임 규칙 ── */}
      <div className="chalk-border p-8 sm:p-10 flex flex-col gap-6 bg-[#0a251e]/60 min-h-[500px]">
        <h3 className="chalk-font chalk-text-yellow text-3xl font-bold border-b border-dashed border-yellow-200/30 pb-3 flex items-center gap-2">
          <span>📋</span> 게임 규칙
        </h3>

        <div className="flex flex-col gap-4 mt-2">
          <div className="chalk-border p-5 bg-[#0a251e]/80">
            <p className="chalk-font chalk-text-white text-xl leading-relaxed">
              📌 게임 규칙은 잠시 후 추가됩니다.
            </p>
          </div>
          <p className="chalk-font text-[#86efac]/80 text-base leading-relaxed">
            * 규칙이 추가되면 이 공간에 상세히 표시됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── 딜러 모드 콘텐츠 ─────────────────────────────────────────── */
function DealerMode() {
  return (
    <div className="w-full flex items-center justify-center py-12">
      <div className="chalk-border p-12 text-center max-w-lg bg-[#0a251e]/60 w-full">
        <p className="chalk-font chalk-text-yellow text-4xl mb-4">🎲 딜러 모드</p>
        <p className="chalk-font chalk-text-white text-2xl mb-2">
          딜러 모드 화면은 곧 추가됩니다.
        </p>
        <p className="chalk-font text-[#86efac]/80 text-lg">
          딜러는 입장 코드를 생성하고 게임 진행을 관리합니다.
        </p>
      </div>
    </div>
  );
}

/* ─── 수식 피라미드 메인 대기 페이지 ────────────────────────────── */
export default function PyramidPage() {
  const [mode, setMode] = useState<"player" | "dealer">("player");

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#11382d] text-[#f8fafc] overflow-x-hidden">
      {/* 메인 고정 헤더 */}
      <Header />

      {/* 대기실 본문 컨테이너 */}
      <main className="pyramid-page-container flex-1">
        {/* 상단 서브 바: 홈으로 버튼 + 단일 박스 통합 모드 토글 */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-dashed border-white/20 w-full">
          {/* 홈으로 버튼 */}
          <Link
            href="/"
            className="btn-chalk text-lg py-2.5 px-6 rounded-lg flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>홈으로</span>
          </Link>

          {/* 단일 박스 ON/OFF 모드 스위치 */}
          <div className="inline-flex items-center p-1.5 rounded-xl border-2 border-dashed border-[#fef08a]/60 bg-[#0a251e]/80 shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <button
              id="btn-player-mode"
              onClick={() => setMode("player")}
              className={`chalk-font text-xl px-5 py-2 rounded-lg transition-all duration-200 ${
                mode === "player"
                  ? "bg-[#fef08a] text-[#0a251e] font-bold shadow-[0_0_12px_rgba(254,240,138,0.5)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {mode === "player" ? "🟢 플레이어 모드" : "플레이어 모드"}
            </button>

            <button
              id="btn-dealer-mode"
              onClick={() => setMode("dealer")}
              className={`chalk-font text-xl px-5 py-2 rounded-lg transition-all duration-200 ${
                mode === "dealer"
                  ? "bg-[#fef08a] text-[#0a251e] font-bold shadow-[0_0_12px_rgba(254,240,138,0.5)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {mode === "dealer" ? "🟢 딜러 모드" : "딜러 모드"}
            </button>
          </div>
        </div>

        {/* 모드별 본문 */}
        {mode === "player" ? <PlayerMode /> : <DealerMode />}
      </main>

      {/* 푸터 */}
      <footer className="w-full text-center py-6 border-t border-dashed border-white/10 mt-auto">
        <p className="chalk-font chalk-text-white text-sm sm:text-base">
          &copy; {new Date().getFullYear()} 무한대수학반. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
