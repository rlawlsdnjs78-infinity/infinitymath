/**
 * src/app/speed-factorization/page.tsx
 * 스피드 소인수분해 게임 대기 페이지
 *
 * [수식 피라미드 대기 페이지와 동일한 양식]
 * - 좌측: 게임 입장하기 (닉네임 → 난이도 선택 → 입장하기)
 * - 중앙: 게임 판 (추후 구현)
 * - 우측: 게임 설명
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, HelpCircle, LogIn, ArrowLeft } from "lucide-react";

type Difficulty = "쉬움" | "보통" | "어려움";

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { color: string; border: string; bg: string; desc: string }
> = {
  쉬움: {
    color: "text-emerald-600",
    border: "border-emerald-400",
    bg: "bg-emerald-50",
    desc: "100 이하 · 소인수 2, 3, 5, 7",
  },
  보통: {
    color: "text-amber-600",
    border: "border-amber-400",
    bg: "bg-amber-50",
    desc: "200 이하 · 소인수 2, 3, 5, 7, 11",
  },
  어려움: {
    color: "text-rose-600",
    border: "border-rose-400",
    bg: "bg-rose-50",
    desc: "300 이하 · 소인수 2, 3, 5, 7, 11, 13",
  },
};

export default function SpeedFactorizationPage() {
  const [nickname, setNickname] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("보통");

  const handleEnter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nickname.trim()) {
      alert("닉네임을 입력해 주세요.");
      return;
    }
    // TODO: 게임 진입 로직 연결
    alert(`[${difficulty}] 난이도로 입장합니다. (닉네임: ${nickname.trim()})`);
  };

  return (
    <div
      className="w-full flex-1 flex flex-col items-center justify-start"
      style={{
        paddingTop: "0.5rem",
        paddingBottom: "2rem",
        paddingLeft: "clamp(1rem, 4vw, 3rem)",
        paddingRight: "clamp(1rem, 4vw, 3rem)",
      }}
    >
      <div className="w-full max-w-[1550px] flex flex-col mx-auto">

        {/* ─── 상단 타이틀 ─────────────────────────────── */}
        <div
          className="flex items-center justify-between w-full"
          style={{ marginTop: "0.25rem", marginBottom: "0.85rem" }}
        >
          <h1
            className="text-[#CBA7D2] flex items-center gap-3.5 font-bold"
            style={{
              fontFamily: "var(--font-chalk)",
              fontSize: "1.65rem",
              letterSpacing: "0.04em",
            }}
          >
            <Zap className="text-[#CBA7D2] flex-shrink-0" size={30} />
            <span>스피드 소인수분해 (Speed Factorization)</span>
          </h1>
          <Link
            href="/"
            className="flex items-center rounded-full bg-gray-50/80 backdrop-blur-md hover:bg-gray-100 border-2 border-dashed border-[#CBA7D2]/90 text-[#CBA7D2] font-extrabold transition-all shadow-lg hover:scale-105 cursor-pointer"
            style={{
              paddingLeft: "1.45rem",
              paddingRight: "1.45rem",
              paddingTop: "0.65rem",
              paddingBottom: "0.65rem",
              gap: "0.65rem",
              fontFamily: "var(--font-chalk)",
              fontSize: "1.45rem",
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            <ArrowLeft size={22} className="text-[#CBA7D2] flex-shrink-0" />
            <span className="leading-none">홈으로</span>
          </Link>
        </div>

        <div
          className="w-full border-t-2 border-dashed border-gray-200/80"
          style={{ marginTop: "0.85rem", marginBottom: "0.85rem" }}
        />

        {/* ─── 3분할 박스 ─────────────────────────────── */}
        <div
          className="grid grid-cols-1 xl:grid-cols-12 items-stretch"
          style={{ gap: "1.45rem" }}
        >

          {/* ════════════════════ [좌측 박스] ════════════════════ */}
          <div
            className="xl:col-span-3 chalk-box flex flex-col bg-white/80 backdrop-blur-md h-full"
            style={{ padding: "0.85rem" }}
          >
            <div className="flex items-center gap-3 w-full min-h-[44px]">
              <LogIn className="text-[#CBA7D2] flex-shrink-0" size={28} />
              <h2
                className="text-[#CBA7D2] font-bold"
                style={{
                  fontFamily: "var(--font-chalk)",
                  fontSize: "1.85rem",
                  lineHeight: 1.1,
                }}
              >
                게임 입장하기
              </h2>
            </div>
            <div
              className="w-full border-t border-dashed border-gray-300/70"
              style={{ marginTop: "0.85rem", marginBottom: "0.85rem" }}
            />

            <form onSubmit={handleEnter} className="flex flex-col gap-5 flex-1">
              {/* 닉네임 */}
              <div className="flex flex-col" style={{ gap: "0.45rem" }}>
                <label
                  htmlFor="sf-nickname-input"
                  className="text-gray-800 font-bold"
                  style={{ fontFamily: "var(--font-chalk)", fontSize: "1.65rem" }}
                >
                  닉네임
                </label>
                <input
                  id="sf-nickname-input"
                  type="text"
                  placeholder="닉네임을 입력해 주세요"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full rounded-2xl bg-gray-50/80 backdrop-blur-md border border-dashed border-gray-300 text-gray-800 focus:outline-none focus:border-[#CBA7D2] placeholder:text-gray-500/80"
                  style={{
                    padding: "0.65rem 1.45rem",
                    fontFamily: "var(--font-body)",
                    fontSize: "1.05rem",
                    lineHeight: "1.5",
                  }}
                />
              </div>

              {/* 난이도 선택 */}
              <div className="flex flex-col" style={{ gap: "0.65rem" }}>
                <span
                  className="text-gray-800 font-bold"
                  style={{ fontFamily: "var(--font-chalk)", fontSize: "1.65rem" }}
                >
                  난이도
                </span>
                <div className="flex flex-col gap-2.5">
                  {(["쉬움", "보통", "어려움"] as Difficulty[]).map((d) => {
                    const cfg = DIFFICULTY_CONFIG[d];
                    const isSelected = difficulty === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`w-full flex items-center justify-between rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? `${cfg.bg} ${cfg.border} shadow-md`
                            : "bg-gray-50/80 border-gray-200 hover:bg-gray-100/80"
                        }`}
                        style={{ padding: "0.65rem 1.1rem", fontFamily: "var(--font-chalk)" }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-3 h-3 rounded-full flex-shrink-0 border-2 transition-all ${
                              isSelected
                                ? `${cfg.bg} ${cfg.border}`
                                : "bg-gray-200 border-gray-300"
                            }`}
                          />
                          <span
                            className={`font-extrabold text-base ${
                              isSelected ? cfg.color : "text-gray-500"
                            }`}
                          >
                            {d}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            isSelected ? cfg.color : "text-gray-400"
                          }`}
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {cfg.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 입장하기 버튼 */}
              <button
                type="submit"
                className="btn-chalk w-full justify-center font-extrabold cursor-pointer"
                style={{
                  marginTop: "auto",
                  padding: "0.65rem 1.45rem",
                  fontFamily: "var(--font-chalk)",
                  fontSize: "1.45rem",
                }}
              >
                입장하기
              </button>
            </form>
          </div>

          {/* ════════════════════ [중앙 박스] ════════════════════ */}
          <div
            className="xl:col-span-6 chalk-box flex flex-col items-center justify-center bg-white/85 backdrop-blur-md h-full gap-4"
            style={{ padding: "0.85rem", minHeight: "420px" }}
          >
            <div className="flex flex-col items-center justify-center gap-4 text-center py-12">
              <Zap size={56} className="text-[#CBA7D2] opacity-40" />
              <p
                className="text-gray-400 font-medium"
                style={{ fontFamily: "var(--font-body)", fontSize: "1.05rem" }}
              >
                게임 판은 준비 중입니다.
              </p>
            </div>
          </div>

          {/* ════════════════════ [우측 박스] ════════════════════ */}
          <div
            className="xl:col-span-3 chalk-box flex flex-col bg-white/80 backdrop-blur-md h-full"
            style={{ padding: "0.85rem" }}
          >
            <div className="flex items-center gap-3 w-full min-h-[44px]">
              <HelpCircle className="text-[#CBA7D2] flex-shrink-0" size={28} />
              <h2
                className="text-[#CBA7D2] font-bold"
                style={{
                  fontFamily: "var(--font-chalk)",
                  fontSize: "1.85rem",
                  lineHeight: 1.1,
                }}
              >
                게임 설명
              </h2>
            </div>
            <div
              className="w-full border-t border-dashed border-gray-200"
              style={{ marginTop: "0.85rem", marginBottom: "0.85rem" }}
            />

            <div
              className="flex flex-col text-gray-700 leading-relaxed py-1 overflow-y-auto"
              style={{
                gap: "0.85rem",
                fontFamily: "var(--font-chalk)",
                fontSize: "0.85rem",
                wordBreak: "break-all",
                letterSpacing: "-0.015em",
              }}
            >
              {/* ① 게임 소개 */}
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">①</span>
                <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                  <strong className="text-[#CBA7D2] font-bold">&lsquo;스피드 소인수분해&rsquo;</strong>는 문제 판에서 적당한 카드를 선택하여 타깃 넘버를 소인수분해한 수식을 만드는 게임입니다.
                </p>
              </div>

              {/* ② 난이도별 타깃 넘버 범위 */}
              <div className="flex flex-col" style={{ gap: "0.85rem" }}>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">②</span>
                  <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                    난이도에 따른 타깃 넘버 범위는 다음과 같습니다.
                  </p>
                </div>
                <div
                  className="w-full rounded-2xl shadow-lg border-2 border-dashed border-[#CBA7D2]/90 bg-gray-50/80 backdrop-blur-md"
                  style={{ padding: "0.65rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}
                >
                  {[
                    {
                      level: "쉬움",
                      desc: "100 이하의 자연수 중 소인수를 2, 3, 5, 7 중 일부 또는 전체를 가지는 자연수",
                      color: "text-emerald-600",
                    },
                    {
                      level: "보통",
                      desc: "200 이하의 자연수 중 소인수를 2, 3, 5, 7, 11 중 일부를 가지는 자연수",
                      color: "text-amber-600",
                    },
                    {
                      level: "어려움",
                      desc: "300 이하의 자연수 중 소인수를 2, 3, 5, 7, 11, 13 중 일부를 가지는 자연수",
                      color: "text-rose-600",
                    },
                  ].map(({ level, desc, color }) => (
                    <div
                      key={level}
                      className="flex items-start gap-2.5 text-gray-600 font-medium"
                      style={{ fontSize: "0.85rem", lineHeight: "1.5", letterSpacing: "-0.015em" }}
                    >
                      <span className="flex-shrink-0 mt-0.5">💡</span>
                      <span>
                        <span className={`font-extrabold ${color}`}>{level}</span>
                        {" | "}
                        {desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ③ 점수 규칙 */}
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">③</span>
                <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                  정답을 제출하면 1점을 획득합니다. 오답을 제출한 경우{" "}
                  <strong className="text-[#CBA7D2]">쉬움, 보통</strong>의 경우에는 감점이 없지만{" "}
                  <strong className="text-rose-500">어려움</strong>의 경우에는 1점이 감점됩니다.
                </p>
              </div>

              {/* ④ 라운드 종료 및 명예의 전당 */}
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">④</span>
                <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                  라운드 진행 시간이 지나면 라운드가 종료되고, 상위 10등은 명예의 전당에 등록됩니다.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
