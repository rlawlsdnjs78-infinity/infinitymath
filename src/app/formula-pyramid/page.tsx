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

import { useState, useEffect, useRef } from "react";
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
  Lock,
  BookOpen,
  Play,
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

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [penaltyLockSeconds, setPenaltyLockSeconds] = useState<number>(0);

  useEffect(() => {
    if (penaltyLockSeconds <= 0) return;
    const timer = setInterval(() => {
      setPenaltyLockSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [penaltyLockSeconds]);

  const getPenaltySec = () => {
    if (!selectedPenalty || selectedPenalty === "없음") return 0;
    const parsed = parseInt(selectedPenalty.replace(/[^0-9]/g, ""), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleSubmitAnswer = () => {
    if (penaltyLockSeconds > 0) return;

    const penaltySec = getPenaltySec();

    if (selectedNodes.length !== 3) {
      if (penaltySec > 0) {
        setPenaltyLockSeconds(penaltySec);
        triggerNotice(`3개의 칸을 모두 선택해야 합니다! (${penaltySec}초 동안 정답을 입력할 수 없습니다.)`, "warning", penaltySec * 1000);
      } else {
        triggerNotice("3개의 칸을 모두 선택해야 합니다!", "warning", 1000);
      }
      setSelectedNodes([]);
      return;
    }

    const TARGET = 9;
    const nodesStr = selectedNodes.join(" ");

    // 플레이어가 제출한 수식이 이미 제출된 수식이라면 1점 감점 및 "이미 제출된 정답입니다!" 안내
    const isAlreadySubmitted = submittedAnswersList.some((a) => a.nodes === nodesStr);
    if (isAlreadySubmitted) {
      const nextScore = Math.max(0, myScore - 1);
      setMyScore(nextScore);
      setPlayers((prev) =>
        prev.map((p) => (p.name === myNickname ? { ...p, score: nextScore } : p))
      );

      if (penaltySec > 0) {
        setPenaltyLockSeconds(penaltySec);
        triggerNotice(`이미 제출된 정답입니다! (-1점) (${penaltySec}초 동안 정답을 입력할 수 없습니다.)`, "error", penaltySec * 1000);
      } else {
        triggerNotice("이미 제출된 정답입니다! (-1점)", "error", 1500);
      }

      if (inGameRoom && activeRoomCode && typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
          bc.postMessage({ type: "SCORE_UPDATE", playerName: myNickname, newScore: nextScore });
          bc.close();
        } catch (err) {}
      }
      setSelectedNodes([]);
      return;
    }

    if (currentResult === TARGET) {
      const nextScore = myScore + 1;
      setMyScore(nextScore);
      setPlayers((prev) =>
        prev.map((p) => (p.name === myNickname ? { ...p, score: nextScore } : p))
      );
      triggerNotice("정답입니다! (+1점)", "success", 1200);

      const nodesArr = selectedNodes.map((id) => ALL_NODES[id]);
      const formulaStr = `${nodesArr[0].num} ${nodesArr[1].op} ${nodesArr[1].num} ${nodesArr[2].op} ${nodesArr[2].num} = 9`;
      const ansObj = { nodes: nodesStr, formula: formulaStr };

      setSubmittedAnswersList((prev) => {
        if (prev.some((a) => a.nodes === ansObj.nodes)) return prev;
        return [...prev, ansObj];
      });

      if (inGameRoom && activeRoomCode && typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
          bc.postMessage({
            type: "SCORE_UPDATE",
            playerName: myNickname,
            newScore: nextScore,
            submittedAnswer: ansObj,
          });
          bc.close();
        } catch (err) {}
      }
    } else {
      const nextScore = Math.max(0, myScore - 1);
      setMyScore(nextScore);
      setPlayers((prev) =>
        prev.map((p) => (p.name === myNickname ? { ...p, score: nextScore } : p))
      );

      if (penaltySec > 0) {
        setPenaltyLockSeconds(penaltySec);
        triggerNotice(`오답입니다! (-1점) (${penaltySec}초 동안 정답을 입력할 수 없습니다.)`, "error", penaltySec * 1000);
      } else {
        triggerNotice("오답입니다! (-1점)", "error", 1200);
      }

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
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [players, setPlayers] = useState<{ name: string; score: number; isHost?: boolean }[]>([]);
  const [activityLogs, setActivityLogs] = useState<string[]>([]);
  const [submittedAnswersList, setSubmittedAnswersList] = useState<{ nodes: string; formula: string }[]>([]);
  const [roomTimerSeconds, setRoomTimerSeconds] = useState(180);
  const [roomEndTime, setRoomEndTime] = useState<number | null>(null);

  useEffect(() => {
    if (!inGameRoom) return;
    const interval = setInterval(() => {
      if (!isGameStarted) return;
      if (roomEndTime) {
        const rem = Math.max(0, Math.ceil((roomEndTime - Date.now()) / 1000));
        setRoomTimerSeconds(rem);
      } else {
        setRoomTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [inGameRoom, isGameStarted, roomEndTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 최신 방 상태값을 useRef로 관리하여 BroadcastChannel 수신 핸들러 내 무한 재구독 및 도배 방지
  const roomStateRef = useRef({
    myNickname,
    myScore,
    isDealerHost,
    selectedRound,
    selectedTime,
    selectedPenalty,
    isGameStarted,
    roomEndTime,
  });

  useEffect(() => {
    roomStateRef.current = {
      myNickname,
      myScore,
      isDealerHost,
      selectedRound,
      selectedTime,
      selectedPenalty,
      isGameStarted,
      roomEndTime,
    };
  });

  // BroadcastChannel 실시간 멀티플레이어 동기화 (방 생성/입장 시 1회 커넥션 수립)
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
            // 자기 자신이 보낸 JOIN 메시지는 무시
            if (data.player.name === curr.myNickname) return;

            setPlayers((prev) => {
              if (prev.some((p) => p.name === data.player.name)) return prev;
              return [...prev, data.player];
            });

            // 참가 안내 로그 중복 수신 방지
            setActivityLogs((prev) => {
              const logMsg = `[실시간] ${data.player.name} 님이 방에 참가하셨습니다.`;
              if (prev.includes(logMsg)) return prev;
              return [logMsg, ...prev];
            });

            // 방의 단하나의 타임스탬프(roomEndTime)를 localStorage 또는 ref에서 조회 (fallback 신규 생성 금지)
            let exactEndTime = curr.roomEndTime;
            if (!exactEndTime && typeof window !== "undefined") {
              try {
                const confStr = localStorage.getItem(`pyramid-room-config-${activeRoomCode}`);
                if (confStr) {
                  const conf = JSON.parse(confStr);
                  if (conf.roomEndTime) exactEndTime = conf.roomEndTime;
                }
              } catch (err) {}
            }

            // 기존 참가자(방장/딜러)가 새로 들어온 참가자에게 현재 방 설정 및 roomEndTime 전송
            bc?.postMessage({
              type: "SYNC_PRESENCE",
              player: { name: curr.myNickname, score: curr.myScore, isHost: curr.isDealerHost },
              roomConfig: {
                selectedRound: curr.selectedRound,
                selectedTime: curr.selectedTime,
                selectedPenalty: curr.selectedPenalty,
                isGameStarted: curr.isGameStarted,
                roomEndTime: exactEndTime,
              },
            });
          } else if (data.type === "SYNC_PRESENCE") {
            if (data.player.name === curr.myNickname) return;

            setPlayers((prev) => {
              if (prev.some((p) => p.name === data.player.name)) return prev;
              return [...prev, data.player];
            });

            if (data.roomConfig) {
              if (data.roomConfig.selectedRound) setSelectedRound(data.roomConfig.selectedRound);
              if (data.roomConfig.selectedTime) setSelectedTime(data.roomConfig.selectedTime);
              if (data.roomConfig.selectedPenalty) setSelectedPenalty(data.roomConfig.selectedPenalty);
              if (data.roomConfig.isGameStarted !== undefined) setIsGameStarted(data.roomConfig.isGameStarted);
              if (data.roomConfig.roomEndTime) {
                setRoomEndTime(data.roomConfig.roomEndTime);
                const rem = Math.max(0, Math.ceil((data.roomConfig.roomEndTime - Date.now()) / 1000));
                setRoomTimerSeconds(rem);
              }
            }
          } else if (data.type === "START_GAME") {
            setIsGameStarted(true);
            if (data.roomEndTime) {
              setRoomEndTime(data.roomEndTime);
              const rem = Math.max(0, Math.ceil((data.roomEndTime - Date.now()) / 1000));
              setRoomTimerSeconds(rem);
            }
            setActivityLogs((prev) => ["[실시간] 딜러가 게임을 시작했습니다!", ...prev]);
          } else if (data.type === "SCORE_UPDATE") {
            if (data.playerName === curr.myNickname) return;

            setPlayers((prev) =>
              prev.map((p) => (p.name === data.playerName ? { ...p, score: data.newScore } : p))
            );
            if (data.submittedAnswer) {
              setSubmittedAnswersList((prev) => {
                if (prev.some((a) => a.nodes === data.submittedAnswer.nodes)) return prev;
                return [...prev, data.submittedAnswer];
              });
            }
            setActivityLogs((prev) => [
              `[정답] ${data.playerName} 님이 정답 제출! (${data.submittedAnswer?.nodes || ""} -> ${data.newScore}점)`,
              ...prev,
            ]);
          } else if (data.type === "LEAVE") {
            if (data.playerName === curr.myNickname) return;

            setPlayers((prev) => {
              const updated = prev.filter((p) => p.name !== data.playerName);
              // 방에 접속자가 0명이 되면 방 설정 초기화
              if (updated.length === 0 && activeRoomCode) {
                if (typeof window !== "undefined") {
                  try {
                    localStorage.removeItem(`pyramid-room-config-${activeRoomCode}`);
                  } catch (e) {}
                }
              }
              return updated;
            });

            setActivityLogs((prev) => [
              `[실시간] ${data.playerName} 님이 방을 나갔습니다.`,
              ...prev,
            ]);
          }
        };

        // 방 입장 시 1회에 한해 JOIN 방송
        bc.postMessage({
          type: "JOIN",
          player: { name: myNickname, score: myScore, isHost: isDealerHost },
        });
      } catch (e) {}
    }

    return () => {
      if (bc) bc.close();
    };
  }, [inGameRoom, activeRoomCode]);

  // 탭/창 종료 시 퇴장 메시지 발송 및 방 비어짐 감지
  useEffect(() => {
    if (!inGameRoom || !activeRoomCode) return;

    const handleUnload = () => {
      try {
        const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
        bc.postMessage({ type: "LEAVE", playerName: myNickname, isHost: isDealerHost });
        bc.close();
      } catch (e) {}
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [inGameRoom, activeRoomCode, myNickname, isDealerHost]);

  const handleLeaveRoom = () => {
    if (inGameRoom && activeRoomCode && typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
        bc.postMessage({ type: "LEAVE", playerName: myNickname, isHost: isDealerHost });
        bc.close();
      } catch (err) {}
    }

    const remainingPlayers = players.filter((p) => p.name !== myNickname);
    // 방에 실시간으로 접속한 사람이 아무도 없게 되면 방 설정 초기화!
    if (remainingPlayers.length === 0 && activeRoomCode) {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(`pyramid-room-config-${activeRoomCode}`);
        } catch (e) {}
      }
      setSelectedRound(1);
      setSelectedTime(3);
      setSelectedPenalty("없음");
      setRoomTimerSeconds(180);
      setRoomEndTime(null);
    }

    setInGameRoom(false);
    setActiveRoomCode("");
    setPlayers([]);
    setActivityLogs([]);
    setSubmittedAnswersList([]);
  };

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

    // 입장하려는 방의 설정(라운드, 제한시간, 오답패널티, roomEndTime)을 localStorage 및 로컬 상태로 동기화
    if (typeof window !== "undefined") {
      try {
        const savedConfigStr = localStorage.getItem(`pyramid-room-config-${cleanCode}`);
        if (savedConfigStr) {
          const savedConfig = JSON.parse(savedConfigStr);
          if (savedConfig.selectedRound) setSelectedRound(savedConfig.selectedRound);
          if (savedConfig.selectedTime) setSelectedTime(savedConfig.selectedTime);
          if (savedConfig.selectedPenalty) setSelectedPenalty(savedConfig.selectedPenalty);
          if (savedConfig.isGameStarted !== undefined) setIsGameStarted(savedConfig.isGameStarted);
          if (savedConfig.roomEndTime) {
            setRoomEndTime(savedConfig.roomEndTime);
            const rem = Math.max(0, Math.ceil((savedConfig.roomEndTime - Date.now()) / 1000));
            setRoomTimerSeconds(rem);
          } else {
            setRoomTimerSeconds(savedConfig.selectedTime ? savedConfig.selectedTime * 60 : 180);
          }
        }
      } catch (err) {}
    }

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

    const currentRoomConfig = {
      selectedRound,
      selectedTime,
      selectedPenalty,
      isGameStarted: false,
      roomEndTime: null,
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`pyramid-room-config-${code}`, JSON.stringify(currentRoomConfig));
      } catch (err) {}
    }

    setRoomEndTime(null);
    setIsGameStarted(false);
    setRoomTimerSeconds(selectedTime * 60);
    setGeneratedRoomCode(code);
    setActiveRoomCode(code);
    setMyNickname("딜러(선생님)");
    setMyScore(0);
    setIsDealerHost(true);
    setInGameRoom(true);

    const host = { name: "딜러(선생님)", score: 0, isHost: true };
    setPlayers([host]);
    setActivityLogs([`[안내] 딜러 방 [${code}] 가 생성되었습니다. 플레이어가 입장하면 [게임 시작하기]를 눌러주세요.`]);

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel(`pyramid-room-${code}`);
        bc.postMessage({ type: "JOIN", player: host, roomConfig: currentRoomConfig });
        bc.close();
      } catch (err) {}
    }
  };

  const handleStartGame = () => {
    if (!activeRoomCode) return;
    const calculatedEndTime = Date.now() + selectedTime * 60 * 1000;
    setRoomEndTime(calculatedEndTime);
    setIsGameStarted(true);

    const currentRoomConfig = {
      selectedRound,
      selectedTime,
      selectedPenalty,
      isGameStarted: true,
      roomEndTime: calculatedEndTime,
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`pyramid-room-config-${activeRoomCode}`, JSON.stringify(currentRoomConfig));
      } catch (err) {}
    }

    setActivityLogs((prev) => ["[실시간] 딜러가 게임을 시작했습니다!", ...prev]);

    if (inGameRoom && activeRoomCode && typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
        bc.postMessage({
          type: "START_GAME",
          roomEndTime: calculatedEndTime,
        });
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

        <div
          className="w-full border-t-2 border-dashed border-teal-700/80"
          style={{ marginTop: "0.25rem", marginBottom: "1rem" }}
        />

        {/* ───────────────────────────────────────────────────────────────────
           [하단 3분할 박스 영역]
           ─────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* ── [좌측 박스] xl:col-span-3 ─────────────────────────────────── */}
          <div className="xl:col-span-3 chalk-box content-box flex flex-col bg-teal-950/80 backdrop-blur-md h-full min-h-0 p-4 sm:p-5">
            {/* 카드 헤더 */}
            <div className="flex items-center gap-3 w-full min-h-[44px]">
              <LogIn className="text-yellow-400 flex-shrink-0" size={28} />
              <h2
                className="text-yellow-300 font-bold"
                style={{ fontFamily: "var(--font-chalk)", fontSize: "2.5rem", lineHeight: 1.1 }}
              >
                게임 입장하기
              </h2>
            </div>
            {/* 녹색 점선 구분선 */}
            <div
              className="w-full border-t border-dashed border-teal-600/70"
              style={{ marginTop: "0.5rem", marginBottom: "0.85rem" }}
            />

            {/* [플레이어 모드 / 딜러 모드] 탭 선택 버튼 */}
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
              /* 플레이어 모드 입장 양식 */
              <form onSubmit={handleJoinGameRoom} className="flex flex-col py-1 gap-5">
                <div className="flex flex-col gap-2">
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

                <div className="flex flex-col gap-2">
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

                <button
                  type="submit"
                  className="btn-chalk w-full justify-center text-2.5xl sm:text-3xl font-extrabold cursor-pointer"
                  style={{ marginTop: "1rem", padding: "16px 24px", fontFamily: "var(--font-chalk)" }}
                >
                  입장하기
                </button>

                {inGameRoom && !isDealerHost && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 text-xs sm:text-sm font-bold mt-1">
                    <span>🟢 [{activeRoomCode}] 접속 완료 ({myNickname})</span>
                    <button
                      type="button"
                      onClick={handleLeaveRoom}
                      className="text-rose-400 hover:text-rose-200 underline font-extrabold cursor-pointer ml-2"
                    >
                      퇴장
                    </button>
                  </div>
                )}
              </form>
            ) : (
              /* 딜러 모드 대기 정보 */
              <div className="flex flex-col gap-4 text-sm text-gray-200 leading-relaxed py-1" style={{ fontFamily: "var(--font-body)" }}>
                <p className="leading-loose text-base sm:text-lg">
                  딜러 모드에서는 라운드 수, 제한 시간, 오답 패널티를 설정하여 방을 생성할 수 있습니다.
                </p>
                <div
                  className="w-full rounded-xl shadow-lg border-2 border-dashed border-yellow-400/90 bg-teal-900/95"
                  style={{
                    padding: "0.8rem 1.25rem",
                    marginTop: "0.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    className="flex items-start gap-3 text-yellow-300 text-base sm:text-lg font-medium"
                    style={{ lineHeight: "1.5", wordBreak: "break-all", letterSpacing: "-0.015em" }}
                  >
                    <Megaphone size={18} className="flex-shrink-0 text-yellow-400 mt-0.5" />
                    <span style={{ wordBreak: "break-all" }}>생성된 방 코드를 플레이어들에게 공유하세요.</span>
                  </div>
                </div>

                {inGameRoom && isDealerHost && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-950/90 border border-amber-500/80 text-amber-300 text-xs sm:text-sm font-bold mt-1">
                    <span>👑 딜러 방 [{activeRoomCode}] 운영 중</span>
                    <button
                      type="button"
                      onClick={handleLeaveRoom}
                      className="text-rose-400 hover:text-rose-200 underline font-extrabold cursor-pointer ml-2"
                    >
                      퇴장
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── [중앙 박스] xl:col-span-6 ─────────────────────────────────── */}
          <div className="xl:col-span-6 chalk-box content-box flex flex-col bg-teal-950/85 backdrop-blur-md h-full min-h-0 p-4 sm:p-5 gap-4">
            {mode === "player" ? (
              /* =================================================================== */
              /* 🎮 [플레이어 모드 전용 가운데 UI] - 딜러 모드 변경 시 영향 받지 않음 */
              /* =================================================================== */
              <div className="flex flex-col gap-4 w-full h-full">
                {/* 상단 딜러/게임 상태 바 (방 접속 시 노출) */}
                {inGameRoom && (
                  <div
                    className="chalk-box-straight bg-teal-900/90 flex flex-wrap items-center justify-between gap-3 border border-yellow-400/80 shadow-md rounded-xl"
                    style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-yellow-300 font-extrabold text-sm sm:text-base" style={{ fontFamily: "var(--font-chalk)" }}>
                        라운드: <span className="text-white">{currentRound} / {selectedRound}</span>
                      </span>
                      <span className="text-teal-600">|</span>
                      <span className={`font-extrabold text-sm sm:text-base flex items-center gap-1.5 ${roomTimerSeconds <= 30 && isGameStarted ? "text-rose-300 animate-pulse" : "text-yellow-300"}`} style={{ fontFamily: "var(--font-chalk)" }}>
                        <Clock size={16} className={roomTimerSeconds <= 30 && isGameStarted ? "text-rose-400 animate-spin" : "text-yellow-400"} />
                        남은 시간: <span className="text-white ml-0.5">{!isGameStarted ? `${formatTime(roomTimerSeconds)} (대기 중)` : formatTime(roomTimerSeconds)}</span>
                      </span>
                      <span className="text-teal-600">|</span>
                      <span className="text-yellow-300 font-extrabold text-sm sm:text-base" style={{ fontFamily: "var(--font-chalk)" }}>
                        오답 페널티: <span className="text-white">{selectedPenalty}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleLeaveRoom}
                      className="flex items-center gap-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-md text-xs sm:text-sm font-bold border border-rose-600/60 cursor-pointer px-3 py-2"
                    >
                      <LogOut size={16} />
                      <span>퇴장</span>
                    </button>
                  </div>
                )}

                {/* 대칭 수식 피라미드 보드 및 우측 연습/모니터 영역 */}
                {!inGameRoom ? (
                  /* [플레이어 대기/연습용 상단]: 피라미드 + 연습 문구 & 정답 확인 버튼 */
                  <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 mb-1">
                    {/* 피라미드 보드 */}
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

                    {/* 우측: 연습 설명글 & 정답확인 버튼 & absolute 펼침 창 */}
                    <div className="relative flex-1 w-full flex flex-col items-center xl:items-stretch gap-4">
                      <div
                        className="flex items-center gap-2 text-xs sm:text-sm md:text-base xl:text-lg text-gray-200 font-semibold justify-center xl:justify-start whitespace-nowrap"
                        style={{ fontFamily: "var(--font-chalk)", wordBreak: "keep-all" }}
                      >
                        <Pencil size={18} className="text-yellow-400 flex-shrink-0" />
                        <span className="whitespace-nowrap">게임 시작을 기다리는 동안 연습해 보세요.</span>
                      </div>

                      {/* '정답 확인' 버튼 */}
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

                      {/* 예시 정답 펼침 목록 */}
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
                              <span className="text-lg sm:text-xl font-black text-yellow-300 group-hover:text-teal-950 tracking-widest">
                                {sol.nodes.join(" ")}
                              </span>
                              <span className="text-sm sm:text-base text-teal-200 group-hover:text-teal-950 font-extrabold tracking-wide">
                                {sol.formulaStr.split(" ( ")[1]?.replace(" )", "")}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* [플레이어 실시간 방 접속 중 상단]: 피라미드 + 이미 제출된 정답 + 실시간 점수판 */
                  <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 mb-1">
                    {/* 피라미드 보드 */}
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

                    {/* 우측 모니터 영역: 이미 제출된 정답 + 실시간 점수판 */}
                    <div className="relative flex-1 w-full flex flex-col items-stretch gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-yellow-300 font-extrabold text-xl" style={{ fontFamily: "var(--font-chalk)" }}>
                          <BookOpen size={20} className="text-yellow-400" />
                          <span>이미 제출된 정답</span>
                        </div>
                        <span
                          className="text-xs sm:text-sm text-yellow-300 font-extrabold bg-teal-900 rounded-md border border-teal-700/80 shadow-sm px-4 py-1"
                          style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}
                        >
                          {submittedAnswersList.length}개
                        </span>
                      </div>
                      <div className="w-full border-t border-dashed border-teal-600/70" style={{ marginTop: "0.4rem", marginBottom: "0.5rem" }} />

                      <div
                        className="w-full bg-teal-900/98 rounded-xl border-2 border-dashed border-yellow-400/90 shadow-lg flex flex-col backdrop-blur-md overflow-hidden min-h-[120px] max-h-[150px] overflow-y-auto"
                        style={{
                          paddingTop: "0.65rem",
                          paddingBottom: "0.65rem",
                          paddingLeft: "1.25rem",
                          paddingRight: "1.25rem",
                          gap: "0.4rem",
                        }}
                      >
                        {submittedAnswersList.length > 0 ? (
                          submittedAnswersList.map((sol, idx) => (
                            <div
                              key={idx}
                              className="w-full flex items-center justify-between rounded-lg bg-teal-950/95 text-white transition-all border border-teal-700/80 shadow-sm"
                              style={{
                                paddingTop: "0.5rem",
                                paddingBottom: "0.5rem",
                                paddingLeft: "1.25rem",
                                paddingRight: "1.25rem",
                                fontFamily: "var(--font-chalk)",
                              }}
                            >
                              <span className="text-lg sm:text-xl font-black text-yellow-300 tracking-widest">
                                {sol.nodes}
                              </span>
                              <span className="text-sm sm:text-base text-teal-200 font-extrabold tracking-wide">
                                {sol.formula}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-gray-400 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                            아직 제출된 정답이 없습니다.
                          </div>
                        )}
                      </div>

                      {/* 실시간 점수판 */}
                      <div className="flex flex-col gap-2 mt-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-yellow-300 font-extrabold text-lg" style={{ fontFamily: "var(--font-chalk)" }}>
                            <Trophy size={18} className="text-yellow-400" />
                            <span>실시간 점수판</span>
                          </div>
                          <span className="text-xs text-gray-300 font-medium">
                            ({players.filter((p) => !p.isHost).length}명 접속 중)
                          </span>
                        </div>
                        <div className="w-full border-t border-dashed border-teal-600/70" style={{ marginTop: "0.2rem", marginBottom: "0.3rem" }} />

                        <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1">
                          {players.filter((p) => !p.isHost).length > 0 ? (
                            players
                              .filter((p) => !p.isHost)
                              .slice()
                              .sort((a, b) => b.score - a.score)
                              .map((p, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center justify-between rounded-lg border transition-all px-4 py-2 ${
                                    p.name === myNickname
                                      ? "bg-yellow-400/20 border-yellow-400 text-yellow-200 shadow-md"
                                      : "bg-teal-900/70 border-teal-700/80 text-gray-200"
                                  }`}
                                  style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-sm text-yellow-400 w-4 flex-shrink-0 flex items-center justify-center">
                                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                                    </span>
                                    <span className="font-bold text-xs sm:text-sm" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}>
                                      {p.name}
                                    </span>
                                  </div>
                                  <span className="font-extrabold text-base text-yellow-300 flex-shrink-0" style={{ fontFamily: "var(--font-chalk)" }}>
                                    {p.score}점
                                  </span>
                                </div>
                              ))
                          ) : (
                            <div className="py-3 text-center text-gray-400 text-xs font-medium" style={{ fontFamily: "var(--font-body)" }}>
                              플레이어 참가 대기 중...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 중간 점선 구분선 */}
                <div className="w-full border-t border-dashed border-teal-600/70" style={{ marginTop: "0.2rem", marginBottom: "0.4rem" }} />

                {/* 하단 수식 제출 컨트롤 */}
                <div className="flex flex-col gap-4 w-full">
                  <div
                    className={`w-full rounded-md border border-dashed transition-all duration-200 flex items-center justify-between min-h-[58px] h-[58px] ${
                      tempNotice
                        ? tempNotice.type === "success"
                          ? "bg-emerald-950/90 border-emerald-500 text-emerald-200"
                          : "bg-rose-950/90 border-rose-500 text-rose-200"
                        : "bg-teal-950 border-teal-600 text-yellow-300"
                    }`}
                    style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.6rem", paddingBottom: "0.6rem" }}
                  >
                    {tempNotice ? (
                      <div className={`flex items-center gap-3 w-full justify-center text-xl font-bold ${tempNotice.type === "success" ? "text-emerald-300" : "text-rose-300"}`}>
                        {tempNotice.type === "success" ? (
                          <CheckCircle2 size={22} className="text-emerald-400 flex-shrink-0 animate-bounce" />
                        ) : tempNotice.type === "error" ? (
                          <XCircle size={22} className="text-rose-400 flex-shrink-0 animate-bounce" />
                        ) : (
                          <AlertTriangle size={22} className="text-rose-400 flex-shrink-0 animate-bounce" />
                        )}
                        <span style={{ fontFamily: "var(--font-chalk)" }}>{tempNotice.msg}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="text-2xl text-teal-300 font-extrabold" style={{ fontFamily: "var(--font-chalk)" }}>
                          선택한 수식:
                        </span>
                        <span className="text-3xl font-black text-yellow-300 tracking-widest flex items-center" style={{ fontFamily: "var(--font-chalk)" }}>
                          {exprStr || "\u00A0"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch gap-4">
                    <div
                      className="chalk-box-straight bg-teal-950 flex flex-col items-center justify-center min-w-[130px] border-2 border-yellow-400/80 shadow-md p-3"
                      style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}
                    >
                      <span className="text-lg text-yellow-400 font-extrabold tracking-widest mb-0.5" style={{ fontFamily: "var(--font-chalk)" }}>
                        TARGET
                      </span>
                      <span className="text-5xl text-white font-black" style={{ fontFamily: "var(--font-chalk)" }}>
                        9
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between gap-2">
                      <div className="grid grid-cols-5 gap-2">
                        {Object.values(ALL_NODES).map((node) => {
                          const isSel = selectedNodes.includes(node.id);
                          return (
                            <button
                              key={node.id}
                              type="button"
                              onClick={() => handleNodeClick(node.id)}
                              className={`py-2.5 px-2 rounded-md text-xl font-black transition-all ${
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

                  <button
                    type="button"
                    disabled={penaltyLockSeconds > 0}
                    onClick={handleSubmitAnswer}
                    className={`btn-chalk w-full justify-center py-3 text-2xl font-extrabold shadow-lg transition-all ${
                      penaltyLockSeconds > 0
                        ? "bg-rose-950/90 border-2 border-rose-500/80 text-rose-300 opacity-90 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    style={{ fontFamily: "var(--font-chalk)", letterSpacing: penaltyLockSeconds > 0 ? "0.02em" : "0.35em" }}
                  >
                    {penaltyLockSeconds > 0 ? (
                      <div className="flex items-center justify-center gap-2 py-0.5">
                        <Lock size={22} className="text-yellow-400 animate-pulse flex-shrink-0" />
                        <span className="text-rose-200 text-base font-bold" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}>
                          {penaltyLockSeconds}초 동안 정답을 입력할 수 없습니다.
                        </span>
                      </div>
                    ) : (
                      <span>제출하기</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* =================================================================== */
              /* 👑 [딜러 모드 전용 가운데 UI] - 플레이어 모드 변경 시 영향 받지 않음  */
              /* =================================================================== */
              <div className="flex flex-col gap-4 w-full h-full">
                {/* 1. [요구사항 1] 입장 코드 생성 전 (대기 상태) 최상단 안내창 배치 및 글씨 크기 확대 */}
                {!inGameRoom ? (
                  <div
                    className="w-full flex items-center justify-center p-4 bg-teal-900/95 rounded-xl border-2 border-dashed border-yellow-400/90 shadow-lg text-center"
                    style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}
                  >
                    <div
                      className="text-lg sm:text-xl text-yellow-300 font-extrabold flex items-center justify-center gap-3 py-1"
                      style={{ fontFamily: "var(--font-chalk)", wordBreak: "keep-all" }}
                    >
                      <Megaphone size={24} className="text-yellow-400 flex-shrink-0 animate-bounce" />
                      <span>우측 [입장 코드 생성하기]를 클릭하면 딜러 대시보드가 실시간으로 연결됩니다.</span>
                    </div>
                  </div>
                ) : (
                  /* 딜러 상태 컨트롤 바 (방 코드 생성 완료 시) */
                  <div
                    className="chalk-box-straight bg-teal-900/90 flex flex-wrap items-center justify-between gap-3 border border-yellow-400/80 shadow-md rounded-xl"
                    style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-yellow-300 font-extrabold text-sm sm:text-base" style={{ fontFamily: "var(--font-chalk)" }}>
                        라운드: <span className="text-white">{currentRound} / {selectedRound}</span>
                      </span>
                      <span className="text-teal-600">|</span>
                      <span className={`font-extrabold text-sm sm:text-base flex items-center gap-1.5 ${roomTimerSeconds <= 30 && isGameStarted ? "text-rose-300 animate-pulse" : "text-yellow-300"}`} style={{ fontFamily: "var(--font-chalk)" }}>
                        <Clock size={16} className={roomTimerSeconds <= 30 && isGameStarted ? "text-rose-400 animate-spin" : "text-yellow-400"} />
                        남은 시간: <span className="text-white ml-0.5">{!isGameStarted ? `${formatTime(roomTimerSeconds)} (대기 중)` : formatTime(roomTimerSeconds)}</span>
                      </span>
                      <span className="text-teal-600">|</span>
                      <span className="text-yellow-300 font-extrabold text-sm sm:text-base" style={{ fontFamily: "var(--font-chalk)" }}>
                        오답 페널티: <span className="text-white">{selectedPenalty}</span>
                      </span>
                    </div>

                    {/* 2. [요구사항 2] '게임 시작하기' 및 '퇴장' 버튼 내부 여백 1.25rem (20px / px-5) 100% 동일하게 통일 적용 */}
                    <div className="flex items-center gap-3">
                      {!isGameStarted && (
                        <button
                          type="button"
                          onClick={handleStartGame}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-md text-sm sm:text-base border border-emerald-400 shadow-md cursor-pointer animate-pulse"
                          style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.6rem", paddingBottom: "0.6rem" }}
                        >
                          <Play size={18} className="fill-white flex-shrink-0" />
                          <span>게임 시작하기</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleLeaveRoom}
                        className="flex items-center gap-2 bg-rose-900/90 hover:bg-rose-800 text-rose-200 rounded-md text-sm sm:text-base font-bold border border-rose-600/70 cursor-pointer shadow-md"
                        style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.6rem", paddingBottom: "0.6rem" }}
                      >
                        <LogOut size={18} />
                        <span>퇴장</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 대칭 피라미드 보드 & 이미 제출된 정답 + 실시간 점수판 모니터 */}
                <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 mb-1">
                  {/* 피라미드 보드 */}
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

                  {/* 우측 딜러 모니터 영역: 이미 제출된 정답 모니터 & 실시간 점수판 */}
                  <div className="relative flex-1 w-full flex flex-col items-stretch gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-yellow-300 font-extrabold text-xl" style={{ fontFamily: "var(--font-chalk)" }}>
                        <BookOpen size={20} className="text-yellow-400" />
                        <span>이미 제출된 정답</span>
                      </div>
                      <span
                        className="text-xs sm:text-sm text-yellow-300 font-extrabold bg-teal-900 rounded-md border border-teal-700/80 shadow-sm"
                        style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.25rem", paddingBottom: "0.25rem" }}
                      >
                        {submittedAnswersList.length}개
                      </span>
                    </div>
                    <div className="w-full border-t border-dashed border-teal-600/70" style={{ marginTop: "0.4rem", marginBottom: "0.5rem" }} />

                    <div
                      className="w-full bg-teal-900/98 rounded-xl border-2 border-dashed border-yellow-400/90 shadow-lg flex flex-col backdrop-blur-md overflow-hidden min-h-[140px] max-h-[180px] overflow-y-auto"
                      style={{
                        paddingTop: "0.65rem",
                        paddingBottom: "0.65rem",
                        paddingLeft: "1.25rem",
                        paddingRight: "1.25rem",
                        gap: "0.4rem",
                      }}
                    >
                      {submittedAnswersList.length > 0 ? (
                        submittedAnswersList.map((sol, idx) => (
                          <div
                            key={idx}
                            className="w-full flex items-center justify-between rounded-lg bg-teal-950/95 text-white transition-all border border-teal-700/80 shadow-sm"
                            style={{
                              paddingTop: "0.5rem",
                              paddingBottom: "0.5rem",
                              paddingLeft: "1.25rem",
                              paddingRight: "1.25rem",
                              fontFamily: "var(--font-chalk)",
                            }}
                          >
                            <span className="text-lg sm:text-xl font-black text-yellow-300 tracking-widest">
                              {sol.nodes}
                            </span>
                            <span className="text-sm sm:text-base text-teal-200 font-extrabold tracking-wide">
                              {sol.formula}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-gray-400 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                          {inGameRoom ? "아직 제출된 정답이 없습니다." : "입장 코드를 생성하면 실시간 정답 제출 현황이 표시됩니다."}
                        </div>
                      )}
                    </div>

                    {/* 딜러 실시간 점수판 모니터 */}
                    {inGameRoom && (
                      <div className="flex flex-col gap-2 mt-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-yellow-300 font-extrabold text-lg" style={{ fontFamily: "var(--font-chalk)" }}>
                            <Trophy size={18} className="text-yellow-400" />
                            <span>실시간 점수판</span>
                          </div>
                          <span className="text-xs text-gray-300 font-medium">
                            ({players.filter((p) => !p.isHost).length}명 접속 중)
                          </span>
                        </div>
                        <div className="w-full border-t border-dashed border-teal-600/70" style={{ marginTop: "0.2rem", marginBottom: "0.3rem" }} />

                        <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                          {players.filter((p) => !p.isHost).length > 0 ? (
                            players
                              .filter((p) => !p.isHost)
                              .slice()
                              .sort((a, b) => b.score - a.score)
                              .map((p, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between rounded-lg border transition-all bg-teal-900/70 border-teal-700/80 text-gray-200"
                                  style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-sm text-yellow-400 w-4 flex-shrink-0 flex items-center justify-center">
                                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                                    </span>
                                    <span className="font-bold text-xs sm:text-sm" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}>
                                      {p.name}
                                    </span>
                                  </div>
                                  <span className="font-extrabold text-base text-yellow-300 flex-shrink-0" style={{ fontFamily: "var(--font-chalk)" }}>
                                    {p.score}점
                                  </span>
                                </div>
                              ))
                          ) : (
                            <div className="py-3 text-center text-gray-400 text-xs font-medium" style={{ fontFamily: "var(--font-body)" }}>
                              플레이어 참가 대기 중...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 중간 점선 구분선 */}
                <div className="w-full border-t border-dashed border-teal-600/70" style={{ marginTop: "0.2rem", marginBottom: "0.4rem" }} />

                {/* 딜러 모드 하단 전용 안내 영역 */}
                {inGameRoom && (
                  <div className="flex items-center justify-center p-3.5 bg-teal-900/60 rounded-xl border border-teal-700/60 text-center">
                    <span className="text-sm text-yellow-300 font-extrabold" style={{ fontFamily: "var(--font-chalk)" }}>
                      📢 딜러 화면입니다. 상단 실시간 점수판 및 정답 현황을 실시간 모니터링할 수 있습니다.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── [우측 박스] xl:col-span-3 ─────────────────────────────────── */}
          <div className="xl:col-span-3 chalk-box content-box flex flex-col bg-teal-950/80 backdrop-blur-md h-full min-h-0 p-4 sm:p-5">
            {mode === "player" ? (
              <>
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

                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 font-bold text-yellow-300 w-5">③</span>
                      <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                        문제판이 공개되면 이 중 3개의 칸을 조합해 타깃 넘버가 답이 되는 수식을 만들어야 합니다.
                      </p>
                    </div>

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

                  <div className="flex flex-col gap-2" style={{ marginTop: "1.5rem" }}>
                    <button
                      type="button"
                      onClick={handleCreateGame}
                      className="btn-chalk w-full justify-center py-2 text-base sm:text-lg font-bold cursor-pointer"
                      style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                    >
                      입장 코드 생성하기
                    </button>

                    <div className="chalk-box-straight bg-teal-950 px-3 py-1.5 flex items-center justify-center min-h-[56px] h-[56px] border-dashed border-teal-600 text-center rounded-md transition-all">
                      {generatedRoomCode || activeRoomCode ? (
                        <div className="flex items-center gap-3">
                          <span
                            className="text-2.5xl sm:text-3xl text-yellow-300 font-extrabold leading-none"
                            style={{ fontFamily: "var(--font-chalk)", letterSpacing: "0.2em" }}
                          >
                            {activeRoomCode || generatedRoomCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const codeToCopy = activeRoomCode || generatedRoomCode;
                              if (codeToCopy) {
                                navigator.clipboard.writeText(codeToCopy);
                                alert(`입장 코드 [${codeToCopy}] 가 복사되었습니다!`);
                              }
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
      </div>
    </div>
  );
}
