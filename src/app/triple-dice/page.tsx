/**
 * src/app/triple-dice/page.tsx
 * 트리플 다이스 게임 페이지
 *
 * [주요 구성]
 * - 수식 피라미드와 동일한 3분할 레이아웃 사용
 * - 좌측: 게임 입장하기 (플레이어/딜러 모드 탭)
 * - 중앙: 게임 보드 영역 (주사위 표시)
 * - 우측: 게임 설명 / 딜러 패널
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Settings,
  HelpCircle,
  LogIn,
  ArrowLeft,
  Megaphone,
  Brain,
  LogOut,
  Play,
  Dice5,
  Pencil,
} from "lucide-react";

export default function TripleDicePage() {
  const [mode, setMode] = useState<"player" | "dealer">("player");
  const [inGameRoom, setInGameRoom] = useState(false);
  const [isDealerHost, setIsDealerHost] = useState(false);

  const [nickname, setNickname] = useState("");
  const [entryCode, setEntryCode] = useState("");
  const [activityLogs] = useState<{ id: string; tag: string; text: string }[]>([]);
  const [myNickname] = useState("");
  const [activeRoomCode] = useState("");

  const handleJoinGameRoom = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleLeaveRoom = () => {
    setInGameRoom(false);
    setIsDealerHost(false);
  };

  const handleCreateGame = () => {};

  return (
    <div
      className="flex-1 flex flex-col"
      style={{
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
        paddingTop: "1.45rem",
        paddingBottom: "1.45rem",
      }}
    >
      {/* ─── 상단 타이틀 ─────────────────────────────── */}
      {!inGameRoom && (
        <>
          <div className="flex items-center justify-between w-full" style={{ marginTop: "0.25rem", marginBottom: "0.85rem" }}>
            <h1
              className="text-[#CBA7D2] flex items-center gap-3.5 font-bold"
              style={{ fontFamily: "var(--font-chalk)", fontSize: "1.65rem", letterSpacing: "0.04em" }}
            >
              <Brain className="text-[#CBA7D2] flex-shrink-0" size={30} />
              <span>트리플 다이스 (Triple Dice)</span>
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
          <div className="w-full border-t-2 border-dashed border-gray-200/80" style={{ marginTop: "0.85rem", marginBottom: "0.85rem" }} />
        </>
      )}

      {/* ─── 3분할 박스 ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 items-stretch" style={{ gap: "1.45rem" }}>

        {/* ════════════════════ [좌측 박스] ════════════════════ */}
        <div
          className="xl:col-span-3 chalk-box flex flex-col bg-white/80 backdrop-blur-md h-full"
          style={{ padding: "0.85rem" }}
        >
          <div className="flex items-center gap-3 w-full min-h-[44px]">
            <LogIn className="text-[#CBA7D2] flex-shrink-0" size={28} />
            <h2 className="text-[#CBA7D2] font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.85rem", lineHeight: 1.1 }}>
              게임 입장하기
            </h2>
          </div>
          <div className="w-full border-t border-dashed border-gray-300/70" style={{ marginTop: "0.85rem", marginBottom: "0.85rem" }} />

          {/* 탭 버튼: 방에 입장 중이 아닐 때만 표시 */}
          {!inGameRoom && (
            <div className="w-full flex justify-center" style={{ marginTop: "0", marginBottom: "2.45rem" }}>
              <div className="flex items-center rounded-full select-none bg-white/80 backdrop-blur-md border-2 border-[#CBA7D2]/70 shadow-sm w-full p-1 gap-0 overflow-hidden">
                {(["player", "dealer"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 font-bold transition-all duration-200 cursor-pointer text-center ${
                      mode === m ? "bg-[#CBA7D2] text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-800"
                    } ${m === "player" ? "rounded-l-full" : "rounded-r-full"}`}
                    style={{ paddingTop: "0.65rem", paddingBottom: "0.65rem", fontFamily: "var(--font-chalk)", fontSize: "1.05rem" }}
                  >
                    {m === "player" ? "플레이어 모드" : "딜러 모드"}
                  </button>
                ))}
              </div>
            </div>
          )}
          {inGameRoom && <div style={{ marginBottom: "0.5rem" }} />}

          {mode === "player" ? (
            /* ── 플레이어 모드 입장 양식 ── */
            <div className="flex flex-col flex-1 gap-5">
              {!inGameRoom ? (
                <form onSubmit={handleJoinGameRoom} className="flex flex-col gap-5">
                  <div className="flex flex-col" style={{ gap: "0.45rem" }}>
                    <label htmlFor="td-nickname-input" className="text-gray-800 font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.65rem" }}>닉네임</label>
                    <input
                      id="td-nickname-input"
                      type="text"
                      placeholder="닉네임을 입력해 주세요"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full rounded-2xl bg-gray-50/80 backdrop-blur-md border border-dashed border-gray-300 text-gray-800 focus:outline-none focus:border-[#CBA7D2] placeholder:text-gray-500/80"
                      style={{ padding: "0.65rem 1.45rem", fontFamily: "var(--font-body)", fontSize: "1.05rem", lineHeight: "1.5" }}
                    />
                  </div>
                  <div className="flex flex-col" style={{ gap: "0.45rem" }}>
                    <label htmlFor="td-code-input" className="text-gray-800 font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.65rem" }}>입장 코드</label>
                    <input
                      id="td-code-input"
                      type="text"
                      placeholder="코드를 입력해주세요."
                      value={entryCode}
                      onChange={(e) => setEntryCode(e.target.value.toUpperCase())}
                      className="w-full rounded-2xl bg-gray-50/80 backdrop-blur-md border border-dashed border-gray-300 text-gray-800 uppercase focus:outline-none focus:border-[#CBA7D2] placeholder:text-gray-500/80"
                      style={{ padding: "0.65rem 1.45rem", fontFamily: "var(--font-body)", fontSize: "1.05rem", lineHeight: "1.5" }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-chalk w-full justify-center font-extrabold cursor-pointer"
                    style={{ marginTop: "2.45rem", padding: "0.65rem 1.45rem", fontFamily: "var(--font-chalk)", fontSize: "1.45rem" }}
                  >
                    입장하기
                  </button>
                </form>
              ) : (
                /* 게임방 입장 후: 접속 뱃지 + 실시간 점수판 */
                <div className="flex flex-col flex-1 gap-4">
                  <div
                    className="flex items-center justify-between rounded-2xl bg-gray-50/80 backdrop-blur-md border border-dashed border-gray-300 text-gray-800 shadow-sm"
                    style={{ paddingLeft: "1.45rem", paddingRight: "1.45rem", paddingTop: "0.9rem", paddingBottom: "0.9rem" }}
                  >
                    <span className="font-black text-lg sm:text-xl text-[#CBA7D2] flex items-center gap-2" style={{ fontFamily: "var(--font-chalk)" }}>
                      🪪 {myNickname}
                    </span>
                    <button
                      type="button"
                      onClick={handleLeaveRoom}
                      className="flex items-center gap-1.5 bg-rose-900/90 hover:bg-rose-800 text-rose-200 font-extrabold text-sm sm:text-base rounded-2xl border border-rose-600/80 cursor-pointer shadow flex-shrink-0"
                      style={{ paddingLeft: "1.1rem", paddingRight: "1.1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", fontFamily: "var(--font-chalk)" }}
                    >
                      <LogOut size={16} className="flex-shrink-0" />
                      <span>퇴장</span>
                    </button>
                  </div>
                  <div
                    className="flex-1 rounded-2xl border-2 border-dashed border-gray-300/80 bg-gray-50/40"
                    style={{ paddingTop: "2rem", paddingBottom: "2rem", paddingLeft: "1.45rem", paddingRight: "1.45rem" }}
                  />
                </div>
              )}
            </div>
          ) : (
            /* ── 딜러 모드 대기 정보 ── */
            <div className="flex flex-col justify-between flex-1 gap-4 text-sm text-gray-700 leading-relaxed py-1" style={{ fontFamily: "var(--font-body)" }}>
              <div className="flex flex-col gap-4">
                {!inGameRoom && (
                  <p className="leading-loose text-gray-700" style={{ fontSize: "1.05rem", fontFamily: "var(--font-body)" }}>
                    딜러 모드에서는 방을 생성하고 게임을 진행할 수 있습니다.
                  </p>
                )}
                {inGameRoom && isDealerHost && (
                  <div
                    className="w-full rounded-2xl bg-gray-50/80 backdrop-blur-md border border-dashed border-gray-300 text-gray-800 flex items-center justify-between shadow-sm"
                    style={{ padding: "0.65rem 1.45rem", fontFamily: "var(--font-body)", fontSize: "1.05rem", lineHeight: "1.5" }}
                  >
                    <span className="font-black text-lg sm:text-xl text-[#CBA7D2] flex items-center gap-2" style={{ fontFamily: "var(--font-chalk)" }}>
                      👑 입장 코드 : {activeRoomCode}
                    </span>
                  </div>
                )}
                {inGameRoom && isDealerHost && (
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-gray-800 font-extrabold rounded-2xl text-base border-2 border-emerald-400 shadow-lg cursor-pointer animate-pulse transition-all"
                    style={{ paddingTop: "0.85rem", paddingBottom: "0.85rem", fontFamily: "var(--font-chalk)" }}
                  >
                    <Play size={18} className="fill-white flex-shrink-0" />
                    <span>게임 시작하기</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════ [중앙 박스] ════════════════════ */}
        <div
          className="xl:col-span-6 chalk-box flex flex-col bg-white/85 backdrop-blur-md h-full gap-4"
          style={{ padding: "0.85rem" }}
        >
          {mode === "player" ? (
            /* ── 플레이어 모드 가운데 UI ── */
            <div className="flex flex-col gap-4 w-full h-full">
              {/* 연습 모드(방 미접속): 게임 대기 안내 */}
              {!inGameRoom ? (
                <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between" style={{ gap: "1.45rem" }}>
                  {/* 좌측: 주사위 플레이스홀더 */}
                  <div className="flex flex-col items-center justify-center flex-shrink-0 py-2 mx-auto xl:mx-0" style={{ gap: "1.25rem" }}>
                    <div className="flex items-center gap-5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="rounded-2xl border-4 border-dashed border-[#CBA7D2]/60 bg-gray-50/60 flex items-center justify-center shadow-xl"
                          style={{ width: "80px", height: "80px" }}
                        >
                          <Dice5 size={44} className="text-[#CBA7D2]/70" />
                        </div>
                      ))}
                    </div>
                    <p
                      className="text-gray-400 font-bold text-center"
                      style={{ fontFamily: "var(--font-chalk)", fontSize: "1.05rem", letterSpacing: "0.04em" }}
                    >
                      게임 보드 (개발 중)
                    </p>
                  </div>

                  {/* 우측: 연습 설명 */}
                  <div className="flex-1 w-full flex flex-col items-center xl:items-stretch" style={{ gap: "0.65rem" }}>
                    <div className="flex items-center gap-2 text-gray-700 font-semibold justify-center xl:justify-start" style={{ fontFamily: "var(--font-chalk)", fontSize: "0.85rem" }}>
                      <Pencil size={16} className="text-[#CBA7D2] flex-shrink-0" />
                      <span>게임 시작을 기다리는 동안 게임 설명을 확인해 보세요.</span>
                    </div>
                    <div
                      className="w-full rounded-2xl border-2 border-dashed border-gray-200/80 bg-gray-50/60 text-center"
                      style={{ padding: "1.25rem 1.45rem" }}
                    >
                      <p className="text-gray-500" style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                        주사위를 굴리고 예측 카드를 제출하여 승점을 획득하세요.<br />
                        게임 시작 후 이 영역에 주사위 보드가 표시됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* 방 입장 후: 주사위 보드 + 대기 안내 */
                <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6">
                  <div className="flex flex-col items-center justify-center flex-shrink-0 py-2 mx-auto xl:mx-0" style={{ gap: "1.25rem" }}>
                    <div className="flex items-center gap-5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="rounded-2xl border-4 border-dashed border-[#CBA7D2]/60 bg-gray-50/60 flex items-center justify-center shadow-xl"
                          style={{ width: "80px", height: "80px" }}
                        >
                          <Dice5 size={44} className="text-[#CBA7D2]/70" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="relative flex-1 w-full flex flex-col items-stretch gap-3">
                    <div className="py-6 text-center text-gray-500 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                      게임 시작을 기다리는 중입니다...
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full border-t border-dashed border-gray-300/70" style={{ marginTop: "0.45rem", marginBottom: "0.45rem" }} />

              {/* 하단 컨트롤 영역 (입장 전: 안내 / 입장 후: 주사위 제출 자리) */}
              <div className="flex flex-col w-full" style={{ gap: "0.85rem" }}>
                <div
                  className="w-full rounded-2xl border border-dashed bg-white border-gray-300 text-[#CBA7D2] transition-all duration-200 flex items-center justify-between min-h-[58px] h-[58px]"
                  style={{ padding: "0.65rem" }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 font-extrabold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.45rem" }}>선택한 주사위:</span>
                    <span className="font-black text-[#CBA7D2] tracking-widest" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.85rem" }}>&nbsp;</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="btn-chalk w-full justify-center font-extrabold shadow-lg transition-all cursor-not-allowed opacity-60"
                  style={{ padding: "0.65rem 1.45rem", fontFamily: "var(--font-chalk)", fontSize: "1.45rem", letterSpacing: "0.35em" }}
                >
                  제출하기
                </button>
              </div>
            </div>
          ) : (
            /* ── 딜러 모드 가운데 UI ── */
            <div className="relative flex flex-col gap-4 w-full">
              {!inGameRoom && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/85 rounded-2xl backdrop-blur-sm">
                  <div className="w-full flex items-center justify-center bg-white/90 rounded-2xl border-2 border-dashed border-gray-300/90 shadow-sm text-center" style={{ paddingTop: "0.85rem", paddingBottom: "0.85rem" }}>
                    <div className="text-gray-800 font-medium flex items-center justify-center gap-3" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.05rem" }}>
                      <Megaphone size={20} className="text-[#CBA7D2] flex-shrink-0 animate-bounce" />
                      <span>우측 [방 생성하기]를 클릭하면 딜러 대시보드가 실시간으로 연결됩니다.</span>
                    </div>
                  </div>
                </div>
              )}
              <div className={`flex flex-col gap-4 w-full${!inGameRoom ? " invisible" : ""}`}>
                <div className="flex flex-col items-center justify-center py-10 gap-5">
                  <div className="flex items-center gap-5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-2xl border-4 border-dashed border-[#CBA7D2]/60 bg-gray-50/60 flex items-center justify-center shadow-xl"
                        style={{ width: "80px", height: "80px" }}
                      >
                        <Dice5 size={44} className="text-[#CBA7D2]/70" />
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-400 font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.05rem" }}>
                    게임 보드 (개발 중)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════ [우측 박스] ════════════════════ */}
        <div
          className="xl:col-span-3 chalk-box flex flex-col bg-white/80 backdrop-blur-md h-full"
          style={{ padding: "0.85rem" }}
        >
          {mode === "player" ? (
            <>
              <div className="flex items-center gap-3 w-full min-h-[44px]">
                <HelpCircle className="text-[#CBA7D2] flex-shrink-0" size={28} />
                <h2 className="text-[#CBA7D2] font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.85rem", lineHeight: 1.1 }}>게임 설명</h2>
              </div>
              <div className="w-full border-t border-dashed border-gray-200" style={{ marginTop: "0.85rem", marginBottom: "0.85rem" }} />
              <div
                className="flex flex-col text-gray-700 leading-relaxed py-1 overflow-y-auto"
                style={{ gap: "0.85rem", fontFamily: "var(--font-chalk)", fontSize: "0.85rem", wordBreak: "break-all", letterSpacing: "-0.015em" }}
              >
                {/* ① 게임 소개 */}
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">①</span>
                  <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                    <strong className="text-[#CBA7D2] font-bold">&lsquo;트리플 다이스&rsquo;</strong>는 세 개의 주사위를 조합하고 예측을 성공시켜 높은 승점을 획득해야 하는 게임입니다.
                  </p>
                </div>

                {/* ② 시작 조건 */}
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">②</span>
                  <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                    게임은 총 4라운드로 진행되며, 각 플레이어들은 흰색 주사위 9개, 빨간 주사위 1개, 파란 주사위 1개를 가지고 시작합니다.
                  </p>
                </div>

                {/* ③ 주사위 공개 규칙 */}
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">③</span>
                  <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                    라운드가 시작되면 플레이어들은 주사위 11개를 굴립니다. 흰색 주사위는 본인을 포함한 모두에게 공개되며, 빨간 주사위와 파란 주사위는 자신만 확인할 수 있습니다.
                  </p>
                </div>

                {/* ④ 예측 카드 제출 + 카드 종류 박스 */}
                <div className="flex flex-col gap-2" style={{ marginBottom: "0.2rem" }}>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">④</span>
                    <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                      11개의 주사위를 굴린 뒤 플레이어들은 자신이 이번 라운드에 획득할 점수를 예측하여 예측 카드를 비공개로 제출합니다. 예측 카드의 종류는 다음과 같습니다.
                    </p>
                  </div>
                  <div
                    className="w-full rounded-2xl shadow-lg border-2 border-dashed border-[#CBA7D2]/90 bg-gray-50/80 backdrop-blur-md"
                    style={{ padding: "0.65rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}
                  >
                    {[
                      { label: "ZERO", desc: "승점 0점 획득" },
                      { label: "MIN", desc: "승점 0점 초과 7점 미만 획득" },
                      { label: "MORE", desc: "승점 7점 이상 10점 이하 획득" },
                      { label: "MAX", desc: "승점 10점 초과 획득" },
                    ].map(({ label, desc }, idx) => (
                      <div
                        key={label}
                        className="flex items-start gap-2.5 text-gray-600 font-medium"
                        style={{ fontSize: "0.85rem", lineHeight: "1.5", letterSpacing: "-0.015em" }}
                      >
                        <AlertTriangle size={16} className="flex-shrink-0 text-[#CBA7D2] mt-0.5" />
                        <span>
                          <span className="font-extrabold text-[#CBA7D2]">{idx + 1}. {label}</span>
                          {" "}: {desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ⑤ 주사위 제출 */}
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">⑤</span>
                  <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                    선 플레이어부터 순서대로 원하는 주사위 3개를 제출합니다. 이때 히든 주사위는 모든 플레이어의 주사위 제출이 끝나면 공개됩니다.
                  </p>
                </div>
              </div>
            </>
          ) : inGameRoom && isDealerHost ? (
            /* ── 딜러 방 생성 후: 실시간 게임 공지 ── */
            <div className="flex flex-col justify-between flex-1 h-full min-h-[460px]">
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-3 w-full min-h-[44px]">
                  <Megaphone className="text-[#CBA7D2] flex-shrink-0" size={28} />
                  <h2 className="text-[#CBA7D2] font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.85rem", lineHeight: 1.1 }}>
                    실시간 게임 공지
                  </h2>
                </div>
                <div className="w-full border-t border-dashed border-gray-200" style={{ marginTop: "0.85rem", marginBottom: "0.85rem" }} />
                <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1.5 max-h-[420px]">
                  {activityLogs.length > 0 ? (
                    activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2.5 leading-relaxed py-0.5" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}>
                        <span className="flex-shrink-0 font-extrabold text-base sm:text-lg text-cyan-300" style={{ fontFamily: "var(--font-chalk)" }}>
                          {log.tag}
                        </span>
                        <span className="flex-1 text-gray-700" style={{ wordBreak: "break-all" }}>{log.text}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center text-gray-500 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                      공지 내역이 여기에 실시간으로 표시됩니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── 딜러 방 생성 전: 게임 생성 옵션 ── */
            <>
              <div className="flex items-center gap-3 w-full min-h-[44px]">
                <Settings className="text-[#CBA7D2] flex-shrink-0" size={28} />
                <h2 className="text-[#CBA7D2] font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.85rem", lineHeight: 1.1 }}>게임 생성</h2>
              </div>
              <div className="w-full border-t border-dashed border-gray-200" style={{ marginTop: "0.85rem", marginBottom: "0.85rem" }} />
              <div className="flex flex-col justify-between flex-1 py-1" style={{ gap: "0.95rem" }}>
                <div className="flex flex-col" style={{ gap: "0.95rem" }}>
                  <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
                    방을 생성하여 플레이어들과 트리플 다이스 게임을 시작할 수 있습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateGame}
                  className="btn-chalk w-full justify-center font-extrabold cursor-pointer"
                  style={{ marginTop: "1rem", padding: "0.65rem 1.45rem", fontFamily: "var(--font-chalk)", fontSize: "1.45rem" }}
                >
                  방 생성하기
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
