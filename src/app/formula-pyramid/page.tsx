/**
 * src/app/formula-pyramid/page.tsx
 * 수식 피라미드 게임 페이지
 *
 * [주요 기능]
 * 1. 게임 시작 전(!isGameStarted)에는 타깃 넘버가 9인 '연습 문제판'으로 고정
 * 2. 딜러가 '게임 시작하기' 클릭 시 10가지 프리셋 게임판 중 1개가 랜덤으로 추첨되어 적용
 * 3. 게임 시작과 동시에 3초 카운트다운 후 실전 게임판 및 TARGET 동기화
 * 4. 라운드 종료 시 '이번 라운드 정답 보기' 팝업 표시 (모든 정답 / 제출된 정답 강조)
 * 5. 딜러가 방 생성 후 게임 시작 전까지 A~J 칸과 타깃 넘버를 ?로 표시
 * 6. 플레이어 입장 시 좌측에 실시간 점수판 표시
 * 7. 좌우 여백 1.25rem(20px) 디자인 규칙 100% 엄격 준수
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Pencil,
  AlertTriangle,
  Settings,
  HelpCircle,
  LogIn,
  CheckCircle2,
  XCircle,
  Copy,
  Sparkles,
  Pyramid,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Megaphone,
  Trophy,
  LogOut,
  Clock,
  Lock,
  BookOpen,
  Play,
} from "lucide-react";

/* ─── 피라미드 칸 데이터 타입 (A ~ J) ─────────────────────────────────────────── */
export interface PyramidNode {
  id: string;
  op: string;
  num: number;
  display: string;
}

export interface GameBoardPreset {
  id: number;
  title: string;
  target: number;
  nodes: Record<string, PyramidNode>;
  pyramidData: PyramidNode[][];
  nodeList: PyramidNode[];
}

/* ─── 헬퍼: 10개 노드 구성 데이터로부터 피라미드 프리셋 생성 ─────────────────────── */
const createBoardPreset = (
  id: number,
  title: string,
  target: number,
  nodeConfigs: { id: string; op: string; num: number }[]
): GameBoardPreset => {
  const nodesMap: Record<string, PyramidNode> = {};
  const nodeList: PyramidNode[] = [];

  nodeConfigs.forEach((c) => {
    const nodeObj: PyramidNode = {
      id: c.id,
      op: c.op,
      num: c.num,
      display: `${c.op}${c.num}`,
    };
    nodesMap[c.id] = nodeObj;
    nodeList.push(nodeObj);
  });

  const pyramidData: PyramidNode[][] = [
    [nodesMap["A"]],
    [nodesMap["B"], nodesMap["C"]],
    [nodesMap["D"], nodesMap["E"], nodesMap["F"]],
    [nodesMap["G"], nodesMap["H"], nodesMap["I"], nodesMap["J"]],
  ];

  return { id, title, target, nodes: nodesMap, pyramidData, nodeList };
};

/* ─── 0. 게임 시작 전 기본 연습용 게임판 (타깃 넘버: 9 고정) ────────────────────────── */
export const PRACTICE_BOARD: GameBoardPreset = createBoardPreset(0, "연습 문제판", 9, [
  { id: "A", op: "+", num: 1 },
  { id: "B", op: "÷", num: 4 },
  { id: "C", op: "×", num: 3 },
  { id: "D", op: "-", num: 10 },
  { id: "E", op: "÷", num: 5 },
  { id: "F", op: "×", num: 6 },
  { id: "G", op: "-", num: 11 },
  { id: "H", op: "+", num: 7 },
  { id: "I", op: "÷", num: 9 },
  { id: "J", op: "+", num: 9 },
]);

/* ─── 1~10. 게임 시작 시 랜덤으로 적용되는 10가지 실전 게임판 리스트 ─────────────────── */
export const GAME_BOARDS: GameBoardPreset[] = [
  createBoardPreset(1, "게임판 1", 10, [
    { id: "A", op: "×", num: 7 }, { id: "B", op: "÷", num: 5 }, { id: "C", op: "+", num: 9 },
    { id: "D", op: "-", num: 5 }, { id: "E", op: "×", num: 2 }, { id: "F", op: "+", num: 2 },
    { id: "G", op: "÷", num: 8 }, { id: "H", op: "÷", num: 8 }, { id: "I", op: "-", num: 8 }, { id: "J", op: "×", num: 3 },
  ]),
  createBoardPreset(2, "게임판 2", 1, [
    { id: "A", op: "÷", num: 4 }, { id: "B", op: "+", num: 8 }, { id: "C", op: "×", num: 2 },
    { id: "D", op: "-", num: 3 }, { id: "E", op: "+", num: 9 }, { id: "F", op: "+", num: 1 },
    { id: "G", op: "×", num: 7 }, { id: "H", op: "÷", num: 11 }, { id: "I", op: "-", num: 6 }, { id: "J", op: "×", num: 8 },
  ]),
  createBoardPreset(3, "게임판 3", 8, [
    { id: "A", op: "+", num: 7 }, { id: "B", op: "÷", num: 9 }, { id: "C", op: "×", num: 2 },
    { id: "D", op: "-", num: 13 }, { id: "E", op: "+", num: 15 }, { id: "F", op: "÷", num: 5 },
    { id: "G", op: "×", num: 1 }, { id: "H", op: "÷", num: 3 }, { id: "I", op: "-", num: 11 }, { id: "J", op: "×", num: 3 },
  ]),
  createBoardPreset(4, "게임판 4", 11, [
    { id: "A", op: "×", num: 3 }, { id: "B", op: "×", num: 13 }, { id: "C", op: "-", num: 8 },
    { id: "D", op: "-", num: 14 }, { id: "E", op: "÷", num: 2 }, { id: "F", op: "÷", num: 7 },
    { id: "G", op: "×", num: 9 }, { id: "H", op: "÷", num: 5 }, { id: "I", op: "-", num: 1 }, { id: "J", op: "÷", num: 4 },
  ]),
  createBoardPreset(5, "게임판 5", 6, [
    { id: "A", op: "÷", num: 14 }, { id: "B", op: "÷", num: 2 }, { id: "C", op: "-", num: 10 },
    { id: "D", op: "÷", num: 7 }, { id: "E", op: "×", num: 8 }, { id: "F", op: "÷", num: 5 },
    { id: "G", op: "÷", num: 12 }, { id: "H", op: "-", num: 5 }, { id: "I", op: "-", num: 6 }, { id: "J", op: "÷", num: 4 },
  ]),
  createBoardPreset(6, "게임판 6", 3, [
    { id: "A", op: "÷", num: 9 }, { id: "B", op: "-", num: 2 }, { id: "C", op: "-", num: 10 },
    { id: "D", op: "×", num: 6 }, { id: "E", op: "×", num: 3 }, { id: "F", op: "-", num: 8 },
    { id: "G", op: "×", num: 2 }, { id: "H", op: "×", num: 5 }, { id: "I", op: "÷", num: 7 }, { id: "J", op: "×", num: 4 },
  ]),
  createBoardPreset(7, "게임판 7", 19, [
    { id: "A", op: "-", num: 1 }, { id: "B", op: "+", num: 2 }, { id: "C", op: "+", num: 3 },
    { id: "D", op: "-", num: 4 }, { id: "E", op: "×", num: 5 }, { id: "F", op: "×", num: 6 },
    { id: "G", op: "×", num: 7 }, { id: "H", op: "-", num: 8 }, { id: "I", op: "×", num: 9 }, { id: "J", op: "-", num: 10 },
  ]),
  createBoardPreset(8, "게임판 8", 9, [
    { id: "A", op: "-", num: 16 }, { id: "B", op: "-", num: 14 }, { id: "C", op: "÷", num: 2 },
    { id: "D", op: "÷", num: 8 }, { id: "E", op: "×", num: 12 }, { id: "F", op: "×", num: 4 },
    { id: "G", op: "÷", num: 7 }, { id: "H", op: "+", num: 10 }, { id: "I", op: "+", num: 3 }, { id: "J", op: "÷", num: 5 },
  ]),
  createBoardPreset(9, "게임판 9", 7, [
    { id: "A", op: "-", num: 2 }, { id: "B", op: "+", num: 12 }, { id: "C", op: "÷", num: 6 },
    { id: "D", op: "×", num: 4 }, { id: "E", op: "÷", num: 2 }, { id: "F", op: "+", num: 8 },
    { id: "G", op: "×", num: 6 }, { id: "H", op: "÷", num: 10 }, { id: "I", op: "-", num: 4 }, { id: "J", op: "×", num: 2 },
  ]),
  createBoardPreset(10, "게임판 10", 17, [
    { id: "A", op: "-", num: 10 }, { id: "B", op: "×", num: 4 }, { id: "C", op: "×", num: 9 },
    { id: "D", op: "×", num: 5 }, { id: "E", op: "×", num: 2 }, { id: "F", op: "+", num: 3 },
    { id: "G", op: "+", num: 1 }, { id: "H", op: "÷", num: 6 }, { id: "I", op: "÷", num: 8 }, { id: "J", op: "÷", num: 7 },
  ]),
];

/* ─── TARGET을 만드는 모든 수학적 정답 조합 동적 계산 ───────────────────────────── */
const getAllValidSolutions = (
  target: number,
  nodesMap: Record<string, PyramidNode>
): { nodes: string[]; formulaStr: string; val: number }[] => {
  const nodeKeys = Object.keys(nodesMap);
  const solutions: { nodes: string[]; formulaStr: string; val: number }[] = [];

  for (let i = 0; i < nodeKeys.length; i++) {
    for (let j = 0; j < nodeKeys.length; j++) {
      if (i === j) continue;
      for (let k = 0; k < nodeKeys.length; k++) {
        if (i === k || j === k) continue;
        const n1 = nodesMap[nodeKeys[i]];
        const n2 = nodesMap[nodeKeys[j]];
        const n3 = nodesMap[nodeKeys[k]];
        if (!n1 || !n2 || !n3) continue;

        const op2 = n2.op === "×" ? "*" : n2.op === "÷" ? "/" : n2.op;
        const op3 = n3.op === "×" ? "*" : n3.op === "÷" ? "/" : n3.op;
        const calcExpr = `${n1.num} ${op2} ${n2.num} ${op3} ${n3.num}`;

        try {
          const val = Function(`"use strict"; return (${calcExpr})`)();
          if (val === target) {
            const formulaStr = `${n1.num} ${n2.op}${n2.num} ${n3.op}${n3.num} = ${target}`;
            solutions.push({ nodes: [n1.id, n2.id, n3.id], formulaStr, val });
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
  masked = false,
}: {
  node: PyramidNode;
  isSelected: boolean;
  onClick?: () => void;
  masked?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative transition-all duration-200 select-none w-[64px] h-[73.9px] sm:w-[68px] sm:h-[78.5px] flex items-center justify-center ${
        onClick ? "cursor-pointer hover:scale-105" : ""
      } ${isSelected ? "drop-shadow-[0_0_16px_rgba(245,230,66,0.95)]" : ""}`}
    >
      <svg viewBox="0 0 100 115.47" className="w-full h-full absolute inset-0 filter drop-shadow-md">
        <polygon
          points="50,4.62 96,31.18 96,84.30 50,110.85 4,84.30 4,31.18"
          fill={isSelected ? "rgba(245, 230, 66, 0.3)" : "rgba(20, 50, 50, 0.92)"}
          stroke={isSelected ? "#f5e642" : "rgba(240, 237, 232, 0.65)"}
          strokeWidth="3.5"
          strokeDasharray={isSelected ? "none" : "4 2"}
        />
        <polygon
          points="50,4.62 67.32,14.62 67.32,34.62 50,44.62 32.68,34.62 32.68,14.62"
          fill={isSelected ? "#f5e642" : "rgba(245, 230, 66, 0.25)"}
          stroke={isSelected ? "#1a3a3a" : "var(--chalk-yellow)"}
          strokeWidth="2"
        />
        <text x="50" y="31" textAnchor="middle" fill={isSelected ? "#1a3a3a" : "var(--chalk-yellow)"} fontSize="28" fontWeight="bold" fontFamily="var(--font-chalk)">
          {node.id}
        </text>
        <text x="50" y="85" textAnchor="middle" fill={isSelected ? "#f5e642" : "var(--chalk-white)"} fontSize={masked ? "52" : "44"} fontWeight="bold" fontFamily="var(--font-chalk)">
          {masked ? "?" : node.display}
        </text>
      </svg>
    </div>
  );
}

/* ─── 메인 수식 피라미드 페이지 ─────────────────────────────────────────── */
export default function FormulaPyramidPage() {
  const [mode, setMode] = useState<"player" | "dealer">("player");

  /* ── 실시간 다중 플레이어 대전 방 상태 ── */
  const [inGameRoom, setInGameRoom] = useState(false);
  const [activeRoomCode, setActiveRoomCode] = useState("");
  const [myNickname, setMyNickname] = useState("");
  const [myScore, setMyScore] = useState(0);
  const [isDealerHost, setIsDealerHost] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<number>(1);
  const [players, setPlayers] = useState<{ name: string; score: number; isHost?: boolean }[]>([]);
  const [activityLogs, setActivityLogs] = useState<string[]>([]);
  const [submittedAnswersList, setSubmittedAnswersList] = useState<{ nodes: string; formula: string }[]>([]);
  const [roomTimerSeconds, setRoomTimerSeconds] = useState(180);
  const [roomEndTime, setRoomEndTime] = useState<number | null>(null);

  /* ── 카운트다운 & 라운드 종료 팝업 ── */
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [showRoundEndPopup, setShowRoundEndPopup] = useState(false);
  const [isRoundLocked, setIsRoundLocked] = useState(false);

  /* ── 게임판 결정 로직 ──
     - 딜러: 방 생성 후 게임 시작 전에는 연습판 표시 (A~J / TARGET을 ?로 마스킹)
     - 플레이어: 게임 시작 전에는 연습판(TARGET:9), 시작 후 랜덤 추첨 판으로 전환
  ── */
  const currentBoard = isGameStarted
    ? GAME_BOARDS.find((b) => b.id === selectedBoardId) || GAME_BOARDS[0]
    : PRACTICE_BOARD;

  const currentPyramidData = currentBoard.pyramidData;
  const currentAllNodes = currentBoard.nodes;
  const currentTargetNumber = currentBoard.target;
  const validSolutions = getAllValidSolutions(currentTargetNumber, currentAllNodes);

  /* ── 플레이어 모드 상태 ── */
  const [nickname, setNickname] = useState("");
  const [entryCode, setEntryCode] = useState("");
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [showSolutions, setShowSolutions] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedTime, setSelectedTime] = useState<number>(3);
  const [selectedPenalty, setSelectedPenalty] = useState<string>("없음");
  const [generatedRoomCode, setGeneratedRoomCode] = useState<string>("");

  const [tempNotice, setTempNotice] = useState<{ msg: string; type: "warning" | "success" | "error" } | null>(null);
  const [noticeTimer, setNoticeTimer] = useState<NodeJS.Timeout | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [penaltyLockSeconds, setPenaltyLockSeconds] = useState<number>(0);

  const triggerNotice = (msg: string, type: "warning" | "success" | "error" = "warning", durationMs = 1000) => {
    if (noticeTimer) clearTimeout(noticeTimer);
    setTempNotice({ msg, type });
    const timer = setTimeout(() => setTempNotice(null), durationMs);
    setNoticeTimer(timer);
  };

  /* ── 페널티 타이머 ── */
  useEffect(() => {
    if (penaltyLockSeconds <= 0) return;
    const timer = setInterval(() => setPenaltyLockSeconds((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [penaltyLockSeconds]);

  /* ── 라운드 타이머 ── */
  useEffect(() => {
    if (!inGameRoom) return;
    const interval = setInterval(() => {
      if (!isGameStarted) return;
      if (roomEndTime) {
        const rem = Math.max(0, Math.ceil((roomEndTime - Date.now()) / 1000));
        setRoomTimerSeconds(rem);
        // 시간이 0이 되면 라운드 종료 처리
        if (rem === 0 && !showRoundEndPopup && !isRoundLocked) {
          setIsRoundLocked(true);
          setShowRoundEndPopup(true);
        }
      } else {
        setRoomTimerSeconds((prev) => {
          const next = prev > 0 ? prev - 1 : 0;
          if (next === 0 && !showRoundEndPopup && !isRoundLocked) {
            setIsRoundLocked(true);
            setShowRoundEndPopup(true);
          }
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [inGameRoom, isGameStarted, roomEndTime, showRoundEndPopup, isRoundLocked]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getPenaltySec = () => {
    if (!selectedPenalty || selectedPenalty === "없음") return 0;
    return parseInt(selectedPenalty.replace(/[^0-9]/g, ""), 10) || 0;
  };

  const handleNodeClick = (nodeId: string) => {
    if (isRoundLocked) return;
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
    const nodes = nodeIds.map((id) => currentAllNodes[id]).filter(Boolean);
    const exprStr = nodeIds.join(" ");
    if (nodes.length < 3) return { exprStr, result: null };

    let calcExpr = `${nodes[0].num}`;
    for (let i = 1; i < nodes.length; i++) {
      const opSymbol = nodes[i].op === "×" ? "*" : nodes[i].op === "÷" ? "/" : nodes[i].op;
      calcExpr += ` ${opSymbol} ${nodes[i].num}`;
    }
    try {
      const evalRes = Function(`"use strict"; return (${calcExpr})`)();
      return { exprStr, result: Number(evalRes) };
    } catch {
      return { exprStr, result: null };
    }
  };

  const { exprStr, result: currentResult } = calculateFormula(selectedNodes);

  const handleSubmitAnswer = () => {
    if (penaltyLockSeconds > 0 || isRoundLocked) return;

    const penaltySec = getPenaltySec();

    if (selectedNodes.length !== 3) {
      if (penaltySec > 0) {
        setPenaltyLockSeconds(penaltySec);
        triggerNotice(`3개의 칸을 모두 선택해야 합니다! (${penaltySec}초 대기)`, "warning", penaltySec * 1000);
      } else {
        triggerNotice("3개의 칸을 모두 선택해야 합니다!", "warning", 1000);
      }
      setSelectedNodes([]);
      return;
    }

    const nodesStr = selectedNodes.join(" ");
    const isAlreadySubmitted = submittedAnswersList.some((a) => a.nodes === nodesStr);

    if (isAlreadySubmitted) {
      const nextScore = Math.max(0, myScore - 1);
      setMyScore(nextScore);
      setPlayers((prev) => prev.map((p) => (p.name === myNickname ? { ...p, score: nextScore } : p)));
      if (penaltySec > 0) {
        setPenaltyLockSeconds(penaltySec);
        triggerNotice(`이미 제출된 정답입니다! (-1점) (${penaltySec}초 대기)`, "error", penaltySec * 1000);
      } else {
        triggerNotice("이미 제출된 정답입니다! (-1점)", "error", 1500);
      }
      broadcastScoreUpdate(myNickname, nextScore);
      setSelectedNodes([]);
      return;
    }

    if (currentResult === currentTargetNumber) {
      const nextScore = myScore + 1;
      setMyScore(nextScore);
      setPlayers((prev) => prev.map((p) => (p.name === myNickname ? { ...p, score: nextScore } : p)));
      triggerNotice("정답입니다! (+1점)", "success", 1200);

      const nodesArr = selectedNodes.map((id) => currentAllNodes[id]);
      const formulaStr = `${nodesArr[0].num} ${nodesArr[1].op}${nodesArr[1].num} ${nodesArr[2].op}${nodesArr[2].num} = ${currentTargetNumber}`;
      const ansObj = { nodes: nodesStr, formula: formulaStr };
      setSubmittedAnswersList((prev) => {
        if (prev.some((a) => a.nodes === ansObj.nodes)) return prev;
        const next = [...prev, ansObj];
        // 모든 정답 조합이 다 제출되었으면 즉시 라운드 종료
        const allSolutions = getAllValidSolutions(currentTargetNumber, currentAllNodes);
        const allSubmittedKeys = next.map((a) => a.nodes);
        const allSolKeys = allSolutions.map((s) => s.nodes.join(" "));
        const allDone = allSolKeys.every((k) => allSubmittedKeys.includes(k));
        if (allDone) {
          setIsRoundLocked(true);
          setShowRoundEndPopup(true);
        }
        return next;
      });
      broadcastScoreUpdate(myNickname, nextScore, ansObj);
    } else {
      const nextScore = Math.max(0, myScore - 1);
      setMyScore(nextScore);
      setPlayers((prev) => prev.map((p) => (p.name === myNickname ? { ...p, score: nextScore } : p)));
      if (penaltySec > 0) {
        setPenaltyLockSeconds(penaltySec);
        triggerNotice(`오답입니다! (-1점) (${penaltySec}초 대기)`, "error", penaltySec * 1000);
      } else {
        triggerNotice("오답입니다! (-1점)", "error", 1200);
      }
      broadcastScoreUpdate(myNickname, nextScore);
    }
    setSelectedNodes([]);
  };

  const broadcastScoreUpdate = (playerName: string, newScore: number, submittedAnswer?: { nodes: string; formula: string }) => {
    if (inGameRoom && activeRoomCode && typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
        bc.postMessage({ type: "SCORE_UPDATE", playerName, newScore, submittedAnswer });
        bc.close();
      } catch {}
    }
  };

  /* ── 최신 방 상태값을 useRef로 관리 ── */
  const roomStateRef = useRef({
    myNickname, myScore, isDealerHost, selectedRound, selectedTime, selectedPenalty, selectedBoardId, isGameStarted, roomEndTime,
  });
  useEffect(() => {
    roomStateRef.current = { myNickname, myScore, isDealerHost, selectedRound, selectedTime, selectedPenalty, selectedBoardId, isGameStarted, roomEndTime };
  });

  /* ── BroadcastChannel 실시간 멀티플레이어 동기화 ── */
  useEffect(() => {
    if (!inGameRoom || !activeRoomCode) return;
    let bc: BroadcastChannel | null = null;

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
        bc.onmessage = (event) => {
          const data = event.data;
          if (!data) return;
          const curr = roomStateRef.current;

          if (data.type === "JOIN") {
            if (data.player.name === curr.myNickname) return;
            setPlayers((prev) => prev.some((p) => p.name === data.player.name) ? prev : [...prev, data.player]);
            setActivityLogs((prev) => {
              const msg = `[실시간] ${data.player.name} 님이 방에 참가하셨습니다.`;
              return prev.includes(msg) ? prev : [msg, ...prev];
            });
            let exactEndTime = curr.roomEndTime;
            if (!exactEndTime) {
              try {
                const confStr = localStorage.getItem(`pyramid-room-config-${activeRoomCode}`);
                if (confStr) { const conf = JSON.parse(confStr); if (conf.roomEndTime) exactEndTime = conf.roomEndTime; }
              } catch {}
            }
            bc?.postMessage({
              type: "SYNC_PRESENCE",
              player: { name: curr.myNickname, score: curr.myScore, isHost: curr.isDealerHost },
              roomConfig: { selectedRound: curr.selectedRound, selectedTime: curr.selectedTime, selectedPenalty: curr.selectedPenalty, selectedBoardId: curr.selectedBoardId, isGameStarted: curr.isGameStarted, roomEndTime: exactEndTime },
            });
          } else if (data.type === "SYNC_PRESENCE") {
            if (data.player.name === curr.myNickname) return;
            setPlayers((prev) => prev.some((p) => p.name === data.player.name) ? prev : [...prev, data.player]);
            if (data.roomConfig) {
              if (data.roomConfig.selectedRound) setSelectedRound(data.roomConfig.selectedRound);
              if (data.roomConfig.selectedTime) setSelectedTime(data.roomConfig.selectedTime);
              if (data.roomConfig.selectedPenalty) setSelectedPenalty(data.roomConfig.selectedPenalty);
              if (data.roomConfig.selectedBoardId) setSelectedBoardId(data.roomConfig.selectedBoardId);
              if (data.roomConfig.isGameStarted !== undefined) setIsGameStarted(data.roomConfig.isGameStarted);
              if (data.roomConfig.roomEndTime) {
                setRoomEndTime(data.roomConfig.roomEndTime);
                setRoomTimerSeconds(Math.max(0, Math.ceil((data.roomConfig.roomEndTime - Date.now()) / 1000)));
              }
            }
          } else if (data.type === "START_GAME") {
            // 수신 측에서는 카운트다운 없이 바로 boardId 세팅만 하고 countdownValue를 통해 트리거
            setSelectedBoardId(data.selectedBoardId || 1);
            if (data.roomEndTime) {
              setRoomEndTime(data.roomEndTime);
              setRoomTimerSeconds(Math.max(0, Math.ceil((data.roomEndTime - Date.now()) / 1000)));
            }
            // 카운트다운 시작 (3초)
            setCountdownValue(3);
          } else if (data.type === "SCORE_UPDATE") {
            if (data.playerName === curr.myNickname) return;
            setPlayers((prev) => prev.map((p) => (p.name === data.playerName ? { ...p, score: data.newScore } : p)));
            if (data.submittedAnswer) {
              setSubmittedAnswersList((prev) => prev.some((a) => a.nodes === data.submittedAnswer.nodes) ? prev : [...prev, data.submittedAnswer]);
            }
            setActivityLogs((prev) => [`[정답] ${data.playerName} 님이 정답 제출! (${data.submittedAnswer?.nodes || ""} -> ${data.newScore}점)`, ...prev]);
          } else if (data.type === "LEAVE") {
            if (data.playerName === curr.myNickname) return;
            setPlayers((prev) => {
              const updated = prev.filter((p) => p.name !== data.playerName);
              if (updated.length === 0 && activeRoomCode) {
                try { localStorage.removeItem(`pyramid-room-config-${activeRoomCode}`); } catch {}
              }
              return updated;
            });
            setActivityLogs((prev) => [`[실시간] ${data.playerName} 님이 방을 나갔습니다.`, ...prev]);
          }
        };
        bc.postMessage({ type: "JOIN", player: { name: myNickname, score: myScore, isHost: isDealerHost } });
      } catch {}
    }
    return () => { if (bc) bc.close(); };
  }, [inGameRoom, activeRoomCode]);

  /* ── 카운트다운 로직 ── */
  useEffect(() => {
    if (countdownValue === null) return;
    if (countdownValue <= 0) {
      setCountdownValue(null);
      setIsGameStarted(true);
      return;
    }
    const timer = setTimeout(() => setCountdownValue((prev) => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdownValue]);

  /* ── unload 처리 ── */
  useEffect(() => {
    if (!inGameRoom || !activeRoomCode) return;
    const handleUnload = () => {
      try {
        const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
        bc.postMessage({ type: "LEAVE", playerName: myNickname, isHost: isDealerHost });
        bc.close();
      } catch {}
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [inGameRoom, activeRoomCode, myNickname, isDealerHost]);

  const handleLeaveRoom = () => {
    if (inGameRoom && activeRoomCode && typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
        bc.postMessage({ type: "LEAVE", playerName: myNickname, isHost: isDealerHost });
        bc.close();
      } catch {}
    }
    const remainingPlayers = players.filter((p) => p.name !== myNickname);
    if (remainingPlayers.length === 0 && activeRoomCode) {
      try { localStorage.removeItem(`pyramid-room-config-${activeRoomCode}`); } catch {}
      setSelectedRound(1); setSelectedTime(3); setSelectedPenalty("없음"); setSelectedBoardId(1); setRoomTimerSeconds(180); setRoomEndTime(null);
    }
    setInGameRoom(false); setIsGameStarted(false); setActiveRoomCode(""); setPlayers([]); setActivityLogs([]); setSubmittedAnswersList([]);
    setShowRoundEndPopup(false); setIsRoundLocked(false); setCountdownValue(null);
  };

  const handleJoinGameRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nickname.trim()) { alert("닉네임을 입력해 주세요."); return; }
    if (!entryCode.trim()) { alert("입장 코드를 입력해 주세요."); return; }
    const cleanCode = entryCode.trim().toUpperCase();
    try {
      const savedConfigStr = localStorage.getItem(`pyramid-room-config-${cleanCode}`);
      if (savedConfigStr) {
        const savedConfig = JSON.parse(savedConfigStr);
        if (savedConfig.selectedRound) setSelectedRound(savedConfig.selectedRound);
        if (savedConfig.selectedTime) setSelectedTime(savedConfig.selectedTime);
        if (savedConfig.selectedPenalty) setSelectedPenalty(savedConfig.selectedPenalty);
        if (savedConfig.selectedBoardId) setSelectedBoardId(savedConfig.selectedBoardId);
        if (savedConfig.isGameStarted !== undefined) setIsGameStarted(savedConfig.isGameStarted);
        if (savedConfig.roomEndTime) {
          setRoomEndTime(savedConfig.roomEndTime);
          setRoomTimerSeconds(Math.max(0, Math.ceil((savedConfig.roomEndTime - Date.now()) / 1000)));
        } else {
          setRoomTimerSeconds(savedConfig.selectedTime ? savedConfig.selectedTime * 60 : 180);
        }
      }
    } catch {}
    setActiveRoomCode(cleanCode); setMyNickname(nickname.trim()); setMyScore(0); setIsDealerHost(false); setInGameRoom(true);
    const me = { name: nickname.trim(), score: 0 };
    setPlayers([me]);
    setActivityLogs([`[안내] 방 [${cleanCode}] 에 성공적으로 입장했습니다.`]);
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try { const bc = new BroadcastChannel(`pyramid-room-${cleanCode}`); bc.postMessage({ type: "JOIN", player: me }); bc.close(); } catch {}
    }
  };

  const handleCreateGame = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const code = `P${randomNum}`;
    const currentRoomConfig = { selectedRound, selectedTime, selectedPenalty, selectedBoardId: 1, isGameStarted: false, roomEndTime: null };
    try { localStorage.setItem(`pyramid-room-config-${code}`, JSON.stringify(currentRoomConfig)); } catch {}
    setRoomEndTime(null); setIsGameStarted(false); setRoomTimerSeconds(selectedTime * 60);
    setGeneratedRoomCode(code); setActiveRoomCode(code); setMyNickname("딜러(선생님)"); setMyScore(0); setIsDealerHost(true); setInGameRoom(true);
    const host = { name: "딜러(선생님)", score: 0, isHost: true };
    setPlayers([host]);
    setActivityLogs([`[안내] 딜러 방 [${code}] 가 생성되었습니다. 플레이어가 입장하면 [게임 시작하기]를 눌러주세요.`]);
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try { const bc = new BroadcastChannel(`pyramid-room-${code}`); bc.postMessage({ type: "JOIN", player: host, roomConfig: currentRoomConfig }); bc.close(); } catch {}
    }
  };

  /* ── 딜러가 '게임 시작하기' 클릭 시 랜덤 추첨 후 카운트다운 시작 ── */
  const handleStartGame = () => {
    if (!activeRoomCode) return;
    const chosenBoard = GAME_BOARDS[Math.floor(Math.random() * GAME_BOARDS.length)];
    const chosenBoardId = chosenBoard.id;
    const calculatedEndTime = Date.now() + 3000 + selectedTime * 60 * 1000; // 카운트다운 3초 포함

    setSelectedBoardId(chosenBoardId);
    setRoomEndTime(calculatedEndTime);
    setShowRoundEndPopup(false);
    setIsRoundLocked(false);

    const currentRoomConfig = { selectedRound, selectedTime, selectedPenalty, selectedBoardId: chosenBoardId, isGameStarted: true, roomEndTime: calculatedEndTime };
    try { localStorage.setItem(`pyramid-room-config-${activeRoomCode}`, JSON.stringify(currentRoomConfig)); } catch {}

    // 딜러 본인도 카운트다운 시작
    setCountdownValue(3);

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
        bc.postMessage({ type: "START_GAME", roomEndTime: calculatedEndTime, selectedBoardId: chosenBoardId, target: chosenBoard.target });
        bc.close();
      } catch {}
    }
  };

  /* ── 점수판 컴포넌트 (재사용) ── */
  const ScoreBoard = ({ maxH = "120px" }: { maxH?: string }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-300 font-extrabold text-lg" style={{ fontFamily: "var(--font-chalk)" }}>
          <Trophy size={18} className="text-yellow-400" />
          <span>실시간 점수판</span>
        </div>
        <span className="text-xs text-gray-300 font-medium">({players.filter((p) => !p.isHost).length}명)</span>
      </div>
      <div className="w-full border-t border-dashed border-teal-600/70" style={{ marginTop: "0.2rem", marginBottom: "0.3rem" }} />
      <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: maxH }}>
        {players.filter((p) => !p.isHost).length > 0 ? (
          players.filter((p) => !p.isHost).slice().sort((a, b) => b.score - a.score).map((p, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between rounded-lg border transition-all ${
                p.name === myNickname ? "bg-yellow-400/20 border-yellow-400 text-yellow-200 shadow-md" : "bg-teal-900/70 border-teal-700/80 text-gray-200"
              }`}
              style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
            >
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-yellow-400 w-4 flex-shrink-0 text-center">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                </span>
                <span className="font-bold text-xs sm:text-sm" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}>{p.name}</span>
              </div>
              <span className="font-extrabold text-base text-yellow-300 flex-shrink-0" style={{ fontFamily: "var(--font-chalk)" }}>{p.score}점</span>
            </div>
          ))
        ) : (
          <div className="py-3 text-center text-gray-400 text-xs" style={{ fontFamily: "var(--font-body)" }}>플레이어 참가 대기 중...</div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="w-full flex-1 flex flex-col items-center justify-start"
      style={{ paddingTop: "0.5rem", paddingBottom: "1rem", paddingLeft: "clamp(1rem, 4vw, 3rem)", paddingRight: "clamp(1rem, 4vw, 3rem)" }}
    >
      <div className="w-full max-w-[1550px] flex flex-col mx-auto">

        {/* ── 카운트다운 오버레이 ── */}
        {countdownValue !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6">
              <p className="text-2xl sm:text-3xl text-yellow-300 font-extrabold" style={{ fontFamily: "var(--font-chalk)" }}>
                게임이 곧 시작됩니다!
              </p>
              <div
                className="w-36 h-36 rounded-full flex items-center justify-center border-4 border-yellow-400 shadow-2xl"
                style={{ background: "radial-gradient(circle at 50% 40%, rgba(20,60,50,0.98), rgba(5,25,20,1))" }}
              >
                <span
                  className="text-8xl font-black text-yellow-300 leading-none"
                  style={{ fontFamily: "var(--font-chalk)", textShadow: "0 0 30px rgba(245,230,66,0.8)" }}
                >
                  {countdownValue}
                </span>
              </div>
              <p className="text-lg text-teal-200 font-medium" style={{ fontFamily: "var(--font-body)" }}>
                준비하세요...
              </p>
            </div>
          </div>
        )}

        {/* ── 라운드 종료 팝업 ── */}
        {showRoundEndPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div
              className="w-full max-w-2xl mx-4 rounded-2xl shadow-2xl border-2 border-yellow-400/80 bg-teal-950/98 flex flex-col"
              style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "1.5rem", paddingBottom: "1.5rem", gap: "1rem" }}
            >
              {/* 팝업 헤더 */}
              <div className="flex items-center gap-3">
                <BookOpen size={28} className="text-yellow-400 flex-shrink-0" />
                <h2 className="text-yellow-300 font-extrabold text-2xl sm:text-3xl" style={{ fontFamily: "var(--font-chalk)" }}>
                  이번 라운드 정답 보기
                </h2>
              </div>
              <div className="w-full border-t border-dashed border-teal-600/70" />

              {/* 정답 목록 */}
              <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
                {validSolutions.length === 0 ? (
                  <p className="text-center text-gray-400 py-6" style={{ fontFamily: "var(--font-body)" }}>가능한 정답 조합이 없습니다.</p>
                ) : (
                  validSolutions.map((sol, idx) => {
                    const solNodeStr = sol.nodes.join(" ");
                    const isSubmitted = submittedAnswersList.some((a) => a.nodes === solNodeStr);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-xl border transition-all ${
                          isSubmitted
                            ? "bg-emerald-900/80 border-emerald-400/90 shadow-lg"
                            : "bg-teal-900/60 border-teal-700/80"
                        }`}
                        style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.65rem", paddingBottom: "0.65rem" }}
                      >
                        <div className="flex items-center gap-3">
                          {isSubmitted && <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />}
                          <span
                            className={`font-black text-lg sm:text-xl tracking-widest ${isSubmitted ? "text-emerald-300" : "text-yellow-300"}`}
                            style={{ fontFamily: "var(--font-chalk)" }}
                          >
                            {solNodeStr}
                          </span>
                          {isSubmitted && (
                            <span className="text-xs text-emerald-400 font-bold border border-emerald-500/70 rounded-md px-2 py-0.5" style={{ fontFamily: "var(--font-body)" }}>
                              제출 완료
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-sm sm:text-base font-extrabold tracking-wide ${isSubmitted ? "text-emerald-200" : "text-teal-200"}`}
                          style={{ fontFamily: "var(--font-chalk)" }}
                        >
                          {sol.formulaStr}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="w-full border-t border-dashed border-teal-600/70" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-300" style={{ fontFamily: "var(--font-body)" }}>
                  총 <span className="text-yellow-300 font-bold">{validSolutions.length}개</span> 조합 중{" "}
                  <span className="text-emerald-300 font-bold">{submittedAnswersList.length}개</span> 제출 완료
                </p>
                <button
                  type="button"
                  onClick={() => setShowRoundEndPopup(false)}
                  className="bg-yellow-400 hover:bg-yellow-300 text-teal-950 font-extrabold rounded-xl cursor-pointer transition-all shadow-md"
                  style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.65rem", paddingBottom: "0.65rem", fontFamily: "var(--font-chalk)" }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── 상단 타이틀 ─────────────────────────────── */}
        <div className="flex items-center justify-between w-full" style={{ marginTop: "0.25rem", marginBottom: "0.75rem" }}>
          <h1 className="text-3xl sm:text-4xl text-yellow-300 flex items-center gap-4" style={{ fontFamily: "var(--font-chalk)" }}>
            <Pyramid className="text-yellow-400 flex-shrink-0" size={36} />
            수식 피라미드 (Formula Pyramid)
          </h1>
          <Link
            href="/"
            className="flex items-center rounded-full bg-teal-900/90 hover:bg-teal-800 border-2 border-dashed border-yellow-400/90 text-yellow-300 text-xl sm:text-2xl font-extrabold transition-all shadow-lg hover:scale-105 cursor-pointer"
            style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.9rem", paddingBottom: "0.9rem", gap: "0.85rem", fontFamily: "var(--font-chalk)", textDecoration: "none", letterSpacing: "0.05em" }}
          >
            <ArrowLeft size={24} className="text-yellow-400 flex-shrink-0" />
            <span className="leading-none">홈으로</span>
          </Link>
        </div>

        <div className="w-full border-t-2 border-dashed border-teal-700/80" style={{ marginTop: "0.25rem", marginBottom: "1rem" }} />

        {/* ─── 3분할 박스 ─────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">

          {/* ════════════════════ [좌측 박스] ════════════════════ */}
          <div className="xl:col-span-3 chalk-box content-box flex flex-col bg-teal-950/80 backdrop-blur-md h-full p-4 sm:p-5">
            <div className="flex items-center gap-3 w-full min-h-[44px]">
              <LogIn className="text-yellow-400 flex-shrink-0" size={28} />
              <h2 className="text-yellow-300 font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "2.5rem", lineHeight: 1.1 }}>
                게임 입장하기
              </h2>
            </div>
            <div className="w-full border-t border-dashed border-teal-600/70" style={{ marginTop: "0.5rem", marginBottom: "0.85rem" }} />

            {/* 탭 버튼: 방에 입장 중이 아닐 때만 표시 */}
            {!inGameRoom && (
              <div className="w-full flex justify-center" style={{ marginTop: "0.5rem", marginBottom: "2.5rem" }}>
                <div className="flex items-center rounded-full select-none bg-teal-950/95 border-2 border-yellow-400/70 shadow-lg w-full p-1.5 gap-2">
                  {(["player", "dealer"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`flex-1 py-2.5 rounded-full text-base sm:text-lg font-bold transition-all duration-200 cursor-pointer text-center ${
                        mode === m ? "bg-yellow-400 text-teal-950 shadow-md scale-102" : "text-gray-300 hover:text-white"
                      }`}
                      style={{ fontFamily: "var(--font-chalk)" }}
                    >
                      {m === "player" ? "플레이어 모드" : "딜러 모드"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* 방 입장 중일 때 탭 대신 상단 간격 보정 */}
            {inGameRoom && <div style={{ marginBottom: "0.5rem" }} />}

            {mode === "player" ? (
              /* ── 플레이어 모드 입장 양식 ── */
              <div className="flex flex-col flex-1 gap-5">
                {/* 게임방 입장 전: 입장 폼 */}
                {!inGameRoom ? (
                  <form onSubmit={handleJoinGameRoom} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="nickname-input" className="text-2xl sm:text-3xl text-white font-bold" style={{ fontFamily: "var(--font-chalk)" }}>닉네임</label>
                      <input
                        id="nickname-input" type="text" placeholder="닉네임을 입력해 주세요" value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full rounded-md bg-teal-900/90 border border-dashed border-teal-600 text-white text-lg focus:outline-none focus:border-yellow-400 placeholder:text-gray-400/80"
                        style={{ padding: "14px 20px", fontFamily: "var(--font-body)", lineHeight: "1.5" }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="code-input" className="text-2xl sm:text-3xl text-white font-bold" style={{ fontFamily: "var(--font-chalk)" }}>입장 코드</label>
                      <input
                        id="code-input" type="text" placeholder="코드를 입력해주세요." value={entryCode}
                        onChange={(e) => setEntryCode(e.target.value)}
                        className="w-full rounded-md bg-teal-900/90 border border-dashed border-teal-600 text-white text-lg uppercase focus:outline-none focus:border-yellow-400 placeholder:text-gray-400/80"
                        style={{ padding: "14px 20px", fontFamily: "var(--font-body)", lineHeight: "1.5" }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn-chalk w-full justify-center text-2.5xl sm:text-3xl font-extrabold cursor-pointer"
                      style={{ marginTop: "1rem", padding: "16px 24px", fontFamily: "var(--font-chalk)" }}
                    >
                      입장하기
                    </button>
                  </form>
                ) : (
                  /* 게임방 입장 후: 접속 뱃지 + 실시간 점수판 */
                  <div className="flex flex-col flex-1 gap-4">
                    {/* 접속 완료 뱃지 */}
                    <div
                      className="flex items-center justify-between rounded-xl bg-emerald-950/95 border-2 border-emerald-500/90 text-emerald-200 shadow-md"
                      style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "1.1rem", paddingBottom: "1.1rem" }}
                    >
                      <span className="font-black text-lg sm:text-xl text-yellow-300 flex items-center gap-2" style={{ fontFamily: "var(--font-chalk)" }}>
                        🪪 {myNickname}
                      </span>
                      <button
                        type="button" onClick={handleLeaveRoom}
                        className="bg-rose-900/90 hover:bg-rose-800 text-rose-200 font-extrabold text-sm sm:text-base rounded-md border border-rose-600/80 cursor-pointer shadow flex-shrink-0"
                        style={{ paddingLeft: "1.1rem", paddingRight: "1.1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
                      >
                        퇴장
                      </button>
                    </div>

                    {/* 실시간 점수판 (입장 후 좌측 패널로 이동) */}
                    <div
                      className="flex-1 rounded-xl border-2 border-dashed border-teal-600/80 bg-teal-900/40"
                      style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "1rem", paddingBottom: "1rem" }}
                    >
                      <ScoreBoard maxH="calc(100% - 60px)" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── 딜러 모드 대기 정보 ── */
              <div className="flex flex-col justify-between flex-1 gap-4 text-sm text-gray-200 leading-relaxed py-1" style={{ fontFamily: "var(--font-body)" }}>
                <div className="flex flex-col gap-4">
                  <p className="leading-loose text-base sm:text-lg">
                    딜러 모드에서는 라운드 수, 제한 시간, 오답 패널티를 설정하여 방을 생성할 수 있습니다.
                  </p>
                  <div
                    className="w-full rounded-xl shadow-lg border-2 border-dashed border-yellow-400/90 bg-teal-900/95"
                    style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "1.25rem", paddingBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
                  >
                    <div className="flex items-start gap-3 text-yellow-300 text-base sm:text-lg font-medium" style={{ lineHeight: "1.5", wordBreak: "break-all" }}>
                      <Megaphone size={20} className="flex-shrink-0 text-yellow-400 mt-0.5" />
                      <span>생성된 방 코드를 플레이어들에게 공유하세요.</span>
                    </div>
                  </div>
                </div>

                {inGameRoom && isDealerHost ? (
                  <div
                    className="flex items-center justify-between rounded-xl bg-amber-950/95 border-2 border-amber-500/90 text-amber-200 shadow-md"
                    style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "1.1rem", paddingBottom: "1.1rem" }}
                  >
                    <span className="font-black text-lg sm:text-xl text-yellow-300 flex items-center gap-2" style={{ fontFamily: "var(--font-chalk)" }}>
                      👑 딜러 방 [{activeRoomCode}] 운영 중
                    </span>
                    <button
                      type="button" onClick={handleLeaveRoom}
                      className="bg-rose-900/90 hover:bg-rose-800 text-rose-200 font-extrabold text-sm sm:text-base rounded-md border border-rose-600/80 cursor-pointer shadow flex-shrink-0"
                      style={{ paddingLeft: "1.1rem", paddingRight: "1.1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
                    >
                      퇴장
                    </button>
                  </div>
                ) : (
                  <div className="invisible flex items-center justify-between rounded-xl" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "1.1rem", paddingBottom: "1.1rem" }}>
                    <span className="font-black text-lg sm:text-xl" style={{ fontFamily: "var(--font-chalk)" }}>👑 딜러 방 [000000] 운영 중</span>
                    <button type="button" className="text-sm sm:text-base rounded-md" style={{ paddingLeft: "1.1rem", paddingRight: "1.1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}>퇴장</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ════════════════════ [중앙 박스] ════════════════════ */}
          <div className="xl:col-span-6 chalk-box content-box flex flex-col bg-teal-950/85 backdrop-blur-md h-full p-4 sm:p-5 gap-4">
            {mode === "player" ? (
              /* ── 플레이어 모드 가운데 UI ── */
              <div className="flex flex-col gap-4 w-full h-full">
                {/* 방 접속 중 상태 바 */}
                {inGameRoom && (
                  <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-3 flex-wrap">
                      {[
                        { label: "라운드", value: `${currentRound} / ${selectedRound}`, urgent: false },
                        { label: "남은 시간", value: !isGameStarted ? `${formatTime(roomTimerSeconds)} (대기 중)` : formatTime(roomTimerSeconds), urgent: roomTimerSeconds <= 30 && isGameStarted },
                        { label: "오답 패널티", value: selectedPenalty, urgent: false },
                      ].map(({ label, value, urgent }) => (
                        <div
                          key={label}
                          className={`border-2 border-dashed rounded-xl flex items-center gap-2 shadow-md ${urgent ? "border-rose-500/90 bg-rose-950/80" : "border-teal-500/80 bg-teal-900/90"}`}
                          style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.6rem", paddingBottom: "0.6rem" }}
                        >
                          {label === "남은 시간" && <Clock size={18} className={urgent ? "text-rose-400 animate-spin" : "text-yellow-400"} />}
                          <span className={`font-extrabold text-sm sm:text-base whitespace-nowrap ${urgent ? "text-rose-300 animate-pulse" : "text-yellow-300"}`} style={{ fontFamily: "var(--font-chalk)" }}>
                            {label}: <span className="text-white ml-1">{value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button" onClick={handleLeaveRoom}
                      className="flex items-center justify-center gap-2 bg-rose-900/90 hover:bg-rose-800 text-rose-100 rounded-xl text-sm sm:text-base font-extrabold border-2 border-rose-600/90 cursor-pointer shadow-lg transition-all"
                      style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.65rem", paddingBottom: "0.65rem", fontFamily: "var(--font-chalk)" }}
                    >
                      <LogOut size={18} className="flex-shrink-0" />
                      <span className="whitespace-nowrap">퇴장</span>
                    </button>
                  </div>
                )}

                {/* 피라미드 보드 영역 */}
                {!inGameRoom ? (
                  /* 연습 모드: 피라미드 + 정답 확인 버튼 */
                  <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 mb-1">
                    <div className="flex flex-col items-center justify-center flex-shrink-0 py-2 mx-auto xl:mx-0">
                      {currentPyramidData.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center gap-2 sm:gap-2.5" style={{ marginTop: rowIndex === 0 ? "0px" : "-10px" }}>
                          {row.map((node) => (
                            <HexagonCell key={node.id} node={node} isSelected={selectedNodes.includes(node.id)} onClick={() => handleNodeClick(node.id)} />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* 우측: 연습 설명 & 정답 확인 (overflow 방지: relative→static, 박스 안에서 스크롤) */}
                    <div className="flex-1 w-full flex flex-col items-center xl:items-stretch gap-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base xl:text-lg text-gray-200 font-semibold justify-center xl:justify-start" style={{ fontFamily: "var(--font-chalk)" }}>
                        <Pencil size={18} className="text-yellow-400 flex-shrink-0" />
                        <span>게임 시작을 기다리는 동안 연습해 보세요.</span>
                      </div>

                      {/* 정답 확인 버튼 */}
                      <button
                        type="button"
                        onClick={() => setShowSolutions(!showSolutions)}
                        className="w-full flex items-center justify-center gap-3 rounded-full bg-teal-900/90 hover:bg-teal-800 border-2 border-dashed border-yellow-400/80 text-yellow-300 text-base sm:text-lg font-bold transition-all cursor-pointer shadow-md"
                        style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.75rem", paddingBottom: "0.75rem", fontFamily: "var(--font-chalk)" }}
                      >
                        <Sparkles size={18} className="text-yellow-400 animate-pulse" />
                        <span>정답 확인 ({validSolutions.length}개 조합)</span>
                        {showSolutions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {/* 정답 목록: 버튼 바로 아래 인라인(non-absolute)으로 배치 → 초록 점선 안에서 표시 */}
                      {showSolutions && (
                        <div
                          className="w-full bg-teal-900/98 rounded-xl border-2 border-dashed border-yellow-400/90 shadow-xl flex flex-col backdrop-blur-md overflow-hidden max-h-[260px] overflow-y-auto"
                          style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.55rem", paddingBottom: "0.55rem", gap: "0.35rem" }}
                        >
                          {validSolutions.slice(0, 8).map((sol, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => { setSelectedNodes(sol.nodes); setTempNotice(null); }}
                              className="w-full flex items-center justify-between rounded-lg bg-teal-950/95 hover:bg-yellow-400 hover:text-teal-950 text-white transition-all border border-teal-700/80 cursor-pointer shadow-sm group"
                              style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.4rem", paddingBottom: "0.4rem", fontFamily: "var(--font-chalk)" }}
                            >
                              <span className="text-lg sm:text-xl font-black text-yellow-300 group-hover:text-teal-950 tracking-widest">{sol.nodes.join(" ")}</span>
                              <span className="text-sm sm:text-base text-teal-200 group-hover:text-teal-950 font-extrabold tracking-wide">{sol.formulaStr}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* 방 입장 후: 피라미드 + 이미 제출된 정답 */
                  <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 mb-1">
                    <div className="flex flex-col items-center justify-center flex-shrink-0 py-2 mx-auto xl:mx-0">
                      {currentPyramidData.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center gap-2 sm:gap-2.5" style={{ marginTop: rowIndex === 0 ? "0px" : "-10px" }}>
                          {row.map((node) => (
                            // 플레이어 대기 중에는 피라미드 칸 연산 기호를 ? 로 마스킹
                            <HexagonCell key={node.id} node={node} isSelected={selectedNodes.includes(node.id)} onClick={() => handleNodeClick(node.id)} masked={!isGameStarted} />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* 이미 제출된 정답 */}
                    <div className="relative flex-1 w-full flex flex-col items-stretch gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-yellow-300 font-extrabold text-xl" style={{ fontFamily: "var(--font-chalk)" }}>
                          <BookOpen size={20} className="text-yellow-400" />
                          <span>이미 제출된 정답</span>
                        </div>
                        <span className="text-xs sm:text-sm text-yellow-300 font-extrabold bg-teal-900 rounded-md border border-teal-700/80 shadow-sm" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.25rem", paddingBottom: "0.25rem" }}>
                          {submittedAnswersList.length}개
                        </span>
                      </div>
                      <div className="w-full border-t border-dashed border-teal-600/70" style={{ marginTop: "0.4rem", marginBottom: "0.5rem" }} />
                      <div
                        className="w-full bg-teal-900/98 rounded-xl border-2 border-dashed border-yellow-400/90 shadow-lg flex flex-col backdrop-blur-md overflow-y-auto min-h-[120px] max-h-[200px]"
                        style={{ paddingTop: "0.65rem", paddingBottom: "0.65rem", paddingLeft: "1.25rem", paddingRight: "1.25rem", gap: "0.4rem" }}
                      >
                        {submittedAnswersList.length > 0 ? (
                          submittedAnswersList.map((sol, idx) => (
                            <div key={idx} className="w-full flex items-center justify-between rounded-lg bg-teal-950/95 text-white border border-teal-700/80 shadow-sm" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", paddingLeft: "1.25rem", paddingRight: "1.25rem", fontFamily: "var(--font-chalk)" }}>
                              <span className="text-lg sm:text-xl font-black text-yellow-300 tracking-widest">{sol.nodes}</span>
                              <span className="text-sm sm:text-base text-teal-200 font-extrabold tracking-wide">{sol.formula}</span>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-gray-400 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                            {isGameStarted ? "아직 제출된 정답이 없습니다." : "게임 시작을 기다리는 중입니다..."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="w-full border-t border-dashed border-teal-600/70" style={{ marginTop: "0.2rem", marginBottom: "0.4rem" }} />

                {/* 수식 제출 컨트롤 */}
                <div className="flex flex-col gap-4 w-full">
                  <div
                    className={`w-full rounded-md border border-dashed transition-all duration-200 flex items-center justify-between min-h-[58px] h-[58px] ${
                      tempNotice
                        ? tempNotice.type === "success" ? "bg-emerald-950/90 border-emerald-500 text-emerald-200" : "bg-rose-950/90 border-rose-500 text-rose-200"
                        : "bg-teal-950 border-teal-600 text-yellow-300"
                    }`}
                    style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.6rem", paddingBottom: "0.6rem" }}
                  >
                    {tempNotice ? (
                      <div className={`flex items-center gap-3 w-full justify-center text-xl font-bold ${tempNotice.type === "success" ? "text-emerald-300" : "text-rose-300"}`}>
                        {tempNotice.type === "success" ? <CheckCircle2 size={22} className="text-emerald-400 flex-shrink-0 animate-bounce" /> : tempNotice.type === "error" ? <XCircle size={22} className="text-rose-400 flex-shrink-0 animate-bounce" /> : <AlertTriangle size={22} className="text-rose-400 flex-shrink-0 animate-bounce" />}
                        <span style={{ fontFamily: "var(--font-chalk)" }}>{tempNotice.msg}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="text-2xl text-teal-300 font-extrabold" style={{ fontFamily: "var(--font-chalk)" }}>선택한 수식:</span>
                        <span className="text-3xl font-black text-yellow-300 tracking-widest" style={{ fontFamily: "var(--font-chalk)" }}>{exprStr || "\u00A0"}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch gap-4">
                    <div className="chalk-box-straight bg-teal-950 flex flex-col items-center justify-center min-w-[130px] border-2 border-yellow-400/80 shadow-md p-3" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}>
                      <span className="text-lg text-yellow-400 font-extrabold tracking-widest mb-0.5" style={{ fontFamily: "var(--font-chalk)" }}>TARGET</span>
                      <span className="text-5xl text-white font-black" style={{ fontFamily: "var(--font-chalk)" }}>
                        {inGameRoom && !isGameStarted ? "?" : currentTargetNumber}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-between gap-2">
                      <div className="grid grid-cols-5 gap-2">
                        {/* 정답 입력용 버튼: A~J ID는 항상 표시 (게임 전 대기 중에도 클릭 가능해야 함) */}
                        {Object.values(currentAllNodes).map((node) => {
                          const isSel = selectedNodes.includes(node.id);
                          return (
                            <button
                              key={node.id} type="button" onClick={() => handleNodeClick(node.id)}
                              className={`py-2.5 px-2 rounded-md text-xl font-black transition-all ${isSel ? "bg-yellow-400 text-teal-950 scale-105 shadow-md" : "bg-teal-800/90 text-white hover:bg-teal-700"}`}
                              style={{ fontFamily: "var(--font-chalk)" }}
                            >
                              {node.id}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={penaltyLockSeconds > 0 || isRoundLocked}
                    onClick={handleSubmitAnswer}
                    className={`btn-chalk w-full justify-center py-3 text-2xl font-extrabold shadow-lg transition-all ${
                      penaltyLockSeconds > 0 || isRoundLocked
                        ? "bg-rose-950/90 border-2 border-rose-500/80 text-rose-300 opacity-90 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", fontFamily: "var(--font-chalk)", letterSpacing: penaltyLockSeconds > 0 ? "0.02em" : "0.35em" }}
                  >
                    {isRoundLocked ? (
                      <div className="flex items-center justify-center gap-2 py-0.5">
                        <Lock size={22} className="text-rose-400 flex-shrink-0" />
                        <span className="text-rose-200 text-base font-bold" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}>라운드 종료 - 입력 불가</span>
                      </div>
                    ) : penaltyLockSeconds > 0 ? (
                      <div className="flex items-center justify-center gap-2 py-0.5">
                        <Lock size={22} className="text-yellow-400 animate-pulse flex-shrink-0" />
                        <span className="text-rose-200 text-base font-bold" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}>{penaltyLockSeconds}초 동안 정답을 입력할 수 없습니다.</span>
                      </div>
                    ) : (
                      <span>제출하기</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* ── 딜러 모드 가운데 UI ── */
              <div className="relative flex flex-col gap-4 w-full">
                {/* 방 생성 전 안내 오버레이 */}
                {!inGameRoom && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-teal-950/85 rounded-2xl backdrop-blur-sm">
                    <div className="w-full flex items-center justify-center bg-teal-950/90 rounded-2xl border-2 border-dashed border-teal-500/90 shadow-md text-center" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.85rem", paddingBottom: "0.85rem" }}>
                      <div className="text-base sm:text-lg text-white font-medium flex items-center justify-center gap-3" style={{ fontFamily: "var(--font-chalk)" }}>
                        <Megaphone size={20} className="text-yellow-400 flex-shrink-0 animate-bounce" />
                        <span>우측 [입장 코드 생성하기]를 클릭하면 딜러 대시보드가 실시간으로 연결됩니다.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 딜러 대시보드 */}
                <div className={`flex flex-col gap-4 w-full${!inGameRoom ? " invisible" : ""}`}>
                  {/* 딜러 상태 바 */}
                  <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-3 flex-wrap">
                      {[
                        { label: "라운드", value: `${currentRound} / ${selectedRound}` },
                        { label: "남은 시간", value: !isGameStarted ? `${formatTime(roomTimerSeconds)} (대기 중)` : formatTime(roomTimerSeconds), urgent: roomTimerSeconds <= 30 && isGameStarted },
                        { label: "오답 패널티", value: selectedPenalty },
                      ].map(({ label, value, urgent = false }) => (
                        <div
                          key={label}
                          className={`border-2 border-dashed rounded-xl flex items-center gap-2 shadow-md ${urgent ? "border-rose-500/90 bg-rose-950/80" : "border-teal-500/80 bg-teal-900/90"}`}
                          style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.6rem", paddingBottom: "0.6rem" }}
                        >
                          {label === "남은 시간" && <Clock size={18} className={urgent ? "text-rose-400 animate-spin" : "text-yellow-400"} />}
                          <span className={`font-extrabold text-sm sm:text-base whitespace-nowrap ${urgent ? "text-rose-300 animate-pulse" : "text-yellow-300"}`} style={{ fontFamily: "var(--font-chalk)" }}>
                            {label}: <span className="text-white ml-1">{value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      {!isGameStarted && inGameRoom && (
                        <button
                          type="button" onClick={handleStartGame}
                          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-sm sm:text-base border-2 border-emerald-400 shadow-lg cursor-pointer animate-pulse transition-all"
                          style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.65rem", paddingBottom: "0.65rem", fontFamily: "var(--font-chalk)" }}
                        >
                          <Play size={18} className="fill-white flex-shrink-0" />
                          <span className="whitespace-nowrap">게임 시작하기 (랜덤 추첨)</span>
                        </button>
                      )}
                      {inGameRoom && (
                        <button
                          type="button" onClick={handleLeaveRoom}
                          className="flex items-center justify-center gap-2 bg-rose-900/90 hover:bg-rose-800 text-rose-100 rounded-xl text-sm sm:text-base font-extrabold border-2 border-rose-600/90 cursor-pointer shadow-lg transition-all"
                          style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.65rem", paddingBottom: "0.65rem", fontFamily: "var(--font-chalk)" }}
                        >
                          <LogOut size={18} className="flex-shrink-0" />
                          <span className="whitespace-nowrap">퇴장</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 피라미드 보드 (딜러) - 게임 시작 전 마스킹 */}
                  <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 mb-1">
                    <div className="flex flex-col items-center justify-center flex-shrink-0 py-2 mx-auto xl:mx-0">
                      {currentPyramidData.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center gap-2 sm:gap-2.5" style={{ marginTop: rowIndex === 0 ? "0px" : "-10px" }}>
                          {row.map((node) => (
                            <HexagonCell key={node.id} node={node} isSelected={false} masked={!isGameStarted && inGameRoom} />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* 제출된 정답 + 점수판 */}
                    <div className="relative flex-1 w-full flex flex-col items-stretch gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-yellow-300 font-extrabold text-xl" style={{ fontFamily: "var(--font-chalk)" }}>
                          <BookOpen size={20} className="text-yellow-400" />
                          <span>이미 제출된 정답</span>
                        </div>
                        <span className="text-xs sm:text-sm text-yellow-300 font-extrabold bg-teal-900 rounded-md border border-teal-700/80 shadow-sm" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.25rem", paddingBottom: "0.25rem" }}>
                          {submittedAnswersList.length}개
                        </span>
                      </div>
                      <div className="w-full border-t border-dashed border-teal-600/70" style={{ marginTop: "0.4rem", marginBottom: "0.5rem" }} />
                      <div
                        className="w-full bg-teal-900/98 rounded-xl border-2 border-dashed border-yellow-400/90 shadow-lg flex flex-col backdrop-blur-md overflow-y-auto min-h-[140px] max-h-[180px]"
                        style={{ paddingTop: "0.65rem", paddingBottom: "0.65rem", paddingLeft: "1.25rem", paddingRight: "1.25rem", gap: "0.4rem" }}
                      >
                        {submittedAnswersList.length > 0 ? (
                          submittedAnswersList.map((sol, idx) => (
                            <div key={idx} className="w-full flex items-center justify-between rounded-lg bg-teal-950/95 text-white border border-teal-700/80 shadow-sm" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", paddingLeft: "1.25rem", paddingRight: "1.25rem", fontFamily: "var(--font-chalk)" }}>
                              <span className="text-lg sm:text-xl font-black text-yellow-300 tracking-widest">{sol.nodes}</span>
                              <span className="text-sm sm:text-base text-teal-200 font-extrabold tracking-wide">{sol.formula}</span>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-gray-400 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                            {isGameStarted ? "아직 제출된 정답이 없습니다." : "게임이 시작되면 실시간 정답 제출 현황이 표시됩니다."}
                          </div>
                        )}
                      </div>

                      {/* 딜러 점수판 */}
                      <ScoreBoard maxH="140px" />
                    </div>
                  </div>

                  {/* 딜러 TARGET 표시 */}
                  <div className="flex items-center gap-4">
                    <div className="chalk-box-straight bg-teal-950 flex flex-col items-center justify-center min-w-[130px] border-2 border-yellow-400/80 shadow-md p-3" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}>
                      <span className="text-lg text-yellow-400 font-extrabold tracking-widest mb-0.5" style={{ fontFamily: "var(--font-chalk)" }}>TARGET</span>
                      <span className="text-5xl text-white font-black" style={{ fontFamily: "var(--font-chalk)" }}>
                        {isGameStarted ? currentTargetNumber : "?"}
                      </span>
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-2">
                      {Object.values(currentAllNodes).map((node) => (
                        <div
                          key={node.id}
                          className="py-2.5 px-2 rounded-md text-xl font-black bg-teal-800/90 text-white text-center"
                          style={{ fontFamily: "var(--font-chalk)" }}
                        >
                          {!isGameStarted && inGameRoom ? "?" : node.id}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════ [우측 박스] ════════════════════ */}
          <div className="xl:col-span-3 chalk-box content-box flex flex-col bg-teal-950/80 backdrop-blur-md h-full p-4 sm:p-5">
            {mode === "player" ? (
              <>
                <div className="flex items-center gap-3 w-full min-h-[44px]">
                  <HelpCircle className="text-yellow-400 flex-shrink-0" size={28} />
                  <h2 className="text-yellow-300 font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "2.5rem", lineHeight: 1.1 }}>게임 설명</h2>
                </div>
                <div className="w-full border-t border-dashed border-teal-700" style={{ marginTop: "1.1rem", marginBottom: "1.1rem" }} />
                <div className="flex flex-col gap-4 text-sm text-gray-200 leading-relaxed py-1" style={{ fontFamily: "var(--font-body)", wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                  {/* ① 게임 소개 */}
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 font-bold text-yellow-300 w-5">①</span>
                    <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                      <strong className="text-yellow-300 font-semibold">&lsquo;수식 피라미드&rsquo;</strong>는 문제 판에서 3개의 칸을 선택하여 타깃 넘버가 될 수 있도록 수식을 만드는 게임입니다.
                    </p>
                  </div>

                  {/* ② 문제판 설명 */}
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 font-bold text-yellow-300 w-5">②</span>
                    <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                      라운드가 시작되면 피라미드 모양의 문제판과 타깃 넘버가 공개됩니다. 문제판은 총 10개의 칸으로 이루어져 있으며, 각 칸에는 사칙연산 기호 중 하나와 숫자가 한 쌍을 이루고 있습니다.
                    </p>
                  </div>

                  {/* ③ 조합 규칙 (②와 ④ 사이로 이동) */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 font-bold text-yellow-300 w-5">③</span>
                      <p className="flex-1 leading-relaxed">문제판이 공개되면 이 중 3개의 칸을 조합해 타깃 넘버가 답이 되는 수식을 만들어야 합니다.</p>
                    </div>
                    <div className="w-full rounded-xl shadow-lg border-2 border-dashed border-yellow-400/90 bg-teal-900/95" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.8rem", paddingBottom: "0.8rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {[
                        "동일한 칸은 중복선택할 수 없습니다.",
                        "수식의 맨 앞에 사용된 칸의 연산 기호는 무시합니다.",
                        "완성된 수식은 사칙연산 순서에 따라 계산됩니다.",
                      ].map((rule) => (
                        <div key={rule} className="flex items-start gap-3 text-yellow-200 text-sm font-medium" style={{ lineHeight: "1.5", letterSpacing: "-0.015em" }}>
                          <AlertTriangle size={16} className="flex-shrink-0 text-yellow-400 mt-0.5" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ④ 점수 */}
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 font-bold text-yellow-300 w-5">④</span>
                    <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                      정답을 제출하면 1점을 획득하고, 오답을 제출하거나 이번 라운드에서 이미 제출된 정답을 다시 제출하는 경우 1점이 감점됩니다.
                    </p>
                  </div>

                  {/* ⑤ 종료 */}
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
                  <h2 className="text-yellow-300 font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "2.5rem", lineHeight: 1.1 }}>게임 생성</h2>
                </div>
                <div className="w-full border-t border-dashed border-teal-700" style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }} />

                <div className="flex flex-col py-0.5 gap-3">
                  {/* 라운드 설정 */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between w-full text-sm text-gray-200 font-medium" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}>
                      <span>라운드 설정</span>
                      <span className="text-yellow-300 font-bold">({selectedRound}라운드)</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((r) => (
                        <button key={r} type="button" onClick={() => setSelectedRound(r)}
                          className={`py-1 text-sm font-medium rounded-md transition-all ${selectedRound === r ? "bg-yellow-400 text-teal-950 shadow scale-105" : "bg-teal-900/90 text-gray-300 hover:bg-teal-800"}`}
                          style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                        >{r}R</button>
                      ))}
                    </div>
                  </div>

                  {/* 시간 설정 */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between w-full text-sm text-gray-200 font-medium" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}>
                      <span>라운드 별 시간</span>
                      <span className="text-yellow-300 font-bold">({selectedTime}분)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[3, 5, 7].map((t) => (
                        <button key={t} type="button" onClick={() => setSelectedTime(t)}
                          className={`py-1.5 text-sm font-medium rounded-md transition-all ${selectedTime === t ? "bg-yellow-400 text-teal-950 shadow scale-105" : "bg-teal-900/90 text-gray-300 hover:bg-teal-800"}`}
                          style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                        >{t}분</button>
                      ))}
                    </div>
                  </div>

                  {/* 페널티 설정 */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between w-full text-sm text-gray-200 font-medium" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}>
                      <span>오답 패널티</span>
                      <span className="text-yellow-300 font-bold">({selectedPenalty})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["없음", "1초", "2초", "3초", "4초", "5초"].map((p) => (
                        <button key={p} type="button" onClick={() => setSelectedPenalty(p)}
                          className={`py-1 text-sm font-medium rounded-md transition-all ${selectedPenalty === p ? "bg-yellow-400 text-teal-950 shadow scale-105" : "bg-teal-900/90 text-gray-300 hover:bg-teal-800"}`}
                          style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                        >{p}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2" style={{ marginTop: "1.5rem" }}>
                    <button
                      type="button" onClick={handleCreateGame}
                      className="btn-chalk w-full justify-center py-2 text-base sm:text-lg font-bold cursor-pointer"
                      style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                    >
                      입장 코드 생성하기
                    </button>

                    <div
                      className="chalk-box-straight bg-teal-950 flex items-center justify-center min-h-[56px] h-[56px] border-dashed border-teal-600 rounded-md"
                      style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.4rem", paddingBottom: "0.4rem" }}
                    >
                      {generatedRoomCode || activeRoomCode ? (
                        <div className="flex items-center gap-3">
                          <span className="text-2.5xl sm:text-3xl text-yellow-300 font-extrabold leading-none" style={{ fontFamily: "var(--font-chalk)", letterSpacing: "0.2em" }}>
                            {activeRoomCode || generatedRoomCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const code = activeRoomCode || generatedRoomCode;
                              if (code) { navigator.clipboard.writeText(code); alert(`입장 코드 [${code}] 가 복사되었습니다!`); }
                            }}
                            className="p-1 text-yellow-400 hover:text-yellow-200 transition-colors cursor-pointer hover:scale-110"
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
      </div>
    </div>
  );
}
