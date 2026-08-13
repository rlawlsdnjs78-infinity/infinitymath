/**
 * src/app/formula-pyramid/page.tsx
 * 수식 피라미드 게임 페이지
 *
 * [중앙 정렬 레이아웃 수정]
 * - 최상위 컨테이너에 flex flex-col items-center justify-center mx-auto 적용
 * - 모니터 해상도에 상관없이 3분할 대기창 덩어리가 화면 "정중앙(Center)"에 완벽 배치되도록 구조 개편
 */

"use client";

import { useState } from "react";
import {
  Pencil,
  AlertTriangle,
  Play,
  Settings,
  HelpCircle,
  LogIn,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Copy,
  Sparkles,
} from "lucide-react";

/* ─── 피라미드 칸 데이터 (A ~ J) ─────────────────────────────────────────── */
interface PyramidNode {
  id: string;
  op: string; // 사칙연산 기호
  num: number; // 숫자
  display: string; // 표시용 문자열 (예: +1, ÷4)
}

const PYRAMID_DATA: PyramidNode[][] = [
  // 1층
  [{ id: "A", op: "+", num: 1, display: "+1" }],
  // 2층
  [
    { id: "B", op: "÷", num: 4, display: "÷4" },
    { id: "C", op: "×", num: 3, display: "×3" },
  ],
  // 3층
  [
    { id: "D", op: "-", num: 10, display: "-10" },
    { id: "E", op: "÷", num: 5, display: "÷5" },
    { id: "F", op: "×", num: 6, display: "×6" },
  ],
  // 4층
  [
    { id: "G", op: "-", num: 11, display: "-11" },
    { id: "H", op: "+", num: 7, display: "+7" },
    { id: "I", op: "÷", num: 9, display: "÷9" },
    { id: "J", op: "+", num: 9, display: "+9" },
  ],
];

// 평탄화된 노드 맵 (id 기준 검색용)
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
        {/* 외곽 큰 정육각형 */}
        <polygon
          points="50,2 95,28 95,87 50,113 5,87 5,28"
          fill={isSelected ? "rgba(245, 230, 66, 0.3)" : "rgba(20, 50, 50, 0.9)"}
          stroke={isSelected ? "#f5e642" : "rgba(240, 237, 232, 0.65)"}
          strokeWidth="3.5"
          strokeDasharray={isSelected ? "none" : "4 2"}
        />

        {/* 내부 상단에 두 변을 공유하는 작은 정육각형 (캡/헤더 디자인) */}
        <polygon
          points="50,2 95,28 73,42 50,28 27,42 5,28"
          fill={isSelected ? "rgba(245, 230, 66, 0.6)" : "rgba(240, 237, 232, 0.18)"}
          stroke={isSelected ? "#f5e642" : "rgba(240, 237, 232, 0.55)"}
          strokeWidth="2"
        />

        {/* 상단 ID (A~J) 텍스트 */}
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

        {/* 중앙 사칙연산 값 텍스트 */}
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
  // 모드 상태: 'player' | 'dealer'
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
  const [selectedTime, setSelectedTime] = useState<number>(1); // 분
  const [selectedPenalty, setSelectedPenalty] = useState<string>("없음"); // "없음" | "1초" ~ "5초"
  const [generatedRoomCode, setGeneratedRoomCode] = useState<string>("");

  /* ── 노드 클릭 처리 ── */
  const handleNodeClick = (nodeId: string) => {
    if (selectedNodes.includes(nodeId)) {
      setSelectedNodes(selectedNodes.filter((id) => id !== nodeId));
    } else {
      if (selectedNodes.length >= 3) {
        return;
      }
      setSelectedNodes([...selectedNodes, nodeId]);
    }
    setSubmissionResult(null);
  };

  /* ── 수식 계산 로직 ── */
  const calculateFormula = (nodeIds: string[]): { exprStr: string; result: number | null } => {
    if (nodeIds.length === 0) return { exprStr: "", result: null };

    const nodes = nodeIds.map((id) => ALL_NODES[id]);

    let exprStr = `${nodes[0].id}(${nodes[0].num})`;
    for (let i = 1; i < nodes.length; i++) {
      exprStr += ` ${nodes[i].op} ${nodes[i].id}(${nodes[i].num})`;
    }

    if (nodeIds.length < 3) {
      return { exprStr, result: null };
    }

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

  /* ── 정답 제출 ── */
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

  /* ── 딜러 모드 방 생성 ── */
  const handleCreateGame = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = `PYRAMID-${randomNum}`;
    setGeneratedRoomCode(code);
  };

  return (
    /*
     * [최상위 래퍼]
     * flex-1 flex flex-col items-center justify-center mx-auto
     * 대형 화면이든 어떤 해상도이든 3분할 게임 화면 전체를 화면 "정중앙(Center)"에 배치합니다.
     */
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-8 my-auto">
      <div className="w-full max-w-[1550px] flex flex-col gap-6 mx-auto">
        {/* ───────────────────────────────────────────────────────────────────
           상단 타이틀 & 모드 변경 토글 스위치
           ─────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b-2 border-dashed border-teal-800 w-full">
          <div>
            <h1
              className="text-3xl sm:text-4xl text-yellow-300 flex items-center gap-2"
              style={{ fontFamily: "var(--font-chalk)" }}
            >
              <Sparkles className="text-yellow-400" />
              수식 피라미드 (Formula Pyramid)
            </h1>
            <p className="text-sm text-gray-300 mt-1" style={{ fontFamily: "var(--font-body)" }}>
              3개의 칸을 조합하여 타깃 넘버(TARGET)를 만드는 브레인 서바이벌 게임
            </p>
          </div>

          {/* ── 타원형 ON/OFF 모드 스위치 버튼 ───────────────────────────── */}
          <div
            className="chalk-box-straight rounded-full p-1.5 flex items-center gap-2"
            style={{
              background: "rgba(20, 48, 48, 0.95)",
              border: "2px solid var(--chalk-yellow)",
              boxShadow: "0 0 15px rgba(245, 230, 66, 0.25)",
            }}
          >
            {/* 플레이어 모드 버튼 */}
            <button
              type="button"
              onClick={() => setMode("player")}
              className={`px-6 py-2.5 rounded-full text-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                mode === "player"
                  ? "bg-yellow-400 text-teal-950 shadow-md scale-105"
                  : "text-gray-300 hover:text-white"
              }`}
              style={{ fontFamily: "var(--font-chalk)" }}
            >
              <Play size={18} />
              <span>플레이어 모드</span>
            </button>

            {/* 딜러 모드 버튼 */}
            <button
              type="button"
              onClick={() => setMode("dealer")}
              className={`px-6 py-2.5 rounded-full text-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                mode === "dealer"
                  ? "bg-yellow-400 text-teal-950 shadow-md scale-105"
                  : "text-gray-300 hover:text-white"
              }`}
              style={{ fontFamily: "var(--font-chalk)" }}
            >
              <Settings size={18} />
              <span>딜러 모드</span>
            </button>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
           1. 플레이어 모드 화면 (가로 3분할 — 화면 정중앙에 균형 있게 배치)
           ─────────────────────────────────────────────────────────────────── */}
        {mode === "player" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch w-full mx-auto">
            {/* ── [좌측] 게임 입장하기 (xl:col-span-3) ───────────────────────── */}
            <div className="xl:col-span-3 chalk-box content-box flex flex-col gap-6 bg-teal-950/75 backdrop-blur-md h-full">
              <div className="flex items-center gap-2 border-b border-dashed border-teal-700 pb-3">
                <LogIn className="text-yellow-400" size={24} />
                <h2 className="text-2.5xl text-yellow-300" style={{ fontFamily: "var(--font-chalk)" }}>
                  게임 입장하기
                </h2>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert(`[${nickname || "손님"}] 님, 입장 코드 [${entryCode}] 로 입장을 시도합니다.`);
                }}
                className="flex flex-col gap-5 flex-1 justify-between"
              >
                <div className="flex flex-col gap-4">
                  {/* 닉네임 입력 */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="nickname-input"
                      className="text-base text-gray-200 font-medium"
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
                      className="w-full px-4 py-3 rounded bg-teal-900/90 border border-dashed border-teal-600 text-white text-base focus:outline-none focus:border-yellow-400"
                      style={{ fontFamily: "var(--font-body)" }}
                    />
                  </div>

                  {/* 입장 코드 입력 */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="code-input"
                      className="text-base text-gray-200 font-medium"
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
                      className="w-full px-4 py-3 rounded bg-teal-900/90 border border-dashed border-teal-600 text-white text-base uppercase focus:outline-none focus:border-yellow-400"
                      style={{ fontFamily: "var(--font-body)" }}
                    />
                  </div>
                </div>

                {/* 입장 버튼 */}
                <button
                  type="submit"
                  className="btn-chalk w-full justify-center py-3.5 text-xl mt-4"
                >
                  게임 방 입장하기
                </button>
              </form>
            </div>

            {/* ── [중앙] 수식 피라미드 (xl:col-span-6) ──────────── */}
            <div className="xl:col-span-6 chalk-box content-box flex flex-col items-center gap-5 bg-teal-950/85 backdrop-blur-md h-full">
              {/* 상단 타이틀 & 설명 */}
              <div className="text-center w-full border-b border-dashed border-teal-700 pb-3">
                <h2 className="text-3.5xl text-yellow-300" style={{ fontFamily: "var(--font-chalk)" }}>
                  수식 피라미드
                </h2>
                <div className="flex items-center justify-center gap-1.5 text-sm text-gray-300 mt-1">
                  <Pencil size={16} className="text-yellow-400" />
                  <span style={{ fontFamily: "var(--font-body)" }}>
                    게임 시작을 기다리는 동안 연습해 보세요.
                  </span>
                </div>
              </div>

              {/* 4층짜리 정육각형 피라미드 (A~J) */}
              <div className="py-2 flex flex-col items-center gap-2 sm:gap-3 my-auto w-full overflow-x-auto">
                {PYRAMID_DATA.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex justify-center gap-2 sm:gap-3">
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

              {/* 피라미드 밑 하단 조작 컨트롤 박스 */}
              <div className="w-full chalk-box-straight p-4 sm:p-5 bg-teal-900/60 rounded flex flex-col gap-4 mt-auto">
                {/* 보드: 현재 선택 수식 렌더링 */}
                <div className="w-full bg-teal-950 p-3.5 rounded border border-dashed border-teal-600 flex items-center justify-between">
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

                {/* TARGET & A~J 클릭 입력 버튼 박스 */}
                <div className="flex flex-col sm:flex-row items-stretch gap-4">
                  {/* 좌측: TARGET / 9 */}
                  <div className="chalk-box-straight bg-teal-950 px-5 py-4 flex flex-col items-center justify-center min-w-[100px] border-yellow-400/80">
                    <span
                      className="text-sm text-yellow-400 font-bold tracking-wider"
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

                  {/* 우측: A~J 선택 클릭 박스 목록 */}
                  <div className="flex-1 flex flex-col gap-2">
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
                            className={`py-2 px-2 rounded text-base font-bold transition-all ${
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

                {/* 제출 및 초기화 버튼 */}
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    className="btn-chalk flex-1 justify-center py-3 text-xl"
                  >
                    제출하기
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNodes([]);
                      setSubmissionResult(null);
                    }}
                    className="p-3 text-gray-300 hover:text-white rounded border border-dashed border-teal-600 hover:border-yellow-400 transition-colors"
                    title="선택 초기화"
                  >
                    <RefreshCw size={22} />
                  </button>
                </div>

                {/* 제출 결과 메시지 피드백 */}
                {submissionResult && (
                  <div
                    className={`p-3.5 rounded border text-base flex items-center gap-2.5 ${
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
            </div>

            {/* ── [우측] 게임 설명 (xl:col-span-3) ───────────────────────────── */}
            <div className="xl:col-span-3 chalk-box content-box flex flex-col gap-4 bg-teal-950/75 backdrop-blur-md h-full">
              <div className="flex items-center gap-2 border-b border-dashed border-teal-700 pb-3">
                <HelpCircle className="text-yellow-400" size={24} />
                <h2 className="text-2.5xl text-yellow-300" style={{ fontFamily: "var(--font-chalk)" }}>
                  게임 설명
                </h2>
              </div>

              <div
                className="flex flex-col gap-4 text-sm text-gray-200 leading-relaxed"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <p>
                  ① <strong className="text-yellow-300 font-semibold">&lsquo;수식 피라미드&rsquo;</strong>는
                  문제 판에서 3개의 칸을 선택하여 타깃 넘버가 될 수 있도록 수식을 만드는 게임입니다.
                </p>

                <p>
                  ② 라운드가 시작되면 피라미드 모양의 문제판과 타깃 넘버가 공개됩니다. 문제판은 총 10개의
                  칸으로 이루어져 있으며, 각 칸에는 사칙연산 기호 중 하나와 숫자가 한 쌍을 이루고
                  있습니다.
                </p>

                <div className="flex flex-col gap-2.5 bg-teal-900/60 p-3.5 rounded border border-dashed border-yellow-500/40">
                  <p>
                    ③ 문제판이 공개되면 이 중 3개의 칸을 조합해 타깃 넘버가 답이 되는 수식을 만들어야
                    합니다.
                  </p>
                  <div className="flex items-start gap-1.5 text-xs text-yellow-300 mt-1">
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-yellow-400" />
                    <span>동일한 칸은 중복선택할 수 없습니다.</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-yellow-300">
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-yellow-400" />
                    <span>수식의 맨 앞에 사용된 칸의 연산 기호는 무시합니다.</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-yellow-300">
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-yellow-400" />
                    <span>완성된 수식은 사칙연산 순서에 따라 계산됩니다.</span>
                  </div>
                </div>

                <p>
                  ④ 정답을 제출하면 1점을 획득하고, 오답을 제출하거나 이번 라운드에서 이미 제출된 정답을
                  다시 제출하는 경우 1점이 감점됩니다.
                </p>

                <p>⑤ 라운드 진행 시간이 지났거나 모든 정답이 제출되면 라운드가 종료됩니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
           2. 딜러 모드 화면
           ─────────────────────────────────────────────────────────────────── */}
        {mode === "dealer" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch w-full mx-auto">
            {/* ── [좌측/중앙] 개발중입니다 (xl:col-span-8) ────────────────────── */}
            <div className="xl:col-span-8 chalk-box content-box flex flex-col items-center justify-center min-h-[450px] bg-teal-950/50 border-dashed border-teal-700/60 text-center h-full">
              <Pencil size={56} className="text-yellow-400/60 mb-4 animate-bounce" />
              <h2
                className="text-4xl text-yellow-300 mb-3"
                style={{ fontFamily: "var(--font-chalk)" }}
              >
                개발중입니다.
              </h2>
              <p className="text-base text-gray-300" style={{ fontFamily: "var(--font-body)" }}>
                딜러 진행용 모니터링 화면 및 실시간 진행 컨트롤러 기능이 준비 중입니다.
              </p>
            </div>

            {/* ── [우측] 세팅 및 방 생성 (xl:col-span-4) ───────────────────────── */}
            <div className="xl:col-span-4 chalk-box content-box flex flex-col gap-6 bg-teal-950/80 backdrop-blur-md h-full">
              <div className="flex items-center gap-2 border-b border-dashed border-teal-700 pb-3">
                <Settings className="text-yellow-400" size={24} />
                <h2 className="text-2.5xl text-yellow-300" style={{ fontFamily: "var(--font-chalk)" }}>
                  게임 세팅 & 방 생성
                </h2>
              </div>

              {/* 1. 라운드 설정 (1~15 라운드, 5열 버튼 배열) */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-base text-gray-200 font-medium"
                  style={{ fontFamily: "var(--font-chalk)" }}
                >
                  라운드 설정 (총 {selectedRound}라운드)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRound(r)}
                      className={`py-2 text-sm font-bold rounded transition-all ${
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

              {/* 2. 라운드 별 시간 (1분~5분, 3열 버튼 배열) */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-base text-gray-200 font-medium"
                  style={{ fontFamily: "var(--font-chalk)" }}
                >
                  라운드 별 시간 ({selectedTime}분)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[1, 2, 3, 4, 5].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTime(t)}
                      className={`py-2.5 text-base font-bold rounded transition-all ${
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

              {/* 3. 오답 패널티 (없음, 1초~5초, 3열 버튼 배열) */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-base text-gray-200 font-medium"
                  style={{ fontFamily: "var(--font-chalk)" }}
                >
                  오답 패널티 ({selectedPenalty})
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {["없음", "1초", "2초", "3초", "4초", "5초"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPenalty(p)}
                      className={`py-2.5 text-sm font-bold rounded transition-all ${
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

              {/* 게임 생성하기 버튼 */}
              <button
                type="button"
                onClick={handleCreateGame}
                className="btn-chalk w-full justify-center mt-3 py-3.5 text-xl"
              >
                게임 방 생성하기
              </button>

              {/* 생성된 방 코드 출력 */}
              {generatedRoomCode && (
                <div className="chalk-box-straight bg-teal-950 p-4 flex flex-col items-center gap-2 border-yellow-400 text-center">
                  <span className="text-xs text-gray-300" style={{ fontFamily: "var(--font-body)" }}>
                    생성된 방 코드 (플레이어에게 전달하세요)
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-3xl text-yellow-300 font-bold tracking-widest"
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
        )}
      </div>
    </div>
  );
}
