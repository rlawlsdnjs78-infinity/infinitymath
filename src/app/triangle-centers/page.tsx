/**
 * src/app/triangle-centers/page.tsx
 * 삼각형의 외심과 내심 — 기하 도구 페이지
 */

"use client";

import { useState, useRef, useCallback, useMemo } from "react";

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */
type Tool = "선택" | "점" | "선분" | "종이접기";
type Pt2 = { x: number; y: number };

interface Point { id: string; x: number; y: number; label: string; }
interface Segment { id: string; p1Id: string; p2Id: string; x1: number; y1: number; x2: number; y2: number; }
interface DetectedPoly { id: string; pts: Point[]; color: { fill: string; stroke: string }; }
interface FoldResult {
  id: string;
  polygonId: string;
  gonePoly: Pt2[];
  flapPoly: Pt2[];
  remainingPoly: Pt2[];
  color: { fill: string; stroke: string };
}
interface CreaseLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
type SelectedItem = { type: "point"; id: string } | { type: "segment"; id: string } | null;

/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const POLY_COLORS = [
  { fill: "#FF9AA2", stroke: "#E57373" }, { fill: "#FFB7B2", stroke: "#FF8A65" },
  { fill: "#FFDAC1", stroke: "#FFB74D" }, { fill: "#E2F0CB", stroke: "#81C784" },
  { fill: "#B5EAD7", stroke: "#4DB6AC" }, { fill: "#C7CEEA", stroke: "#7986CB" },
  { fill: "#F4C2C2", stroke: "#EF9A9A" }, { fill: "#D4F0F0", stroke: "#80DEEA" },
  { fill: "#FCE1E4", stroke: "#F48FB1" }, { fill: "#DDC9FF", stroke: "#CE93D8" },
];
const TOOLS: { name: Tool; icon: string }[] = [
  { name: "선택",   icon: "↖"  },
  { name: "점",    icon: "•"  },
  { name: "선분",   icon: "∕"  },
  { name: "종이접기", icon: "🗂" },
];

/* ══════════════════════════════════════════════
   GEOMETRY HELPERS
══════════════════════════════════════════════ */
function makeLabel(i: number) { return LABELS[i % 26] + "'".repeat(Math.floor(i / 26)); }

function nearestPt(pts: Point[], x: number, y: number, thr: number): Point | null {
  let best: Point | null = null, minD = thr;
  for (const p of pts) { const d = Math.hypot(p.x - x, p.y - y); if (d < minD) { minD = d; best = p; } }
  return best;
}

function distSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** 부호 있는 면적 (cross product of AB × AP) */
function cross2(A: Pt2, B: Pt2, P: Pt2) {
  return (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x);
}

/** 두 직선 교점 */
function lineIsect(A: Pt2, B: Pt2, C: Pt2, D: Pt2): Pt2 | null {
  const a1 = B.y - A.y, b1 = A.x - B.x, c1 = a1 * A.x + b1 * A.y;
  const a2 = D.y - C.y, b2 = C.x - D.x, c2 = a2 * C.x + b2 * C.y;
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-10) return null;
  return { x: (c1 * b2 - c2 * b1) / det, y: (a1 * c2 - a2 * c1) / det };
}

/** 선분 CD와 직선 AB의 교점 (C-D 선분 내에 존재할 때만 반환) */
function segmentLineIsect(C: Pt2, D: Pt2, A: Pt2, B: Pt2): Pt2 | null {
  const isect = lineIsect(C, D, A, B);
  if (!isect) return null;
  const minX = Math.min(C.x, D.x) - 1e-5;
  const maxX = Math.max(C.x, D.x) + 1e-5;
  const minY = Math.min(C.y, D.y) - 1e-5;
  const maxY = Math.max(C.y, D.y) + 1e-5;
  if (isect.x >= minX && isect.x <= maxX && isect.y >= minY && isect.y <= maxY) {
    return isect;
  }
  return null;
}

/** Sutherland-Hodgman: A→B의 왼쪽(inside) 으로 다각형 클리핑 */
function clipHalf(poly: Pt2[], A: Pt2, B: Pt2): Pt2[] {
  if (!poly.length) return [];
  const out: Pt2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const c = poly[i], n = poly[(i + 1) % poly.length];
    const sc = cross2(A, B, c), sn = cross2(A, B, n);
    if (sc >= 0) out.push(c);
    if ((sc > 0 && sn < 0) || (sc < 0 && sn > 0)) { const p = lineIsect(A, B, c, n); if (p) out.push(p); }
  }
  return out;
}

/** P→Q의 수직이등분선 기준 점 V를 반사 */
function reflectPt(V: Pt2, P: Pt2, Q: Pt2): Pt2 {
  const M = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
  const nx = Q.x - P.x, ny = Q.y - P.y;
  const len2 = nx * nx + ny * ny;
  if (len2 < 1e-10) return V;
  const dot = nx * (V.x - M.x) + ny * (V.y - M.y);
  return { x: V.x - 2 * (dot / len2) * nx, y: V.y - 2 * (dot / len2) * ny };
}

/**
 * 종이접기 계산:
 * P가 Q로 이동 → 수직이등분선으로 분할
 * - gonePoly  : P쪽 (사라지는 부분)
 * - remainingPoly : Q쪽 (남는 부분)
 * - flapPoly  : gonePoly를 반사한 부분 (Q쪽으로 접혀 온 부분)
 */
function computeFold(polyPts: Pt2[], P: Pt2, Q: Pt2) {
  const M = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
  const nx = Q.x - P.x, ny = Q.y - P.y;
  // M → Bp : P가 왼쪽 (P-side)
  const Bp: Pt2 = { x: M.x - ny, y: M.y + nx };
  // M → Bq : Q가 왼쪽 (Q-side)
  const Bq: Pt2 = { x: M.x + ny, y: M.y - nx };
  const gonePoly      = clipHalf(polyPts, M, Bp);
  const remainingPoly = clipHalf(polyPts, M, Bq);
  const flapPoly      = gonePoly.map(v => reflectPt(v, P, Q));
  return { gonePoly, remainingPoly, flapPoly };
}

/** 수직이등분선과 다각형의 교선 (접힌 흔적 선분) 계산 */
function getCreaseSegment(polyPts: Pt2[], P: Pt2, Q: Pt2): { x1: number; y1: number; x2: number; y2: number } | null {
  const M = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
  const nx = Q.x - P.x, ny = Q.y - P.y;
  const A = M;
  const B = { x: M.x - ny, y: M.y + nx };

  const isects: Pt2[] = [];
  for (let i = 0; i < polyPts.length; i++) {
    const C = polyPts[i];
    const D = polyPts[(i + 1) % polyPts.length];
    const pt = segmentLineIsect(C, D, A, B);
    if (pt) {
      if (!isects.some(p => Math.hypot(p.x - pt.x, p.y - pt.y) < 1e-3)) {
        isects.push(pt);
      }
    }
  }
  if (isects.length >= 2) {
    return { x1: isects[0].x, y1: isects[0].y, x2: isects[1].x, y2: isects[1].y };
  }
  return null;
}

/* 사이클 탐색 */
function canonicalize(cycle: string[]) {
  let mi = 0; for (let i = 1; i < cycle.length; i++) if (cycle[i] < cycle[mi]) mi = i;
  const rot = [...cycle.slice(mi), ...cycle.slice(0, mi)];
  const rev = [rot[0], ...rot.slice(1).reverse()];
  for (let i = 0; i < rot.length; i++) { if (rot[i] < rev[i]) return rot; if (rot[i] > rev[i]) return rev; }
  return rot;
}
function findCycles(adj: Map<string, string[]>, maxLen = 10) {
  const res: string[][] = [], seen = new Set<string>();
  const dfs = (start: string, cur: string, path: string[], vis: Set<string>) => {
    if (path.length > maxLen) return;
    for (const nx of (adj.get(cur) ?? [])) {
      if (nx === start && path.length >= 3) {
        const key = canonicalize(path).join("|");
        if (!seen.has(key)) { seen.add(key); res.push(canonicalize(path)); }
      } else if (!vis.has(nx)) { vis.add(nx); dfs(start, nx, [...path, nx], vis); vis.delete(nx); }
    }
  };
  for (const n of adj.keys()) dfs(n, n, [n], new Set([n]));
  return res;
}
function hashIdx(s: string, len: number) {
  let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h) % len;
}

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
export default function TriangleCentersPage() {
  const [activeTool,   setActiveTool  ] = useState<Tool>("선택");
  const [points,       setPoints      ] = useState<Point[]>([]);
  const [segments,     setSegments    ] = useState<Segment[]>([]);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [pendingStart, setPendingStart ] = useState<Point | null>(null);
  const [cursorPos,    setCursorPos   ] = useState<Pt2 | null>(null);
  const [foldSource,   setFoldSource  ] = useState<{ pt: Point; polygonId: string } | null>(null);
  const [foldResults,  setFoldResults ] = useState<FoldResult[]>([]);
  const [creaseLines,  setCreaseLines ] = useState<CreaseLine[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const getCoords = useCallback((e: React.MouseEvent<SVGSVGElement>): Pt2 => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) };
  }, []);

  /* 다각형 자동 감지 */
  const polygons: DetectedPoly[] = useMemo(() => {
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
    return findCycles(adj)
      .map(cycle => ({ cycle, pts: cycle.map(id => ptMap.get(id)).filter(Boolean) as Point[] }))
      .filter(({ pts }) => pts.length >= 3)
      .map(({ cycle, pts }) => {
        const key = cycle.join("|");
        return { id: `poly_${key}`, pts, color: POLY_COLORS[hashIdx(key, POLY_COLORS.length)] };
      });
  }, [points, segments]);

  const foldMap = useMemo(() => {
    const m = new Map<string, FoldResult>();
    for (const f of foldResults) m.set(f.polygonId, f);
    return m;
  }, [foldResults]);

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
  const changeTool = useCallback((t: Tool) => {
    setActiveTool(t); setPendingStart(null); setCursorPos(null);
    setSelectedItem(null); setFoldSource(null);
  }, []);

  /* 캔버스 클릭 */
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const { x, y } = getCoords(e);

    /* ── 선택 ── */
    if (activeTool === "선택") {
      const p = nearestPt(points, x, y, 12);
      if (p) { setSelectedItem({ type: "point", id: p.id }); return; }
      let bestSeg: Segment | null = null, minD = 8;
      for (const s of segments) { const d = distSeg(x, y, s.x1, s.y1, s.x2, s.y2); if (d < minD) { minD = d; bestSeg = s; } }
      if (bestSeg) { setSelectedItem({ type: "segment", id: bestSeg.id }); return; }
      setSelectedItem(null); return;
    }

    /* ── 점 ── */
    if (activeTool === "점") {
      const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      setPoints(prev => [...prev, { id, x, y, label: makeLabel(prev.length) }]);
      setSelectedItem(null); return;
    }

    /* ── 선분 ── */
    if (activeTool === "선분") {
      if (!pendingStart) {
        const snapped = nearestPt(points, x, y, 12);
        if (snapped) { setPendingStart(snapped); }
        else {
          const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          const np: Point = { id, x, y, label: makeLabel(points.length) };
          setPoints(prev => [...prev, np]); setPendingStart(np);
        }
      } else {
        const snapped = nearestPt(points, x, y, 12);
        let endPt: Point;
        if (snapped && snapped.id !== pendingStart.id) endPt = snapped;
        else if (!snapped) {
          const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          endPt = { id, x, y, label: makeLabel(points.length) };
          setPoints(prev => [...prev, endPt]);
        } else { setPendingStart(null); return; }
        const dup = segments.some(s =>
          (s.p1Id === pendingStart.id && s.p2Id === endPt.id) ||
          (s.p1Id === endPt.id && s.p2Id === pendingStart.id));
        if (!dup) {
          const sid = `seg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          setSegments(prev => [...prev, { id: sid, p1Id: pendingStart.id, p2Id: endPt.id, x1: pendingStart.x, y1: pendingStart.y, x2: endPt.x, y2: endPt.y }]);
        }
        setPendingStart(null);
      }
      return;
    }

    /* ── 종이접기 ── */
    if (activeTool === "종이접기") {
      if (!foldSource) {
        // 다각형 꼭짓점만 선택 허용
        const p = nearestPt(points, x, y, 18);
        if (!p) return;
        const poly = polygons.find(pl => pl.pts.some(pp => pp.id === p.id));
        if (!poly) return;
        setFoldSource({ pt: p, polygonId: poly.id });
      } else {
        // 해당 다각형의 꼭짓점 목록에서 도착점 Q 스냅 선택
        const poly = polygons.find(pl => pl.id === foldSource.polygonId);
        if (!poly) { setFoldSource(null); return; }

        const q = nearestPt(poly.pts, x, y, 20);
        if (!q || q.id === foldSource.pt.id) {
          // 같은 점이거나 꼭짓점이 아니면 취소 또는 재선택 대기
          if (q && q.id === foldSource.pt.id) setFoldSource(null);
          return;
        }

        const P: Pt2 = { x: foldSource.pt.x, y: foldSource.pt.y };
        const Q: Pt2 = { x: q.x, y: q.y };
        const polyPts2: Pt2[] = poly.pts.map(pp => ({ x: pp.x, y: pp.y }));

        const { gonePoly, flapPoly, remainingPoly } = computeFold(polyPts2, P, Q);
        const crease = getCreaseSegment(polyPts2, P, Q);

        if (crease) {
          setCreaseLines(prev => [
            ...prev,
            { id: `crease_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, ...crease }
          ]);
        }

        const fid = `fold_${Date.now()}`;
        setFoldResults(prev => {
          const next = prev.filter(f => f.polygonId !== foldSource.polygonId);
          return [...next, { id: fid, polygonId: foldSource.polygonId, gonePoly, flapPoly, remainingPoly, color: poly.color }];
        });
        setFoldSource(null);
      }
      return;
    }
  }, [activeTool, points, segments, pendingStart, foldSource, polygons, getCoords]);

  /* 펼치기 (해당 다각형의 접힌 상태 원복, 접힌 자국은 유지) */
  const handleUnfold = useCallback((polyId: string) => {
    setFoldResults(prev => prev.filter(f => f.polygonId !== polyId));
  }, []);

  /* 마우스 이동 */
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
    setPendingStart(null); setCursorPos(null); setFoldSource(null);
    setFoldResults([]); setCreaseLines([]);
  };

  const toSVGPts = (pts: Pt2[]) => pts.map(p => `${p.x},${p.y}`).join(" ");

  const svgCursor = activeTool === "선택" ? "default"
    : activeTool === "종이접기" ? (foldSource ? "crosshair" : "pointer")
    : activeTool === "선분" && pendingStart ? "crosshair" : "cell";

  /* 접힌 다각형들에 속해있는 선분 집합 (ID 집합) */
  const foldedPolySegIds = useMemo(() => {
    const s = new Set<string>();
    for (const fold of foldResults) {
      const poly = polygons.find(p => p.id === fold.polygonId);
      if (!poly) continue;
      for (let i = 0; i < poly.pts.length; i++) {
        const id1 = poly.pts[i].id;
        const id2 = poly.pts[(i + 1) % poly.pts.length].id;
        const seg = segments.find(sg =>
          (sg.p1Id === id1 && sg.p2Id === id2) || (sg.p1Id === id2 && sg.p2Id === id1)
        );
        if (seg) s.add(seg.id);
      }
    }
    return s;
  }, [foldResults, polygons, segments]);

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start"
      style={{ paddingTop: "0.5rem", paddingBottom: "2rem", paddingLeft: "clamp(1rem,4vw,3rem)", paddingRight: "clamp(1rem,4vw,3rem)" }}>
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

            {/* 도구 목록 — 이모지 + 이름 가로 배치 */}
            <div className="flex flex-col gap-2">
              {TOOLS.map(({ name, icon }) => {
                const active = activeTool === name;
                return (
                  <button key={name} type="button" onClick={() => changeTool(name)}
                    className={`w-full flex items-center gap-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      active ? "bg-[#CBA7D2]/20 border-[#CBA7D2] shadow-md" : "bg-gray-50/80 border-gray-200 hover:bg-gray-100/80 hover:border-[#CBA7D2]/50"
                    }`}
                    style={{ padding: "0.65rem 1rem", fontFamily: "var(--font-chalk)" }}>
                    <span className={`text-xl leading-none w-6 text-center flex-shrink-0 ${active ? "text-[#CBA7D2]" : "text-gray-400"}`}>{icon}</span>
                    <span className={`font-extrabold text-base ${active ? "text-[#CBA7D2]" : "text-gray-500"}`}>{name}</span>
                  </button>
                );
              })}
            </div>

            {/* 상태 안내 */}
            {activeTool === "선분" && (
              <div className="mt-3 rounded-2xl bg-[#CBA7D2]/10 border border-dashed border-[#CBA7D2]/40 text-[#CBA7D2] text-xs leading-relaxed" style={{ padding: "0.65rem 1rem", fontFamily: "var(--font-body)" }}>
                {pendingStart ? <><span className="font-bold">{pendingStart.label}</span> 에서 시작 — 끝점을 클릭하세요.</> : "시작점을 클릭하세요."}
              </div>
            )}
            {activeTool === "선택" && selectedItem && (
              <div className="mt-3 rounded-2xl bg-rose-50 border border-dashed border-rose-300/60 text-rose-500 text-xs leading-relaxed" style={{ padding: "0.65rem 1rem", fontFamily: "var(--font-body)" }}>
                {selectedItem.type === "point" ? "점" : "선분"}이 선택됨 — 도화지의 <span className="font-bold">삭제</span> 버튼을 클릭하세요.
              </div>
            )}
            {activeTool === "종이접기" && (
              <div className="mt-3 rounded-2xl bg-[#CBA7D2]/10 border border-dashed border-[#CBA7D2]/40 text-[#CBA7D2] text-xs leading-relaxed" style={{ padding: "0.65rem 1rem", fontFamily: "var(--font-body)" }}>
                {foldSource ? (
                  <>
                    <span className="font-bold text-[#A855F7]">{foldSource.pt.label}</span> 점에서 시작 — 접어 도착할 꼭짓점을 클릭하세요.
                  </>
                ) : (
                  "접기 시작할 다각형의 꼭짓점을 클릭하세요."
                )}
              </div>
            )}

            {/* 초기화 — 가장 아래 고정 */}
            <button type="button" onClick={handleClear}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300/60 text-rose-400 hover:bg-rose-50/60 transition-all cursor-pointer font-bold"
              style={{ padding: "0.65rem 1rem", fontFamily: "var(--font-chalk)", fontSize: "1.05rem", marginTop: "auto", paddingTop: "0.65rem" }}>
              초기화
            </button>
          </div>

          {/* ════ 우측: 도화지 ════ */}
          <div className="xl:col-span-9 chalk-box flex flex-col bg-white/85 backdrop-blur-md" style={{ padding: "0.85rem", minHeight: "520px" }}>
            <div className="relative flex-1" style={{ minHeight: "460px" }}>
              <svg ref={svgRef}
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  background: "rgba(255,255,255,0.97)",
                  border: "1.5px dashed rgba(203,167,210,0.35)",
                  borderRadius: "1rem",
                  cursor: svgCursor,
                }}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setCursorPos(null)}
              >
                <defs>
                  <pattern id="tc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(203,167,210,0.12)" strokeWidth="1" />
                  </pattern>
                  {/* 색종이 질감 필터 */}
                  <filter id="tc-paper" x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" seed="7" result="noise" />
                    <feColorMatrix in="noise" type="matrix"
                      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.22 0"
                      result="grain" />
                    <feComposite in="grain" in2="SourceGraphic" operator="in" result="clippedGrain" />
                    <feComposite in="SourceGraphic" in2="clippedGrain" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="0" />
                  </filter>
                </defs>

                {/* 배경 격자 */}
                <rect width="100%" height="100%" fill="url(#tc-grid)" rx="16" />

                {/* ── 1. 다각형 렌더링 ── */}
                {polygons.map(poly => {
                  const fold = foldMap.get(poly.id);
                  const pts2: Pt2[] = poly.pts.map(p => ({ x: p.x, y: p.y }));

                  if (!fold) {
                    return (
                      <polygon key={poly.id}
                        points={toSVGPts(pts2)}
                        fill={poly.color.fill} fillOpacity={0.62}
                        stroke="none"
                        filter="url(#tc-paper)" />
                    );
                  }

                  return (
                    <g key={poly.id}>
                      {/* 사라진 부분(gone): 투명 배경 + 외곽선 점선 처리 */}
                      {fold.gonePoly.length >= 3 && (
                        <polygon points={toSVGPts(fold.gonePoly)}
                          fill="none"
                          stroke="#9CA3AF" strokeWidth={1.8}
                          strokeDasharray="5 4" />
                      )}

                      {/* 남아있는 부분(remaining): 기본 색상 질감 채우기 + 실선 테두리 */}
                      {fold.remainingPoly.length >= 3 && (
                        <polygon points={toSVGPts(fold.remainingPoly)}
                          fill={poly.color.fill} fillOpacity={0.62}
                          stroke="#374151" strokeWidth={2}
                          filter="url(#tc-paper)" />
                      )}

                      {/* 접혀 겹친 부분(flap): 중첩되어 더 진한 색상 + 실선 테두리 */}
                      {fold.flapPoly.length >= 3 && (
                        <polygon points={toSVGPts(fold.flapPoly)}
                          fill={poly.color.fill} fillOpacity={0.62}
                          stroke="#374151" strokeWidth={2}
                          filter="url(#tc-paper)" />
                      )}
                    </g>
                  );
                })}

                {/* ── 2. 접혔던 흔적(Crease lines) 영구 렌더링 ── */}
                {creaseLines.map(cl => (
                  <line key={cl.id}
                    x1={cl.x1} y1={cl.y1} x2={cl.x2} y2={cl.y2}
                    stroke="#9CA3AF" strokeWidth={1.5}
                    strokeDasharray="4 3" strokeLinecap="round" />
                ))}

                {/* ── 3. 선분 렌더링 (접힌 다각형의 변은 다각형 내부 테두리로 처리) ── */}
                {segments.map(seg => {
                  if (foldedPolySegIds.has(seg.id)) return null;
                  const sel = selectedItem?.type === "segment" && selectedItem.id === seg.id;
                  return (
                    <line key={seg.id}
                      x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                      stroke={sel ? "#CBA7D2" : "#374151"}
                      strokeWidth={sel ? 3 : 2} strokeLinecap="round" />
                  );
                })}

                {/* ── 4. 선분 미리보기 ── */}
                {activeTool === "선분" && pendingStart && cursorPos && (
                  <line x1={pendingStart.x} y1={pendingStart.y} x2={cursorPos.x} y2={cursorPos.y}
                    stroke="#CBA7D2" strokeWidth={1.5} strokeDasharray="6 4" strokeLinecap="round" />
                )}

                {/* ── 5. 점 렌더링 ── */}
                {points.map(pt => {
                  const isPending = pendingStart?.id === pt.id;
                  const isSel     = selectedItem?.type === "point" && selectedItem.id === pt.id;
                  const isFoldSrc = foldSource?.pt.id === pt.id;
                  const hl = isPending || isSel || isFoldSrc;
                  return (
                    <g key={pt.id}>
                      {hl && <circle cx={pt.x} cy={pt.y} r={11}
                        fill={isFoldSrc ? "rgba(168,85,247,0.2)" : "rgba(203,167,210,0.2)"}
                        stroke={isFoldSrc ? "#A855F7" : "#CBA7D2"}
                        strokeWidth={1.8} strokeDasharray="4 3" />}
                      <circle cx={pt.x} cy={pt.y} r={5}
                        fill={isFoldSrc ? "#A855F7" : hl ? "#CBA7D2" : "#374151"}
                        stroke="white" strokeWidth={1.5} />
                      <text x={pt.x + 9} y={pt.y - 7}
                        fill={isFoldSrc ? "#A855F7" : hl ? "#CBA7D2" : "#4B5563"}
                        fontSize={13} fontWeight="bold"
                        style={{ fontFamily: "var(--font-chalk)", userSelect: "none" }}>
                        {pt.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* 삭제 버튼 */}
              {selectedItem && delBtnPos && (
                <button type="button"
                  onClick={e => { e.stopPropagation(); handleDelete(); }}
                  className="absolute z-10 font-bold transition-all hover:bg-rose-100 active:scale-95"
                  style={{
                    left: delBtnPos.x, top: delBtnPos.y,
                    background: "#FEE2E2", border: "1.5px solid #FCA5A5", borderRadius: "0.45rem",
                    color: "#DC2626", fontSize: "0.72rem", padding: "2px 9px",
                    cursor: "pointer", whiteSpace: "nowrap", fontFamily: "var(--font-body)",
                    lineHeight: "1.6", boxShadow: "0 1px 4px rgba(220,38,38,0.15)",
                  }}>
                  삭제
                </button>
              )}

              {/* 펼치기 버튼들 */}
              {foldResults.map(fold => {
                const allPts = [...fold.gonePoly, ...fold.flapPoly, ...fold.remainingPoly];
                if (!allPts.length) return null;
                const maxX = Math.max(...allPts.map(p => p.x));
                const minY = Math.min(...allPts.map(p => p.y));
                return (
                  <button
                    key={fold.polygonId}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnfold(fold.polygonId);
                    }}
                    className="absolute z-10 font-bold transition-all hover:bg-purple-100 active:scale-95 flex items-center gap-1 shadow-sm"
                    style={{
                      left: maxX + 10,
                      top: Math.max(12, minY),
                      background: "#EDE9FE",
                      border: "1.5px solid #C4B5FD",
                      borderRadius: "0.5rem",
                      color: "#6D28D9",
                      fontSize: "0.78rem",
                      padding: "3px 10px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      fontFamily: "var(--font-body)",
                      lineHeight: "1.5",
                    }}
                  >
                    <span>펼치기</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
