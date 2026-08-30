/**
 * src/app/triangle-centers/page.tsx
 * 삼각형의 외심과 내심 — 기하 도구 페이지
 *
 * [레이아웃]
 * - 좌측 (xl:col-span-3): 도구 선택 패널 — 선택 / 점 / 선분 (3열 그리드)
 * - 우측 (xl:col-span-9): SVG 도화지
 */

"use client";

import { useState, useRef, useCallback, useMemo } from "react";

/* ═══════════════ 타입 ═══════════════ */
type Tool = "선택" | "점" | "선분";

interface Point {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface Segment {
  id: string;
  p1Id: string;
  p2Id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

type SelectedItem =
  | { type: "point"; id: string }
  | { type: "segment"; id: string }
  | null;

/* ═══════════════ 상수 ═══════════════ */
const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const POLY_COLORS = [
  { fill: "#FF9AA2", stroke: "#E57373" },
  { fill: "#FFB7B2", stroke: "#FF8A65" },
  { fill: "#FFDAC1", stroke: "#FFB74D" },
  { fill: "#E2F0CB", stroke: "#81C784" },
  { fill: "#B5EAD7", stroke: "#4DB6AC" },
  { fill: "#C7CEEA", stroke: "#7986CB" },
  { fill: "#F4C2C2", stroke: "#EF9A9A" },
  { fill: "#D4F0F0", stroke: "#80DEEA" },
  { fill: "#FCE1E4", stroke: "#F48FB1" },
  { fill: "#DDC9FF", stroke: "#CE93D8" },
];

/* ═══════════════ 순수 헬퍼 함수 (컴포넌트 바깥) ═══════════════ */

function makeLabel(index: number): string {
  return LABELS[index % 26] + "'".repeat(Math.floor(index / 26));
}

function nearestPoint(pts: Point[], x: number, y: number, threshold: number): Point | null {
  let best: Point | null = null;
  let minD = threshold;
  for (const p of pts) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < minD) { minD = d; best = p; }
  }
  return best;
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function canonicalizeCycle(cycle: string[]): string[] {
  const n = cycle.length;
  let minIdx = 0;
  for (let i = 1; i < n; i++) if (cycle[i] < cycle[minIdx]) minIdx = i;
  const rot = [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)];
  const rev = [rot[0], ...rot.slice(1).reverse()];
  for (let i = 0; i < n; i++) {
    if (rot[i] < rev[i]) return rot;
    if (rot[i] > rev[i]) return rev;
  }
  return rot;
}

function findAllCycles(adj: Map<string, string[]>, maxLen = 10): string[][] {
  const result: string[][] = [];
  const seen = new Set<string>();

  const dfs = (start: string, cur: string, path: string[], visited: Set<string>) => {
    if (path.length > maxLen) return;
    for (const next of (adj.get(cur) ?? [])) {
      if (next === start && path.length >= 3) {
        const key = canonicalizeCycle(path).join("|");
        if (!seen.has(key)) { seen.add(key); result.push(canonicalizeCycle(path)); }
      } else if (!visited.has(next)) {
        visited.add(next);
        dfs(start, next, [...path, next], visited);
        visited.delete(next);
      }
    }
  };

  for (const node of adj.keys()) dfs(node, node, [node], new Set([node]));
  return result;
}

function strHashIndex(s: string, len: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h) % len;
}

/* ═══════════════ 메인 컴포넌트 ═══════════════ */
export default function TriangleCentersPage() {
  const [activeTool, setActiveTool] = useState<Tool>("선택");
  const [points, setPoints] = useState<Point[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [pendingStart, setPendingStart] = useState<Point | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  /* SVG 좌표 계산 */
  const getCoords = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) };
  }, []);

  /* 닫힌 다각형 감지 */
  const polygons = useMemo(() => {
    if (points.length < 3 || segments.length < 3) return [];
    const adj = new Map<string, string[]>();
    for (const p of points) adj.set(p.id, []);
    for (const s of segments) {
      if (adj.has(s.p1Id) && adj.has(s.p2Id)) {
        adj.get(s.p1Id)!.push(s.p2Id);
        adj.get(s.p2Id)!.push(s.p1Id);
      }
    }
    const ptMap = new Map(points.map(p => [p.id, p]));
    return findAllCycles(adj)
      .map(cycle => ({ cycle, pts: cycle.map(id => ptMap.get(id)).filter(Boolean) as Point[] }))
      .filter(({ pts }) => pts.length >= 3)
      .map(({ cycle, pts }) => {
        const key = cycle.join("|");
        const colorIdx = strHashIndex(key, POLY_COLORS.length);
        return { id: `poly_${key}`, pts, color: POLY_COLORS[colorIdx] };
      });
  }, [points, segments]);

  /* 삭제 버튼 위치 */
  const delBtnPos = useMemo(() => {
    if (!selectedItem) return null;
    if (selectedItem.type === "point") {
      const p = points.find(p => p.id === selectedItem.id);
      return p ? { x: p.x + 13, y: p.y - 16 } : null;
    }
    const s = segments.find(s => s.id === selectedItem.id);
    return s ? { x: (s.x1 + s.x2) / 2 + 10, y: (s.y1 + s.y2) / 2 - 16 } : null;
  }, [selectedItem, points, segments]);

  /* 도구 전환 */
  const changeTool = useCallback((tool: Tool) => {
    setActiveTool(tool);
    setPendingStart(null);
    setCursorPos(null);
    setSelectedItem(null);
  }, []);

  /* 캔버스 클릭 */
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const { x, y } = getCoords(e);

    /* ── 선택 도구 ── */
    if (activeTool === "선택") {
      // 점 우선 (12px)
      const p = nearestPoint(points, x, y, 12);
      if (p) { setSelectedItem({ type: "point", id: p.id }); return; }
      // 선분 (8px)
      let bestSeg: Segment | null = null, minD = 8;
      for (const s of segments) {
        const d = distToSegment(x, y, s.x1, s.y1, s.x2, s.y2);
        if (d < minD) { minD = d; bestSeg = s; }
      }
      if (bestSeg) { setSelectedItem({ type: "segment", id: bestSeg.id }); return; }
      setSelectedItem(null);
      return;
    }

    /* ── 점 도구 ── */
    if (activeTool === "점") {
      const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      setPoints(prev => [...prev, { id, x, y, label: makeLabel(prev.length) }]);
      setSelectedItem(null);
      return;
    }

    /* ── 선분 도구 ── */
    if (activeTool === "선분") {
      if (!pendingStart) {
        const snapped = nearestPoint(points, x, y, 12);
        if (snapped) {
          setPendingStart(snapped);
        } else {
          const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          const newPt: Point = { id, x, y, label: makeLabel(points.length) };
          setPoints(prev => [...prev, newPt]);
          setPendingStart(newPt);
        }
      } else {
        const snapped = nearestPoint(points, x, y, 12);
        let endPt: Point;
        if (snapped && snapped.id !== pendingStart.id) {
          endPt = snapped;
        } else if (!snapped) {
          const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          endPt = { id, x, y, label: makeLabel(points.length) };
          setPoints(prev => [...prev, endPt]);
        } else {
          setPendingStart(null); return;
        }
        const dup = segments.some(
          s => (s.p1Id === pendingStart.id && s.p2Id === endPt.id) ||
               (s.p1Id === endPt.id && s.p2Id === pendingStart.id)
        );
        if (!dup) {
          const segId = `seg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          setSegments(prev => [...prev, {
            id: segId, p1Id: pendingStart.id, p2Id: endPt.id,
            x1: pendingStart.x, y1: pendingStart.y, x2: endPt.x, y2: endPt.y,
          }]);
        }
        setPendingStart(null);
      }
    }
  }, [activeTool, points, segments, pendingStart, getCoords]);

  /* 마우스 이동 (선분 미리보기) */
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === "선분" && pendingStart) setCursorPos(getCoords(e));
    else setCursorPos(null);
  }, [activeTool, pendingStart, getCoords]);

  /* 삭제 */
  const handleDelete = useCallback(() => {
    if (!selectedItem) return;
    if (selectedItem.type === "point") {
      const id = selectedItem.id;
      setPoints(prev => prev.filter(p => p.id !== id));
      setSegments(prev => prev.filter(s => s.p1Id !== id && s.p2Id !== id));
    } else {
      setSegments(prev => prev.filter(s => s.id !== selectedItem.id));
    }
    setSelectedItem(null);
  }, [selectedItem]);

  /* 초기화 */
  const handleClear = () => {
    setPoints([]); setSegments([]); setSelectedItem(null);
    setPendingStart(null); setCursorPos(null);
  };

  const TOOLS: { name: Tool; icon: string }[] = [
    { name: "선택", icon: "↖" },
    { name: "점",   icon: "•" },
    { name: "선분", icon: "∕" },
  ];

  return (
    <div
      className="w-full flex-1 flex flex-col items-center justify-start"
      style={{ paddingTop: "0.5rem", paddingBottom: "2rem", paddingLeft: "clamp(1rem, 4vw, 3rem)", paddingRight: "clamp(1rem, 4vw, 3rem)" }}
    >
      <div className="w-full max-w-[1550px] flex flex-col mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 items-stretch" style={{ gap: "1.45rem", marginTop: "0.85rem" }}>

          {/* ════ 좌측: 도구 선택 ════ */}
          <div className="xl:col-span-3 chalk-box flex flex-col bg-white/80 backdrop-blur-md" style={{ padding: "0.85rem" }}>
            <div className="flex items-center gap-3 w-full min-h-[44px]">
              <h2 className="text-[#CBA7D2] font-bold" style={{ fontFamily: "var(--font-chalk)", fontSize: "1.85rem", lineHeight: 1.1 }}>
                도구 선택
              </h2>
            </div>
            <div className="w-full border-t border-dashed border-gray-300/70" style={{ marginTop: "0.85rem", marginBottom: "0.85rem" }} />

            {/* 3열 도구 그리드 */}
            <div className="grid grid-cols-3 gap-2">
              {TOOLS.map(({ name, icon }) => {
                const active = activeTool === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => changeTool(name)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all cursor-pointer ${
                      active
                        ? "bg-[#CBA7D2]/20 border-[#CBA7D2] shadow-md"
                        : "bg-gray-50/80 border-gray-200 hover:bg-gray-100/80 hover:border-[#CBA7D2]/50"
                    }`}
                    style={{ padding: "0.85rem 0.4rem", fontFamily: "var(--font-chalk)", aspectRatio: "1" }}
                  >
                    <span className={`text-[1.45rem] leading-none ${active ? "text-[#CBA7D2]" : "text-gray-400"}`}>{icon}</span>
                    <span className={`text-sm font-extrabold mt-0.5 ${active ? "text-[#CBA7D2]" : "text-gray-500"}`}>{name}</span>
                  </button>
                );
              })}
            </div>

            {/* 상태 안내 */}
            {activeTool === "선분" && (
              <div className="mt-3 rounded-2xl bg-[#CBA7D2]/10 border border-dashed border-[#CBA7D2]/40 text-[#CBA7D2] text-xs leading-relaxed"
                style={{ padding: "0.65rem 1rem", fontFamily: "var(--font-body)" }}>
                {pendingStart ? <><span className="font-bold">{pendingStart.label}</span> 에서 시작 — 끝점을 클릭하세요.</> : "시작점을 클릭하세요."}
              </div>
            )}
            {activeTool === "선택" && selectedItem && (
              <div className="mt-3 rounded-2xl bg-rose-50 border border-dashed border-rose-300/60 text-rose-500 text-xs leading-relaxed"
                style={{ padding: "0.65rem 1rem", fontFamily: "var(--font-body)" }}>
                {selectedItem.type === "point" ? "점" : "선분"}이 선택됨 — 도화지의 <span className="font-bold">삭제</span> 버튼을 클릭하세요.
              </div>
            )}

            {/* 초기화 */}
            <button
              type="button"
              onClick={handleClear}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300/60 text-rose-400 hover:bg-rose-50/60 transition-all cursor-pointer font-bold"
              style={{ padding: "0.65rem 1rem", fontFamily: "var(--font-chalk)", fontSize: "1.05rem", marginTop: "1.25rem" }}
            >
              초기화
            </button>
          </div>

          {/* ════ 우측: 도화지 ════ */}
          <div
            className="xl:col-span-9 chalk-box flex flex-col bg-white/85 backdrop-blur-md"
            style={{ padding: "0.85rem", minHeight: "520px" }}
          >
            {/* SVG + 삭제 버튼 래퍼 */}
            <div className="relative flex-1" style={{ minHeight: "460px" }}>
              <svg
                ref={svgRef}
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  background: "rgba(255,255,255,0.97)",
                  border: "1.5px dashed rgba(203,167,210,0.35)",
                  borderRadius: "1rem",
                  cursor: activeTool === "선택" ? "default"
                    : activeTool === "선분" && pendingStart ? "crosshair" : "cell",
                }}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setCursorPos(null)}
              >
                <defs>
                  {/* 격자 */}
                  <pattern id="tc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(203,167,210,0.12)" strokeWidth="1" />
                  </pattern>
                  {/* 색종이 질감 필터 */}
                  <filter id="tc-paper" x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" seed="7" result="noise" />
                    <feColorMatrix in="noise" type="matrix"
                      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.22 0"
                      result="grain" />
                    <feComposite in="SourceGraphic" in2="grain" operator="arithmetic" k1="0" k2="1" k3="0.5" k4="0" />
                  </filter>
                </defs>

                {/* 배경 격자 */}
                <rect width="100%" height="100%" fill="url(#tc-grid)" rx="16" />

                {/* 다각형 채우기 (색종이 질감) */}
                {polygons.map(poly => (
                  <polygon
                    key={poly.id}
                    points={poly.pts.map(p => `${p.x},${p.y}`).join(" ")}
                    fill={poly.color.fill}
                    fillOpacity={0.62}
                    stroke={poly.color.stroke}
                    strokeWidth={0}
                    filter="url(#tc-paper)"
                  />
                ))}

                {/* 선분 */}
                {segments.map(seg => {
                  const sel = selectedItem?.type === "segment" && selectedItem.id === seg.id;
                  return (
                    <line
                      key={seg.id}
                      x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                      stroke={sel ? "#CBA7D2" : "#374151"}
                      strokeWidth={sel ? 3 : 2}
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* 선분 미리보기 */}
                {activeTool === "선분" && pendingStart && cursorPos && (
                  <line
                    x1={pendingStart.x} y1={pendingStart.y} x2={cursorPos.x} y2={cursorPos.y}
                    stroke="#CBA7D2" strokeWidth={1.5} strokeDasharray="6 4" strokeLinecap="round"
                  />
                )}

                {/* 점 */}
                {points.map(pt => {
                  const isPending = pendingStart?.id === pt.id;
                  const isSel = selectedItem?.type === "point" && selectedItem.id === pt.id;
                  const highlight = isPending || isSel;
                  return (
                    <g key={pt.id}>
                      {highlight && (
                        <circle cx={pt.x} cy={pt.y} r={10}
                          fill={isSel ? "rgba(203,167,210,0.18)" : "rgba(203,167,210,0.25)"}
                          stroke="#CBA7D2" strokeWidth={1.5} strokeDasharray="4 3" />
                      )}
                      <circle cx={pt.x} cy={pt.y} r={5}
                        fill={highlight ? "#CBA7D2" : "#374151"}
                        stroke="white" strokeWidth={1.5} />
                      <text x={pt.x + 9} y={pt.y - 7}
                        fill={highlight ? "#CBA7D2" : "#4B5563"}
                        fontSize={13} fontWeight="bold"
                        style={{ fontFamily: "var(--font-chalk)", userSelect: "none" }}>
                        {pt.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* 삭제 버튼 (SVG 위에 HTML로 절대 위치) */}
              {selectedItem && delBtnPos && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="absolute z-10 font-bold transition-all hover:bg-rose-100 active:scale-95"
                  style={{
                    left: delBtnPos.x,
                    top: delBtnPos.y,
                    background: "#FEE2E2",
                    border: "1.5px solid #FCA5A5",
                    borderRadius: "0.45rem",
                    color: "#DC2626",
                    fontSize: "0.72rem",
                    padding: "2px 9px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-body)",
                    lineHeight: "1.6",
                    boxShadow: "0 1px 4px rgba(220,38,38,0.15)",
                  }}
                >
                  삭제
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
