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

import { useState, useEffect } from "react";
import Link from "next/link";
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
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Megaphone,
  Users,
  Trophy,
  LogOut,
  Clock,
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

/* ─── TARGET 9를 만드는 모든 수학적 정답 조합 구하기 ───────────────────────────── */
const getAllValidSolutions = (target: number = 9): { nodes: string[]; formulaStr: string; val: number }[] => {
  const nodeKeys = Object.keys(ALL_NODES);
  const solutions: { nodes: string[]; formulaStr: string; val: number }[] = [];

  for (let i = 0; i < nodeKeys.length; i++) {
    for (let j = 0; j < nodeKeys.length; j++) {
      if (i === j) continue;
      for (let k = 0; k < nodeKeys.length; k++) {
        if (i === k || j === k) continue;
        const n1 = ALL_NODES[nodeKeys[i]];
        const n2 = ALL_NODES[nodeKeys[j]];
        const n3 = ALL_NODES[nodeKeys[k]];

        const op2 = n2.op === "×" ? "*" : n2.op === "÷" ? "/" : n2.op;
        const op3 = n3.op === "×" ? "*" : n3.op === "÷" ? "/" : n3.op;

        const calcExpr = `${n1.num} ${op2} ${n2.num} ${op3} ${n3.num}`;
        try {
          // eslint-disable-next-line no-eval
          const val = Function(`"use strict"; return (${calcExpr})`)();
          if (val === target) {
            const formulaStr = `${n1.id} ${n2.id} ${n3.id} ( ${n1.num} ${n2.op}${n2.num} ${n3.op}${n3.num} = ${target} )`;
            solutions.push({
              nodes: [n1.id, n2.id, n3.id],
              formulaStr,
              val,
            });
          }
        } catch {}
      }
    }
  }
  return solutions;
};

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
      className={`relative cursor-pointer transition-all duration-200 hover:scale-105 select-none w-[64px] h-[73.9px] sm:w-[68px] sm:h-[78.5px] flex items-center justify-center ${
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
          y="31"
          textAnchor="middle"
          fill={isSelected ? "#1a3a3a" : "var(--chalk-yellow)"}
          fontSize="28"
          fontWeight="bold"
          fontFamily="var(--font-chalk)"
        >
          {node.id}
        </text>

        {/* 중앙 사칙연산 값 텍스트 */}
        <text
          x="50"
          y="85"
          textAnchor="middle"
          fill={isSelected ? "#f5e642" : "var(--chalk-white)"}
          fontSize="48"
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

  const [showSolutions, setShowSolutions] = useState(false);
  const validSolutions = getAllValidSolutions(9);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedTime, setSelectedTime] = useState<number>(3);
  const [selectedPenalty, setSelectedPenalty] = useState<string>("없음");
  const [generatedRoomCode, setGeneratedRoomCode] = useState<string>("");

  const [tempNotice, setTempNotice] = useState<{
    msg: string;
    type: "warning" | "success" | "error";
  } | null>(null);
  const [noticeTimer, setNoticeTimer] = useState<NodeJS.Timeout | null>(null);

  const triggerNotice = (
    msg: string,
    type: "warning" | "success" | "error" = "warning",
    durationMs: number = 1000
  ) => {
    if (noticeTimer) clearTimeout(noticeTimer);
    setTempNotice({ msg, type });
    const timer = setTimeout(() => {
      setTempNotice(null);
    }, durationMs);
    setNoticeTimer(timer);
  };

  const handleNodeClick = (nodeId: string) => {
    if (selectedNodes.includes(nodeId)) {
      setSelectedNodes(selectedNodes.filter((id) => id !== nodeId));
    } else {
      if (selectedNodes.length >= 3) return;
      setSelectedNodes([...selectedNodes, nodeId]);
    }
    setTempNotice(null);
  };

  const calculateFormula = (nodeIds: string[]): { exprStr: string; result: number | null } => {
    if (nodeIds.length === 0) return { exprStr: "", result: null };
    const nodes = nodeIds.map((id) => ALL_NODES[id]);

    // [요구사항 2] A(1) ÷ B(4) 형태가 아니라 A B C 형태 (공백으로 노드 ID만 연결)
    const exprStr = nodeIds.join(" ");

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
      triggerNotice("3개의 칸을 모두 선택해야 합니다!", "warning", 1000);
      setSelectedNodes([]);
      return;
    }

    const TARGET = 9;
    if (currentResult === TARGET) {
      const nextScore = myScore + 1;
      setMyScore(nextScore);
      setPlayers((prev) =>
        prev.map((p) => (p.name === myNickname ? { ...p, score: nextScore } : p))
      );
      triggerNotice("정답입니다! (+1점)", "success", 1200);

      if (inGameRoom && activeRoomCode && typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
          bc.postMessage({ type: "SCORE_UPDATE", playerName: myNickname, newScore: nextScore });
          bc.close();
        } catch (err) {}
      }
    } else {
      const nextScore = Math.max(0, myScore - 1);
      setMyScore(nextScore);
      setPlayers((prev) =>
        prev.map((p) => (p.name === myNickname ? { ...p, score: nextScore } : p))
      );
      triggerNotice("오답입니다! (-1점)", "error", 1200);

      if (inGameRoom && activeRoomCode && typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
          bc.postMessage({ type: "SCORE_UPDATE", playerName: myNickname, newScore: nextScore });
          bc.close();
        } catch (err) {}
      }
    }

    setSelectedNodes([]);
  };

  /* ── 실시간 다중 플레이어 대전 방 상태 ── */
  const [inGameRoom, setInGameRoom] = useState(false);
  const [activeRoomCode, setActiveRoomCode] = useState("");
  const [myNickname, setMyNickname] = useState("");
  const [myScore, setMyScore] = useState(0);
  const [isDealerHost, setIsDealerHost] = useState(false);
  const [players, setPlayers] = useState<{ name: string; score: number; isHost?: boolean }[]>([]);
  const [activityLogs, setActivityLogs] = useState<string[]>([]);

  // BroadcastChannel 실시간 멀티플레이어 동기화 (같은 방 코드로 참가한 탭/창 실시간 연동)
  useEffect(() => {
    if (!inGameRoom || !activeRoomCode) return;

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
        bc.onmessage = (event) => {
          const data = event.data;
          if (!data) return;

          if (data.type === "JOIN") {
            setPlayers((prev) => {
              if (prev.some((p) => p.name === data.player.name)) return prev;
              return [...prev, data.player];
            });
            setActivityLogs((prev) => [`[실시간] ${data.player.name} 님이 방에 참가하셨습니다.`, ...prev]);

            bc?.postMessage({
              type: "SYNC_PRESENCE",
              player: { name: myNickname, score: myScore, isHost: isDealerHost },
            });
          } else if (data.type === "SYNC_PRESENCE") {
            setPlayers((prev) => {
              if (prev.some((p) => p.name === data.player.name)) return prev;
              return [...prev, data.player];
            });
          } else if (data.type === "SCORE_UPDATE") {
            setPlayers((prev) =>
              prev.map((p) => (p.name === data.playerName ? { ...p, score: data.newScore } : p))
            );
            setActivityLogs((prev) => [
              `[정답] ${data.playerName} 님이 정답 제출! (현재 ${data.newScore}점)`,
              ...prev,
            ]);
          }
        };

        bc.postMessage({
          type: "JOIN",
          player: { name: myNickname, score: myScore, isHost: isDealerHost },
        });
      } catch (e) {}
    }

    return () => {
      if (bc) bc.close();
    };
  }, [inGameRoom, activeRoomCode, myNickname, myScore, isDealerHost]);

  const handleJoinGameRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nickname.trim()) {
      alert("닉네임을 입력해 주세요.");
      return;
    }
    if (!entryCode.trim()) {
      alert("입장 코드를 입력해 주세요.");
      return;
    }
    const cleanCode = entryCode.trim().toUpperCase();
    setActiveRoomCode(cleanCode);
    setMyNickname(nickname.trim());
    setMyScore(0);
    setIsDealerHost(false);
    setInGameRoom(true);

    const me = { name: nickname.trim(), score: 0 };
    setPlayers([me]);
    setActivityLogs([`[안내] 방 [${cleanCode}] 에 성공적으로 입장했습니다.`]);

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel(`pyramid-room-${cleanCode}`);
        bc.postMessage({ type: "JOIN", player: me });
        bc.close();
      } catch (err) {}
    }
  };

  const handleCreateGame = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const code = `P${randomNum}`;
    setGeneratedRoomCode(code);
    setActiveRoomCode(code);
    setMyNickname("딜러(선생님)");
    setMyScore(0);
    setIsDealerHost(true);
    setInGameRoom(true);

    const host = { name: "딜러(선생님)", score: 0, isHost: true };
    setPlayers([host]);
    setActivityLogs([`[안내] 딜러 방 [${code}] 가 생성 및 입장되었습니다.`]);

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel(`pyramid-room-${code}`);
        bc.postMessage({ type: "JOIN", player: host });
        bc.close();
      } catch (err) {}
    }
  };

  return (
    <div
      className="w-full flex-1 flex flex-col items-center justify-start"
      style={{
        paddingTop: "0.5rem",
        paddingBottom: "1rem",
        paddingLeft: "clamp(1rem, 4vw, 3rem)",
        paddingRight: "clamp(1rem, 4vw, 3rem)",
      }}
    >
      <div className="w-full max-w-[1550px] flex flex-col mx-auto">
        {/* ───────────────────────────────────────────────────────────────────
           [상단 고정 타이틀]
           ─────────────────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between w-full"
          style={{ marginTop: "0.25rem", marginBottom: "0.75rem" }}
        >
          <div>
            <h1
              className="text-3xl sm:text-4xl text-yellow-300 flex items-center gap-4"
              style={{ fontFamily: "var(--font-chalk)" }}
            >
              <Pyramid className="text-yellow-400 flex-shrink-0" size={36} />
              수식 피라미드 (Formula Pyramid)
            </h1>
          </div>

          {/* [여백 최우선 원칙] '← 홈으로' 버튼 내부 패딩(0.9rem 2rem) 및 아이콘-글자 간격(0.85rem) 넉넉히 부여 */}
          <Link
            href="/"
            className="flex items-center rounded-full bg-teal-900/90 hover:bg-teal-800 border-2 border-dashed border-yellow-400/90 text-yellow-300 text-xl sm:text-2xl font-extrabold transition-all shadow-lg hover:scale-105 cursor-pointer"
            style={{
              padding: "0.9rem 2rem",
              gap: "0.85rem",
              fontFamily: "var(--font-chalk)",
              textDecoration: "none",
              letterSpacing: "0.05em",
            }}
          >
            <ArrowLeft size={24} className="text-yellow-400 flex-shrink-0" />
            <span className="leading-none">홈으로</span>
          </Link>
        </div>

        {/* 상단 게임 소개와 UI 사이의 점선 구분선 */}
        <div
          className="w-full border-t-2 border-dashed border-teal-700/80"
          style={{ marginTop: "0.25rem", marginBottom: "1rem" }}
        />

        {/* ───────────────────────────────────────────────────────────────────
           [하단 3분할 박스 영역 또는 실시간 게임 방 영역]
           ─────────────────────────────────────────────────────────────────── */}
        {inGameRoom ? (
          <div className="w-full flex flex-col gap-4">
            {/* 상단 컨트롤 바 */}
            <div className="chalk-box-straight bg-teal-950 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-yellow-400/80">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xl sm:text-2xl text-yellow-300 font-extrabold flex items-center gap-2" style={{ fontFamily: "var(--font-chalk)" }}>
                  입장 코드: <span className="tracking-widest text-white bg-teal-900 px-3 py-0.5 rounded border border-teal-700">{activeRoomCode}</span>
                </span>
                <span className="bg-teal-900 text-yellow-200 px-3 py-1 rounded-full text-sm font-bold border border-teal-700">
                  {isDealerHost ? "👑 딜러(선생님)" : `👤 ${myNickname}`}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-teal-900/90 px-3.5 py-1.5 rounded-md border border-teal-700">
                  <Clock className="text-yellow-400" size={18} />
                  <span className="text-yellow-300 font-bold text-base sm:text-lg" style={{ fontFamily: "var(--font-chalk)" }}>
                    1 / {selectedRound} 라운드 ({selectedTime}분)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setInGameRoom(false)}
                  className="flex items-center gap-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 px-4 py-1.5 rounded-md text-sm font-bold border border-rose-600/60 transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>방 나가기</span>
                </button>
              </div>
            </div>

            {/* 메인 3컬럼 대전 그리드 */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* [좌측: 실시간 참가자 & 점수판] */}
              <div className="xl:col-span-3 chalk-box content-box bg-teal-950/80 p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-dashed border-teal-700 pb-2">
                  <div className="flex items-center gap-2 text-yellow-300 font-extrabold text-xl" style={{ fontFamily: "var(--font-chalk)" }}>
                    <Trophy size={20} className="text-yellow-400" />
                    <span>실시간 점수판</span>
                  </div>
                  <span className="text-xs text-gray-300 font-medium">({players.length}명 접속 중)</span>
                </div>

                <div className="flex flex-col gap-2">
                  {players
                    .slice()
                    .sort((a, b) => b.score - a.score)
                    .map((p, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-md border ${
                          p.name === myNickname
                            ? "bg-yellow-400/20 border-yellow-400 text-yellow-200"
                            : "bg-teal-900/60 border-teal-700/80 text-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-yellow-400 w-5">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                          </span>
                          <span className="font-bold text-sm" style={{ fontFamily: "var(--font-body)" }}>
                            {p.name} {p.isHost && "(딜러)"}
                          </span>
                        </div>
                        <span className="font-extrabold text-base text-yellow-300" style={{ fontFamily: "var(--font-chalk)" }}>
                          {p.score}점
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* [중앙: 수식 피라미드 보드] */}
              <div className="xl:col-span-6 chalk-box content-box bg-teal-950/85 p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 mb-2">
                  <div className="flex flex-col items-center justify-center flex-shrink-0 py-2 mx-auto xl:mx-0">
                    {PYRAMID_DATA.map((row, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="flex justify-center gap-2 sm:gap-2.5"
                        style={{ marginTop: rowIndex === 0 ? "0px" : "-10px" }}
                      >
                        {row.map((node) => (
                          <HexagonCell
                            key={node.id}
                            node={node}
                            isSelected={selectedNodes.includes(node.id)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* TARGET 표시 및 A~J 선택 버튼 */}
                <div className="flex flex-col sm:flex-row items-stretch gap-4">
                  <div className="chalk-box-straight bg-teal-950 px-7 py-4 flex flex-col items-center justify-center min-w-[135px] border-yellow-400/80">
                    <span className="text-xl sm:text-2xl text-yellow-400 font-extrabold tracking-widest mb-1" style={{ fontFamily: "var(--font-chalk)" }}>
                      TARGET
                    </span>
                    <span className="text-5xl sm:text-6xl text-white font-black" style={{ fontFamily: "var(--font-chalk)" }}>
                      9
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between gap-2.5">
                    <div className="text-xl sm:text-2xl text-yellow-300 font-bold mb-0.5" style={{ fontFamily: "var(--font-chalk)" }}>
                      제출할 수식 칸 선택
                    </div>
                    <div className="grid grid-cols-5 gap-2.5">
                      {Object.values(ALL_NODES).map((node) => {
                        const isSel = selectedNodes.includes(node.id);
                        return (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => handleNodeClick(node.id)}
                            className={`py-3 px-3 rounded-md text-xl sm:text-2xl font-black transition-all ${
                              isSel
                                ? "bg-yellow-400 text-teal-950 scale-105 shadow-md"
                                : "bg-teal-800/90 text-white hover:bg-teal-700"
                            }`}
                            style={{ fontFamily: "var(--font-chalk)" }}
                          >
                            {node.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="w-full mt-1">
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    className="btn-chalk w-full justify-center py-3 text-2.5xl sm:text-3xl font-extrabold cursor-pointer shadow-lg"
                    style={{ fontFamily: "var(--font-chalk)", letterSpacing: "0.35em" }}
                  >
                    제출하기
                  </button>
                </div>
              </div>

              {/* [우측: 실시간 활동 피드] */}
              <div className="xl:col-span-3 chalk-box content-box bg-teal-950/80 p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-yellow-300 font-extrabold text-xl border-b border-dashed border-teal-700 pb-2" style={{ fontFamily: "var(--font-chalk)" }}>
                  <Users size={20} className="text-yellow-400" />
                  <span>실시간 활동 현황</span>
                </div>

                <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {activityLogs.map((log, i) => (
                    <div key={i} className="text-xs text-gray-300 bg-teal-900/50 p-2 rounded border border-teal-800/60" style={{ fontFamily: "var(--font-body)" }}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full mx-auto">
          {/* ── [좌측 박스] xl:col-span-3 ─────────────────────────────────── */}
          <div className="xl:col-span-3 chalk-box content-box flex flex-col bg-teal-950/75 backdrop-blur-md h-full min-h-0 p-4 sm:p-5">
            {/* [요구사항 3] 카드 헤더 높이 및 정렬 통일 */}
            <div className="flex items-center justify-between w-full min-h-[44px]">
              <div className="flex items-center gap-3">
                <LogIn className="text-yellow-400 flex-shrink-0" size={28} />
                <h2
                  className="text-yellow-300 font-bold"
                  style={{ fontFamily: "var(--font-chalk)", fontSize: "2.5rem", lineHeight: 1.1 }}
                >
                  게임 입장하기
                </h2>
              </div>
            </div>

            <div
              className="w-full border-t border-dashed border-teal-700"
              style={{ marginTop: "1.1rem", marginBottom: "1.5rem" }}
            />

            {/* [요구사항 1] 모드 선택 버튼과 '닉네임' 사이 간격을 명시적 2.5rem(40px)으로 확장 */}
            <div className="w-full flex justify-center" style={{ marginTop: "0.5rem", marginBottom: "2.5rem" }}>
              <div className="flex items-center rounded-full select-none bg-teal-950/95 border-2 border-yellow-400/70 shadow-lg w-full p-1.5 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("player")}
                  className={`flex-1 py-2.5 rounded-full text-base sm:text-lg font-bold transition-all duration-200 cursor-pointer text-center ${
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
                  className={`flex-1 py-2.5 rounded-full text-base sm:text-lg font-bold transition-all duration-200 cursor-pointer text-center ${
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

            {mode === "player" ? (
              <form
                onSubmit={handleJoinGameRoom}
                className="flex flex-col py-1"
              >
                <div className="flex flex-col gap-6">
                  {/* [요구사항 2] '닉네임' 글씨 색상을 흰색으로 변경 */}
                  <div className="flex flex-col gap-2.5">
                    <label
                      htmlFor="nickname-input"
                      className="text-2xl sm:text-3xl text-white font-bold tracking-wide"
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
                      className="w-full rounded-md bg-teal-900/90 border border-dashed border-teal-600 text-white text-lg focus:outline-none focus:border-yellow-400 placeholder:text-gray-400/80"
                      style={{
                        padding: "14px 20px",
                        fontFamily: "var(--font-body)",
                        lineHeight: "1.5",
                      }}
                    />
                  </div>

                  {/* [요구사항 2 & 3] '입장 코드' 글씨 색상 흰색 & placeholder 변경 */}
                  <div className="flex flex-col gap-2.5">
                    <label
                      htmlFor="code-input"
                      className="text-2xl sm:text-3xl text-white font-bold tracking-wide"
                      style={{ fontFamily: "var(--font-chalk)" }}
                    >
                      입장 코드
                    </label>
                    <input
                      id="code-input"
                      type="text"
                      placeholder="코드를 입력해주세요."
                      value={entryCode}
                      onChange={(e) => setEntryCode(e.target.value)}
                      className="w-full rounded-md bg-teal-900/90 border border-dashed border-teal-600 text-white text-lg uppercase focus:outline-none focus:border-yellow-400 placeholder:text-gray-400/80"
                      style={{
                        padding: "14px 20px",
                        fontFamily: "var(--font-body)",
                        lineHeight: "1.5",
                      }}
                    />
                  </div>
                </div>

                {/* [요구사항] 입장코드 입력 박스 하단과 입장하기 버튼 사이 간격을 닉네임 박스 하단~입장코드 제목 간격(24px: gap-6)의 정확히 2배(48px = marginTop: 3rem)로 설정 */}
                <button
                  type="submit"
                  className="btn-chalk w-full justify-center text-2.5xl sm:text-3xl font-extrabold cursor-pointer"
                  style={{ marginTop: "3rem", padding: "16px 24px", fontFamily: "var(--font-chalk)" }}
                >
                  입장하기
                </button>
              </form>
            ) : (
              <div
                className="flex flex-col gap-5 text-sm text-gray-200 leading-relaxed flex-1 justify-start py-1"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <div className="flex flex-col gap-4">
                  <p className="leading-loose text-base sm:text-lg">
                    딜러 모드에서는 라운드 수, 제한 시간, 오답 패널티를 설정하여 방을 생성할 수 있습니다.
                  </p>
                  {/* [테두리 절연 필수 수칙] 확성기 아이콘 및 텍스트가 좌우 테두리에 닿지 않도록 명시적 인라인 패딩(3.25rem / 52px 좌측 여백) 보장 */}
                  <div
                    className="w-full bg-teal-900/70 rounded-lg border-2 border-dashed border-yellow-400/70 text-base sm:text-lg text-yellow-300 flex items-start shadow-sm"
                    style={{
                      paddingTop: "1.25rem",
                      paddingBottom: "1.25rem",
                      paddingLeft: "3.25rem",
                      paddingRight: "2.5rem",
                      gap: "1.25rem",
                    }}
                  >
                    <Megaphone className="text-yellow-400 flex-shrink-0 mt-1" size={24} />
                    <span
                      className="flex-1 leading-relaxed font-medium"
                      style={{
                        fontFamily: "var(--font-body)",
                        wordBreak: "break-all",
                        letterSpacing: "-0.015em",
                      }}
                    >
                      생성된 방 코드를 플레이어들에게 공유하세요.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── [중앙 박스] xl:col-span-6 ─────────────────────────────────── */}
          <div className="xl:col-span-6 chalk-box content-box flex flex-col bg-teal-950/85 backdrop-blur-md h-full min-h-0 p-4 sm:p-5">
            {mode === "player" ? (
              <>
                {/* [요구사항] 한 블록 안에서 좌측: 피라미드, 우측: 설명글 & 정답보기 */}
                <div className="w-full flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 mb-4">
                  {/* [좌측] 대칭 피라미드 (클릭해도 정답에 입력되지 않도록 onClick 제거) */}
                  <div className="flex flex-col items-center justify-center flex-shrink-0 py-2 mx-auto xl:mx-0">
                    {PYRAMID_DATA.map((row, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="flex justify-center gap-2 sm:gap-2.5"
                        style={{ marginTop: rowIndex === 0 ? "0px" : "-10px" }}
                      >
                        {row.map((node) => (
                          <HexagonCell
                            key={node.id}
                            node={node}
                            isSelected={selectedNodes.includes(node.id)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* [우측] 연습 설명글 & 정답확인 버튼 & absolute 펼침 창 */}
                  <div className="relative flex-1 w-full flex flex-col items-center xl:items-stretch gap-4">
                    <div
                      className="flex items-center gap-2 text-xs sm:text-sm md:text-base xl:text-lg text-gray-200 font-semibold justify-center xl:justify-start whitespace-nowrap"
                      style={{ fontFamily: "var(--font-chalk)", wordBreak: "keep-all" }}
                    >
                      <Pencil size={18} className="text-yellow-400 flex-shrink-0" />
                      <span className="whitespace-nowrap">게임 시작을 기다리는 동안 연습해 보세요.</span>
                    </div>

                    {/* '정답 확인' 버튼 - 이전 디자인 그대로 복구 */}
                    <button
                      type="button"
                      onClick={() => setShowSolutions(!showSolutions)}
                      className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-full bg-teal-900/90 hover:bg-teal-800 border-2 border-dashed border-yellow-400/80 text-yellow-300 text-base sm:text-lg font-bold transition-all cursor-pointer shadow-md text-center"
                      style={{ fontFamily: "var(--font-chalk)" }}
                    >
                      <Sparkles size={18} className="text-yellow-400 animate-pulse" />
                      <span>정답 확인 ({validSolutions.length}개 조합)</span>
                      {showSolutions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {/* [요구사항] 스크롤 없이 4개 정답이 모두 쏙 들어가며 아래 정답 입력 박스를 침범하지 않도록 컴팩트 조율 */}
                    {showSolutions && (
                      <div
                        className="absolute top-full left-0 mt-1.5 w-full bg-teal-900/98 rounded-xl border-2 border-dashed border-yellow-400/90 shadow-2xl flex flex-col z-30 backdrop-blur-md overflow-hidden"
                        style={{
                          padding: "0.55rem 0.65rem",
                          gap: "0.35rem",
                        }}
                      >
                        {validSolutions.slice(0, 4).map((sol, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedNodes(sol.nodes);
                              setTempNotice(null);
                            }}
                            className="w-full flex items-center justify-between rounded-lg bg-teal-950/95 hover:bg-yellow-400 hover:text-teal-950 text-white transition-all border border-teal-700/80 cursor-pointer shadow-sm group"
                            style={{
                              padding: "0.4rem 0.75rem",
                              fontFamily: "var(--font-chalk)",
                            }}
                          >
                            {/* 왼쪽: 정답 (예: A C F) */}
                            <span className="text-lg sm:text-xl font-black text-yellow-300 group-hover:text-teal-950 tracking-widest">
                              {sol.nodes.join(" ")}
                            </span>

                            {/* 오른쪽: 계산식 (예: 1 + 3 + 5 = 9) - 글씨 크기 키움 */}
                            <span className="text-sm sm:text-base text-teal-200 group-hover:text-teal-950 font-extrabold tracking-wide">
                              {sol.formulaStr.split(" ( ")[1]?.replace(" )", "")}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* [요구사항 2, 3, 4, 5] 정답 입력 박스 레이아웃 & 고정 높이 안내창 변신 */}
                <div
                  className="w-full chalk-box-straight bg-teal-900/60 rounded-md flex flex-col gap-6"
                  style={{ padding: "1.5rem 1.5rem", marginTop: "1rem" }}
                >
                  {/* [요구사항 1 & 2] '선택한 수식:' 박스 - 1초 간 경고/정답/오답 안내 후 원복 */}
                  <div
                    className={`w-full rounded-md border border-dashed transition-all duration-200 flex items-center justify-between min-h-[72px] h-[72px] ${
                      tempNotice
                        ? tempNotice.type === "success"
                          ? "bg-emerald-950/90 border-emerald-500 text-emerald-200 px-6 py-4"
                          : "bg-rose-950/90 border-rose-500 text-rose-200 px-6 py-4"
                        : "bg-teal-950 border-teal-600 text-yellow-300 px-6 py-4"
                    }`}
                  >
                    {tempNotice ? (
                      <div
                        className={`flex items-center gap-3 w-full justify-center text-xl sm:text-2xl font-bold ${
                          tempNotice.type === "success" ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {tempNotice.type === "success" ? (
                          <CheckCircle2 size={26} className="text-emerald-400 flex-shrink-0 animate-bounce" />
                        ) : tempNotice.type === "error" ? (
                          <XCircle size={26} className="text-rose-400 flex-shrink-0 animate-bounce" />
                        ) : (
                          <AlertTriangle size={26} className="text-rose-400 flex-shrink-0 animate-bounce" />
                        )}
                        <span style={{ fontFamily: "var(--font-chalk)" }}>{tempNotice.msg}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-5" style={{ paddingLeft: "1.5rem" }}>
                        <span
                          className="text-2xl sm:text-3xl text-teal-300 font-extrabold"
                          style={{ fontFamily: "var(--font-chalk)", letterSpacing: "0.02em" }}
                        >
                          선택한 수식:
                        </span>
                        <span
                          className="text-3xl sm:text-4xl font-black text-yellow-300 tracking-widest min-h-[40px] flex items-center"
                          style={{ fontFamily: "var(--font-chalk)", paddingLeft: "1rem" }}
                        >
                          {exprStr || "\u00A0"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* [요구사항 3] TARGET 표시 박스와 A~J 버튼 영역 높이 수평 완벽 정렬 */}
                  <div className="flex flex-col sm:flex-row items-stretch gap-4">
                    {/* [요구사항 2] TARGET 글씨 크기 키우기 */}
                    <div className="chalk-box-straight bg-teal-950 px-7 py-4 flex flex-col items-center justify-center min-w-[135px] border-yellow-400/80">
                      <span
                        className="text-xl sm:text-2xl text-yellow-400 font-extrabold tracking-widest mb-1"
                        style={{ fontFamily: "var(--font-chalk)" }}
                      >
                        TARGET
                      </span>
                      <span
                        className="text-5xl sm:text-6xl text-white font-black"
                        style={{ fontFamily: "var(--font-chalk)" }}
                      >
                        9
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between gap-2.5">
                      <div
                        className="text-xl sm:text-2xl text-yellow-300 font-bold mb-0.5"
                        style={{ fontFamily: "var(--font-chalk)" }}
                      >
                        제출할 수식 칸 선택
                      </div>
                      <div className="grid grid-cols-5 gap-2.5">
                        {Object.values(ALL_NODES).map((node) => {
                          const isSel = selectedNodes.includes(node.id);
                          return (
                            <button
                              key={node.id}
                              type="button"
                              onClick={() => handleNodeClick(node.id)}
                              className={`py-3 px-3 rounded-md text-xl sm:text-2xl font-black transition-all ${
                                isSel
                                  ? "bg-yellow-400 text-teal-950 scale-105 shadow-md"
                                  : "bg-teal-800/90 text-white hover:bg-teal-700"
                              }`}
                              style={{ fontFamily: "var(--font-chalk)" }}
                            >
                              {node.id}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* [요구사항 2] '제출하기' 자간을 조금 띄워서 가시성 확보 (letterSpacing: 0.35em) */}
                  <div className="w-full mt-1">
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      className="btn-chalk w-full justify-center py-4 text-2.5xl sm:text-3xl font-extrabold cursor-pointer shadow-lg"
                      style={{ fontFamily: "var(--font-chalk)", letterSpacing: "0.35em" }}
                    >
                      제출하기
                    </button>
                  </div>
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
          <div className="xl:col-span-3 chalk-box content-box flex flex-col bg-teal-950/80 backdrop-blur-md h-full min-h-0 p-4 sm:p-5">
            {mode === "player" ? (
              <>
                {/* [요구사항 3] 카드 헤더 높이 및 정렬 통일 */}
                <div className="flex items-center justify-between w-full min-h-[44px]">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="text-yellow-400 flex-shrink-0" size={28} />
                    <h2
                      className="text-yellow-300 font-bold"
                      style={{ fontFamily: "var(--font-chalk)", fontSize: "2.5rem", lineHeight: 1.1 }}
                    >
                      게임 설명
                    </h2>
                  </div>
                </div>

                <div
                  className="w-full border-t border-dashed border-teal-700"
                  style={{ marginTop: "1.1rem", marginBottom: "1.1rem" }}
                />

                {/* [요구사항 6 & 7] 번호 기준 들여쓰기 & ③번 '주의' 표시 항목 전용 박스 */}
                {/* [요구사항] 넘어가는 문자가 이전 줄의 우측 빈 공간으로 당겨오도록 wordBreak: break-all 적용 */}
                <div
                  className="flex flex-col gap-4 text-sm text-gray-200 leading-relaxed py-1"
                  style={{ fontFamily: "var(--font-body)", wordBreak: "break-all", letterSpacing: "-0.015em" }}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 font-bold text-yellow-300 w-5">①</span>
                    <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                      <strong className="text-yellow-300 font-semibold">&lsquo;수식 피라미드&rsquo;</strong>는
                      문제 판에서 3개의 칸을 선택하여 타깃 넘버가 될 수 있도록 수식을 만드는 게임입니다.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 font-bold text-yellow-300 w-5">②</span>
                    <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                      라운드가 시작되면 피라미드 모양의 문제판과 타깃 넘버가 공개됩니다. 문제판은 총 10개의
                      칸으로 이루어져 있으며, 각 칸에는 사칙연산 기호 중 하나와 숫자가 한 쌍을 이루고
                      있습니다.
                    </p>
                  </div>

                  {/* ③번 설명 항목 바로 밑에 '주의' 표시 박스 밀착 연결 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 font-bold text-yellow-300 w-5">③</span>
                      <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                        문제판이 공개되면 이 중 3개의 칸을 조합해 타깃 넘버가 답이 되는 수식을 만들어야 합니다.
                      </p>
                    </div>

                    {/* [주의 박스] 안쪽 상하 여백 감축(0.8rem) 및 하단 간격을 ①-② 항목 간격(gap-4: 16px)과 일치 */}
                    <div
                      className="w-full rounded-xl shadow-lg border-2 border-dashed border-yellow-400/90 bg-teal-900/95"
                      style={{
                        padding: "0.8rem 1.25rem",
                        marginTop: "0.25rem",
                        marginBottom: "0px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        className="flex items-start gap-3 text-yellow-200 text-sm font-medium"
                        style={{ lineHeight: "1.5", wordBreak: "break-all", letterSpacing: "-0.015em" }}
                      >
                        <AlertTriangle size={16} className="flex-shrink-0 text-yellow-400 mt-0.5" />
                        <span style={{ wordBreak: "break-all" }}>동일한 칸은 중복선택할 수 없습니다.</span>
                      </div>

                      <div
                        className="flex items-start gap-3 text-yellow-200 text-sm font-medium"
                        style={{ lineHeight: "1.5", wordBreak: "break-all", letterSpacing: "-0.015em" }}
                      >
                        <AlertTriangle size={16} className="flex-shrink-0 text-yellow-400 mt-0.5" />
                        <span style={{ wordBreak: "break-all" }}>수식의 맨 앞에 사용된 칸의 연산 기호는 무시합니다.</span>
                      </div>

                      <div
                        className="flex items-start gap-3 text-yellow-200 text-sm font-medium"
                        style={{ lineHeight: "1.5", wordBreak: "break-all", letterSpacing: "-0.015em" }}
                      >
                        <AlertTriangle size={16} className="flex-shrink-0 text-yellow-400 mt-0.5" />
                        <span style={{ wordBreak: "break-all" }}>완성된 수식은 사칙연산 순서에 따라 계산됩니다.</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 font-bold text-yellow-300 w-5">④</span>
                    <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                      정답을 제출하면 1점을 획득하고, 오답을 제출하거나 이번 라운드에서 이미 제출된 정답을
                      다시 제출하는 경우 1점이 감점됩니다.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 font-bold text-yellow-300 w-5">⑤</span>
                    <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
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
                    게임 생성
                  </h2>
                </div>

                <div
                  className="w-full border-t border-dashed border-teal-700"
                  style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
                />

                <div className="flex flex-col py-0.5">
                  <div className="flex flex-col gap-3">
                    {/* [요구사항] 게임 설명 본문 항목과 100% 동일한 글씨 크기(text-sm) & 폰트(var(--font-body)) 적용 */}
                    <div className="flex flex-col gap-1">
                      <div
                        className="flex items-center justify-between w-full text-sm text-gray-200 font-medium"
                        style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                      >
                        <span>라운드 설정</span>
                        <span className="text-yellow-300 font-bold">({selectedRound}라운드)</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {Array.from({ length: 15 }, (_, i) => i + 1).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSelectedRound(r)}
                            className={`py-1 text-sm font-medium rounded-md transition-all ${
                              selectedRound === r
                                ? "bg-yellow-400 text-teal-950 shadow scale-105"
                                : "bg-teal-900/90 text-gray-300 hover:bg-teal-800"
                            }`}
                            style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                          >
                            {r}R
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* [요구사항 1] 라운드 별 시간 3분, 5분, 7분 3개로 구성 */}
                    <div className="flex flex-col gap-1">
                      <div
                        className="flex items-center justify-between w-full text-sm text-gray-200 font-medium"
                        style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                      >
                        <span>라운드 별 시간</span>
                        <span className="text-yellow-300 font-bold">({selectedTime}분)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[3, 5, 7].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedTime(t)}
                            className={`py-1.5 text-sm font-medium rounded-md transition-all ${
                              selectedTime === t
                                ? "bg-yellow-400 text-teal-950 shadow scale-105"
                                : "bg-teal-900/90 text-gray-300 hover:bg-teal-800"
                            }`}
                            style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                          >
                            {t}분
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div
                        className="flex items-center justify-between w-full text-sm text-gray-200 font-medium"
                        style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                      >
                        <span>오답 패널티</span>
                        <span className="text-yellow-300 font-bold">({selectedPenalty})</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {["없음", "1초", "2초", "3초", "4초", "5초"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setSelectedPenalty(p)}
                            className={`py-1 text-sm font-medium rounded-md transition-all ${
                              selectedPenalty === p
                                ? "bg-yellow-400 text-teal-950 shadow scale-105"
                                : "bg-teal-900/90 text-gray-300 hover:bg-teal-800"
                            }`}
                            style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* [요구사항] 11R~15R과 라운드별 시간 사이 간격(12px: gap-3)의 정확히 2배(24px = marginTop: 1.5rem) 적용 */}
                  <div className="flex flex-col gap-2" style={{ marginTop: "1.5rem" }}>
                    <button
                      type="button"
                      onClick={handleCreateGame}
                      className="btn-chalk w-full justify-center py-2 text-base sm:text-lg font-bold"
                      style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                    >
                      입장 코드 생성하기
                    </button>

                    <div className="chalk-box-straight bg-teal-950 px-3 py-1.5 flex items-center justify-center min-h-[56px] h-[56px] border-dashed border-teal-600 text-center rounded-md transition-all">
                      {generatedRoomCode ? (
                        <div className="flex items-center gap-3">
                          <span
                            className="text-2.5xl sm:text-3xl text-yellow-300 font-extrabold leading-none"
                            style={{ fontFamily: "var(--font-chalk)", letterSpacing: "0.2em" }}
                          >
                            {generatedRoomCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedRoomCode);
                              alert(`입장 코드 [${generatedRoomCode}] 가 복사되었습니다!`);
                            }}
                            className="p-1 text-yellow-400 hover:text-yellow-200 transition-colors cursor-pointer hover:scale-110"
                            title="코드 복사"
                          >
                            <Copy size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-400 font-medium" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}>
                          버튼을 클릭하면 입장 코드가 생성됩니다.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
