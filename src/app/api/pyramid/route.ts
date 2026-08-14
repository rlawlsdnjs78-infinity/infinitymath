/**
 * src/app/api/pyramid/route.ts
 * 수식 피라미드 멀티 디바이스(PC, 태블릿, 모바일) 실시간 방 동기화 API
 */

import { NextRequest, NextResponse } from "next/server";

export interface RoomPlayer {
  name: string;
  score: number;
  isHost?: boolean;
  lastSeen?: number;
}

export interface RoomData {
  roomCode: string;
  selectedRound: number;
  selectedTime: number;
  selectedPenalty: string;
  selectedBoardId: number;
  currentRound: number;
  isGameStarted: boolean;
  roomEndTime: number | null;
  players: RoomPlayer[];
  submittedAnswersList: { nodes: string; formula: string }[];
  activityLogs: string[];
  lastUpdated: number;
  usedBoardIds: number[];
}

// 서버 인메모리 룸 저장소 (글로벌 싱글톤)
declare global {
  // eslint-disable-next-line no-var
  var __pyramidRooms: Map<string, RoomData> | undefined;
}

const getRoomsMap = (): Map<string, RoomData> => {
  if (!globalThis.__pyramidRooms) {
    globalThis.__pyramidRooms = new Map<string, RoomData>();
  }
  return globalThis.__pyramidRooms;
};

// GET: 방 상태 조회 (Status Polling)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomCode = searchParams.get("roomCode")?.toUpperCase();

  if (!roomCode) {
    return NextResponse.json({ error: "Room code is required" }, { status: 400 });
  }

  const rooms = getRoomsMap();
  const room = rooms.get(roomCode);

  if (!room) {
    return NextResponse.json({ exists: false, room: null });
  }

  return NextResponse.json({ exists: true, room });
}

// POST: 방 생성, 입장, 상태 갱신, 퇴장 등 액션 처리
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, roomCode: rawCode, payload } = body;
    const roomCode = rawCode?.toUpperCase();

    if (!roomCode) {
      return NextResponse.json({ error: "Room code is required" }, { status: 400 });
    }

    const rooms = getRoomsMap();
    let room = rooms.get(roomCode);

    if (action === "CREATE") {
      const newRoom: RoomData = {
        roomCode,
        selectedRound: payload.selectedRound || 1,
        selectedTime: payload.selectedTime || 3,
        selectedPenalty: payload.selectedPenalty || "없음",
        selectedBoardId: payload.selectedBoardId || 1,
        currentRound: payload.currentRound || 1,
        isGameStarted: false,
        roomEndTime: null,
        players: [{ name: payload.hostName || "딜러(선생님)", score: 0, isHost: true, lastSeen: Date.now() }],
        submittedAnswersList: [],
        activityLogs: [`[안내] 딜러 방 [${roomCode}] 가 생성되었습니다.`],
        lastUpdated: Date.now(),
        usedBoardIds: [],
      };
      rooms.set(roomCode, newRoom);
      return NextResponse.json({ success: true, room: newRoom });
    }

    if (!room) {
      return NextResponse.json({ error: "Room not found", exists: false }, { status: 404 });
    }

    if (action === "JOIN") {
      const playerName = payload.playerName?.trim();
      if (!playerName) {
        return NextResponse.json({ error: "Player name is required" }, { status: 400 });
      }

      const existingPlayer = room.players.find((p) => p.name === playerName);
      if (!existingPlayer) {
        room.players.push({ name: playerName, score: 0, isHost: false, lastSeen: Date.now() });
        room.activityLogs = [`[실시간] ${playerName} 님이 참가했습니다.`, ...room.activityLogs.slice(0, 30)];
      } else {
        existingPlayer.lastSeen = Date.now();
      }
      room.lastUpdated = Date.now();
      return NextResponse.json({ success: true, room });
    }

    if (action === "START_GAME") {
      room.isGameStarted = true;
      room.selectedBoardId = payload.selectedBoardId;
      room.currentRound = payload.currentRound || room.currentRound;
      room.roomEndTime = payload.roomEndTime;
      room.submittedAnswersList = [];
      if (payload.usedBoardIds) {
        room.usedBoardIds = payload.usedBoardIds;
      }
      room.activityLogs = [
        `[안내] ${room.currentRound}라운드가 시작되었습니다! (TARGET: ${payload.target || 10})`,
        ...room.activityLogs.slice(0, 30),
      ];
      room.lastUpdated = Date.now();
      return NextResponse.json({ success: true, room });
    }

    if (action === "SCORE_UPDATE") {
      const { playerName, newScore, submittedAnswer, roundFinish } = payload;
      const targetPlayer = room.players.find((p) => p.name === playerName);
      if (targetPlayer) {
        targetPlayer.score = newScore;
      }
      if (submittedAnswer) {
        if (!room.submittedAnswersList.some((a) => a.nodes === submittedAnswer.nodes)) {
          room.submittedAnswersList.push(submittedAnswer);
        }
        room.activityLogs = [
          `[정답] ${playerName} 님이 정답 제출! (${submittedAnswer.nodes} -> ${newScore}점)`,
          ...room.activityLogs.slice(0, 30),
        ];
      }

      if (roundFinish) {
        room.roomEndTime = Date.now();
      }
      room.lastUpdated = Date.now();
      return NextResponse.json({ success: true, room });
    }

    if (action === "LEAVE") {
      const { playerName } = payload;
      room.players = room.players.filter((p) => p.name !== playerName);
      room.activityLogs = [`[실시간] ${playerName} 님이 퇴장했습니다.`, ...room.activityLogs.slice(0, 30)];
      if (room.players.length === 0) {
        rooms.delete(roomCode);
      } else {
        room.lastUpdated = Date.now();
      }
      return NextResponse.json({ success: true, room: room.players.length === 0 ? null : room });
    }

    if (action === "HEARTBEAT") {
      const { playerName } = payload;
      const p = room.players.find((item) => item.name === playerName);
      if (p) p.lastSeen = Date.now();
      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
