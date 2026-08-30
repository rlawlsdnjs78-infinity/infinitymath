/**
 * src/app/triangle-centers/page.tsx
 * 삼각형의 외심과 내심 — 기하 도구 페이지
 */

"use client";

import { useState, useRef, useCallback, useMemo } from "react";

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */
type Tool = "선택" | "점" | "직선" | "종이접기";
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
  polygonId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
type SelectedItem = { type: "point"; id: string } | { type: "segment"; id: string } | null;

interface CanvasData {
  points: Point[];
  segments: Segment[];
  foldResults: FoldResult[];
  creaseLines: CreaseLine[];
}

const initialCanvasData = (): CanvasData => ({
  points: [],
  segments: [],
  foldResults: [],
  creaseLines: [],
});

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

/* ══════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════ */
function OrigamiCraneIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13 L6 10 L11 15 L22 3 L17 16 L22 18 L14 20 L9 16 Z" />
      <path d="M6 10 L11 15 L17 16" />
      <path d="M2 13 L4 15 L6 10" />
      <path d="M11 15 L14 20" />
    </svg>
  );
}

function AcuteTriangleIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 4, 21 20, 3 20" />
    </svg>
  );
}

function RightTriangleIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 4, 5 20, 21 20" />
      <path d="M5 16 h4 v4" strokeWidth="1.4" />
    </svg>
  );
}

function ObtuseTriangleIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7 7, 22 20, 2 20" />
    </svg>
  );
}

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

function cross2(A: Pt2, B: Pt2, P: Pt2) {
  return (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x);
}

function lineIsect(A: Pt2, B: Pt2, C: Pt2, D: Pt2): Pt2 | null {
  const a1 = B.y - A.y, b1 = A.x - B.x, c1 = a1 * A.x + b1 * A.y;
  const a2 = D.y - C.y, b2 = C.x - D.x, c2 = a2 * C.x + b2 * C.y;
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-10) return null;
  return { x: (c1 * b2 - c2 * b1) / det, y: (a1 * c2 - a2 * c1) / det };
}

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

function reflectPt(V: Pt2, P: Pt2, Q: Pt2): Pt2 {
  const M = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
  const nx = Q.x - P.x, ny = Q.y - P.y;
  const len2 = nx * nx + ny * ny;
  if (len2 < 1e-10) return V;
  const dot = nx * (V.x - M.x) + ny * (V.y - M.y);
  return { x: V.x - 2 * (dot / len2) * nx, y: V.y - 2 * (dot / len2) * ny };
}

function computeFold(polyPts: Pt2[], P: Pt2, Q: Pt2) {
  const M = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
  const nx = Q.x - P.x, ny = Q.y - P.y;
  const Bp: Pt2 = { x: M.x - ny, y: M.y + nx };
  const Bq: Pt2 = { x: M.x + ny, y: M.y - nx };
  const gonePoly      = clipHalf(polyPts, M, Bp);
  const remainingPoly = clipHalf(polyPts, M, Bq);
  const flapPoly      = gonePoly.map(v => reflectPt(v, P, Q));
  return { gonePoly, remainingPoly, flapPoly };
}

function getExtendedBisector(P: Pt2, Q: Pt2, length = 4000): { x1: number; y1: number; x2: number; y2: number } {
  const M = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
  const nx = Q.x - P.x, ny = Q.y - P.y;
  const len = Math.hypot(nx, ny);
  if (len < 1e-10) return { x1: M.x, y1: M.y, x2: M.x, y2: M.y };
  const ux = -ny / len;
  const uy = nx / len;
  return {
    x1: Math.round(M.x - length * ux),
    y1: Math.round(M.y - length * uy),
    x2: Math.round(M.x + length * ux),
    y2: Math.round(M.y + length * uy),
  };
}

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

/** 생성된 점들을 캔버스 영역 내에 자연스럽게 배치하는 헬퍼 */
function fitInCanvas(pts: Pt2[], width: number, height: number, margin = 60): Pt2[] {
  const minX = Math.min(...pts.map(p => p.x));
  const maxX = Math.max(...pts.map(p => p.x));
  const minY = Math.min(...pts.map(p => p.y));
  const maxY = Math.max(...pts.map(p => p.y));

  const polyW = maxX - minX;
  const polyH = maxY - minY;

  const availMinX = margin;
  const availMaxX = Math.max(margin, width - margin - polyW);
  const availMinY = margin;
  const availMaxY = Math.max(margin, height - margin - polyH);

  const targetX = availMinX + Math.random() * (availMaxX - availMinX);
  const targetY = availMinY + Math.random() * (availMaxY - availMinY);

  const dx = targetX - minX;
  const dy = targetY - minY;

  return pts.map(p => ({
    x: Math.round(p.x + dx),
    y: Math.round(p.y + dy),
  }));
}

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
export default function TriangleCentersPage() {
  const [activeTool, setActiveTool] = useState<Tool>("선택");
  const [currentCanvasId, setCurrentCanvasId] = useState<1 | 2 | 3>(1);
  const [canvases, setCanvases] = useState<Record<1 | 2 | 3, CanvasData>>({
    1: initialCanvasData(),
    2: initialCanvasData(),
    3: initialCanvasData(),
  });

  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [pendingStart, setPendingStart] = useState<Point | null>(null);
  const [cursorPos, setCursorPos] = useState<Pt2 | null>(null);
  const [foldSource, setFoldSource] = useState<{ pt: Point; polygonId: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  /* 현재 활성 도화지 데이터 */
  const currentData = canvases[currentCanvasId];
  const points = currentData.points;
  const segments = currentData.segments;
  const foldResults = currentData.foldResults;
  const creaseLines = currentData.creaseLines;

  /* 현재 도화지 데이터 업데이트 헬퍼 */
  const updateCurrentCanvas = useCallback((updater: (prev: CanvasData) => CanvasData) => {
    setCanvases(prev => ({
      ...prev,
      [currentCanvasId]: updater(prev[currentCanvasId]),
    }));
  }, [currentCanvasId]);

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

  const validPolyIds = useMemo(() => new Set(polygons.map(p => p.id)), [polygons]);

  const validFoldResults = useMemo(() => {
    return foldResults.filter(f => validPolyIds.has(f.polygonId));
  }, [foldResults, validPolyIds]);

  const foldMap = useMemo(() => {
    const m = new Map<string, FoldResult>();
    for (const f of validFoldResults) m.set(f.polygonId, f);
    return m;
  }, [validFoldResults]);

  const validCreaseLines = useMemo(() => {
    return creaseLines.filter(cl => validPolyIds.has(cl.polygonId));
  }, [creaseLines, validPolyIds]);

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
    setActiveTool(t);
    setPendingStart(null);
    setCursorPos(null);
    setSelectedItem(null);
    setFoldSource(null);
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
      updateCurrentCanvas(prev => ({
        ...prev,
        points: [...prev.points, { id, x, y, label: makeLabel(prev.points.length) }],
      }));
      setSelectedItem(null);
      return;
    }

    /* ── 직선(선분) ── */
    if (activeTool === "직선") {
      if (!pendingStart) {
        const snapped = nearestPt(points, x, y, 12);
        if (snapped) {
          setPendingStart(snapped);
        } else {
          const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          const np: Point = { id, x, y, label: makeLabel(points.length) };
          updateCurrentCanvas(prev => ({ ...prev, points: [...prev.points, np] }));
          setPendingStart(np);
        }
      } else {
        const snapped = nearestPt(points, x, y, 12);
        let endPt: Point;
        if (snapped && snapped.id !== pendingStart.id) {
          endPt = snapped;
        } else if (!snapped) {
          const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          endPt = { id, x, y, label: makeLabel(points.length) };
          updateCurrentCanvas(prev => ({ ...prev, points: [...prev.points, endPt] }));
        } else {
          setPendingStart(null);
          return;
        }
        const dup = segments.some(s =>
          (s.p1Id === pendingStart.id && s.p2Id === endPt.id) ||
          (s.p1Id === endPt.id && s.p2Id === pendingStart.id));
        if (!dup) {
          const sid = `seg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          updateCurrentCanvas(prev => ({
            ...prev,
            segments: [...prev.segments, { id: sid, p1Id: pendingStart.id, p2Id: endPt.id, x1: pendingStart.x, y1: pendingStart.y, x2: endPt.x, y2: endPt.y }]
          }));
        }
        setPendingStart(null);
      }
      return;
    }

    /* ── 종이접기 ── */
    if (activeTool === "종이접기") {
      if (!foldSource) {
        const p = nearestPt(points, x, y, 18);
        if (!p) return;
        const poly = polygons.find(pl => pl.pts.some(pp => pp.id === p.id));
        if (!poly) return;
        setFoldSource({ pt: p, polygonId: poly.id });
      } else {
        const poly = polygons.find(pl => pl.id === foldSource.polygonId);
        if (!poly) { setFoldSource(null); return; }

        const q = nearestPt(poly.pts, x, y, 20);
        if (!q || q.id === foldSource.pt.id) {
          if (q && q.id === foldSource.pt.id) setFoldSource(null);
          return;
        }

        const P: Pt2 = { x: foldSource.pt.x, y: foldSource.pt.y };
        const Q: Pt2 = { x: q.x, y: q.y };
        const polyPts2: Pt2[] = poly.pts.map(pp => ({ x: pp.x, y: pp.y }));

        const { gonePoly, flapPoly, remainingPoly } = computeFold(polyPts2, P, Q);
        const extendedLine = getExtendedBisector(P, Q);

        const newCrease: CreaseLine = {
          id: `crease_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          polygonId: foldSource.polygonId,
          ...extendedLine,
        };

        const fid = `fold_${Date.now()}`;
        updateCurrentCanvas(prev => {
          const nextFolds = prev.foldResults.filter(f => f.polygonId !== foldSource.polygonId);
          return {
            ...prev,
            creaseLines: [...prev.creaseLines, newCrease],
            foldResults: [...nextFolds, { id: fid, polygonId: foldSource.polygonId, gonePoly, flapPoly, remainingPoly, color: poly.color }],
          };
        });
        setFoldSource(null);
      }
      return;
    }
  }, [activeTool, points, segments, pendingStart, foldSource, polygons, getCoords, updateCurrentCanvas]);

  /* 펼치기 */
  const handleUnfold = useCallback((polyId: string) => {
    updateCurrentCanvas(prev => ({
      ...prev,
      foldResults: prev.foldResults.filter(f => f.polygonId !== polyId),
    }));
  }, [updateCurrentCanvas]);

  /* 마우스 이동 */
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === "직선" && pendingStart) setCursorPos(getCoords(e));
    else setCursorPos(null);
  }, [activeTool, pendingStart, getCoords]);

  /* 삭제 */
  const handleDelete = useCallback(() => {
    if (!selectedItem) return;
    updateCurrentCanvas(prev => {
      if (selectedItem.type === "point") {
        const id = selectedItem.id;
        return {
          ...prev,
          points: prev.points.filter(p => p.id !== id),
          segments: prev.segments.filter(s => s.p1Id !== id && s.p2Id !== id),
        };
      } else {
        return {
          ...prev,
          segments: prev.segments.filter(s => s.id !== selectedItem.id),
        };
      }
    });
    setSelectedItem(null);
  }, [selectedItem, updateCurrentCanvas]);

  /* 전체 초기화 (3개 도화지 모두 초기화) */
  const handleClearAll = () => {
    setCanvases({
      1: initialCanvasData(),
      2: initialCanvasData(),
      3: initialCanvasData(),
    });
    setSelectedItem(null);
    setPendingStart(null);
    setCursorPos(null);
    setFoldSource(null);
  };

  /* 삼각형 자동 생성 — 위치, 각도, 변 길이 등 모든 요소를 완전 무작위화 */
  const generateTriangle = useCallback((type: "acute" | "right" | "obtuse") => {
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    const width = rect && rect.width > 200 ? rect.width : 780;
    const height = rect && rect.height > 200 ? rect.height : 480;

    let rawPts: Pt2[] = [];

    if (type === "acute") {
      /* ── 예각삼각형 무작위 생성 (모든 내각 < 90도) ── */
      const R = 80 + Math.random() * 70; // 반지름 무작위 (80 ~ 150)
      const baseAngle = Math.random() * Math.PI * 2; // 전체 회전각 무작위

      // 외접원 위의 3개 호의 각도 (모두 < 180도이어야 세 내각이 모두 < 90도 예각 보장)
      let a1 = 70 + Math.random() * 70; // 70 ~ 140도
      let a2 = 70 + Math.random() * 70; // 70 ~ 140도
      let a3 = 360 - (a1 + a2);
      while (a3 < 65 || a3 > 150) {
        a1 = 70 + Math.random() * 70;
        a2 = 70 + Math.random() * 70;
        a3 = 360 - (a1 + a2);
      }

      const t1 = baseAngle;
      const t2 = t1 + (a1 * Math.PI) / 180;
      const t3 = t2 + (a2 * Math.PI) / 180;

      rawPts = [
        { x: R * Math.cos(t1), y: R * Math.sin(t1) },
        { x: R * Math.cos(t2), y: R * Math.sin(t2) },
        { x: R * Math.cos(t3), y: R * Math.sin(t3) },
      ];
    } else if (type === "right") {
      /* ── 직각삼각형 무작위 생성 (한 각 = 90도, 변 길이 및 회전 무작위) ── */
      const L1 = 90 + Math.random() * 120; // 밑변 길이 무작위 (90 ~ 210)
      const L2 = 80 + Math.random() * 120; // 높이 길이 무작위 (80 ~ 200)
      const rot = Math.random() * Math.PI * 2; // 전체 회전각 무작위

      // P2가 직각 꼭짓점 (0,0)
      const P2: Pt2 = { x: 0, y: 0 };
      const P1: Pt2 = { x: L1 * Math.cos(rot), y: L1 * Math.sin(rot) };
      const P3: Pt2 = { x: -L2 * Math.sin(rot), y: L2 * Math.cos(rot) };

      rawPts = [P1, P2, P3];
    } else {
      /* ── 둔각삼각형 무작위 생성 (한 각 > 90도, 각도 및 변 길이 무작위) ── */
      const obtuseAngleDeg = 98 + Math.random() * 52; // 둔각 크기 무작위 (98도 ~ 150도)
      const obtuseAngleRad = (obtuseAngleDeg * Math.PI) / 180;
      const L1 = 90 + Math.random() * 110; // 첫 번째 변 길이 무작위 (90 ~ 200)
      const L2 = 80 + Math.random() * 110; // 두 번째 변 길이 무작위 (80 ~ 190)
      const rot = Math.random() * Math.PI * 2; // 회전각 무작위

      // P1이 둔각 꼭짓점 (0,0)
      const P1: Pt2 = { x: 0, y: 0 };
      const P2: Pt2 = { x: L1 * Math.cos(rot), y: L1 * Math.sin(rot) };
      const P3: Pt2 = { x: L2 * Math.cos(rot + obtuseAngleRad), y: L2 * Math.sin(rot + obtuseAngleRad) };

      rawPts = [P1, P2, P3];
    }

    // 캔버스 내 무작위 위치로 배치
    const finalPts = fitInCanvas(rawPts, width, height, 55);

    updateCurrentCanvas(prev => {
      const startIndex = prev.points.length;
      const pt1: Point = { id: `pt_${Date.now()}_1`, x: finalPts[0].x, y: finalPts[0].y, label: makeLabel(startIndex) };
      const pt2: Point = { id: `pt_${Date.now()}_2`, x: finalPts[1].x, y: finalPts[1].y, label: makeLabel(startIndex + 1) };
      const pt3: Point = { id: `pt_${Date.now()}_3`, x: finalPts[2].x, y: finalPts[2].y, label: makeLabel(startIndex + 2) };

      const seg1: Segment = { id: `seg_${Date.now()}_1`, p1Id: pt1.id, p2Id: pt2.id, x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y };
      const seg2: Segment = { id: `seg_${Date.now()}_2`, p1Id: pt2.id, p2Id: pt3.id, x1: pt2.x, y1: pt2.y, x2: pt3.x, y2: pt3.y };
      const seg3: Segment = { id: `seg_${Date.now()}_3`, p1Id: pt3.id, p2Id: pt1.id, x1: pt3.x, y1: pt3.y, x2: pt1.x, y2: pt1.y };

      return {
        ...prev,
        points: [...prev.points, pt1, pt2, pt3],
        segments: [...prev.segments, seg1, seg2, seg3],
      };
    });
  }, [updateCurrentCanvas]);

  const toSVGPts = (pts: Pt2[]) => pts.map(p => `${p.x},${p.y}`).join(" ");

  const svgCursor = activeTool === "선택" ? "default"
    : activeTool === "종이접기" ? (foldSource ? "crosshair" : "pointer")
    : activeTool === "직선" && pendingStart ? "crosshair" : "cell";

  const foldedPolySegIds = useMemo(() => {
    const s = new Set<string>();
    for (const fold of validFoldResults) {
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
  }, [validFoldResults, polygons, segments]);

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

            {/* 1. 기본 도구 목록 (3열 그리드) */}
            <div className="grid grid-cols-3 gap-2">
              {/* 선택 */}
              <button
                type="button"
                onClick={() => changeTool("선택")}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all cursor-pointer ${
                  activeTool === "선택"
                    ? "bg-[#CBA7D2]/20 border-[#CBA7D2] shadow-md"
                    : "bg-gray-50/80 border-gray-200 hover:bg-gray-100/80 hover:border-[#CBA7D2]/50"
                }`}
                style={{ padding: "0.75rem 0.3rem", fontFamily: "var(--font-chalk)" }}
              >
                <span className={`text-xl leading-none ${activeTool === "선택" ? "text-[#CBA7D2]" : "text-gray-400"}`}>↖</span>
                <span className={`font-extrabold text-sm ${activeTool === "선택" ? "text-[#CBA7D2]" : "text-gray-600"}`}>선택</span>
              </button>

              {/* 점 */}
              <button
                type="button"
                onClick={() => changeTool("점")}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all cursor-pointer ${
                  activeTool === "점"
                    ? "bg-[#CBA7D2]/20 border-[#CBA7D2] shadow-md"
                    : "bg-gray-50/80 border-gray-200 hover:bg-gray-100/80 hover:border-[#CBA7D2]/50"
                }`}
                style={{ padding: "0.75rem 0.3rem", fontFamily: "var(--font-chalk)" }}
              >
                <span className={`text-xl leading-none ${activeTool === "점" ? "text-[#CBA7D2]" : "text-gray-400"}`}>•</span>
                <span className={`font-extrabold text-sm ${activeTool === "점" ? "text-[#CBA7D2]" : "text-gray-600"}`}>점</span>
              </button>

              {/* 직선 */}
              <button
                type="button"
                onClick={() => changeTool("직선")}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all cursor-pointer ${
                  activeTool === "직선"
                    ? "bg-[#CBA7D2]/20 border-[#CBA7D2] shadow-md"
                    : "bg-gray-50/80 border-gray-200 hover:bg-gray-100/80 hover:border-[#CBA7D2]/50"
                }`}
                style={{ padding: "0.75rem 0.3rem", fontFamily: "var(--font-chalk)" }}
              >
                <span className={`text-xl leading-none ${activeTool === "직선" ? "text-[#CBA7D2]" : "text-gray-400"}`}>∕</span>
                <span className={`font-extrabold text-sm ${activeTool === "직선" ? "text-[#CBA7D2]" : "text-gray-600"}`}>직선</span>
              </button>

              {/* 종이접기 */}
              <button
                type="button"
                onClick={() => changeTool("종이접기")}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all cursor-pointer ${
                  activeTool === "종이접기"
                    ? "bg-[#CBA7D2]/20 border-[#CBA7D2] shadow-md"
                    : "bg-gray-50/80 border-gray-200 hover:bg-gray-100/80 hover:border-[#CBA7D2]/50"
                }`}
                style={{ padding: "0.75rem 0.3rem", fontFamily: "var(--font-chalk)" }}
              >
                <span className="flex items-center justify-center">
                  <OrigamiCraneIcon size={20} color={activeTool === "종이접기" ? "#CBA7D2" : "#9CA3AF"} />
                </span>
                <span className={`font-extrabold text-sm ${activeTool === "종이접기" ? "text-[#CBA7D2]" : "text-gray-600"}`}>종이접기</span>
              </button>
            </div>

            {/* 2. 삼각형 생성 도구 (3열 그리드, 줄 간격 추가) */}
            <div style={{ marginTop: "1.25rem" }}>
              <div className="grid grid-cols-3 gap-2">
                {/* 예각삼각형 */}
                <button
                  type="button"
                  onClick={() => generateTriangle("acute")}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-gray-200 bg-gray-50/80 hover:bg-[#CBA7D2]/15 hover:border-[#CBA7D2] transition-all cursor-pointer active:scale-95 text-gray-600 hover:text-[#CBA7D2]"
                  style={{ padding: "0.75rem 0.2rem", fontFamily: "var(--font-chalk)" }}
                >
                  <span className="flex items-center justify-center">
                    <AcuteTriangleIcon size={20} color="currentColor" />
                  </span>
                  <span className="font-extrabold text-xs whitespace-nowrap">예각삼각형</span>
                </button>

                {/* 직각삼각형 */}
                <button
                  type="button"
                  onClick={() => generateTriangle("right")}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-gray-200 bg-gray-50/80 hover:bg-[#CBA7D2]/15 hover:border-[#CBA7D2] transition-all cursor-pointer active:scale-95 text-gray-600 hover:text-[#CBA7D2]"
                  style={{ padding: "0.75rem 0.2rem", fontFamily: "var(--font-chalk)" }}
                >
                  <span className="flex items-center justify-center">
                    <RightTriangleIcon size={20} color="currentColor" />
                  </span>
                  <span className="font-extrabold text-xs whitespace-nowrap">직각삼각형</span>
                </button>

                {/* 둔각삼각형 */}
                <button
                  type="button"
                  onClick={() => generateTriangle("obtuse")}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-gray-200 bg-gray-50/80 hover:bg-[#CBA7D2]/15 hover:border-[#CBA7D2] transition-all cursor-pointer active:scale-95 text-gray-600 hover:text-[#CBA7D2]"
                  style={{ padding: "0.75rem 0.2rem", fontFamily: "var(--font-chalk)" }}
                >
                  <span className="flex items-center justify-center">
                    <ObtuseTriangleIcon size={20} color="currentColor" />
                  </span>
                  <span className="font-extrabold text-xs whitespace-nowrap">둔각삼각형</span>
                </button>
              </div>
            </div>

            {/* 상태 안내 */}
            <div style={{ marginTop: "1.25rem" }}>
              {activeTool === "직선" && (
                <div className="rounded-2xl bg-[#CBA7D2]/10 border border-dashed border-[#CBA7D2]/40 text-[#CBA7D2] text-xs leading-relaxed" style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-body)" }}>
                  {pendingStart ? <><span className="font-bold">{pendingStart.label}</span> 에서 시작 — 끝점을 클릭하세요.</> : "시작점을 클릭하세요."}
                </div>
              )}
              {activeTool === "선택" && selectedItem && (
                <div className="rounded-2xl bg-rose-50 border border-dashed border-rose-300/60 text-rose-500 text-xs leading-relaxed" style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-body)" }}>
                  {selectedItem.type === "point" ? "점" : "선분"}이 선택됨 — 도화지의 <span className="font-bold">삭제</span> 버튼을 클릭하세요.
                </div>
              )}
              {activeTool === "종이접기" && (
                <div className="rounded-2xl bg-[#CBA7D2]/10 border border-dashed border-[#CBA7D2]/40 text-[#CBA7D2] text-xs leading-relaxed" style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-body)" }}>
                  {foldSource ? (
                    <>
                      <span className="font-bold text-[#A855F7]">{foldSource.pt.label}</span> 점에서 시작 — 접어 도착할 꼭짓점을 클릭하세요.
                    </>
                  ) : (
                    "접기 시작할 다각형의 꼭짓점을 클릭하세요."
                  )}
                </div>
              )}
            </div>

            {/* 초기화 — 가장 아래 고정 (3개 도화지 모두 초기화) */}
            <button
              type="button"
              onClick={handleClearAll}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300/60 text-rose-400 hover:bg-rose-50/60 transition-all cursor-pointer font-bold"
              style={{ padding: "0.65rem 1rem", fontFamily: "var(--font-chalk)", fontSize: "1.05rem", marginTop: "auto", paddingTop: "0.65rem" }}
            >
              초기화
            </button>
          </div>

          {/* ════ 우측: 도화지 ════ */}
          <div className="xl:col-span-9 chalk-box flex flex-col bg-white/85 backdrop-blur-md" style={{ padding: "0.85rem", minHeight: "520px" }}>

            {/* 1, 2, 3 도화지 선택 탭 바 (도화지와 명확하고 넉넉한 간격 mb-4 / 1.25rem 제공) */}
            <div
              className="flex items-center justify-between pb-3"
              style={{
                marginBottom: "1.25rem",
                borderBottom: "1.5px dashed rgba(203, 167, 210, 0.45)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-gray-600 mr-1" style={{ fontFamily: "var(--font-chalk)" }}>
                  도화지 선택:
                </span>
                {([1, 2, 3] as const).map(num => {
                  const isActive = currentCanvasId === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setCurrentCanvasId(num);
                        setSelectedItem(null);
                        setPendingStart(null);
                        setCursorPos(null);
                        setFoldSource(null);
                      }}
                      className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#CBA7D2] text-white shadow-md scale-105"
                          : "bg-gray-100/90 text-gray-600 hover:bg-gray-200"
                      }`}
                      style={{ fontFamily: "var(--font-chalk)", fontSize: "1.1rem" }}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              <div className="text-xs font-semibold text-[#A855F7]/80 bg-[#CBA7D2]/15 px-3 py-1 rounded-full" style={{ fontFamily: "var(--font-body)" }}>
                {currentCanvasId}번 도화지 편집 중
              </div>
            </div>

            {/* SVG 도화지 영역 */}
            <div className="relative flex-1 overflow-hidden rounded-2xl" style={{ minHeight: "460px" }}>
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

                {/* ── 1. 접혔던 흔적(Crease lines) 연장된 직선 렌더링 ── */}
                {validCreaseLines.map(cl => (
                  <line key={cl.id}
                    x1={cl.x1} y1={cl.y1} x2={cl.x2} y2={cl.y2}
                    stroke="#9CA3AF" strokeWidth={1.5}
                    strokeDasharray="6 4" strokeLinecap="round" />
                ))}

                {/* ── 2. 다각형 렌더링 ── */}
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

                {/* ── 3. 선분 렌더링 ── */}
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
                {activeTool === "직선" && pendingStart && cursorPos && (
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
              {validFoldResults.map(fold => {
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
