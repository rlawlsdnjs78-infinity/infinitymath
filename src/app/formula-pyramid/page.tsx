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

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import mqtt, { MqttClient } from "mqtt";
import ScoreBoard from "../components/ScoreBoard";
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
  Brain,
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
  Activity,
} from "lucide-react";

import { GAME_BOARDS, PRACTICE_BOARD } from "./data";
import { getAllValidSolutions, normalizeNodesKey } from "./utils";
import HexagonCell from "../components/HexagonCell";

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
  const [activityLogs, setActivityLogs] = useState<{ id: string; tag: string; text: string; ts: number }[]>([]);
  const [submittedAnswersList, setSubmittedAnswersList] = useState<{ nodes: string; formula: string; round?: number }[]>([]);
  const [roomTimerSeconds, setRoomTimerSeconds] = useState(180);
  const [roomEndTime, setRoomEndTime] = useState<number | null>(null);

  /* ── 타임스탬프 기반 중복 방지 및 시간순 공지 로그 헬퍼 ── */
  const addActivityLog = (rawMsg: string, explicitTs?: number) => {
    const match = rawMsg.match(/^(\[[^\]]+\])\s*(.*)$/);
    const tag = match ? match[1] : "[안내]";
    const text = match ? match[2] : rawMsg;
    const ts = explicitTs || Date.now();

    setActivityLogs((prev) => {
      // 동일한 내용의 공지가 이미 존재하면 100% 중복 추가 차단
      if (prev.some((item) => item.text.trim() === text.trim())) {
        return prev;
      }

      const newEntry = {
        id: `${ts}_${Math.random().toString(36).slice(2, 7)}`,
        tag,
        text,
        ts,
      };

      // 시간 순서(과거 -> 최신)로 정렬하여 반환
      return [...prev, newEntry].sort((a, b) => a.ts - b.ts);
    });
  };

  const logsEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activityLogs]);

  /* ── 카운트다운 & 라운드 종료 팝업 ── */
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [showRoundEndPopup, setShowRoundEndPopup] = useState(false);
  const [isRoundLocked, setIsRoundLocked] = useState(false);
  const [showFinalRanking, setShowFinalRanking] = useState(false);
  const [usedBoardIds, setUsedBoardIds] = useState<number[]>([]);

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

  /* ── 현재 라운드에 유효한 제출 정답 목록 (지난 라운드 정답 누수 원천 차단) ── */
  const currentRoundSubmittedAnswers: { nodes: string; formula: string; round?: number }[] = useMemo(() => {
    return submittedAnswersList.filter((a: { nodes: string; formula: string; round?: number }) => {
      const isRoundMatch = a.round === undefined || a.round === currentRound;
      const isValidSolution = validSolutions.some(
        (sol) => normalizeNodesKey(sol.nodes) === normalizeNodesKey(a.nodes)
      );
      return isRoundMatch && isValidSolution;
    });
  }, [submittedAnswersList, currentRound, validSolutions]);

  /* ── 모든 정답 제출 시 자동 라운드 종료 처리 ── */
  useEffect(() => {
    if (!isGameStarted || isRoundLocked || validSolutions.length === 0) return;
    if (currentRoundSubmittedAnswers.length === 0) return;

    const allSolNormalized = validSolutions.map((s) => normalizeNodesKey(s.nodes));
    const allSubmittedNormalized = currentRoundSubmittedAnswers.map((a) => normalizeNodesKey(a.nodes));
    const allDone = allSolNormalized.every((k) => allSubmittedNormalized.includes(k));

    if (allDone) {
      setIsRoundLocked(true);
      if (!isDealerHost) setShowRoundEndPopup(true);
      setRoomTimerSeconds(0);
      setRoomEndTime(Date.now());
      addActivityLog(`[안내] 이번 라운드의 모든 정답이 제출되었습니다. ${currentRound}라운드를 종료합니다.`);

      if (isDealerHost && activeRoomCode && typeof window !== "undefined") {
        try {
          const confStr = localStorage.getItem(`pyramid-room-config-${activeRoomCode}`);
          if (confStr) {
            const conf = JSON.parse(confStr);
            conf.roomEndTime = Date.now();
            localStorage.setItem(`pyramid-room-config-${activeRoomCode}`, JSON.stringify(conf));
          }
        } catch (err) {}
      }
    }
  }, [
    currentRoundSubmittedAnswers,
    validSolutions,
    isGameStarted,
    isRoundLocked,
    currentRound,
    isDealerHost,
    activeRoomCode,
  ]);

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

  /* ── 라운드 타이머 (딜러가 Master Clock으로 초반 10초 실시간, 이후 10초 주기 동기화) ── */
  useEffect(() => {
    if (!inGameRoom || !isGameStarted || countdownValue !== null || isRoundLocked) return;

    const interval = setInterval(() => {
      setRoomTimerSeconds((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        if (next === 0) {
          setIsRoundLocked(true);
          if (!isDealerHost) setShowRoundEndPopup(true);
          addActivityLog(`[안내] ${currentRound}라운드를 종료합니다.`);
        }

        // 딜러(호스트)는 라운드 시작 10초 동안은 실시간 매초 동기화, 그 이후에는 10초마다 1번씩 및 종료 시점(0초)에만 동기화 전송
        const totalRoundSec = selectedTime * 60;
        const elapsedSec = totalRoundSec - next;
        const shouldSync = elapsedSec <= 10 || next % 10 === 0 || next === 0;

        if (isDealerHost && shouldSync && mqttClientRef.current && activeRoomCode) {
          try {
            const topic = `infinitymath/v2/pyramid/${activeRoomCode}`;
            mqttClientRef.current.publish(
              topic,
              JSON.stringify({
                type: "TIME_SYNC",
                remainingSeconds: next,
                currentRound,
                isRoundLocked: next === 0,
              })
            );
          } catch {}
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [inGameRoom, isGameStarted, countdownValue, isRoundLocked, currentRound, isDealerHost, activeRoomCode, selectedTime]);

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
    const currentNormalizedKey = normalizeNodesKey(selectedNodes);
    const isAlreadySubmitted = currentRoundSubmittedAnswers.some(
      (a: { nodes: string; formula: string; round?: number }) => normalizeNodesKey(a.nodes) === currentNormalizedKey
    );

    if (isAlreadySubmitted && inGameRoom) {
      const nextScore = myScore - 1;
      setMyScore(nextScore);
      setPlayers((prev) => prev.map((p) => (p.name === myNickname ? { ...p, score: nextScore } : p)));
      if (penaltySec > 0) {
        setPenaltyLockSeconds(penaltySec);
        triggerNotice(`이미 제출된 정답입니다! (-1점) (${penaltySec}초 대기)`, "error", penaltySec * 1000);
      } else {
        triggerNotice("이미 제출된 정답입니다! (-1점)", "error", 1500);
      }
      const logMsg = `[오답] ${myNickname} 님이 이미 제출된 정답 ${nodesStr} 을 다시 제출하였습니다.`;
      addActivityLog(logMsg);
      broadcastScoreUpdate(myNickname, nextScore, undefined, false, logMsg, currentRound);
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
      const ansObj = { nodes: nodesStr, formula: formulaStr, round: currentRound };
      const logMsg = `[정답] ${myNickname} 님이 정답 ${nodesStr} 을 제출하였습니다.`;
      addActivityLog(logMsg);

      setSubmittedAnswersList((prev) => {
        if (prev.some((a) => (a.round === undefined || a.round === currentRound) && normalizeNodesKey(a.nodes) === currentNormalizedKey)) return prev;
        return [...prev.filter((a) => a.round === undefined || a.round === currentRound), ansObj];
      });
      broadcastScoreUpdate(myNickname, nextScore, ansObj, false, logMsg, currentRound);
    } else {
      const nextScore = myScore - 1;
      setMyScore(nextScore);
      setPlayers((prev) => prev.map((p) => (p.name === myNickname ? { ...p, score: nextScore } : p)));
      if (penaltySec > 0) {
        setPenaltyLockSeconds(penaltySec);
        triggerNotice(`오답입니다! (-1점) (${penaltySec}초 대기)`, "error", penaltySec * 1000);
      } else {
        triggerNotice("오답입니다! (-1점)", "error", 1200);
      }
      const logMsg = `[오답] ${myNickname} 님이 오답 ${nodesStr} 을 제출하였습니다.`;
      addActivityLog(logMsg);
      broadcastScoreUpdate(myNickname, nextScore, undefined, false, logMsg, currentRound);
    }
    setSelectedNodes([]);
  };

  const mqttClientRef = useRef<MqttClient | null>(null);
  const submittedAnswersListRef = useRef(submittedAnswersList);
  useEffect(() => {
    submittedAnswersListRef.current = submittedAnswersList;
  }, [submittedAnswersList]);

  const postRoomAction = async (action: string, payload: Record<string, unknown>, targetRoomCode?: string) => {
    const code = targetRoomCode || activeRoomCode;
    if (!code) return;
    try {
      await fetch("/api/pyramid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, roomCode: code, payload }),
      });
    } catch {}
  };

  /* ── 모든 기기(PC, 태블릿, 모바일) 및 탭으로 이벤트 즉시 브로드캐스트 ── */
  const broadcastRoomEvent = (eventData: Record<string, unknown>) => {
    const fullData = { ...eventData, sender: myNickname };
    // 1. MQTT WebSocket (인터넷을 통한 PC ↔ 태블릿 0.05초 초고속 실시간 전파)
    if (mqttClientRef.current && activeRoomCode) {
      try {
        const topic = `infinitymath/v2/pyramid/${activeRoomCode}`;
        mqttClientRef.current.publish(topic, JSON.stringify(fullData));
      } catch {}
    }
    // 2. BroadcastChannel (같은 기기 탭 간 0ms 즉시 전파)
    if (inGameRoom && activeRoomCode && typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
        bc.postMessage(fullData);
        bc.close();
      } catch {}
    }
    // 3. Server API (백업용)
    if (eventData.type === "SCORE_UPDATE") {
      postRoomAction("SCORE_UPDATE", {
        playerName: eventData.playerName,
        newScore: eventData.newScore,
        submittedAnswer: eventData.submittedAnswer,
        roundFinish: eventData.roundFinish,
      });
    } else if (eventData.type === "START_GAME") {
      postRoomAction("START_GAME", {
        selectedBoardId: eventData.selectedBoardId,
        currentRound: eventData.currentRound,
        roomEndTime: eventData.roomEndTime,
        target: eventData.target,
        usedBoardIds: eventData.usedBoardIds,
      });
    } else if (eventData.type === "LEAVE") {
      postRoomAction("LEAVE", { playerName: eventData.playerName });
    }
  };

  const broadcastScoreUpdate = (
    playerName: string,
    newScore: number,
    submittedAnswer?: { nodes: string; formula: string; round?: number },
    roundFinish?: boolean,
    logMsg?: string,
    round?: number
  ) => {
    broadcastRoomEvent({
      type: "SCORE_UPDATE",
      playerName,
      newScore,
      submittedAnswer,
      roundFinish,
      logMsg,
      round,
    });
  };

  /* ── 최신 방 상태값을 useRef로 관리 ── */
  const roomStateRef = useRef({
    myNickname,
    myScore,
    isDealerHost,
    selectedRound,
    selectedTime,
    selectedPenalty,
    selectedBoardId,
    currentRound,
    isGameStarted,
    roomEndTime,
    roomTimerSeconds,
    currentTargetNumber,
    currentAllNodes,
    isRoundLocked,
  });
  useEffect(() => {
    roomStateRef.current = {
      myNickname,
      myScore,
      isDealerHost,
      selectedRound,
      selectedTime,
      selectedPenalty,
      selectedBoardId,
      currentRound,
      isGameStarted,
      roomEndTime,
      roomTimerSeconds,
      currentTargetNumber,
      currentAllNodes,
      isRoundLocked,
    };
  });

  const playersRef = useRef(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const lastStartedGameTsRef = useRef<number>(0);

  /* ── MQTT over WebSocket 실시간 크로스 디바이스(PC, 태블릿) 양방향 동기화 ── */
  useEffect(() => {
    if (!inGameRoom || !activeRoomCode) return;

    let client: MqttClient | null = null;
    const topic = `infinitymath/v2/pyramid/${activeRoomCode}`;

    try {
      client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt", {
        keepalive: 30,
        protocolId: "MQTT",
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 5000,
        clientId: `pyr_${Math.random().toString(16).slice(2, 10)}`,
      });

      mqttClientRef.current = client;

      const sendPresence = (type: "JOIN" | "PRESENCE_PING" | "PRESENCE_PONG") => {
        const curr = roomStateRef.current;
        if (!client || !client.connected) return;
        client.publish(
          topic,
          JSON.stringify({
            type,
            sender: curr.myNickname,
            player: { name: curr.myNickname, score: curr.myScore, isHost: curr.isDealerHost },
            allPlayers: playersRef.current,
          })
        );
      };

      client.on("connect", () => {
        client?.subscribe(topic, { qos: 0 }, (err) => {
          if (!err) {
            sendPresence("JOIN");
          }
        });
      });

      client.on("message", (recvTopic, message) => {
        if (recvTopic !== topic) return;
        try {
          const data = JSON.parse(message.toString());
          if (!data || !data.type) return;
          const curr = roomStateRef.current;

          // 본인이 보낸 메시지는 무시 (에코 방지)
          if (data.sender && data.sender === curr.myNickname) return;

          if (data.type === "JOIN" || data.type === "PRESENCE_PING") {
            // 1. 상대방 플레이어를 내 목록에 즉시 추가
            if (data.player && data.player.name) {
              setPlayers((prev) => {
                const exists = prev.some((p) => p.name === data.player.name);
                if (exists) {
                  return prev.map((p) => (p.name === data.player.name ? { ...p, score: data.player.score, isHost: data.player.isHost } : p));
                }
                return [...prev, data.player];
              });
            }

            // 2. 상대방이 보낸 allPlayers 목록도 병합
            if (data.allPlayers && Array.isArray(data.allPlayers)) {
              setPlayers((prev) => {
                const map = new Map<string, { name: string; score: number; isHost?: boolean }>();
                prev.forEach((p) => map.set(p.name, p));
                data.allPlayers.forEach((p: { name: string; score: number; isHost?: boolean }) => {
                  if (!map.has(p.name)) {
                    map.set(p.name, p);
                  }
                });
                return Array.from(map.values());
              });
            }

            if (data.player?.name) {
              addActivityLog(`[입장] ${data.player.name} 님이 입장하였습니다.`);
            }

            // 3. 상대방에게 "나도 여기 있어" 하고 내 정보 + 전체 플레이어 목록 즉시 응답 (PONG)
            sendPresence("PRESENCE_PONG");

            // 4. 딜러인 경우 방 설정도 즉시 전파
            if (curr.isDealerHost) {
              client?.publish(
                topic,
                JSON.stringify({
                  type: "SYNC_PRESENCE",
                  sender: curr.myNickname,
                  player: { name: curr.myNickname, score: curr.myScore, isHost: true },
                  allPlayers: playersRef.current,
                  roomConfig: {
                    selectedRound: curr.selectedRound,
                    selectedTime: curr.selectedTime,
                    selectedPenalty: curr.selectedPenalty,
                    selectedBoardId: curr.selectedBoardId,
                    isGameStarted: curr.isGameStarted,
                    currentRound: curr.currentRound,
                    currentRemainingSeconds: curr.roomTimerSeconds,
                    submittedAnswersList: submittedAnswersListRef.current.filter((a) => a.round === undefined || a.round === curr.currentRound),
                  },
                })
              );
            }
          } else if (data.type === "PRESENCE_PONG") {
            // 상대방 응답 수신 시 플레이어 목록에 즉시 추가/갱신
            if (data.player && data.player.name) {
              setPlayers((prev) => {
                const exists = prev.some((p) => p.name === data.player.name);
                if (exists) {
                  return prev.map((p) => (p.name === data.player.name ? { ...p, score: data.player.score, isHost: data.player.isHost } : p));
                }
                return [...prev, data.player];
              });
            }
            if (data.allPlayers && Array.isArray(data.allPlayers)) {
              setPlayers((prev) => {
                const map = new Map<string, { name: string; score: number; isHost?: boolean }>();
                prev.forEach((p) => map.set(p.name, p));
                data.allPlayers.forEach((p: { name: string; score: number; isHost?: boolean }) => {
                  if (!map.has(p.name)) {
                    map.set(p.name, p);
                  }
                });
                return Array.from(map.values());
              });
            }
          } else if (data.type === "SYNC_PRESENCE") {
            if (data.player && data.player.name) {
              setPlayers((prev) => (prev.some((p) => p.name === data.player.name) ? prev : [...prev, data.player]));
            }
            if (data.allPlayers && Array.isArray(data.allPlayers)) {
              setPlayers((prev) => {
                const map = new Map<string, { name: string; score: number; isHost?: boolean }>();
                prev.forEach((p) => map.set(p.name, p));
                data.allPlayers.forEach((p: { name: string; score: number; isHost?: boolean }) => {
                  if (!map.has(p.name)) map.set(p.name, p);
                });
                return Array.from(map.values());
              });
            }
            if (data.roomConfig) {
              if (data.roomConfig.selectedRound) setSelectedRound(data.roomConfig.selectedRound);
              if (data.roomConfig.selectedTime) setSelectedTime(data.roomConfig.selectedTime);
              if (data.roomConfig.selectedPenalty) setSelectedPenalty(data.roomConfig.selectedPenalty);
              if (data.roomConfig.selectedBoardId) setSelectedBoardId(data.roomConfig.selectedBoardId);
              if (data.roomConfig.isGameStarted !== undefined) setIsGameStarted(data.roomConfig.isGameStarted);
              if (data.roomConfig.currentRound) setCurrentRound(data.roomConfig.currentRound);
              if (typeof data.roomConfig.currentRemainingSeconds === "number") {
                setRoomTimerSeconds(data.roomConfig.currentRemainingSeconds);
              }
              if (data.roomConfig.submittedAnswersList && Array.isArray(data.roomConfig.submittedAnswersList)) {
                const syncRound = data.roomConfig.currentRound || curr.currentRound;
                if (syncRound === curr.currentRound) {
                  setSubmittedAnswersList(data.roomConfig.submittedAnswersList.map((a: { nodes: string; formula: string; round?: number }) => ({ ...a, round: curr.currentRound })));
                }
              }
            }
          } else if (data.type === "TIME_SYNC") {
            // 딜러(Master Clock)가 보낸 실시간 남은 시간 동기화 수신 (초반 5초 및 종료 시점 보정)
            if (!curr.isDealerHost && typeof data.remainingSeconds === "number") {
              setRoomTimerSeconds((prev) => {
                if (data.remainingSeconds === 0) return 0;
                if (Math.abs(prev - data.remainingSeconds) >= 2) {
                  return data.remainingSeconds;
                }
                return prev;
              });
              if (data.isRoundLocked && !isRoundLocked) {
                setIsRoundLocked(true);
                setShowRoundEndPopup(true);
                addActivityLog(`[안내] ${data.currentRound || curr.currentRound}라운드를 종료합니다.`);
              }
            }
          } else if (data.type === "START_GAME") {
            // 중복 실행 방지: 이미 처리된 게임 시작 이벤트면 무시
            if (data.gameStartTs && data.gameStartTs === lastStartedGameTsRef.current) {
              return;
            }
            lastStartedGameTsRef.current = data.gameStartTs || Date.now();

            setIsGameStarted(true);
            setSelectedBoardId(data.selectedBoardId || 1);
            if (data.currentRound) setCurrentRound(data.currentRound);
            setRoomTimerSeconds(selectedTime * 60);
            setSubmittedAnswersList([]);
            submittedAnswersListRef.current = [];
            setIsRoundLocked(false);
            setShowRoundEndPopup(false);
            setSelectedNodes([]);
            setPenaltyLockSeconds(0);
            setCountdownValue(3);
          } else if (data.type === "SCORE_UPDATE") {
            if (data.playerName !== curr.myNickname) {
              setPlayers((prev) =>
                prev.map((p) => (p.name === data.playerName ? { ...p, score: data.newScore } : p))
              );
            }
            if (data.submittedAnswer) {
              const ansRound = data.round || data.submittedAnswer.round;
              if (!ansRound || ansRound === curr.currentRound) {
                setSubmittedAnswersList((prev) => {
                  const filtered = prev.filter((a) => a.round === undefined || a.round === curr.currentRound);
                  const isDup = filtered.some((a) => normalizeNodesKey(a.nodes) === normalizeNodesKey(data.submittedAnswer.nodes));
                  return isDup ? filtered : [...filtered, { ...data.submittedAnswer, round: curr.currentRound }];
                });
              }
            }
            if (data.logMsg) {
              addActivityLog(data.logMsg);
            } else if (data.submittedAnswer) {
              addActivityLog(`[정답] ${data.playerName} 님이 정답 ${data.submittedAnswer.nodes} 을 제출하였습니다.`);
            }
          } else if (data.type === "LEAVE") {
            if (data.playerName === curr.myNickname) return;
            setPlayers((prev) => prev.filter((p) => p.name !== data.playerName));
            addActivityLog(`[퇴장] ${data.playerName} 님이 퇴장하였습니다.`);
          }
        } catch (err) {}
      });
    } catch (err) {}

    return () => {
      if (client) {
        try {
          client.end(true);
        } catch (e) {}
      }
      mqttClientRef.current = null;
    };
  }, [inGameRoom, activeRoomCode, selectedTime]);

  /* ── 동일 기기 브라우저 탭 간 BroadcastChannel 실시간 리스너 ── */
  useEffect(() => {
    if (!inGameRoom || !activeRoomCode || typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);

    bc.onmessage = (event) => {
      try {
        const data = event.data;
        if (!data || !data.type) return;
        const curr = roomStateRef.current;
        if (data.sender && data.sender === curr.myNickname) return;

        if (data.type === "TIME_SYNC") {
          if (!curr.isDealerHost && typeof data.remainingSeconds === "number") {
            setRoomTimerSeconds((prev) => {
              if (data.remainingSeconds === 0) return 0;
              if (Math.abs(prev - data.remainingSeconds) >= 2) {
                return data.remainingSeconds;
              }
              return prev;
            });
            if (data.isRoundLocked && !isRoundLocked) {
              setIsRoundLocked(true);
              setShowRoundEndPopup(true);
              addActivityLog(`[안내] ${data.currentRound || curr.currentRound}라운드를 종료합니다.`);
            }
          }
        } else if (data.type === "START_GAME") {
          if (data.gameStartTs && data.gameStartTs === lastStartedGameTsRef.current) return;
          lastStartedGameTsRef.current = data.gameStartTs || Date.now();
          setIsGameStarted(true);
          setSelectedBoardId(data.selectedBoardId || 1);
          if (data.currentRound) setCurrentRound(data.currentRound);
          setRoomTimerSeconds(selectedTime * 60);
          setSubmittedAnswersList([]);
          submittedAnswersListRef.current = [];
          setIsRoundLocked(false);
          setShowRoundEndPopup(false);
          setSelectedNodes([]);
          setPenaltyLockSeconds(0);
          setCountdownValue(3);
        } else if (data.type === "SCORE_UPDATE") {
          if (data.playerName !== curr.myNickname) {
            setPlayers((prev) =>
              prev.map((p) => (p.name === data.playerName ? { ...p, score: data.newScore } : p))
            );
          }
          if (data.submittedAnswer) {
            const ansRound = data.round || data.submittedAnswer.round;
            if (!ansRound || ansRound === curr.currentRound) {
              setSubmittedAnswersList((prev) => {
                const filtered = prev.filter((a) => a.round === undefined || a.round === curr.currentRound);
                const isDup = filtered.some((a) => normalizeNodesKey(a.nodes) === normalizeNodesKey(data.submittedAnswer.nodes));
                return isDup ? filtered : [...filtered, { ...data.submittedAnswer, round: curr.currentRound }];
              });
            }
          }
          if (data.logMsg) {
            addActivityLog(data.logMsg);
          }
        } else if (data.type === "LEAVE") {
          if (data.playerName === curr.myNickname) return;
          setPlayers((prev) => prev.filter((p) => p.name !== data.playerName));
          addActivityLog(`[퇴장] ${data.playerName} 님이 퇴장하였습니다.`);
        }
      } catch {}
    };

    return () => {
      try {
        bc.close();
      } catch {}
    };
  }, [inGameRoom, activeRoomCode, selectedTime]);

  /* ── 탭 복귀 / 화면 활성화 시 즉각 재동기화 (화면 꺼짐 및 백그라운드 복귀 완벽 대응) ── */
  useEffect(() => {
    if (!inGameRoom || !activeRoomCode) return;

    const handleSyncOnVisible = async () => {
      if (document.visibilityState === "visible") {
        // 1. MQTT PING 즉시 재전송하여 딜러에게 최신 방 상태 요청
        if (mqttClientRef.current && mqttClientRef.current.connected) {
          const topic = `infinitymath/v2/pyramid/${activeRoomCode}`;
          mqttClientRef.current.publish(
            topic,
            JSON.stringify({
              type: "PRESENCE_PING",
              sender: myNickname,
              player: { name: myNickname, score: myScore, isHost: isDealerHost },
            })
          );
        }
        // 2. 서버 HTTP 상태 즉시 1회 조회 및 동기화
        try {
          const res = await fetch(`/api/pyramid?roomCode=${encodeURIComponent(activeRoomCode)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.exists && data.room) {
              const r = data.room;
              if (r.players) {
                setPlayers((prev) => {
                  const map = new Map<string, { name: string; score: number; isHost?: boolean }>();
                  prev.forEach((p) => map.set(p.name, p));
                  r.players.forEach((p: { name: string; score: number; isHost?: boolean }) => map.set(p.name, p));
                  return Array.from(map.values());
                });
              }
              if (r.isGameStarted && !isDealerHost) {
                setIsGameStarted(true);
                if (r.selectedBoardId) setSelectedBoardId(r.selectedBoardId);
                if (r.currentRound) setCurrentRound(r.currentRound);
              }
            }
          }
        } catch {}
      }
    };

    document.addEventListener("visibilitychange", handleSyncOnVisible);
    window.addEventListener("focus", handleSyncOnVisible);

    return () => {
      document.removeEventListener("visibilitychange", handleSyncOnVisible);
      window.removeEventListener("focus", handleSyncOnVisible);
    };
  }, [inGameRoom, activeRoomCode, myNickname, myScore, isDealerHost]);

  /* ── 태블릿 & 모바일 환경을 위한 탄탄한 백그라운드 HTTP 서버 동기화 폴링 (1.2초) ── */
  useEffect(() => {
    if (!inGameRoom || !activeRoomCode || isDealerHost) return;

    let isAlive = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pyramid?roomCode=${encodeURIComponent(activeRoomCode)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isAlive || !data.exists || !data.room) return;

        const r = data.room;
        const curr = roomStateRef.current;

        // 플레이어 목록 및 내 점수 동기화
        // ★ 버그 수정: 서버 점수가 로컬 점수보다 낮을 경우 로컬 값을 보존 (서버 반영 지연으로 인한 점수 0점 초기화 방지)
        if (r.players && Array.isArray(r.players)) {
          setPlayers((prev) => {
            const map = new Map<string, { name: string; score: number; isHost?: boolean }>();
            prev.forEach((p) => map.set(p.name, p));
            r.players.forEach((p: { name: string; score: number; isHost?: boolean }) => {
              const existing = map.get(p.name);
              // 이미 로컬에 존재하면 점수는 더 높은 값을 유지 (서버 반영 지연 대비)
              if (existing) {
                map.set(p.name, { ...p, score: Math.max(existing.score, p.score) });
              } else {
                map.set(p.name, p);
              }
            });
            return Array.from(map.values());
          });
          const me = r.players.find((p: { name: string; score: number }) => p.name === curr.myNickname);
          if (me && me.score > curr.myScore) {
            // 서버 점수가 로컬보다 높은 경우에만 동기화 (다른 기기에서의 점수 반영)
            setMyScore(me.score);
          }
        }

        // 게임 시작 동기화 (태블릿이 MQTT를 놓쳤을 경우 완벽 보정)
        if (r.isGameStarted && !curr.isGameStarted) {
          setIsGameStarted(true);
          setSelectedBoardId(r.selectedBoardId || 1);
          if (r.currentRound) setCurrentRound(r.currentRound);
          if (r.roomEndTime) {
            setRoomEndTime(r.roomEndTime);
            setRoomTimerSeconds(Math.max(0, Math.ceil((r.roomEndTime - Date.now()) / 1000)));
          }
          setSubmittedAnswersList([]);
          setIsRoundLocked(false);
          setShowRoundEndPopup(false);
          setSelectedNodes([]);
          setPenaltyLockSeconds(0);
          setCountdownValue(3);
        } else if (r.isGameStarted && curr.isGameStarted) {
          if (r.currentRound && r.currentRound > curr.currentRound) {
            // 새 라운드 전환
            setCurrentRound(r.currentRound);
            setSelectedBoardId(r.selectedBoardId || 1);
            if (r.roomEndTime) {
              setRoomEndTime(r.roomEndTime);
              setRoomTimerSeconds(Math.max(0, Math.ceil((r.roomEndTime - Date.now()) / 1000)));
            }
            setSubmittedAnswersList([]);
            setIsRoundLocked(false);
            setShowRoundEndPopup(false);
            setSelectedNodes([]);
            setPenaltyLockSeconds(0);
            setCountdownValue(3);
          }
        }

        // 정답 제출 동기화 (현재 라운드 정답만 안전하게 반영)
        // ★ 버그 수정: 서버 데이터로 완전 덮어쓰지 않고, 로컬+서버 목록을 병합하여 로컬에서 제출한 최신 정답이 사라지지 않도록 함
        if (r.submittedAnswersList && Array.isArray(r.submittedAnswersList)) {
          if (r.currentRound === curr.currentRound) {
            setSubmittedAnswersList((prev) => {
              // 현재 라운드 정답만 필터
              const localAnswers = prev.filter((a) => a.round === undefined || a.round === curr.currentRound);
              const serverAnswers = r.submittedAnswersList.map((a: { nodes: string; formula: string; round?: number }) => ({
                ...a,
                round: curr.currentRound,
              }));
              // 서버 정답과 로컬 정답을 병합 (중복 제거: normalizeNodesKey 기준)
              const merged = [...localAnswers];
              serverAnswers.forEach((sa: { nodes: string; formula: string; round?: number }) => {
                const isDup = merged.some((la) => normalizeNodesKey(la.nodes) === normalizeNodesKey(sa.nodes));
                if (!isDup) merged.push(sa);
              });
              return merged;
            });
          }
        }
      } catch {}
    }, 1200);

    return () => {
      isAlive = false;
      clearInterval(pollInterval);
    };
  }, [inGameRoom, activeRoomCode, isDealerHost]);

  /* ── 고정밀 3초 카운트다운 로직 ── */
  useEffect(() => {
    if (countdownValue === null) return;
    if (countdownValue <= 0) {
      setCountdownValue(null);
      setIsGameStarted(true);
      setRoomTimerSeconds(selectedTime * 60);
      addActivityLog(`[안내] ${currentRound}라운드가 시작되었습니다! (TARGET: ${currentTargetNumber})`);
      return;
    }
    const timer = setTimeout(() => {
      setCountdownValue((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdownValue, selectedTime, currentRound, currentTargetNumber]);

  /* ── unload 처리 ── */
  useEffect(() => {
    if (!inGameRoom || !activeRoomCode) return;
    const handleUnload = () => {
      try {
        const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
        bc.postMessage({ type: "LEAVE", playerName: myNickname, isHost: isDealerHost });
        bc.close();
      } catch {}
      postRoomAction("LEAVE", { playerName: myNickname });
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [inGameRoom, activeRoomCode, myNickname, isDealerHost]);

  const handleLeaveRoom = () => {
    if (inGameRoom && activeRoomCode) {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const bc = new BroadcastChannel(`pyramid-room-${activeRoomCode}`);
          bc.postMessage({ type: "LEAVE", playerName: myNickname, isHost: isDealerHost });
          bc.close();
        } catch {}
      }
      postRoomAction("LEAVE", { playerName: myNickname });
    }
    const remainingPlayers = players.filter((p) => p.name !== myNickname);
    if (remainingPlayers.length === 0 && activeRoomCode) {
      try { localStorage.removeItem(`pyramid-room-config-${activeRoomCode}`); } catch {}
      setSelectedRound(1); setSelectedTime(3); setSelectedPenalty("없음"); setSelectedBoardId(1); setRoomTimerSeconds(180); setRoomEndTime(null);
    }
    setInGameRoom(false); setIsGameStarted(false); setActiveRoomCode(""); setPlayers([]); setActivityLogs([]); setSubmittedAnswersList([]);
    setShowRoundEndPopup(false); setIsRoundLocked(false); setCountdownValue(null); setShowFinalRanking(false); setCurrentRound(1); setUsedBoardIds([]);
  };

  const handleJoinGameRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nickname.trim()) { alert("닉네임을 입력해 주세요."); return; }
    if (!entryCode.trim()) { alert("입장 코드를 입력해 주세요."); return; }
    const cleanCode = entryCode.trim().toUpperCase();

    // 1. 서버에 방 존재 여부 확인 및 정보 로드
    let roomInfo: Record<string, unknown> | null = null;
    try {
      const res = await fetch(`/api/pyramid?roomCode=${encodeURIComponent(cleanCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists && data.room) {
          roomInfo = data.room;
        }
      }
    } catch {}

    // 로컬 스토리지 보조 확인
    if (!roomInfo) {
      try {
        const savedConfigStr = localStorage.getItem(`pyramid-room-config-${cleanCode}`);
        if (savedConfigStr) {
          roomInfo = JSON.parse(savedConfigStr);
        }
      } catch {}
    }

    if (roomInfo) {
      if (typeof roomInfo.selectedRound === "number") setSelectedRound(roomInfo.selectedRound);
      if (typeof roomInfo.selectedTime === "number") setSelectedTime(roomInfo.selectedTime);
      if (typeof roomInfo.selectedPenalty === "string") setSelectedPenalty(roomInfo.selectedPenalty);
      if (typeof roomInfo.selectedBoardId === "number") setSelectedBoardId(roomInfo.selectedBoardId);
      if (typeof roomInfo.isGameStarted === "boolean") setIsGameStarted(roomInfo.isGameStarted);
      if (typeof roomInfo.currentRound === "number") setCurrentRound(roomInfo.currentRound);
      if (typeof roomInfo.roomEndTime === "number" && roomInfo.roomEndTime) {
        setRoomEndTime(roomInfo.roomEndTime);
        setRoomTimerSeconds(Math.max(0, Math.ceil((roomInfo.roomEndTime - Date.now()) / 1000)));
      } else {
        setRoomTimerSeconds(typeof roomInfo.selectedTime === "number" ? roomInfo.selectedTime * 60 : 180);
      }
    }

    setActiveRoomCode(cleanCode);
    setMyNickname(nickname.trim());
    setMyScore(0);
    setIsDealerHost(false);
    setInGameRoom(true);

    const me = { name: nickname.trim(), score: 0 };
    setPlayers([me]);
    setActivityLogs([{ id: `init_${Date.now()}`, tag: "[입장]", text: `${nickname.trim()} 님이 입장하였습니다.`, ts: Date.now() }]);

    // 서버에 입장 알림 (다른 기기 동기화)
    postRoomAction("JOIN", { playerName: nickname.trim() }, cleanCode);

    // 로컬 탭 동기화
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
    setGeneratedRoomCode(code); setActiveRoomCode(code); setMyNickname("딜러(선생님)"); setMyScore(0); setIsDealerHost(true); setInGameRoom(true); setUsedBoardIds([]);
    const host = { name: "딜러(선생님)", score: 0, isHost: true };
    setPlayers([host]);
    setActivityLogs([{ id: `init_${Date.now()}`, tag: "[안내]", text: `딜러 방 [${code}] 가 생성되었습니다.`, ts: Date.now() }]);

    // 서버에 방 생성 알림 (다른 기기 동기화)
    postRoomAction("CREATE", {
      hostName: "딜러(선생님)",
      selectedRound,
      selectedTime,
      selectedPenalty,
      selectedBoardId: 1,
    }, code);

    // 로컬 탭 동기화
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try { const bc = new BroadcastChannel(`pyramid-room-${code}`); bc.postMessage({ type: "JOIN", player: host, roomConfig: currentRoomConfig }); bc.close(); } catch {}
    }
  };

  /* ── 딜러가 '게임 시작하기' 클릭 시 중복 없이 랜덤 추첨 후 카운트다운 시작 ── */
  const handleStartGame = (nextRound?: number) => {
    if (!activeRoomCode) return;
    
    // 아직 사용되지 않은 게임판 중에서 랜덤 선택 (전부 사용 시 리셋)
    const availableBoards = GAME_BOARDS.filter((b) => !usedBoardIds.includes(b.id));
    const pool = availableBoards.length > 0 ? availableBoards : GAME_BOARDS;
    const chosenBoard = pool[Math.floor(Math.random() * pool.length)];
    const chosenBoardId = chosenBoard.id;
    const nextUsed = availableBoards.length > 0 ? [...usedBoardIds, chosenBoard.id] : [chosenBoard.id];
    setUsedBoardIds(nextUsed);

    const calculatedEndTime = Date.now() + 3000 + selectedTime * 60 * 1000; // 카운트다운 3초 포함

    const roundNum = nextRound ?? currentRound;
    setCurrentRound(roundNum);
    setSelectedBoardId(chosenBoardId);
    setRoomEndTime(calculatedEndTime);
    setIsGameStarted(true);
    setShowRoundEndPopup(false);
    setIsRoundLocked(false);
    setSubmittedAnswersList([]);
    submittedAnswersListRef.current = [];
    setShowFinalRanking(false);

    const currentRoomConfig = { selectedRound, selectedTime, selectedPenalty, selectedBoardId: chosenBoardId, isGameStarted: true, roomEndTime: calculatedEndTime, usedBoardIds: nextUsed };
    try { localStorage.setItem(`pyramid-room-config-${activeRoomCode}`, JSON.stringify(currentRoomConfig)); } catch {}

    // 딜러 본인도 카운트다운 시작
    setCountdownValue(3);

    const gameStartTs = Date.now();
    lastStartedGameTsRef.current = gameStartTs;

    // 모든 기기로 게임 시작 전송
    broadcastRoomEvent({
      type: "START_GAME",
      selectedBoardId: chosenBoardId,
      currentRound: roundNum,
      roomEndTime: calculatedEndTime,
      target: chosenBoard.target,
      usedBoardIds: nextUsed,
      gameStartTs,
    });
  };

  /* ── 다음 라운드 시작 ── */
  const handleNextRound = () => {
    const next = currentRound + 1;
    handleStartGame(next);
  };

  /* ── 마지막 라운드 여부 ── */
  const isLastRound = currentRound >= selectedRound;


  return (
    <div
      className="w-full flex-1 flex flex-col items-center justify-start"
      style={{ paddingTop: "0.5rem", paddingBottom: "2rem", paddingLeft: "clamp(1rem, 4vw, 3rem)", paddingRight: "clamp(1rem, 4vw, 3rem)" }}
    >
      <div className="w-full max-w-[1550px] flex flex-col mx-auto">

        {/* ── 카운트다운 오버레이 ── */}
        {countdownValue !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6">
              <p className="text-[#CBA7D2] font-extrabold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.85rem" }}>
                게임이 곧 시작됩니다!
              </p>
              <div
                className="w-36 h-36 rounded-full flex items-center justify-center border-4 border-[#CBA7D2] shadow-2xl"
                style={{ background: "radial-gradient(circle at 50% 40%, rgba(20,60,50,0.98), rgba(5,25,20,1))" }}
              >
                <span
                  className="text-8xl font-black text-[#CBA7D2] leading-none"
                  style={{ fontFamily: "var(--font-chalk)", textShadow: "0 0 30px rgba(245,230,66,0.8)" }}
                >
                  {countdownValue}
                </span>
              </div>
              <p className="text-lg text-gray-600 font-medium" style={{ fontFamily: "var(--font-body)" }}>
                준비하세요...
              </p>
            </div>
          </div>
        )}

        {/* ── 라운드 종료 팝업 (딜러는 팝업 없이 전체 정답 보기 그리드 유지, 플레이어만 팝업 표시) ── */}
        {showRoundEndPopup && !isDealerHost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div
              className="w-full max-w-2xl mx-4 rounded-2xl shadow-2xl border-2 border-[#CBA7D2]/80 bg-white/98 flex flex-col"
              style={{ paddingLeft: "1.45rem", paddingRight: "1.45rem", paddingTop: "1.45rem", paddingBottom: "1.45rem", gap: "1rem" }}
            >
              {/* 팝업 헤더 */}
              <div className="flex items-center gap-3">
                <BookOpen size={28} className="text-[#CBA7D2] flex-shrink-0" />
                <h2 className="text-[#CBA7D2] font-extrabold text-2xl sm:text-3xl" style={{ fontFamily: "var(--font-chalk)" }}>
                  이번 라운드 정답 보기
                </h2>
              </div>
              <div className="w-full border-t border-dashed border-gray-300/70" />

              {/* 정답 목록 */}
              <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
                {validSolutions.length === 0 ? (
                  <p className="text-center text-gray-500 py-6" style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>가능한 정답 조합이 없습니다.</p>
                ) : (
                  validSolutions.map((sol, idx) => {
                    const solNodeStr = sol.nodes.join(" ");
                    const isSubmitted = currentRoundSubmittedAnswers.some(
                      (a: { nodes: string; formula: string; round?: number }) => normalizeNodesKey(a.nodes) === normalizeNodesKey(sol.nodes)
                    );
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-2xl border transition-all ${
                          isSubmitted
                            ? "bg-emerald-900/80 border-emerald-400/90 shadow-lg"
                            : "bg-gray-100/60 border-gray-200/80"
                        }`}
                        style={{ paddingLeft: "1.45rem", paddingRight: "1.45rem", paddingTop: "0.65rem", paddingBottom: "0.65rem" }}
                      >
                        <div className="flex items-center gap-3">
                          {isSubmitted && <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />}
                          <span
                            className={`font-black text-lg sm:text-xl tracking-widest ${isSubmitted ? "text-emerald-300" : "text-[#CBA7D2]"}`}
                            style={{ fontFamily: "var(--font-chalk)" }}
                          >
                            {solNodeStr}
                          </span>
                          {isSubmitted && (
                            <span className="text-emerald-400 font-bold border border-emerald-500/70 rounded-2xl" style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.25rem", paddingBottom: "0.25rem", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                              제출 완료
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-sm sm:text-base font-extrabold tracking-wide ${isSubmitted ? "text-emerald-200" : "text-gray-600"}`}
                          style={{ fontFamily: "var(--font-chalk)" }}
                        >
                          {sol.formulaStr}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="w-full border-t border-dashed border-gray-300/70" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-gray-600" style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                  총 <span className="text-[#CBA7D2] font-bold">{validSolutions.length}개</span> 조합 중{" "}
                  <span className="text-emerald-300 font-bold">{submittedAnswersList.length}개</span> 제출 완료
                </p>
                {isLastRound ? (
                  /* 마지막 라운드 → 전체 순위 확인하기 */
                  <button
                    type="button"
                    onClick={() => { setShowRoundEndPopup(false); setShowFinalRanking(true); }}
                    className="bg-[#CBA7D2] hover:bg-yellow-300 text-gray-900 font-extrabold rounded-2xl cursor-pointer transition-all shadow-sm flex items-center gap-2"
                    style={{ paddingLeft: "1.45rem", paddingRight: "1.45rem", paddingTop: "0.65rem", paddingBottom: "0.65rem", fontFamily: "var(--font-chalk)" }}
                  >
                    <Trophy size={18} className="flex-shrink-0" />
                    전체 순위 확인하기
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRoundEndPopup(false)}
                    className="bg-[#CBA7D2] hover:bg-yellow-300 text-gray-900 font-extrabold rounded-2xl cursor-pointer transition-all shadow-sm"
                    style={{ paddingLeft: "1.45rem", paddingRight: "1.45rem", paddingTop: "0.65rem", paddingBottom: "0.65rem", fontFamily: "var(--font-chalk)" }}
                  >
                    닫기
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 전체 순위 팝업 (최종 라운드 종료 후) ── */}
        {showFinalRanking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div
              className="w-full max-w-lg mx-4 rounded-2xl shadow-2xl border-2 border-[#CBA7D2]/80 bg-white/98 flex flex-col"
              style={{ paddingLeft: "1.45rem", paddingRight: "1.45rem", paddingTop: "1.45rem", paddingBottom: "1.45rem", gap: "1rem" }}
            >
              <div className="flex items-center gap-3">
                <Trophy size={28} className="text-[#CBA7D2] flex-shrink-0" />
                <h2 className="text-[#CBA7D2] font-extrabold text-2xl sm:text-3xl" style={{ fontFamily: "var(--font-chalk)" }}>
                  최종 순위표
                </h2>
              </div>
              <div className="w-full border-t border-dashed border-gray-300/70" />
              <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto">
                {players
                  .filter((p) => !p.isHost)
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((p, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-2xl border-2 transition-all ${
                        p.name === myNickname
                          ? "bg-[#CBA7D2]/25 border-[#CBA7D2] shadow-xl"
                          : "bg-gray-50/70 border-gray-200/80"
                      }`}
                      style={{ paddingLeft: "1.45rem", paddingRight: "1.45rem", paddingTop: "0.85rem", paddingBottom: "0.85rem" }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 text-center flex-shrink-0" style={{ fontSize: "1.45rem" }}>
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}위`}
                        </span>
                        <span
                          className={`font-black text-lg sm:text-xl ${
                            p.name === myNickname ? "text-[#CBA7D2]" : "text-gray-800"
                          }`}
                          style={{ fontFamily: "var(--font-chalk)" }}
                        >
                          {p.name}{p.name === myNickname && " ← 나"}
                        </span>
                      </div>
                      <span
                        className={`font-extrabold text-xl flex-shrink-0 ${
                          p.name === myNickname ? "text-[#CBA7D2]" : "text-gray-600"
                        }`}
                        style={{ fontFamily: "var(--font-chalk)" }}
                      >
                        {p.score}점
                      </span>
                    </div>
                  ))}
              </div>
              <div className="w-full border-t border-dashed border-gray-300/70" />
              <button
                type="button"
                onClick={() => setShowFinalRanking(false)}
                className="bg-[#CBA7D2] hover:bg-yellow-300 text-gray-900 font-extrabold rounded-2xl cursor-pointer transition-all shadow-sm"
                style={{ paddingLeft: "1.45rem", paddingRight: "1.45rem", paddingTop: "0.65rem", paddingBottom: "0.65rem", fontFamily: "var(--font-chalk)" }}
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* ─── 상단 타이틀 ─────────────────────────────── */}
        {!inGameRoom && (
          <>
            <div className="flex items-center justify-between w-full" style={{ marginTop: "0.25rem", marginBottom: "0.85rem" }}>
              <h1 className="text-[#CBA7D2] flex items-center gap-3.5 font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.65rem", letterSpacing: "0.04em" }}>
                <Brain className="text-[#CBA7D2] flex-shrink-0" size={30} />
                <span>수식 피라미드 (Formula Pyramid)</span>
              </h1>
              <Link
                href="/"
                className="flex items-center rounded-full bg-gray-50/80 backdrop-blur-md hover:bg-gray-100 border-2 border-dashed border-[#CBA7D2]/90 text-[#CBA7D2] font-extrabold transition-all shadow-lg hover:scale-105 cursor-pointer"
                style={{ paddingLeft: "1.45rem", paddingRight: "1.45rem", paddingTop: "0.65rem", paddingBottom: "0.65rem", gap: "0.65rem", fontFamily: "var(--font-chalk)", fontSize: "1.45rem", textDecoration: "none", letterSpacing: "0.04em" }}
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
            {/* 방 입장 중일 때 탭 대신 상단 간격 보정 */}
            {inGameRoom && <div style={{ marginBottom: "0.5rem" }} />}

            {mode === "player" ? (
              /* ── 플레이어 모드 입장 양식 ── */
              <div className="flex flex-col flex-1 gap-5">
                {/* 게임방 입장 전: 입장 폼 */}
                {!inGameRoom ? (
                  <form onSubmit={handleJoinGameRoom} className="flex flex-col gap-5">
                    <div className="flex flex-col" style={{ gap: "0.45rem" }}>
                      <label htmlFor="nickname-input" className="text-gray-800 font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.65rem" }}>닉네임</label>
                      <input
                        id="nickname-input" type="text" placeholder="닉네임을 입력해 주세요" value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full rounded-2xl bg-gray-50/80 backdrop-blur-md border border-dashed border-gray-300 text-gray-800 focus:outline-none focus:border-[#CBA7D2] placeholder:text-gray-500/80"
                        style={{ padding: "0.65rem 1.45rem", fontFamily: "var(--font-body)", fontSize: "1.05rem", lineHeight: "1.5" }}
                      />
                    </div>
                    <div className="flex flex-col" style={{ gap: "0.45rem" }}>
                      <label htmlFor="code-input" className="text-gray-800 font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.65rem" }}>입장 코드</label>
                      <input
                        id="code-input" type="text" placeholder="코드를 입력해주세요." value={entryCode}
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
                    {/* 접속 완료 뱃지 */}
                    <div
                      className="flex items-center justify-between rounded-2xl bg-gray-50/80 backdrop-blur-md border border-dashed border-gray-300 text-gray-800 shadow-sm"
                      style={{ paddingLeft: "1.45rem", paddingRight: "1.45rem", paddingTop: "0.9rem", paddingBottom: "0.9rem" }}
                    >
                      <span className="font-black text-lg sm:text-xl text-[#CBA7D2] flex items-center gap-2" style={{ fontFamily: "var(--font-chalk)" }}>
                        🪪 {myNickname}
                      </span>
                      <button
                        type="button" onClick={handleLeaveRoom}
                        className="flex items-center gap-1.5 bg-rose-900/90 hover:bg-rose-800 text-rose-200 font-extrabold text-sm sm:text-base rounded-2xl border border-rose-600/80 cursor-pointer shadow flex-shrink-0"
                        style={{ paddingLeft: "1.1rem", paddingRight: "1.1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", fontFamily: "var(--font-chalk)" }}
                      >
                        <LogOut size={16} className="flex-shrink-0" />
                        <span>퇴장</span>
                      </button>
                    </div>

                    {/* 실시간 점수판 (입장 후 좌측 패널로 이동) */}
                    <div
                      className="flex-1 rounded-2xl border-2 border-dashed border-gray-300/80 bg-gray-50/40"
                      style={{ paddingTop: "2rem", paddingBottom: "2rem", paddingLeft: "1.45rem", paddingRight: "1.45rem" }}
                    >
                      <ScoreBoard players={players} myNickname={myNickname} maxH="calc(100% - 60px)" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── 딜러 모드 대기 정보 ── */
              <div className="flex flex-col justify-between flex-1 gap-4 text-sm text-gray-700 leading-relaxed py-1" style={{ fontFamily: "var(--font-body)" }}>
                <div className="flex flex-col gap-4">
                  {/* 방 생성 전 안내 문구 (방을 생성하기 전에만 표시) */}
                  {!inGameRoom && (
                    <p className="leading-loose text-gray-700" style={{ fontSize: "1.05rem", fontFamily: "var(--font-body)" }}>
                      딜러 모드에서는 라운드 수, 라운드 별 시간, 오답 페널티를 설정하여 방을 생성할 수 있습니다.
                    </p>
                  )}

                  {/* 입장 코드 박스 (플레이어 모드 대기 창 입력란 스타일과 동일) */}
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

                  {/* 중간 버튼 (두 블록 사이에 독립 위치) */}
                  {inGameRoom && isDealerHost && !isGameStarted && !isRoundLocked && (
                    <button
                      type="button" onClick={() => handleStartGame(currentRound)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-gray-800 font-extrabold rounded-2xl text-base border-2 border-emerald-400 shadow-lg cursor-pointer animate-pulse transition-all"
                      style={{ paddingTop: "0.85rem", paddingBottom: "0.85rem", fontFamily: "var(--font-chalk)" }}
                    >
                      <Play size={18} className="fill-white flex-shrink-0" />
                      <span>게임 시작하기</span>
                    </button>
                  )}
                  {inGameRoom && isDealerHost && isRoundLocked && !isLastRound && (
                    <button
                      type="button" onClick={handleNextRound}
                      className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-gray-800 font-extrabold rounded-2xl text-base border-2 border-sky-400 shadow-lg cursor-pointer transition-all"
                      style={{ paddingTop: "0.85rem", paddingBottom: "0.85rem", fontFamily: "var(--font-chalk)" }}
                    >
                      <Play size={18} className="fill-white flex-shrink-0" />
                      <span>다음 라운드 시작하기 ({currentRound + 1} / {selectedRound})</span>
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
                {/* 방 접속 중 상태 바 */}
                {inGameRoom && (
                  <div className="flex flex-wrap items-center justify-start gap-3 w-full">
                    <div className="flex items-center gap-3 flex-wrap">
                      {[
                        { label: "라운드", value: `${currentRound} / ${selectedRound}`, urgent: false },
                        { label: "남은 시간", value: !isGameStarted ? `${formatTime(roomTimerSeconds)} (대기 중)` : formatTime(roomTimerSeconds), urgent: roomTimerSeconds <= 30 && isGameStarted },
                        { label: "오답 페널티", value: selectedPenalty, urgent: false },
                      ].map(({ label, value, urgent }) => (
                        <div
                          key={label}
                          className={`border-2 border-dashed rounded-2xl flex items-center gap-2 shadow-sm ${urgent ? "border-rose-500/90 bg-rose-950/80" : "border-gray-300/80 bg-gray-50/80 backdrop-blur-md"}`}
                          style={{ paddingTop: "0.6rem", paddingBottom: "0.6rem", paddingLeft: "1.45rem", paddingRight: "1.45rem" }}
                        >
                          {label === "남은 시간" && <Clock size={18} className={urgent ? "text-rose-400 animate-spin" : "text-[#CBA7D2]"} />}
                          <span className={`font-extrabold text-sm sm:text-base whitespace-nowrap ${urgent ? "text-rose-300 animate-pulse" : "text-[#CBA7D2]"}`} style={{ fontFamily: "var(--font-chalk)" }}>
                            {label}: <span className="text-gray-800 ml-1">{value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 피라미드 보드 영역 */}
                {!inGameRoom ? (
                  /* 연습 모드: 피라미드 + 정답 확인 버튼 */
                  <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between" style={{ gap: "1.45rem" }}>
                    <div className="flex flex-col items-center justify-center flex-shrink-0 py-2 mx-auto xl:mx-0">
                      {currentPyramidData.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center" style={{ gap: "0.65rem", marginTop: rowIndex === 0 ? "0px" : "-0.65rem" }}>
                          {row.map((node) => (
                            <HexagonCell key={node.id} node={node} isSelected={selectedNodes.includes(node.id)} />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* 우측: 연습 설명 & 정답 확인 (overflow 방지: relative→static, 박스 안에서 스크롤) */}
                    <div className="flex-1 w-full flex flex-col items-center xl:items-stretch" style={{ gap: "0.65rem" }}>
                      <div className="flex items-center gap-2 text-gray-700 font-semibold justify-center xl:justify-start" style={{ fontFamily: "var(--font-chalk)", fontSize: "0.85rem" }}>
                        <Pencil size={16} className="text-[#CBA7D2] flex-shrink-0" />
                        <span>게임 시작을 기다리는 동안 연습해 보세요.</span>
                      </div>

                      {/* 정답 확인 버튼 */}
                      <button
                        type="button"
                        onClick={() => setShowSolutions(!showSolutions)}
                        className="w-full flex items-center justify-center rounded-full bg-gray-50/80 backdrop-blur-md hover:bg-gray-100 border-2 border-dashed border-[#CBA7D2]/80 text-[#CBA7D2] font-bold transition-all cursor-pointer shadow-sm"
                        style={{ paddingTop: "0.45rem", paddingBottom: "0.45rem", gap: "0.65rem", fontFamily: "var(--font-chalk)", fontSize: "1.05rem" }}
                      >
                        <Sparkles size={18} className="text-[#CBA7D2] animate-pulse" />
                        <span>정답 확인 ({validSolutions.length}개 조합)</span>
                        {showSolutions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      {/* 정답 목록: 1열 배치 (4개 조합이 스크롤 없이 한눈에 다 보이도록) */}
                      {showSolutions && (
                        <div
                          className="w-full bg-gray-50/98 rounded-2xl border-2 border-dashed border-[#CBA7D2]/90 shadow-xl backdrop-blur-md flex flex-col"
                          style={{ padding: "0.45rem", gap: "0.25rem" }}
                        >
                          {validSolutions.map((sol, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => { setSelectedNodes(sol.nodes); setTempNotice(null); }}
                              className="w-full flex items-center justify-between rounded-2xl bg-white/90 backdrop-blur-md hover:bg-[#CBA7D2] hover:text-gray-900 text-gray-800 transition-all border border-gray-200/80 cursor-pointer shadow-sm group"
                              style={{ paddingLeft: "0.65rem", paddingRight: "0.65rem", paddingTop: "0.25rem", paddingBottom: "0.25rem", fontFamily: "var(--font-chalk)" }}
                            >
                              <span className="font-black text-[#CBA7D2] group-hover:text-gray-900 tracking-wider" style={{ fontSize: "1.05rem" }}>{sol.nodes.join(" ")}</span>
                              <span className="text-gray-600 group-hover:text-gray-900 font-extrabold tracking-tight" style={{ fontSize: "0.85rem" }}>{sol.formulaStr}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* 방 입장 후: 피라미드 + 이미 제출된 정답 */
                  <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6">
                    <div className="flex flex-col items-center justify-center flex-shrink-0 py-2 mx-auto xl:mx-0">
                      {currentPyramidData.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center gap-2 sm:gap-2.5" style={{ marginTop: rowIndex === 0 ? "0px" : "-10px" }}>
                          {row.map((node) => (
                            // 플레이어 대기 중에는 피라미드 칸 연산 기호를 ? 로 마스킹 (피라미드 칸 클릭 입력 비활성화)
                            <HexagonCell key={node.id} node={node} isSelected={selectedNodes.includes(node.id)} masked={!isGameStarted} />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* 이미 제출된 정답: 3열 그리드 (수식 제외 노드 번호만 표시) */}
                    <div className="relative flex-1 w-full flex flex-col items-stretch gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#CBA7D2] font-extrabold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.25rem" }}>
                          <BookOpen size={20} className="text-[#CBA7D2]" />
                          <span>이미 제출된 정답</span>
                        </div>
                        <span className="text-[#CBA7D2] font-extrabold bg-gray-50 rounded-2xl border border-gray-200/80 shadow-sm" style={{ paddingTop: "0.25rem", paddingBottom: "0.25rem", paddingLeft: "1.45rem", paddingRight: "1.45rem", fontSize: "0.85rem" }}>
                          {currentRoundSubmittedAnswers.length}개
                        </span>
                      </div>
                      <div
                        className="w-full bg-gray-50/98 rounded-2xl border-2 border-dashed border-[#CBA7D2]/90 shadow-lg backdrop-blur-md overflow-y-auto min-h-[120px] max-h-[200px]"
                        style={{ paddingTop: "0.65rem", paddingBottom: "0.65rem", paddingLeft: "1.45rem", paddingRight: "1.45rem" }}
                      >
                        {currentRoundSubmittedAnswers.length > 0 ? (
                          <div className="grid grid-cols-3 gap-1.5">
                            {currentRoundSubmittedAnswers.map((sol: { nodes: string; formula: string; round?: number }, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-center rounded-2xl text-center font-black tracking-normal bg-white/90 text-[#CBA7D2] border border-gray-200/80 shadow-sm whitespace-nowrap"
                                style={{ paddingTop: "0.35rem", paddingBottom: "0.35rem", paddingLeft: "0.25rem", paddingRight: "0.25rem", fontFamily: "var(--font-chalk)", fontSize: "0.95rem" }}
                              >
                                {sol.nodes}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-gray-500 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                            {isGameStarted ? "아직 제출된 정답이 없습니다." : "게임 시작을 기다리는 중입니다..."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="w-full border-t border-dashed border-gray-300/70" style={{ marginTop: "0.45rem", marginBottom: "0.45rem" }} />

                {/* 수식 제출 컨트롤 */}
                <div className="flex flex-col w-full" style={{ gap: "0.85rem" }}>
                  <div
                    className={`w-full rounded-2xl border border-dashed transition-all duration-200 flex items-center justify-between min-h-[58px] h-[58px] ${
                      tempNotice
                        ? tempNotice.type === "success" ? "bg-emerald-950/90 border-emerald-500 text-emerald-200" : "bg-rose-950/90 border-rose-500 text-rose-200"
                        : "bg-white border-gray-300 text-[#CBA7D2]"
                    }`}
                    style={{ padding: "0.65rem" }}
                  >
                    {tempNotice ? (
                      <div className={`flex items-center gap-3 w-full justify-center font-bold ${tempNotice.type === "success" ? "text-emerald-300" : "text-rose-300"}`}>
                        {tempNotice.type === "success" ? <CheckCircle2 size={22} className="text-emerald-400 flex-shrink-0 animate-bounce" /> : tempNotice.type === "error" ? <XCircle size={22} className="text-rose-400 flex-shrink-0 animate-bounce" /> : <AlertTriangle size={22} className="text-rose-400 flex-shrink-0 animate-bounce" />}
                        <span style={{ fontFamily: "var(--font-chalk)", fontSize: "1.25rem" }}>{tempNotice.msg}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600 font-extrabold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.45rem" }}>선택한 수식:</span>
                        <span className="font-black text-[#CBA7D2] tracking-widest" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.85rem" }}>{exprStr || "\u00A0"}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch" style={{ gap: "0.85rem" }}>
                    <div
                      className="bg-white flex flex-col items-center justify-center min-w-[130px] border-2 border-[#CBA7D2] shadow-md rounded-2xl"
                      style={{ padding: "0.45rem 1.05rem" }}
                    >
                      <span
                        className="text-[#CBA7D2] font-extrabold tracking-widest leading-none"
                        style={{ fontFamily: "var(--font-chalk)", fontSize: "1.05rem", marginBottom: "0.45rem" }}
                      >
                        TARGET
                      </span>
                      <span
                        className="text-gray-800 font-black leading-none"
                        style={{ fontFamily: "var(--font-chalk)", fontSize: "3.05rem" }}
                      >
                        {inGameRoom && !isGameStarted ? "?" : currentTargetNumber}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col">
                      {/* 정답 입력 문구 */}
                      <div
                        className="text-[#CBA7D2] font-extrabold flex items-center gap-1.5"
                        style={{ fontFamily: "var(--font-chalk)", fontSize: "1.05rem", lineHeight: "1.2", marginBottom: "0.45rem" }}
                      >
                        <span>정답 입력</span>
                      </div>

                      {/* 입력 버튼 묶음 (A~E와 F~J 사이 간격 0.65rem) */}
                      <div className="flex flex-col" style={{ gap: "0.65rem" }}>
                        {/* A~E 입력칸 */}
                        <div className="grid grid-cols-5" style={{ gap: "0.65rem" }}>
                          {Object.values(currentAllNodes).slice(0, 5).map((node) => {
                            const isSel = selectedNodes.includes(node.id);
                            return (
                              <button
                                key={node.id}
                                type="button"
                                onClick={() => handleNodeClick(node.id)}
                                className={`rounded-2xl font-black transition-all ${
                                  isSel ? "bg-[#CBA7D2] text-gray-900 scale-105 shadow-sm" : "bg-gray-100/90 text-gray-800 hover:bg-gray-200"
                                }`}
                                style={{ padding: "0.45rem 0.45rem", fontFamily: "var(--font-chalk)", fontSize: "1.25rem" }}
                              >
                                {node.id}
                              </button>
                            );
                          })}
                        </div>

                        {/* F~J 입력칸 */}
                        <div className="grid grid-cols-5" style={{ gap: "0.65rem" }}>
                          {Object.values(currentAllNodes).slice(5, 10).map((node) => {
                            const isSel = selectedNodes.includes(node.id);
                            return (
                              <button
                                key={node.id}
                                type="button"
                                onClick={() => handleNodeClick(node.id)}
                                className={`rounded-2xl font-black transition-all ${
                                  isSel ? "bg-[#CBA7D2] text-gray-900 scale-105 shadow-sm" : "bg-gray-100/90 text-gray-800 hover:bg-gray-200"
                                }`}
                                style={{ padding: "0.45rem 0.45rem", fontFamily: "var(--font-chalk)", fontSize: "1.25rem" }}
                              >
                                {node.id}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={penaltyLockSeconds > 0 || isRoundLocked}
                    onClick={handleSubmitAnswer}
                    className={`btn-chalk w-full justify-center font-extrabold shadow-lg transition-all ${
                      penaltyLockSeconds > 0 || isRoundLocked
                        ? "bg-rose-950/90 border-2 border-rose-500/80 text-rose-300 opacity-90 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    style={{ padding: "0.65rem 1.45rem", fontFamily: "var(--font-chalk)", fontSize: "1.45rem", letterSpacing: penaltyLockSeconds > 0 ? "0.02em" : "0.35em" }}
                  >
                    {isRoundLocked ? (
                      <div className="flex items-center justify-center gap-2 py-0.5">
                        <Lock size={22} className="text-rose-400 flex-shrink-0" />
                        <span className="text-rose-200 font-bold" style={{ fontFamily: "var(--font-body)", fontSize: "1.05rem", letterSpacing: "-0.015em" }}>라운드 종료 - 입력 불가</span>
                      </div>
                    ) : penaltyLockSeconds > 0 ? (
                      <div className="flex items-center justify-center gap-2 py-0.5">
                        <Lock size={22} className="text-[#CBA7D2] animate-pulse flex-shrink-0" />
                        <span className="text-rose-200 font-bold" style={{ fontFamily: "var(--font-body)", fontSize: "1.05rem", letterSpacing: "-0.015em" }}>{penaltyLockSeconds}초 동안 정답을 입력할 수 없습니다.</span>
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
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/85 rounded-2xl backdrop-blur-sm">
                    <div className="w-full flex items-center justify-center bg-white/90 rounded-2xl border-2 border-dashed border-gray-300/90 shadow-sm text-center" style={{ paddingTop: "0.85rem", paddingBottom: "0.85rem" }}>
                      <div className="text-gray-800 font-medium flex items-center justify-center gap-3" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.05rem" }}>
                        <Megaphone size={20} className="text-[#CBA7D2] flex-shrink-0 animate-bounce" />
                        <span>우측 [방 생성하기]를 클릭하면 딜러 대시보드가 실시간으로 연결됩니다.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 딜러 대시보드 */}
                <div className={`flex flex-col gap-4 w-full${!inGameRoom ? " invisible" : ""}`}>
                  {/* 딜러 상태 바: 방 정보 + 우측에 퇴장 버튼 */}
                  <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-3 flex-wrap">
                      {[
                        { label: "라운드", value: `${currentRound} / ${selectedRound}` },
                        { label: "남은 시간", value: !isGameStarted ? `${formatTime(roomTimerSeconds)} (대기 중)` : formatTime(roomTimerSeconds), urgent: roomTimerSeconds <= 30 && isGameStarted },
                        { label: "오답 패널티", value: selectedPenalty },
                      ].map(({ label, value, urgent = false }) => (
                        <div
                          key={label}
                          className={`border-2 border-dashed rounded-2xl flex items-center gap-2 shadow-sm ${urgent ? "border-rose-500/90 bg-rose-950/80" : "border-gray-300/80 bg-gray-50/80 backdrop-blur-md"}`}
                          style={{ paddingTop: "0.6rem", paddingBottom: "0.6rem", paddingLeft: "1.45rem", paddingRight: "1.45rem" }}
                        >
                          {label === "남은 시간" && <Clock size={18} className={urgent ? "text-rose-400 animate-spin" : "text-[#CBA7D2]"} />}
                          <span className={`font-extrabold text-sm sm:text-base whitespace-nowrap ${urgent ? "text-rose-300 animate-pulse" : "text-[#CBA7D2]"}`} style={{ fontFamily: "var(--font-chalk)" }}>
                            {label}: <span className="text-gray-800 ml-1">{value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* 퇴장 버튼만 상태바 우측에 */}
                    {inGameRoom && (
                      <button
                        type="button" onClick={handleLeaveRoom}
                        className="flex items-center justify-center gap-2 bg-rose-900/90 hover:bg-rose-800 text-rose-100 rounded-2xl text-sm sm:text-base font-extrabold border-2 border-rose-600/90 cursor-pointer shadow-lg transition-all"
                        style={{ paddingTop: "0.65rem", paddingBottom: "0.65rem", paddingLeft: "1.45rem", paddingRight: "1.45rem", fontFamily: "var(--font-chalk)" }}
                      >
                        <LogOut size={18} className="flex-shrink-0" />
                        <span className="whitespace-nowrap">퇴장</span>
                      </button>
                    )}
                  </div>

                  {/* 피라미드 보드 (딜러) - 게임 시작 전 마스킹 */}
                  <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 mb-1">
                    {/* 좌측: TARGET 가로 바 + 피라미드 (살짝 밑으로 이동) */}
                    <div className="flex flex-col items-center justify-center flex-shrink-0 mx-auto xl:mx-0 w-full xl:w-auto" style={{ gap: "0.85rem" }}>
                      {/* 가로로 긴 TARGET 바 (양쪽 정렬) */}
                      <div
                        className="w-full bg-white flex items-center justify-between border-2 border-[#CBA7D2] shadow-md rounded-2xl"
                        style={{ paddingLeft: "1.45rem", paddingRight: "1.45rem", paddingTop: "0.55rem", paddingBottom: "0.55rem" }}
                      >
                        <span
                          className="text-[#CBA7D2] font-extrabold tracking-widest leading-none"
                          style={{ fontFamily: "var(--font-chalk)", fontSize: "1.25rem" }}
                        >
                          TARGET
                        </span>
                        <span
                          className="text-gray-800 font-black leading-none"
                          style={{ fontFamily: "var(--font-chalk)", fontSize: "1.85rem" }}
                        >
                          {isGameStarted ? currentTargetNumber : "?"}
                        </span>
                      </div>

                      {/* 피라미드 (살짝 밑으로 이동) */}
                      <div className="flex flex-col items-center justify-center py-1">
                        {currentPyramidData.map((row, rowIndex) => (
                          <div key={rowIndex} className="flex justify-center gap-2 sm:gap-2.5" style={{ marginTop: rowIndex === 0 ? "0px" : "-10px" }}>
                            {row.map((node) => (
                              <HexagonCell key={node.id} node={node} isSelected={false} masked={!isGameStarted && inGameRoom} />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 전체 정답 보기 + 점수판 */}
                    <div className="relative flex-1 w-full flex flex-col items-stretch gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#CBA7D2] font-extrabold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.25rem" }}>
                          <BookOpen size={20} className="text-[#CBA7D2]" />
                          <span>전체 정답 보기</span>
                        </div>
                        <span className="text-[#CBA7D2] font-extrabold bg-gray-50 rounded-2xl border border-gray-200/80 shadow-sm" style={{ paddingTop: "0.25rem", paddingBottom: "0.25rem", paddingLeft: "1.45rem", paddingRight: "1.45rem", fontSize: "0.85rem" }}>
                          총 {isGameStarted ? `${validSolutions.length}개` : "?개"}
                        </span>
                      </div>
                      {/* 3열 그리드: 게임 시작 전에는 목록 비움, 게임 시작 후에는 칸 번호만 표시 및 맞춘 정답 초록 강조 */}
                      <div
                        className="w-full bg-gray-50/98 rounded-2xl border-2 border-dashed border-[#CBA7D2]/90 shadow-lg backdrop-blur-md overflow-y-auto min-h-[120px] max-h-[180px]"
                        style={{ paddingTop: "0.65rem", paddingBottom: "0.65rem", paddingLeft: "1.45rem", paddingRight: "1.45rem" }}
                      >
                        {isGameStarted ? (
                          validSolutions.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1.5">
                              {validSolutions.map((sol, idx) => {
                                const isSubmitted = currentRoundSubmittedAnswers.some(
                                  (a: { nodes: string; formula: string; round?: number }) => normalizeNodesKey(a.nodes) === normalizeNodesKey(sol.nodes)
                                );
                                return (
                                  <div
                                    key={idx}
                                    className={`flex items-center justify-center rounded-2xl text-center font-black tracking-normal transition-all whitespace-nowrap ${
                                      isSubmitted
                                        ? "bg-emerald-700/90 border-2 border-emerald-400 text-emerald-200 shadow-sm"
                                        : "bg-white/80 border border-gray-200/70 text-gray-600"
                                    }`}
                                    style={{ paddingTop: "0.35rem", paddingBottom: "0.35rem", paddingLeft: "0.25rem", paddingRight: "0.25rem", fontFamily: "var(--font-chalk)", fontSize: "0.95rem" }}
                                  >
                                    {sol.nodes.join(" ")}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-gray-500 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                              정답 조합 없음
                            </div>
                          )
                        ) : (
                          <div className="py-6 text-center text-gray-500 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                            게임이 시작되면 전체 정답이 표시됩니다.
                          </div>
                        )}
                      </div>

                      {/* 딜러 점수판 */}
                      <ScoreBoard players={players} myNickname={myNickname} maxH="130px" />
                    </div>
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
                <div className="flex flex-col text-gray-700 leading-relaxed py-1 overflow-y-auto" style={{ gap: "0.85rem", fontFamily: "var(--font-chalk)", fontSize: "0.85rem", wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                  {/* ① 게임 소개 */}
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">①</span>
                    <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                      <strong className="text-[#CBA7D2] font-bold">&lsquo;수식 피라미드&rsquo;</strong>는 문제 판에서 3개의 칸을 선택하여 타깃 넘버가 될 수 있도록 수식을 만드는 게임입니다.
                    </p>
                  </div>

                  {/* ② 문제판 설명 */}
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">②</span>
                    <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                      라운드가 시작되면 피라미드 모양의 문제판과 타깃 넘버가 공개됩니다. 문제판은 총 10개의 칸으로 이루어져 있으며, 각 칸에는 사칙연산 기호 중 하나와 숫자가 한 쌍을 이루고 있습니다.
                    </p>
                  </div>

                  {/* ③ 조합 규칙 (②와 ④ 사이) */}
                  <div className="flex flex-col gap-2" style={{ marginBottom: "0.2rem" }}>
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">③</span>
                      <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                        문제판이 공개되면 이 중 3개의 칸을 조합해 타깃 넘버가 답이 되는 수식을 만들어야 합니다.
                      </p>
                    </div>
                    <div
                      className="w-full rounded-2xl shadow-lg border-2 border-dashed border-[#CBA7D2]/90 bg-gray-50/80 backdrop-blur-md"
                      style={{ padding: "0.65rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}
                    >
                      {[
                        "동일한 칸은 중복선택할 수 없습니다.",
                        "수식의 맨 앞에 사용된 칸의 연산 기호는 무시합니다.",
                        "완성된 수식은 사칙연산 순서에 따라 계산됩니다.",
                      ].map((rule) => (
                        <div key={rule} className="flex items-start gap-2.5 text-gray-600 font-medium" style={{ fontSize: "0.85rem", lineHeight: "1.5", letterSpacing: "-0.015em" }}>
                          <AlertTriangle size={16} className="flex-shrink-0 text-[#CBA7D2] mt-0.5" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ④ 점수 */}
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">④</span>
                    <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                      정답을 제출하면 1점을 획득하고, 오답을 제출하거나 이번 라운드에서 이미 제출된 정답을 다시 제출하는 경우 1점이 감점됩니다.
                    </p>
                  </div>

                  {/* ⑤ 종료 */}
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-bold text-[#CBA7D2] w-5">⑤</span>
                    <p className="flex-1 leading-relaxed" style={{ wordBreak: "break-all", letterSpacing: "-0.015em" }}>
                      라운드 진행 시간이 지났거나 모든 정답이 제출되면 라운드가 종료됩니다.
                    </p>
                  </div>
                </div>
              </>
            ) : inGameRoom && isDealerHost ? (
              /* ── 딜러 방 생성 후: 실시간 게임 공지 (게임 생성 폼과 동일한 크기 고정 및 스크롤) ── */
              <div className="flex flex-col justify-between flex-1 h-full min-h-[460px]">
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-3 w-full min-h-[44px]">
                    <Megaphone className="text-[#CBA7D2] flex-shrink-0" size={28} />
                    <h2 className="text-[#CBA7D2] font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.85rem", lineHeight: 1.1 }}>
                      실시간 게임 공지
                    </h2>
                  </div>
                  <div className="w-full border-t border-dashed border-gray-200" style={{ marginTop: "0.85rem", marginBottom: "0.85rem" }} />

                  {/* 말머리 기준 들여쓰기된 실시간 공지 리스트 (시간순 위->아래 배치 & 스크롤) */}
                  <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1.5 max-h-[420px]">
                    {activityLogs.length > 0 ? (
                      activityLogs.map((log) => {
                        const tag = log.tag || "[안내]";
                        const text = log.text || "";

                        const isCorrect = tag === "[정답]";
                        const isWrong = tag === "[오답]";
                        const isJoin = tag === "[입장]";
                        const isLeave = tag === "[퇴장]";

                        return (
                          <div
                            key={log.id}
                            className="flex items-start gap-2.5 leading-relaxed py-0.5"
                            style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}
                          >
                            <span
                              className={`flex-shrink-0 font-extrabold text-base sm:text-lg ${
                                isCorrect
                                  ? "text-[#CBA7D2]"
                                  : isWrong
                                  ? "text-rose-400"
                                  : isJoin
                                  ? "text-emerald-400"
                                  : isLeave
                                  ? "text-gray-500"
                                  : "text-cyan-300"
                              }`}
                              style={{ fontFamily: "var(--font-chalk)" }}
                            >
                              {tag}
                            </span>
                            <span
                              className={`flex-1 ${
                                isCorrect
                                  ? "text-gray-600 font-bold"
                                  : isWrong
                                  ? "text-rose-200 font-semibold"
                                  : "text-gray-700"
                              }`}
                              style={{ wordBreak: "break-all" }}
                            >
                              {text}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-16 text-center text-gray-500 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                        공지 내역이 여기에 실시간으로 표시됩니다.
                      </div>
                    )}
                    <div ref={logsEndRef} />
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
                    {/* 라운드 설정 */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between w-full text-gray-700 font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.05rem", letterSpacing: "-0.015em" }}>
                        <span>라운드 설정</span>
                        <span className="text-[#CBA7D2]">({selectedRound}라운드)</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((r) => (
                          <button key={r} type="button" onClick={() => setSelectedRound(r)}
                            className={`py-1 rounded-2xl transition-all font-bold cursor-pointer ${selectedRound === r ? "bg-[#CBA7D2] text-gray-900 shadow-sm" : "bg-gray-50/80 backdrop-blur-md text-gray-600 hover:bg-gray-100"}`}
                            style={{ fontFamily: "var(--font-chalk)", fontSize: "0.85rem", letterSpacing: "-0.015em" }}
                          >{r}R</button>
                        ))}
                      </div>
                    </div>

                    {/* 시간 설정 */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between w-full text-gray-700 font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.05rem", letterSpacing: "-0.015em" }}>
                        <span>라운드 별 시간</span>
                        <span className="text-[#CBA7D2]">({selectedTime}분)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[3, 5, 7].map((t) => (
                          <button key={t} type="button" onClick={() => setSelectedTime(t)}
                            className={`py-1 rounded-2xl transition-all font-bold cursor-pointer ${selectedTime === t ? "bg-[#CBA7D2] text-gray-900 shadow-sm" : "bg-gray-50/80 backdrop-blur-md text-gray-600 hover:bg-gray-100"}`}
                            style={{ fontFamily: "var(--font-chalk)", fontSize: "0.85rem", letterSpacing: "-0.015em" }}
                          >{t}분</button>
                        ))}
                      </div>
                    </div>

                    {/* 페널티 설정 */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between w-full text-gray-700 font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.05rem", letterSpacing: "-0.015em" }}>
                        <span>오답 페널티</span>
                        <span className="text-[#CBA7D2]">({selectedPenalty})</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {["없음", "1초", "2초", "3초", "4초", "5초"].map((p) => (
                          <button key={p} type="button" onClick={() => setSelectedPenalty(p)}
                            className={`py-1 rounded-2xl transition-all font-bold cursor-pointer ${selectedPenalty === p ? "bg-[#CBA7D2] text-gray-900 shadow-sm" : "bg-gray-50/80 backdrop-blur-md text-gray-600 hover:bg-gray-100"}`}
                            style={{ fontFamily: "var(--font-chalk)", fontSize: "0.85rem", letterSpacing: "-0.015em" }}
                          >{p}</button>
                        ))}
                      </div>
                    </div>
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
    </div>
  );
}
