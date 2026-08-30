/**
 * src/app/triangle-centers/page.tsx
 * 삼각형의 외심과 내심 — 기하 도구 페이지
 *
 * [레이아웃]
 * - 좌측 (xl:col-span-3): 도구 선택 패널 (점 / 선분)
 * - 우측 (xl:col-span-9): SVG 도화지 (클릭으로 점 찍기 / 선분 그리기)
 */

"use client";

import { useState, useRef, useCallback } from "react";

/* ── 타입 ── */
type Tool = "점" | "선분";
interface Point {
  id: string;
  x: number;
  y: number;
  label: string;
}
interface Segment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/* ── 점 라벨 생성 (A, B, C, … Z, A', …) ── */
const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
function makeLabel(index: number): string {
  const base = LABELS[index % 26];
  const prime = Math.floor(index / 26);
  return base + "'".repeat(prime);
}

export default function TriangleCentersPage() {
  const [activeTool, setActiveTool] = useState<Tool>("점");
  const [points, setPoints] = useState<Point[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [pendingStart, setPendingStart] = useState<Point | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  /* SVG 좌표 변환 */
  const getSVGCoords = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: Math.round(e.clientX - rect.left),
        y: Math.round(e.clientY - rect.top),
      };
    },
    []
  );

  /* 캔버스 클릭 처리 */
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const { x, y } = getSVGCoords(e);

      if (activeTool === "점") {
        const id = `pt_${Date.now()}`;
        const label = makeLabel(points.length);
        setPoints((prev) => [...prev, { id, x, y, label }]);
      } else if (activeTool === "선분") {
        if (!pendingStart) {
          /* 선분 시작점: 가장 가까운 기존 점을 우선 연결 대상으로 허용하되, 빈 곳 클릭 시 새 점 추가 */
          const snapped = findNearestPoint(points, x, y, 12);
          if (snapped) {
            setPendingStart(snapped);
          } else {
            const id = `pt_${Date.now()}`;
            const label = makeLabel(points.length);
            const newPt: Point = { id, x, y, label };
            setPoints((prev) => [...prev, newPt]);
            setPendingStart(newPt);
          }
        } else {
          /* 선분 끝점 */
          const snapped = findNearestPoint(points, x, y, 12);
          let endPt: Point;
          if (snapped && snapped.id !== pendingStart.id) {
            endPt = snapped;
          } else if (!snapped) {
            const id = `pt_${Date.now()}`;
            const label = makeLabel(points.length);
            endPt = { id, x, y, label };
            setPoints((prev) => [...prev, endPt]);
          } else {
            setPendingStart(null);
            return;
          }
          const segId = `seg_${Date.now()}`;
          setSegments((prev) => [
            ...prev,
            { id: segId, x1: pendingStart.x, y1: pendingStart.y, x2: endPt.x, y2: endPt.y },
          ]);
          setPendingStart(null);
        }
      }
    },
    [activeTool, points, pendingStart, getSVGCoords]
  );

  /* 마우스 이동 — 선분 미리보기용 */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (activeTool === "선분" && pendingStart) {
        setCursorPos(getSVGCoords(e));
      } else {
        setCursorPos(null);
      }
    },
    [activeTool, pendingStart, getSVGCoords]
  );

  /* 전체 초기화 */
  const handleClear = () => {
    setPoints([]);
    setSegments([]);
    setPendingStart(null);
    setCursorPos(null);
  };

  const tools: { name: Tool; icon: string }[] = [
    { name: "점", icon: "•" },
    { name: "선분", icon: "/" },
  ];

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
        {/* ─── 3분할 → 좌(3) + 우(9) ─────────────────────── */}
        <div
          className="grid grid-cols-1 xl:grid-cols-12 items-stretch"
          style={{ gap: "1.45rem", marginTop: "0.85rem" }}
        >
          {/* ════ [좌측] 도구 선택 ════ */}
          <div
            className="xl:col-span-3 chalk-box flex flex-col bg-white/80 backdrop-blur-md"
            style={{ padding: "0.85rem" }}
          >
            <div className="flex items-center gap-3 w-full min-h-[44px]">
              <h2
                className="text-[#CBA7D2] font-bold"
                style={{ fontFamily: "var(--font-chalk)", fontSize: "1.85rem", lineHeight: 1.1 }}
              >
                도구 선택
              </h2>
            </div>
            <div
              className="w-full border-t border-dashed border-gray-300/70"
              style={{ marginTop: "0.85rem", marginBottom: "0.85rem" }}
            />

            {/* 도구 버튼 목록 */}
            <div className="flex flex-col gap-3 flex-1">
              {tools.map(({ name, icon }) => {
                const isActive = activeTool === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setActiveTool(name);
                      setPendingStart(null);
                      setCursorPos(null);
                    }}
                    className={`w-full flex items-center gap-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#CBA7D2]/20 border-[#CBA7D2] shadow-md"
                        : "bg-gray-50/80 border-gray-200 hover:bg-gray-100/80 hover:border-[#CBA7D2]/50"
                    }`}
                    style={{ padding: "0.75rem 1.1rem", fontFamily: "var(--font-chalk)" }}
                  >
                    <span
                      className={`text-2xl leading-none flex-shrink-0 w-7 text-center ${
                        isActive ? "text-[#CBA7D2]" : "text-gray-400"
                      }`}
                    >
                      {icon}
                    </span>
                    <span
                      className={`font-extrabold text-lg ${
                        isActive ? "text-[#CBA7D2]" : "text-gray-500"
                      }`}
                    >
                      {name}
                    </span>
                    {isActive && (
                      <span
                        className="ml-auto text-xs font-bold text-[#CBA7D2] border border-[#CBA7D2]/50 rounded-full px-2 py-0.5"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        선택됨
                      </span>
                    )}
                  </button>
                );
              })}

              {/* 선분 도구 안내 */}
              {activeTool === "선분" && (
                <div
                  className="rounded-2xl bg-[#CBA7D2]/10 border border-dashed border-[#CBA7D2]/40 text-[#CBA7D2] text-xs leading-relaxed"
                  style={{ padding: "0.65rem 1rem", fontFamily: "var(--font-body)", marginTop: "0.25rem" }}
                >
                  {pendingStart ? (
                    <>
                      <span className="font-bold">{pendingStart.label}</span> 에서 시작 —
                      끝점을 클릭하세요.
                    </>
                  ) : (
                    "시작점을 클릭하세요."
                  )}
                </div>
              )}

              {/* 초기화 버튼 */}
              <button
                type="button"
                onClick={handleClear}
                className="mt-auto w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300/60 text-rose-400 hover:bg-rose-50/60 transition-all cursor-pointer font-bold"
                style={{ padding: "0.65rem 1rem", fontFamily: "var(--font-chalk)", fontSize: "1.05rem", marginTop: "auto" }}
              >
                초기화
              </button>
            </div>
          </div>

          {/* ════ [우측] 도화지 ════ */}
          <div
            className="xl:col-span-9 chalk-box flex flex-col bg-white/85 backdrop-blur-md"
            style={{ padding: "0.85rem", minHeight: "520px" }}
          >
            {/* SVG 캔버스 */}
            <svg
              ref={svgRef}
              className="w-full flex-1 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.97)",
                border: "1.5px dashed rgba(203,167,210,0.35)",
                cursor: activeTool === "선분"
                  ? pendingStart ? "crosshair" : "cell"
                  : "crosshair",
                minHeight: "460px",
              }}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setCursorPos(null)}
            >
              {/* 연한 격자 */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="rgba(203,167,210,0.12)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" rx="12" />

              {/* 선분들 */}
              {segments.map((seg) => (
                <line
                  key={seg.id}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke="#4B5563"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              ))}

              {/* 선분 미리보기 (그리는 중) */}
              {activeTool === "선분" && pendingStart && cursorPos && (
                <line
                  x1={pendingStart.x}
                  y1={pendingStart.y}
                  x2={cursorPos.x}
                  y2={cursorPos.y}
                  stroke="#CBA7D2"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                />
              )}

              {/* 점들 */}
              {points.map((pt) => {
                const isPending = pendingStart?.id === pt.id;
                return (
                  <g key={pt.id}>
                    {/* 강조 링 (선분 시작점) */}
                    {isPending && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={10}
                        fill="rgba(203,167,210,0.25)"
                        stroke="#CBA7D2"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={5}
                      fill={isPending ? "#CBA7D2" : "#374151"}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                    {/* 라벨 */}
                    <text
                      x={pt.x + 9}
                      y={pt.y - 7}
                      fill={isPending ? "#CBA7D2" : "#4B5563"}
                      fontSize={13}
                      fontWeight="bold"
                      style={{ fontFamily: "var(--font-chalk)", userSelect: "none" }}
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 헬퍼: 가장 가까운 점 찾기 ── */
function findNearestPoint(points: Point[], x: number, y: number, threshold: number): Point | null {
  let nearest: Point | null = null;
  let minDist = threshold;
  for (const pt of points) {
    const d = Math.hypot(pt.x - x, pt.y - y);
    if (d < minDist) {
      minDist = d;
      nearest = pt;
    }
  }
  return nearest;
}
