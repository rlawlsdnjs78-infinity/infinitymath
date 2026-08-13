/**
 * src/app/formula-pyramid/page.tsx
 * 수식 피라미드 게임 페이지
 *
 * [수정 사항]
 * 1. 제목 글씨(게임 입장하기, 수식 피라미드, 게임 설명) 2.5rem(40px)으로 확대
 * 2. 수식 피라미드 헤더: 좌측(로고 + 수식 피라미드), 우측(연필 + 연습 문구)
 * 3. 정육각형 칸 크기 슬림화 + A~J 칸 번호를 정육각형 도형으로 독립 감싸기
 * 4. A~J 및 사칙연산 글씨 크기 확대 (fontSize 17 / 26) + 피라미드 간격 축소 (gap-1.5)
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
  Pyramid,
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
      className={`relative cursor-pointer transition-all duration-200 hover:scale-105 select-none w-[56px] h-[64.7px] sm:w-[64px] sm:h-[73.9px] flex items-center justify-center ${
        isSelected ? "drop-shadow-[0_0_16px_rgba(245,230,66,0.95)]" : ""
      }`}
    >
      <svg
        viewBox="0 0 100 115.47"
        className="w-full h-full absolute inset-0 filter drop-shadow-md"
      >
        {/* ① 메인 큰 정육각형 몸통 (Pointy-topped regular hexagon) */}
        <polygon
          points="50,4.62 96,31.18 96,84.30 50,110.85 4,84.30 4,31.18"
          fill={isSelected ? "rgba(245, 230, 66, 0.3)" : "rgba(20, 50, 50, 0.92)"}
          stroke={isSelected ? "#f5e642" : "rgba(240, 237, 232, 0.65)"}
          strokeWidth="3.5"
          strokeDasharray={isSelected ? "none" : "4 2"}
        />

        {/* ② 상단 A~J 칸 번호를 감싸는 '정육각형(Mini Regular Hexagon)' - 큰 정육각형 상단 두 변 공유 */}
        <polygon
          points="50,4.62 67.32,14.62 67.32,34.62 50,44.62 32.68,34.62 32.68,14.62"
          fill={isSelected ? "#f5e642" : "rgba(245, 230, 66, 0.25)"}
          stroke={isSelected ? "#1a3a3a" : "var(--chalk-yellow)"}
          strokeWidth="2"
        />

        {/* 상단 A~J 칸 번호 */}
        <text
          x="50"
          y="29.5"
          textAnchor="middle"
          fill={isSelected ? "#1a3a3a" : "var(--chalk-yellow)"}
          fontSize="16"
          fontWeight="bold"
          fontFamily="var(--font-chalk)"
        >
          {node.id}
        </text>

        {/* 중앙 사칙연산 값 텍스트 */}
        <text
          x="50"
          y="82"
          textAnchor="middle"
          fill={isSelected ? "#f5e642" : "var(--chalk-white)"}
          fontSize="26"
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

    // 제출 시 내가 클릭했던 칸들 바로 초기화 (요구사항 5)
    setSelectedNodes([]);
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
           [상단 고정 타이틀 & 모드 설정 통합 버튼]
           ─────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
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

          {/* 모드 설정 버튼 (요구사항 8: 모드 설정 버튼 안에 플레이어 모드와 딜러 모드 배치) */}
          <div
            className="flex items-center p-1.5 rounded-full select-none bg-teal-950/90 border border-yellow-400/60 shadow-inner"
            style={{ backdropFilter: "blur(8px)" }}
          >
            <button
              type="button"
              onClick={() => setMode("player")}
              className={`px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-base sm:text-lg font-bold transition-all duration-200 cursor-pointer ${
                mode === "player"
                  ? "bg-yellow-400 text-teal-950 shadow-md scale-102"
                  : "text-gray-300 hover:text-white"
              }`}
              style={{ fontFamily: "var(--font-chalk)" }}
            >
              플레이어 모드
            </button>
            <button
              type="button"
              onClick={() => setMode("dealer")}
              className={`px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-base sm:text-lg font-bold transition-all duration-200 cursor-pointer ${
                mode === "dealer"
                  ? "bg-yellow-400 text-teal-950 shadow-md scale-102"
                  : "text-gray-300 hover:text-white"
              }`}
              style={{ fontFamily: "var(--font-chalk)" }}
            >
              딜러 모드
            </button>
          </div>
        </div>

        {/* [요구사항 1] 상단 게임 소개와 UI 사이의 점선 구분선 (박스 내부 점선 스타일 및 여백과 동일하게 적용) */}
        <div
          className="w-full border-t border-dashed border-teal-700"
          style={{ marginTop: "1.1rem", marginBottom: "1.1rem" }}
        />

        {/* ───────────────────────────────────────────────────────────────────
           [하단 3분할 박스 영역]
           ─────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full mx-auto">
          {/* ── [좌측 박스] xl:col-span-3 ─────────────────────────────────── */}
          <div className="xl:col-span-3 chalk-box content-box flex flex-col bg-teal-950/75 backdrop-blur-md h-full min-h-[640px] p-6 sm:p-7">
            {mode === "player" ? (
              <>
                {/* [제목 확대: fontSize: "2.5rem"] */}
                <div className="flex items-center gap-3">
                  <LogIn className="text-yellow-400 flex-shrink-0" size={28} />
                  <h2
                    className="text-yellow-300 font-bold"
                    style={{ fontFamily: "var(--font-chalk)", fontSize: "2.5rem", lineHeight: 1.1 }}
                  >
                    게임 입장하기
                  </h2>
                </div>

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
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="nickname-input"
                        className="text-lg text-gray-200 font-medium tracking-wide"
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

                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="code-input"
                        className="text-lg text-gray-200 font-medium tracking-wide"
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
                  <Monitor className="text-yellow-400 flex-shrink-0" size={28} />
                  <h2
                    className="text-yellow-300 font-bold"
                    style={{ fontFamily: "var(--font-chalk)", fontSize: "2.5rem", lineHeight: 1.1 }}
                  >
                    딜러 가이드
                  </h2>
                </div>

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
                {/* [요구사항 2] 좌측: 로고 + 수식 피라미드 (2.5rem), 우측: 연필 + 연습 설명 문구 */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Pyramid className="text-yellow-400 flex-shrink-0" size={28} />
                    <h2
                      className="text-yellow-300 font-bold"
                      style={{ fontFamily: "var(--font-chalk)", fontSize: "2.5rem", lineHeight: 1.1 }}
                    >
                      수식 피라미드
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Pencil size={16} className="text-yellow-400 flex-shrink-0" />
                    <span style={{ fontFamily: "var(--font-body)" }}>
                      게임 시작을 기다리는 동안 연습해 보세요.
                    </span>
                  </div>
                </div>

                <div
                  className="w-full border-t border-dashed border-teal-700"
                  style={{ marginTop: "1.1rem", marginBottom: "1.1rem" }}
                />

                {/* [요구사항 2 & 4] 피라미드 정육각형 배치 및 층간 uniform spacing & 하단 박스와의 충분한 간격 */}
                <div
                  className="py-4 my-2 flex flex-col items-center justify-center w-full overflow-x-auto"
                  style={{ marginBottom: "2.5rem" }}
                >
                  {PYRAMID_DATA.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="flex justify-center gap-2 sm:gap-2.5"
                      style={{ marginTop: rowIndex === 0 ? "0px" : "-11px" }}
                    >
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

                {/* [요구사항 4] 피라미드와 정답 입력 박스 사이 여백(marginTop: 2.5rem) 확실히 확보 */}
                <div
                  className="w-full chalk-box-straight bg-teal-900/60 rounded-md flex flex-col gap-6"
                  style={{ padding: "1.75rem 1.5rem", marginTop: "2.5rem" }}
                >
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

                  {/* [요구사항 5] 제출하기 버튼 클릭 시 초기화되며, 오른쪽 초기화 버튼 제거 */}
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      className="btn-chalk w-full justify-center py-3.5 text-xl"
                    >
                      제출하기
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
                {/* [제목 확대: fontSize: "2.5rem"] */}
                <div className="flex items-center gap-3">
                  <HelpCircle className="text-yellow-400 flex-shrink-0" size={28} />
                  <h2
                    className="text-yellow-300 font-bold"
                    style={{ fontFamily: "var(--font-chalk)", fontSize: "2.5rem", lineHeight: 1.1 }}
                  >
                    게임 설명
                  </h2>
                </div>

                <div
                  className="w-full border-t border-dashed border-teal-700"
                  style={{ marginTop: "1.1rem", marginBottom: "1.1rem" }}
                />

                {/* [요구사항 6 & 7] 번호 기준 들여쓰기 & ③번 '주의' 표시 항목 전용 박스 */}
                <div
                  className="flex flex-col gap-4 text-sm text-gray-200 leading-relaxed py-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 font-bold text-yellow-300 w-5">①</span>
                    <p className="flex-1 leading-relaxed">
                      <strong className="text-yellow-300 font-semibold">&lsquo;수식 피라미드&rsquo;</strong>는
                      문제 판에서 3개의 칸을 선택하여 타깃 넘버가 될 수 있도록 수식을 만드는 게임입니다.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 font-bold text-yellow-300 w-5">②</span>
                    <p className="flex-1 leading-relaxed">
                      라운드가 시작되면 피라미드 모양의 문제판과 타깃 넘버가 공개됩니다. 문제판은 총 10개의
                      칸으로 이루어져 있으며, 각 칸에는 사칙연산 기호 중 하나와 숫자가 한 쌍을 이루고
                      있습니다.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 font-bold text-yellow-300 w-5">③</span>
                    <p className="flex-1 leading-relaxed">
                      문제판이 공개되면 이 중 3개의 칸을 조합해 타깃 넘버가 답이 되는 수식을 만들어야 합니다.
                    </p>
                  </div>

                  {/* [요구사항 7] ③번 하위 '주의' 표시 항목 전용 박스 - 명시적 인라인 스타일 패딩 및 여백 부여 */}
                  <div
                    className="w-full rounded-lg shadow-md"
                    style={{
                      border: "2px dashed #f5e642",
                      backgroundColor: "rgba(15, 45, 45, 0.9)",
                      padding: "20px 20px",
                      marginTop: "1.25rem",
                      marginBottom: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      className="flex items-start gap-3.5 text-yellow-200 font-medium"
                      style={{ fontSize: "0.95rem", lineHeight: "1.6", wordBreak: "keep-all" }}
                    >
                      <AlertTriangle size={18} className="flex-shrink-0 text-yellow-400 mt-1" />
                      <span>동일한 칸은 중복선택할 수 없습니다.</span>
                    </div>

                    <div
                      className="flex items-start gap-3.5 text-yellow-200 font-medium"
                      style={{ fontSize: "0.95rem", lineHeight: "1.6", wordBreak: "keep-all" }}
                    >
                      <AlertTriangle size={18} className="flex-shrink-0 text-yellow-400 mt-1" />
                      <span>수식의 맨 앞에 사용된 칸의 연산 기호는 무시합니다.</span>
                    </div>

                    <div
                      className="flex items-start gap-3.5 text-yellow-200 font-medium"
                      style={{ fontSize: "0.95rem", lineHeight: "1.6", wordBreak: "keep-all" }}
                    >
                      <AlertTriangle size={18} className="flex-shrink-0 text-yellow-400 mt-1" />
                      <span>완성된 수식은 사칙연산 순서에 따라 계산됩니다.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 font-bold text-yellow-300 w-5">④</span>
                    <p className="flex-1 leading-relaxed">
                      정답을 제출하면 1점을 획득하고, 오답을 제출하거나 이번 라운드에서 이미 제출된 정답을
                      다시 제출하는 경우 1점이 감점됩니다.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 font-bold text-yellow-300 w-5">⑤</span>
                    <p className="flex-1 leading-relaxed">
                      라운드 진행 시간이 지났거나 모든 정답이 제출되면 라운드가 종료됩니다.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Settings className="text-yellow-400 flex-shrink-0" size={28} />
                  <h2
                    className="text-yellow-300 font-bold"
                    style={{ fontFamily: "var(--font-chalk)", fontSize: "2.5rem", lineHeight: 1.1 }}
                  >
                    게임 세팅 & 방 생성
                  </h2>
                </div>

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
