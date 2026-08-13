/**
 * src/app/formula-pyramid/page.tsx
 * 수식 피라미드 게임 페이지
 *
 * [점선 구분선 위/아래 픽셀 단위 1:1 완벽 대칭]
 * 독립된 border-t 점선 구분선 요소에 marginTop & marginBottom 을 동일하게 지정하여
 * 점선 위 텍스트 ↔ 점선 ↔ 점선 아래 텍스트 간격을 100% 대칭으로 보장
 */

"use client";

import { useState } from "react";
import {
  Pencil,
  AlertTriangle,
  Settings,
  HelpCircle,
  LogIn,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Copy,
  Sparkles,
  Monitor,
} from "lucide-react";

/* ─── 피라미드 칸 데이터 (A ~ J) ─────────────────────────────────────────── */
interface PyramidNode {
  id: string;
  op: string;
  num: number;
  display: string;
}

const PYRAMID_DATA: PyramidNode[][] = [
  [{ id: "A", op: "+", num: 1, display: "+1" }],
  [
    { id: "B", op: "÷", num: 4, display: "÷4" },
    { id: "C", op: "×", num: 3, display: "×3" },
  ],
  [
    { id: "D", op: "-", num: 10, display: "-10" },
    { id: "E", op: "÷", num: 5, display: "÷5" },
    { id: "F", op: "×", num: 6, display: "×6" },
  ],
  [
    { id: "G", op: "-", num: 11, display: "-11" },
    { id: "H", op: "+", num: 7, display: "+7" },
    { id: "I", op: "÷", num: 9, display: "÷9" },
    { id: "J", op: "+", num: 9, display: "+9" },
  ],
];

const ALL_NODES: Record<string, PyramidNode> = {};
PYRAMID_DATA.flat().forEach((node) => {
  ALL_NODES[node.id] = node;
});

/* ─── 정육각형(Hexagon) SVG 컴포넌트 ────────────────────────────────────── */
function HexagonCell({
  node,
  isSelected,
  onClick,
}: {
  node: PyramidNode;
  isSelected: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-200 hover:scale-105 select-none w-20 h-24 sm:w-24 sm:h-28 md:w-26 md:h-30 flex items-center justify-center ${
        isSelected ? "drop-shadow-[0_0_15px_rgba(245,230,66,0.95)]" : ""
      }`}
    >
      <svg
        viewBox="0 0 100 115"
        className="w-full h-full absolute inset-0 filter drop-shadow-md"
      >
        <polygon
          points="50,2 95,28 95,87 50,113 5,87 5,28"
          fill={isSelected ? "rgba(245, 230, 66, 0.3)" : "rgba(20, 50, 50, 0.9)"}
          stroke={isSelected ? "#f5e642" : "rgba(240, 237, 232, 0.65)"}
          strokeWidth="3.5"
          strokeDasharray={isSelected ? "none" : "4 2"}
        />
        <polygon
          points="50,2 95,28 73,42 50,28 27,42 5,28"
          fill={isSelected ? "rgba(245, 230, 66, 0.6)" : "rgba(240, 237, 232, 0.18)"}
          stroke={isSelected ? "#f5e642" : "rgba(240, 237, 232, 0.55)"}
          strokeWidth="2"
        />
        <text
          x="50"
          y="23"
          textAnchor="middle"
          fill={isSelected ? "#1a3a3a" : "var(--chalk-yellow)"}
          fontSize="15"
          fontWeight="bold"
          fontFamily="var(--font-chalk)"
        >
          {node.id}
        </text>
        <text
          x="50"
          y="75"
          textAnchor="middle"
          fill={isSelected ? "#f5e642" : "var(--chalk-white)"}
          fontSize="23"
          fontWeight="bold"
          fontFamily="var(--font-chalk)"
        >
          {node.display}
        </text>
      </svg>
    </div>
  );
}

/* ─── 메인 수식 피라미드 페이지 ─────────────────────────────────────────── */
export default function FormulaPyramidPage() {
  const [mode, setMode] = useState<"player" | "dealer">("player");

  /* ── 플레이어 모드 상태 ── */
  const [nickname, setNickname] = useState("");
  const [entryCode, setEntryCode] = useState("");
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [submissionResult, setSubmissionResult] = useState<{
    success?: boolean;
    msg?: string;
    calcValue?: number;
  } | null>(null);

  /* ── 딜러 모드 상태 ── */
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedTime, setSelectedTime] = useState<number>(1);
  const [selectedPenalty, setSelectedPenalty] = useState<string>("없음");
  const [generatedRoomCode, setGeneratedRoomCode] = useState<string>("");

  const handleNodeClick = (nodeId: string) => {
    if (selectedNodes.includes(nodeId)) {
      setSelectedNodes(selectedNodes.filter((id) => id !== nodeId));
    } else {
      if (selectedNodes.length >= 3) return;
      setSelectedNodes([...selectedNodes, nodeId]);
    }
    setSubmissionResult(null);
  };

  const calculateFormula = (nodeIds: string[]): { exprStr: string; result: number | null } => {
    if (nodeIds.length === 0) return { exprStr: "", result: null };
    const nodes = nodeIds.map((id) => ALL_NODES[id]);

    let exprStr = `${nodes[0].id}(${nodes[0].num})`;
    for (let i = 1; i < nodes.length; i++) {
      exprStr += ` ${nodes[i].op} ${nodes[i].id}(${nodes[i].num})`;
    }

    if (nodeIds.length < 3) return { exprStr, result: null };

    let calcExpr = `${nodes[0].num}`;
    for (let i = 1; i < nodes.length; i++) {
      const opSymbol = nodes[i].op === "×" ? "*" : nodes[i].op === "÷" ? "/" : nodes[i].op;
      calcExpr += ` ${opSymbol} ${nodes[i].num}`;
    }

    try {
      // eslint-disable-next-line no-eval
      const evalRes = Function(`"use strict"; return (${calcExpr})`)();
      return { exprStr, result: Number(evalRes) };
    } catch {
      return { exprStr, result: null };
    }
  };

  const { exprStr, result: currentResult } = calculateFormula(selectedNodes);

  const handleSubmitAnswer = () => {
    if (selectedNodes.length !== 3) {
      setSubmissionResult({
        success: false,
        msg: "3개의 칸을 모두 선택해야 합니다!",
      });
      return;
    }

    const TARGET = 9;
    if (currentResult === TARGET) {
      setSubmissionResult({
        success: true,
        msg: `🎉 정답입니다! (+1점 획득) 수식 결과 = ${currentResult}`,
        calcValue: currentResult,
      });
    } else {
      setSubmissionResult({
        success: false,
        msg: `❌ 오답입니다! (-1점 감점) 계산 결과: ${currentResult} (목표: ${TARGET})`,
        calcValue: currentResult ?? undefined,
      });
    }
  };

  const handleCreateGame = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = `PYRAMID-${randomNum}`;
    setGeneratedRoomCode(code);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start px-4 sm:px-8 pt-6 pb-12">
      <div className="w-full max-w-[1550px] flex flex-col mx-auto">
        {/* ───────────────────────────────────────────────────────────────────
           [상단 고정 타이틀 & 슬라이딩 스위치]
           ─────────────────────────────────────────────────────────────────── */}
        <div className="h-[80px] min-h-[80px] flex-shrink-0 flex items-center justify-between pb-4 border-b-2 border-dashed border-teal-800 w-full mb-8">
          <div>
            <h1
              className="text-3xl sm:text-4xl text-yellow-300 flex items-center gap-2 mb-1"
              style={{ fontFamily: "var(--font-chalk)" }}
            >
              <Sparkles className="text-yellow-400" />
              수식 피라미드 (Formula Pyramid)
            </h1>
            <p className="text-sm text-gray-300 mt-1" style={{ fontFamily: "var(--font-body)" }}>
              3개의 칸을 조합하여 타깃 넘버(TARGET)를 만드는 브레인 서바이벌 게임
            </p>
          </div>

          {/* 타원형 ON/OFF 슬라이딩 스위치 */}
          <div className="flex items-center gap-4 select-none">
            <span
              onClick={() => setMode("player")}
              className={`cursor-pointer text-lg font-semibold transition-colors duration-200 ${
                mode === "player" ? "text-yellow-300 font-bold scale-105" : "text-gray-400 hover:text-gray-200"
              }`}
              style={{ fontFamily: "var(--font-chalk)" }}
            >
              플레이어 모드
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={mode === "dealer"}
              onClick={() => setMode(mode === "player" ? "dealer" : "player")}
              className="relative inline-flex items-center justify-start h-9 w-16 rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none"
              style={{
                background: "rgba(10, 30, 30, 0.95)",
                border: "2px solid rgba(245, 230, 66, 0.8)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.6), 0 0 10px rgba(245, 230, 66, 0.2)",
              }}
              title="모드 전환 스위치"
            >
              <span
                className={`inline-block w-6 h-6 rounded-full transition-transform duration-300 ease-in-out shadow-lg ${
                  mode === "dealer"
                    ? "translate-x-7 bg-yellow-400"
                    : "translate-x-0 bg-white"
                }`}
                style={{
                  boxShadow: mode === "dealer"
                    ? "0 0 8px rgba(245, 230, 66, 0.9)"
                    : "0 0 8px rgba(255, 255, 255, 0.8)",
                }}
              />
            </button>

            <span
              onClick={() => setMode("dealer")}
              className={`cursor-pointer text-lg font-semibold transition-colors duration-200 ${
                mode === "dealer" ? "text-yellow-300 font-bold scale-105" : "text-gray-400 hover:text-gray-200"
              }`}
              style={{ fontFamily: "var(--font-chalk)" }}
            >
              딜러 모드
            </span>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
           [하단 3분할 박스 영역]
           ─────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch w-full mx-auto min-h-[640px]">
          {/* ── [좌측 박스] xl:col-span-3 ─────────────────────────────────── */}
          <div className="xl:col-span-3 chalk-box content-box flex flex-col bg-teal-950/75 backdrop-blur-md h-full min-h-[640px] p-6 sm:p-7">
            {mode === "player" ? (
              <>
                {/* [제목 영역] */}
                <div className="flex items-center gap-3">
                  <LogIn className="text-yellow-400 flex-shrink-0" size={24} />
                  <h2
                    className="text-2.5xl text-yellow-300"
                    style={{ fontFamily: "var(--font-chalk)", lineHeight: 1.1 }}
                  >
                    게임 입장하기
                  </h2>
                </div>

                {/* [독립 점선 구분선] 점선 위(marginTop)와 아래(marginBottom)를 1.1rem(18px)으로 100% 동일 대칭 */}
                <div
                  className="w-full border-t border-dashed border-teal-700"
                  style={{ marginTop: "1.1rem", marginBottom: "1.1rem" }}
                />

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert(`[${nickname || "손님"}] 님, 입장 코드 [${entryCode}] 로 입장을 시도합니다.`);
                  }}
                  className="flex flex-col flex-1 justify-between"
                >
                  <div className="flex flex-col gap-5">
                    {/* 닉네임 입력 */}
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="nickname-input"
                        className="text-base text-gray-200 font-medium tracking-wide"
                        style={{ fontFamily: "var(--font-chalk)" }}
                      >
                        닉네임
                      </label>
                      <input
                        id="nickname-input"
                        type="text"
                        placeholder="닉네임을 입력해 주세요"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full rounded-md bg-teal-900/90 border border-dashed border-teal-600 text-white text-base focus:outline-none focus:border-yellow-400 placeholder:text-gray-400/80"
                        style={{
                          padding: "12px 18px",
                          fontFamily: "var(--font-body)",
                          lineHeight: "1.5",
                        }}
                      />
                    </div>

                    {/* 입장 코드 입력 */}
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="code-input"
                        className="text-base text-gray-200 font-medium tracking-wide"
                        style={{ fontFamily: "var(--font-chalk)" }}
                      >
                        입장 코드
                      </label>
                      <input
                        id="code-input"
                        type="text"
                        placeholder="딜러에게 받은 코드 (예: PYRAMID-1234)"
                        value={entryCode}
                        onChange={(e) => setEntryCode(e.target.value)}
                        className="w-full rounded-md bg-teal-900/90 border border-dashed border-teal-600 text-white text-base uppercase focus:outline-none focus:border-yellow-400 placeholder:text-gray-400/80"
                        style={{
                          padding: "12px 18px",
                          fontFamily: "var(--font-body)",
                          lineHeight: "1.5",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-chalk w-full justify-center text-xl mt-6"
                    style={{ padding: "14px 20px" }}
                  >
                    게임 방 입장하기
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Monitor className="text-yellow-400 flex-shrink-0" size={24} />
                  <h2
                    className="text-2.5xl text-yellow-300"
                    style={{ fontFamily: "var(--font-chalk)", lineHeight: 1.1 }}
                  >
                    딜러 가이드
                  </h2>
                </div>

                {/* 점선 구분선 (1:1 동일 대칭) */}
                <div
                  className="w-full border-t border-dashed border-teal-700"
                  style={{ marginTop: "1.1rem", marginBottom: "1.1rem" }}
                />

                <div
                  className="flex flex-col gap-5 text-sm text-gray-200 leading-relaxed flex-1 justify-between py-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <div className="flex flex-col gap-4">
                    <p className="leading-loose">
                      딜러 모드에서는 라운드 수, 제한 시간, 오답 패널티를 설정하여 방을 생성할 수 있습니다.
                    </p>
                    <div className="bg-teal-900/60 p-4.5 rounded-md border border-dashed border-yellow-400/50 text-xs text-yellow-300 leading-relaxed">
                      💡 생성된 방 코드를 학생(플레이어)들에게 공유하세요.
                    </div>
                  </div>
                  <div className="p-4 bg-teal-900/40 rounded-md text-center text-xs text-gray-400 border border-dashed border-teal-700">
                    현재 모드: <span className="text-yellow-400 font-bold">딜러 진행 관리</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── [중앙 박스] xl:col-span-6 ─────────────────────────────────── */}
          <div className="xl:col-span-6 chalk-box content-box flex flex-col items-center bg-teal-950/85 backdrop-blur-md h-full min-h-[640px] p-6 sm:p-7">
            {mode === "player" ? (
              <>
                <div className="text-center w-full">
                  <h2
                    className="text-3.5xl text-yellow-300 mb-1"
                    style={{ fontFamily: "var(--font-chalk)", lineHeight: 1.1 }}
                  >
                    수식 피라미드
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-300 mt-1">
                    <Pencil size={16} className="text-yellow-400" />
                    <span style={{ fontFamily: "var(--font-body)" }}>
                      게임 시작을 기다리는 동안 연습해 보세요.
                    </span>
                  </div>
                </div>

                {/* 점선 구분선 (1:1 동일 대칭) */}
                <div
                  className="w-full border-t border-dashed border-teal-700"
                  style={{ marginTop: "1.1rem", marginBottom: "1.1rem" }}
                />

                <div className="py-4 flex flex-col items-center gap-3 my-auto w-full overflow-x-auto">
                  {PYRAMID_DATA.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center gap-3">
                      {row.map((node) => (
                        <HexagonCell
                          key={node.id}
                          node={node}
                          isSelected={selectedNodes.includes(node.id)}
                          onClick={() => handleNodeClick(node.id)}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                <div className="w-full chalk-box-straight p-5 sm:p-6 bg-teal-900/60 rounded-md flex flex-col gap-5 mt-auto">
                  <div className="w-full bg-teal-950 px-5 py-4 rounded-md border border-dashed border-teal-600 flex items-center justify-between">
                    <span className="text-sm text-teal-400 font-semibold" style={{ fontFamily: "var(--font-chalk)" }}>
                      선택된 수식 보드:
                    </span>
                    <span
                      className="text-2xl font-bold text-yellow-300 tracking-widest"
                      style={{ fontFamily: "var(--font-chalk)" }}
                    >
                      {exprStr || "(칸 3개를 클릭하세요)"}
                    </span>
                    {currentResult !== null && (
                      <span className="text-xl font-bold text-emerald-400 ml-2">
                        = {currentResult}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch gap-4">
                    <div className="chalk-box-straight bg-teal-950 px-6 py-4 flex flex-col items-center justify-center min-w-[110px] border-yellow-400/80">
                      <span
                        className="text-xs text-yellow-400 font-bold tracking-wider mb-1"
                        style={{ fontFamily: "var(--font-chalk)" }}
                      >
                        TARGET
                      </span>
                      <span
                        className="text-4xl text-white font-black"
                        style={{ fontFamily: "var(--font-chalk)" }}
                      >
                        9
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col gap-2.5">
                      <div className="text-sm text-gray-300 font-semibold" style={{ fontFamily: "var(--font-chalk)" }}>
                        칸 클릭 선택 (최대 3개):
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.values(ALL_NODES).map((node) => {
                          const isSel = selectedNodes.includes(node.id);
                          return (
                            <button
                              key={node.id}
                              type="button"
                              onClick={() => handleNodeClick(node.id)}
                              className={`py-2 px-2 rounded-md text-base font-bold transition-all ${
                                isSel
                                  ? "bg-yellow-400 text-teal-950 scale-105 shadow-md"
                                  : "bg-teal-800/90 text-white hover:bg-teal-700"
                              }`}
                              style={{ fontFamily: "var(--font-chalk)" }}
                            >
                              {node.id} ({node.display})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 mt-1">
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      className="btn-chalk flex-1 justify-center py-3.5 text-xl"
                    >
                      제출하기
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNodes([]);
                        setSubmissionResult(null);
                      }}
                      className="p-3.5 text-gray-300 hover:text-white rounded-md border border-dashed border-teal-600 hover:border-yellow-400 transition-colors"
                      title="선택 초기화"
                    >
                      <RefreshCw size={22} />
                    </button>
                  </div>

                  {submissionResult && (
                    <div
                      className={`p-4 rounded-md border text-base flex items-center gap-3 ${
                        submissionResult.success
                          ? "bg-emerald-950/90 border-emerald-500 text-emerald-300"
                          : "bg-rose-950/90 border-rose-500 text-rose-300"
                      }`}
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {submissionResult.success ? (
                        <CheckCircle2 size={22} className="flex-shrink-0" />
                      ) : (
                        <XCircle size={22} className="flex-shrink-0" />
                      )}
                      <span>{submissionResult.msg}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full my-auto text-center py-16">
                <Pencil size={60} className="text-yellow-400/60 mb-5 animate-bounce" />
                <h2
                  className="text-4xl text-yellow-300 mb-3"
                  style={{ fontFamily: "var(--font-chalk)" }}
                >
                  개발중입니다.
                </h2>
                <p className="text-base text-gray-300 max-w-md leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                  딜러 진행용 실시간 게임 현황 모니터링 및 진행 컨트롤러 기능이 준비 중입니다.
                </p>
              </div>
            )}
          </div>

          {/* ── [우측 박스] xl:col-span-3 ─────────────────────────────────── */}
          <div className="xl:col-span-3 chalk-box content-box flex flex-col bg-teal-950/80 backdrop-blur-md h-full min-h-[640px] p-6 sm:p-7">
            {mode === "player" ? (
              <>
                <div className="flex items-center gap-3">
                  <HelpCircle className="text-yellow-400 flex-shrink-0" size={24} />
                  <h2
                    className="text-2.5xl text-yellow-300"
                    style={{ fontFamily: "var(--font-chalk)", lineHeight: 1.1 }}
                  >
                    게임 설명
                  </h2>
                </div>

                {/* 점선 구분선 (1:1 동일 대칭) */}
                <div
                  className="w-full border-t border-dashed border-teal-700"
                  style={{ marginTop: "1.1rem", marginBottom: "1.1rem" }}
                />

                <div
                  className="flex flex-col gap-5 text-sm text-gray-200 leading-relaxed py-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <p className="leading-relaxed">
                    ① <strong className="text-yellow-300 font-semibold">&lsquo;수식 피라미드&rsquo;</strong>는
                    문제 판에서 3개의 칸을 선택하여 타깃 넘버가 될 수 있도록 수식을 만드는 게임입니다.
                  </p>

                  <p className="leading-relaxed">
                    ② 라운드가 시작되면 피라미드 모양의 문제판과 타깃 넘버가 공개됩니다. 문제판은 총 10개의
                    칸으로 이루어져 있으며, 각 칸에는 사칙연산 기호 중 하나와 숫자가 한 쌍을 이루고
                    있습니다.
                  </p>

                  <div className="flex flex-col gap-3 bg-teal-900/70 p-4.5 rounded-md border border-dashed border-yellow-500/40">
                    <p className="font-medium text-yellow-200">
                      ③ 문제판이 공개되면 이 중 3개의 칸을 조합해 타깃 넘버가 답이 되는 수식을 만들어야
                      합니다.
                    </p>
                    <div className="flex items-start gap-2 text-xs text-yellow-300 mt-1">
                      <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-yellow-400" />
                      <span>동일한 칸은 중복선택할 수 없습니다.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-yellow-300">
                      <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-yellow-400" />
                      <span>수식의 맨 앞에 사용된 칸의 연산 기호는 무시합니다.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-yellow-300">
                      <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-yellow-400" />
                      <span>완성된 수식은 사칙연산 순서에 따라 계산됩니다.</span>
                    </div>
                  </div>

                  <p className="leading-relaxed">
                    ④ 정답을 제출하면 1점을 획득하고, 오답을 제출하거나 이번 라운드에서 이미 제출된 정답을
                    다시 제출하는 경우 1점이 감점됩니다.
                  </p>

                  <p className="leading-relaxed">⑤ 라운드 진행 시간이 지났거나 모든 정답이 제출되면 라운드가 종료됩니다.</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Settings className="text-yellow-400 flex-shrink-0" size={24} />
                  <h2
                    className="text-2.5xl text-yellow-300"
                    style={{ fontFamily: "var(--font-chalk)", lineHeight: 1.1 }}
                  >
                    게임 세팅 & 방 생성
                  </h2>
                </div>

                {/* 점선 구분선 (1:1 동일 대칭) */}
                <div
                  className="w-full border-t border-dashed border-teal-700"
                  style={{ marginTop: "1.1rem", marginBottom: "1.1rem" }}
                />

                <div className="flex flex-col gap-6 flex-1 justify-between py-1">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2.5">
                      <label className="text-base text-gray-200 font-medium" style={{ fontFamily: "var(--font-chalk)" }}>
                        라운드 설정 ({selectedRound}라운드)
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 15 }, (_, i) => i + 1).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSelectedRound(r)}
                            className={`py-2 text-sm font-bold rounded-md transition-all ${
                              selectedRound === r
                                ? "bg-yellow-400 text-teal-950 shadow scale-105"
                                : "bg-teal-900/90 text-gray-300 hover:bg-teal-800"
                            }`}
                            style={{ fontFamily: "var(--font-chalk)" }}
                          >
                            {r}R
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <label className="text-base text-gray-200 font-medium" style={{ fontFamily: "var(--font-chalk)" }}>
                        라운드 별 시간 ({selectedTime}분)
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[1, 2, 3, 4, 5].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedTime(t)}
                            className={`py-2.5 text-base font-bold rounded-md transition-all ${
                              selectedTime === t
                                ? "bg-yellow-400 text-teal-950 shadow scale-105"
                                : "bg-teal-900/90 text-gray-300 hover:bg-teal-800"
                            }`}
                            style={{ fontFamily: "var(--font-chalk)" }}
                          >
                            {t}분
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <label className="text-base text-gray-200 font-medium" style={{ fontFamily: "var(--font-chalk)" }}>
                        오답 패널티 ({selectedPenalty})
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {["없음", "1초", "2초", "3초", "4초", "5초"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setSelectedPenalty(p)}
                            className={`py-2.5 text-sm font-bold rounded-md transition-all ${
                              selectedPenalty === p
                                ? "bg-yellow-400 text-teal-950 shadow scale-105"
                                : "bg-teal-900/90 text-gray-300 hover:bg-teal-800"
                            }`}
                            style={{ fontFamily: "var(--font-chalk)" }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleCreateGame}
                      className="btn-chalk w-full justify-center py-3.5 text-xl"
                    >
                      게임 방 생성하기
                    </button>

                    {generatedRoomCode && (
                      <div className="chalk-box-straight bg-teal-950 p-4 mt-4 flex flex-col items-center gap-2 border-yellow-400 text-center rounded-md">
                        <span className="text-xs text-gray-300" style={{ fontFamily: "var(--font-body)" }}>
                          생성된 방 코드
                        </span>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="text-2.5xl text-yellow-300 font-bold tracking-widest"
                            style={{ fontFamily: "var(--font-chalk)" }}
                          >
                            {generatedRoomCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedRoomCode);
                              alert(`방 코드 [${generatedRoomCode}] 가 복사되었습니다!`);
                            }}
                            className="p-1.5 text-yellow-400 hover:text-yellow-200"
                            title="코드 복사"
                          >
                            <Copy size={20} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
