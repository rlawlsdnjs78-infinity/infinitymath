/**
 * src/app/triangle-centers/page.tsx
 * 삼각형의 외심과 내심 — 기하 도구 페이지
 */

"use client";

import { useState, useRef, useCallback, useMemo } from "react";

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */
type Tool = "선택" | "점" | "선분" | "종이접기" | "수선" | "컴퍼스";
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
interface PerpendicularLine {
  id: string;
  polygonId?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fromPtId?: string;
  targetSegId?: string;
}
interface CircleItem {
  id: string;
  cx: number;
  cy: number;
  r: number;
}
type SelectedItem =
  | { type: "point"; id: string }
  | { type: "segment"; id: string }
  | { type: "perpLine"; id: string }
  | null;

type FoldSource =
  | { type: "point"; pt: Point; polygonId: string }
  | { type: "segment"; seg: Segment; polygonId: string }
  | null;

interface CanvasData {
  points: Point[];
  segments: Segment[];
  foldResults: FoldResult[];
  creaseLines: CreaseLine[];
  perpLines: PerpendicularLine[];
  circles: CircleItem[];
}

const initialCanvasData = (): CanvasData => ({
  points: [],
  segments: [],
  foldResults: [],
  creaseLines: [],
  perpLines: [],
  circles: [],
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

function PerpendicularIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 19 L21 19" />
      <path d="M12 5 L12 19" />
      <circle cx="12" cy="5" r="1.5" fill={color} />
      <path d="M12 14 h5 v5" strokeWidth="1.4" />
    </svg>
  );
}

function CompassIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2" />
      <path d="M10.5 5.5 L4 21" />
      <path d="M13.5 5.5 L20 21" />
      <path d="M7 14.5 L17 14.5" strokeWidth="1.4" />
      <path d="M4 21 L3 23" strokeWidth="2" strokeLinecap="square" />
      <circle cx="20" cy="21" r="1" fill={color} />
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

/** 두 꼭짓점을 맞포개어 접는 종이접기 계산 (P를 접어서 Q 위로) */
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

/** 두 변을 맞포개어 접는 종이접기 계산 (s1을 접어서 s2 위로) */
function computeSideFold(polyPts: Pt2[], s1: Segment, s2: Segment, length = 4000) {
  const pA1 = { x: s1.x1, y: s1.y1, id: s1.p1Id };
  const pA2 = { x: s1.x2, y: s1.y2, id: s1.p2Id };
  const pB1 = { x: s2.x1, y: s2.y1, id: s2.p1Id };
  const pB2 = { x: s2.x2, y: s2.y2, id: s2.p2Id };

  let V: Pt2;
  let P1: Pt2;
  let P2: Pt2;

  if (pA1.id === pB1.id || Math.hypot(pA1.x - pB1.x, pA1.y - pB1.y) < 1e-3) {
    V = pA1; P1 = pA2; P2 = pB2;
  } else if (pA1.id === pB2.id || Math.hypot(pA1.x - pB2.x, pA1.y - pB2.y) < 1e-3) {
    V = pA1; P1 = pA2; P2 = pB1;
  } else if (pA2.id === pB1.id || Math.hypot(pA2.x - pB1.x, pA2.y - pB1.y) < 1e-3) {
    V = pA2; P1 = pA1; P2 = pB2;
  } else if (pA2.id === pB2.id || Math.hypot(pA2.x - pB2.x, pA2.y - pB2.y) < 1e-3) {
    V = pA2; P1 = pA1; P2 = pB1;
  } else {
    const isect = lineIsect(pA1, pA2, pB1, pB2);
    if (!isect) return null;
    V = isect;
    P1 = { x: (pA1.x + pA2.x) / 2, y: (pA1.y + pA2.y) / 2 };
    P2 = { x: (pB1.x + pB2.x) / 2, y: (pB1.y + pB2.y) / 2 };
  }

  const d1x = P1.x - V.x, d1y = P1.y - V.y;
  const d2x = P2.x - V.x, d2y = P2.y - V.y;
  const len1 = Math.hypot(d1x, d1y);
  const len2 = Math.hypot(d2x, d2y);
  if (len1 < 1e-5 || len2 < 1e-5) return null;

  const u1x = d1x / len1, u1y = d1y / len1;
  const u2x = d2x / len2, u2y = d2y / len2;

  let bisX = u1x + u2x;
  let bisY = u1y + u2y;
  let bisLen = Math.hypot(bisX, bisY);

  if (bisLen < 1e-5) {
    bisX = -u1y;
    bisY = u1x;
  } else {
    bisX /= bisLen;
    bisY /= bisLen;
  }

  // 접은선: V를 지나며 (bisX, bisY) 방향
  const extendedLine = {
    x1: Math.round(V.x - length * bisX),
    y1: Math.round(V.y - length * bisY),
    x2: Math.round(V.x + length * bisX),
    y2: Math.round(V.y + length * bisY),
  };

  const V_next: Pt2 = { x: V.x + bisX, y: V.y + bisY };

  // s1(P1) 쪽이 접혀서 넘어가는 gonePoly / flapPoly가 됨
  const sideP1 = cross2(V, V_next, P1);

  let gonePoly: Pt2[];
  let remainingPoly: Pt2[];

  if (sideP1 >= 0) {
    gonePoly = clipHalf(polyPts, V, V_next);
    remainingPoly = clipHalf(polyPts, V_next, V);
  } else {
    gonePoly = clipHalf(polyPts, V_next, V);
    remainingPoly = clipHalf(polyPts, V, V_next);
  }

  // 점 V와 방향벡터 (bisX, bisY)를 기준으로 대칭 이동
  const reflectAcrossBisector = (pt: Pt2): Pt2 => {
    const dx = pt.x - V.x;
    const dy = pt.y - V.y;
    const dot = dx * bisX + dy * bisY;
    const projX = dot * bisX;
    const projY = dot * bisY;
    return {
      x: Math.round(V.x + 2 * projX - dx),
      y: Math.round(V.y + 2 * projY - dy),
    };
  };

  const flapPoly = gonePoly.map(reflectAcrossBisector);

  return {
    extendedLine,
    gonePoly,
    remainingPoly,
    flapPoly,
  };
}

/** 점 P에서 선분 seg(또는 선분이 포함된 직선)으로 내린 수선의 발 H 계산 */
function computePerpendicularFoot(P: Pt2, seg: Segment): Pt2 {
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-10) return { x: seg.x1, y: seg.y1 };
  const t = ((P.x - seg.x1) * dx + (P.y - seg.y1) * dy) / len2;
  return {
    x: Math.round(seg.x1 + t * dx),
    y: Math.round(seg.y1 + t * dy),
  };
}

/** 삼각형의 외심 (Circumcenter) 계산 */
function getTriangleCircumcenter(A: Pt2, B: Pt2, C: Pt2): Pt2 | null {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  if (Math.abs(d) < 1e-7) return null;
  const a2 = A.x * A.x + A.y * A.y;
  const b2 = B.x * B.x + B.y * B.y;
  const c2 = C.x * C.x + C.y * C.y;
  const ox = (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d;
  const oy = (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d;
  return { x: Math.round(ox), y: Math.round(oy) };
}

/** 삼각형의 내심 (Incenter) 계산 */
function getTriangleIncenter(A: Pt2, B: Pt2, C: Pt2): Pt2 | null {
  const a = Math.hypot(B.x - C.x, B.y - C.y); // BC 길이
  const b = Math.hypot(C.x - A.x, C.y - A.y); // CA 길이
  const c = Math.hypot(A.x - B.x, A.y - B.y); // AB 길이
  const p = a + b + c;
  if (p < 1e-5) return null;
  const ix = (a * A.x + b * B.x + c * C.x) / p;
  const iy = (a * A.y + b * B.y + c * C.y) / p;
  return { x: Math.round(ix), y: Math.round(iy) };
}

/* ── 모든 선분 및 선들 간의 교점(Intersection) 계산 ── */
interface LineSegmentData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isExtended?: boolean;
}

function findLineIntersection(l1: LineSegmentData, l2: LineSegmentData): Pt2 | null {
  const dx1 = l1.x2 - l1.x1;
  const dy1 = l1.y2 - l1.y1;
  const dx2 = l2.x2 - l2.x1;
  const dy2 = l2.y2 - l2.y1;

  const det = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(det) < 1e-6) return null; // 평행이거나 일치

  const t = ((l2.x1 - l1.x1) * dy2 - (l2.y1 - l1.y1) * dx2) / det;
  const u = ((l2.x1 - l1.x1) * dy1 - (l2.y1 - l1.y1) * dx1) / det;

  // 허용 오차: 부동소수점 및 선분 끝점 근처 교차점을 위해 충분한 tolerance (0.04) 적용
  const eps = 0.04;
  if (!l1.isExtended && (t < -eps || t > 1 + eps)) return null;
  if (!l2.isExtended && (u < -eps || u > 1 + eps)) return null;

  return {
    x: l1.x1 + t * dx1,
    y: l1.y1 + t * dy1,
  };
}

function getAllLineIntersections(
  segments: Segment[],
  creaseLines: CreaseLine[],
  perpLines: PerpendicularLine[],
  foldResults: FoldResult[],
  width = 1200,
  height = 800
): Pt2[] {
  const allLines: LineSegmentData[] = [];

  // 1. 선분들
  for (const s of segments) {
    allLines.push({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, isExtended: false });
  }

  // 2. 종이접기 다각형 테두리 선
  for (const f of foldResults) {
    const addPolyEdges = (poly: Pt2[]) => {
      for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        allLines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, isExtended: false });
      }
    };
    if (f.remainingPoly.length >= 3) addPolyEdges(f.remainingPoly);
    if (f.flapPoly.length >= 3) addPolyEdges(f.flapPoly);
  }

  // 3. 접은선 (연장선)
  for (const cl of creaseLines) {
    allLines.push({ x1: cl.x1, y1: cl.y1, x2: cl.x2, y2: cl.y2, isExtended: true });
  }

  // 4. 수선
  for (const pl of perpLines) {
    allLines.push({ x1: pl.x1, y1: pl.y1, x2: pl.x2, y2: pl.y2, isExtended: false });
  }

  const intersections: Pt2[] = [];

  // 4-1. 모든 수선의 발 H = (pl.x2, pl.y2)는 100% 확실하게 교점 목록에 추가
  for (const pl of perpLines) {
    const footPt: Pt2 = { x: Math.round(pl.x2), y: Math.round(pl.y2) };
    if (!intersections.some(existing => Math.hypot(existing.x - footPt.x, existing.y - footPt.y) < 1.0)) {
      intersections.push(footPt);
    }
  }

  // 5. 모든 선들 간의 교차점 계산
  for (let i = 0; i < allLines.length; i++) {
    for (let j = i + 1; j < allLines.length; j++) {
      const pt = findLineIntersection(allLines[i], allLines[j]);
      if (pt) {
        if (pt.x >= -100 && pt.x <= width + 100 && pt.y >= -100 && pt.y <= height + 100) {
          const roundedPt: Pt2 = { x: Math.round(pt.x), y: Math.round(pt.y) };
          const isDup = intersections.some(existing => Math.hypot(existing.x - roundedPt.x, existing.y - roundedPt.y) < 1.0);
          if (!isDup) {
            intersections.push(roundedPt);
          }
        }
      }
    }
  }

  return intersections;
}

function nearestIntersection(isects: Pt2[], x: number, y: number, thr = 15): Pt2 | null {
  let best: Pt2 | null = null, minD = thr;
  for (const pt of isects) {
    const d = Math.hypot(pt.x - x, pt.y - y);
    if (d < minD) { minD = d; best = pt; }
  }
  return best;
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
function fitInCanvas(pts: Pt2[], width: number, height: number, margin = 30): Pt2[] {
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

/** SVG Arc 패스 생성 헬퍼 */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const diff = endAngle - startAngle;
  if (diff >= Math.PI * 2 - 1e-4) {
    return `M ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy}`;
  }
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArcFlag = diff > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
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
  const [foldSource, setFoldSource] = useState<FoldSource>(null);
  const [pendingPerpPt, setPendingPerpPt] = useState<Point | null>(null);
  const [pendingCompassCenter, setPendingCompassCenter] = useState<Point | null>(null);

  /* 컴퍼스 애니메이션 상태 */
  const [compassAnim, setCompassAnim] = useState<{
    cx: number;
    cy: number;
    px: number;
    py: number;
    r: number;
    startAngle: number;
    currentAngle: number;
    progress: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  /* 현재 활성 도화지 데이터 */
  const currentData = canvases[currentCanvasId];
  const points = currentData.points;
  const segments = currentData.segments;
  const foldResults = currentData.foldResults;
  const creaseLines = currentData.creaseLines;
  const perpLines = currentData.perpLines || [];
  const circles = currentData.circles || [];

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

  const validPerpLines = useMemo(() => {
    return perpLines.filter(pl => !pl.polygonId || validPolyIds.has(pl.polygonId));
  }, [perpLines, validPolyIds]);

  /* ── 현재 도화지의 모든 선들 간 교점 계산 ── */
  const lineIntersections = useMemo(() => {
    const svg = svgRef.current;
    const w = svg && svg.clientWidth > 200 ? svg.clientWidth : 1200;
    const h = svg && svg.clientHeight > 200 ? svg.clientHeight : 800;
    return getAllLineIntersections(segments, validCreaseLines, validPerpLines, validFoldResults, w, h);
  }, [segments, validCreaseLines, validPerpLines, validFoldResults]);

  /* 점 도구 호버 시 근처 교점 스냅 인디케이터 */
  const hoveredSnapPt = useMemo(() => {
    if (activeTool !== "점" || !cursorPos) return null;
    return nearestIntersection(lineIntersections, cursorPos.x, cursorPos.y, 15);
  }, [activeTool, cursorPos, lineIntersections]);

  /* 삭제 버튼 위치 (도화지 경계를 벗어나지 않도록 클램프) */
  const delBtnPos = useMemo(() => {
    if (!selectedItem) return null;
    let rawX = 0;
    let rawY = 0;
    if (selectedItem.type === "point") {
      const p = points.find(p => p.id === selectedItem.id);
      if (!p) return null;
      rawX = p.x + 13;
      rawY = p.y - 16;
    } else if (selectedItem.type === "segment") {
      const s = segments.find(s => s.id === selectedItem.id);
      if (!s) return null;
      rawX = (s.x1 + s.x2) / 2 + 10;
      rawY = (s.y1 + s.y2) / 2 - 16;
    } else if (selectedItem.type === "perpLine") {
      const pl = perpLines.find(p => p.id === selectedItem.id);
      if (!pl) return null;
      rawX = (pl.x1 + pl.x2) / 2 + 10;
      rawY = (pl.y1 + pl.y2) / 2 - 16;
    }

    const svg = svgRef.current;
    const maxW = svg && svg.clientWidth > 200 ? svg.clientWidth : 780;
    const maxH = svg && svg.clientHeight > 200 ? svg.clientHeight : 480;

    const clampedX = Math.max(8, Math.min(maxW - 55, rawX));
    const clampedY = Math.max(8, Math.min(maxH - 32, rawY));

    return { x: clampedX, y: clampedY };
  }, [selectedItem, points, segments, perpLines]);

  /* 도구 전환 */
  const changeTool = useCallback((t: Tool) => {
    setActiveTool(t);
    setPendingStart(null);
    setCursorPos(null);
    setSelectedItem(null);
    setFoldSource(null);
    setPendingPerpPt(null);
    setPendingCompassCenter(null);
  }, []);

  /* 컴퍼스 애니메이션 실행 */
  const runCompassAnimation = useCallback((C: Pt2, P: Pt2, r: number, startAngle: number) => {
    const duration = 1400;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const angle = startAngle + eased * Math.PI * 2;

      setCompassAnim({
        cx: C.x,
        cy: C.y,
        px: C.x + r * Math.cos(angle),
        py: C.y + r * Math.sin(angle),
        r,
        startAngle,
        currentAngle: angle,
        progress: eased,
      });

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setCompassAnim(null);
        const newCircle: CircleItem = {
          id: `circle_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          cx: C.x,
          cy: C.y,
          r,
        };
        updateCurrentCanvas(prev => ({
          ...prev,
          circles: [...(prev.circles || []), newCircle],
        }));
      }
    };

    requestAnimationFrame(frame);
  }, [updateCurrentCanvas]);

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
      let bestPerp: PerpendicularLine | null = null, minDPerp = 10;
      for (const pl of validPerpLines) {
        const d = distSeg(x, y, pl.x1, pl.y1, pl.x2, pl.y2);
        if (d < minDPerp) { minDPerp = d; bestPerp = pl; }
      }
      if (bestPerp) { setSelectedItem({ type: "perpLine", id: bestPerp.id }); return; }
      setSelectedItem(null); return;
    }

    /* ── 점 (모든 선들의 교점 자동 스냅) ── */
    if (activeTool === "점") {
      let finalCoord = { x, y };

      // 1) 클릭한 위치에서 가장 가까운 교점 탐색 (반경 15px)
      const snapIsect = nearestIntersection(lineIntersections, x, y, 15);
      if (snapIsect) {
        finalCoord = { x: Math.round(snapIsect.x), y: Math.round(snapIsect.y) };
      }

      const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      updateCurrentCanvas(prev => ({
        ...prev,
        points: [...prev.points, { id, x: finalCoord.x, y: finalCoord.y, label: makeLabel(prev.points.length) }],
      }));
      setSelectedItem(null);
      return;
    }

    /* ── 선분 ── */
    if (activeTool === "선분") {
      if (!pendingStart) {
        const snapped = nearestPt(points, x, y, 12);
        if (snapped) {
          setPendingStart(snapped);
        } else {
          const snapIsect = nearestIntersection(lineIntersections, x, y, 15);
          const coord = snapIsect ? { x: Math.round(snapIsect.x), y: Math.round(snapIsect.y) } : { x, y };
          const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          const np: Point = { id, x: coord.x, y: coord.y, label: makeLabel(points.length) };
          updateCurrentCanvas(prev => ({ ...prev, points: [...prev.points, np] }));
          setPendingStart(np);
        }
      } else {
        const snapped = nearestPt(points, x, y, 12);
        let endPt: Point;
        if (snapped && snapped.id !== pendingStart.id) {
          endPt = snapped;
        } else if (!snapped) {
          const snapIsect = nearestIntersection(lineIntersections, x, y, 15);
          const coord = snapIsect ? { x: Math.round(snapIsect.x), y: Math.round(snapIsect.y) } : { x, y };
          const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          endPt = { id, x: coord.x, y: coord.y, label: makeLabel(points.length) };
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

    /* ── 종이접기 (꼭짓점 맞포개기[외심] 또는 두 변 맞포개기[내심]) ── */
    if (activeTool === "종이접기") {
      if (!foldSource) {
        // 꼭짓점 먼저 탐색
        const p = nearestPt(points, x, y, 16);
        if (p) {
          const poly = polygons.find(pl => pl.pts.some(pp => pp.id === p.id));
          if (poly) {
            setFoldSource({ type: "point", pt: p, polygonId: poly.id });
            return;
          }
        }

        // 변(선분) 탐색
        let clickedSeg: Segment | null = null;
        let minD = 16;
        for (const s of segments) {
          const d = distSeg(x, y, s.x1, s.y1, s.x2, s.y2);
          if (d < minD) { minD = d; clickedSeg = s; }
        }

        if (clickedSeg) {
          const poly = polygons.find(pl => {
            return pl.pts.some(pt => pt.id === clickedSeg!.p1Id) && pl.pts.some(pt => pt.id === clickedSeg!.p2Id);
          });
          if (poly) {
            setFoldSource({ type: "segment", seg: clickedSeg, polygonId: poly.id });
            return;
          }
        }
      } else {
        const poly = polygons.find(pl => pl.id === foldSource.polygonId);
        if (!poly) { setFoldSource(null); return; }

        if (foldSource.type === "point") {
          // 꼭짓점 맞포개기 (외심)
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
        } else {
          // 두 변 맞포개기 (내심 — 처음 선택한 변이 나중에 선택한 변 위로 접힘)
          let secondSeg: Segment | null = null;
          let minD = 18;
          for (const s of segments) {
            const d = distSeg(x, y, s.x1, s.y1, s.x2, s.y2);
            if (d < minD) { minD = d; secondSeg = s; }
          }

          if (!secondSeg || secondSeg.id === foldSource.seg.id) {
            if (secondSeg && secondSeg.id === foldSource.seg.id) setFoldSource(null);
            return;
          }

          const polyPts2: Pt2[] = poly.pts.map(pp => ({ x: pp.x, y: pp.y }));
          const res = computeSideFold(polyPts2, foldSource.seg, secondSeg);
          if (res) {
            const newCrease: CreaseLine = {
              id: `crease_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
              polygonId: foldSource.polygonId,
              ...res.extendedLine,
            };

            const fid = `fold_${Date.now()}`;
            updateCurrentCanvas(prev => {
              const nextFolds = prev.foldResults.filter(f => f.polygonId !== foldSource.polygonId);
              return {
                ...prev,
                creaseLines: [...prev.creaseLines, newCrease],
                foldResults: [...nextFolds, { id: fid, polygonId: foldSource.polygonId, gonePoly: res.gonePoly, flapPoly: res.flapPoly, remainingPoly: res.remainingPoly, color: poly.color }],
              };
            });
          }
          setFoldSource(null);
        }
      }
      return;
    }

    /* ── 수선 (점 선택 후 선분 선택) ── */
    if (activeTool === "수선") {
      if (!pendingPerpPt) {
        // 1단계: 수선을 내릴 기준 점 선택
        const snapIsect = nearestIntersection(lineIntersections, x, y, 15);
        const targetCoord = snapIsect ? { x: Math.round(snapIsect.x), y: Math.round(snapIsect.y) } : { x, y };
        const snappedPt = nearestPt(points, targetCoord.x, targetCoord.y, 16);

        let fromPt: Point;
        if (snappedPt) {
          fromPt = snappedPt;
        } else {
          fromPt = {
            id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            x: targetCoord.x,
            y: targetCoord.y,
            label: makeLabel(points.length),
          };
          updateCurrentCanvas(prev => ({ ...prev, points: [...prev.points, fromPt] }));
        }
        setPendingPerpPt(fromPt);
      } else {
        // 2단계: 수선을 내릴 선분 선택
        let clickedSeg: Segment | null = null;
        let minD = 18;
        for (const s of segments) {
          const d = distSeg(x, y, s.x1, s.y1, s.x2, s.y2);
          if (d < minD) { minD = d; clickedSeg = s; }
        }

        if (clickedSeg) {
          const H = computePerpendicularFoot(pendingPerpPt, clickedSeg);
          const matchedPoly = polygons.find(p => {
            return p.pts.some(pt => pt.id === clickedSeg!.p1Id) && p.pts.some(pt => pt.id === clickedSeg!.p2Id);
          });

          const newPerpLine: PerpendicularLine = {
            id: `perp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            polygonId: matchedPoly?.id,
            x1: pendingPerpPt.x,
            y1: pendingPerpPt.y,
            x2: H.x,
            y2: H.y,
            fromPtId: pendingPerpPt.id,
            targetSegId: clickedSeg.id,
          };

          updateCurrentCanvas(prev => ({
            ...prev,
            perpLines: [...(prev.perpLines || []), newPerpLine],
          }));
          setPendingPerpPt(null);
        } else {
          // 선분이 아닌 다른 점을 클릭했을 경우 기준점 변경
          const otherPt = nearestPt(points, x, y, 16);
          if (otherPt && otherPt.id !== pendingPerpPt.id) {
            setPendingPerpPt(otherPt);
          } else {
            setPendingPerpPt(null);
          }
        }
      }
      return;
    }

    /* ── 컴퍼스 ── */
    if (activeTool === "컴퍼스") {
      if (!pendingCompassCenter) {
        // 1순위: 이미 도화지에 표시된 점 근처를 클릭하면 해당 점 선택
        const existingPt = nearestPt(points, x, y, 16);
        let center: Point;
        if (existingPt) {
          center = existingPt;
        } else {
          // 2순위: 교점에 스냅 또는 클릭 위치에 새 점 생성
          const snapIsect = nearestIntersection(lineIntersections, x, y, 15);
          const coord = snapIsect ? { x: Math.round(snapIsect.x), y: Math.round(snapIsect.y) } : { x, y };
          center = {
            id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            x: coord.x,
            y: coord.y,
            label: makeLabel(points.length),
          };
          updateCurrentCanvas(prev => ({ ...prev, points: [...prev.points, center] }));
        }
        setPendingCompassCenter(center);
      } else {
        // 1순위: 이미 도화지에 표시된 점 근처를 클릭하면 해당 점 선택
        const existingPt = nearestPt(points, x, y, 16);
        let passPt: Point;
        if (existingPt && existingPt.id !== pendingCompassCenter.id) {
          passPt = existingPt;
        } else if (!existingPt) {
          // 2순위: 교점에 스냅 또는 클릭 위치에 새 점 생성
          const snapIsect = nearestIntersection(lineIntersections, x, y, 15);
          const coord = snapIsect ? { x: Math.round(snapIsect.x), y: Math.round(snapIsect.y) } : { x, y };
          passPt = {
            id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            x: coord.x,
            y: coord.y,
            label: makeLabel(points.length),
          };
          updateCurrentCanvas(prev => ({ ...prev, points: [...prev.points, passPt] }));
        } else {
          // 같은 점을 다시 클릭했을 경우 선택 취소
          setPendingCompassCenter(null);
          return;
        }

        const r = Math.hypot(passPt.x - pendingCompassCenter.x, passPt.y - pendingCompassCenter.y);
        if (r > 6) {
          const startAngle = Math.atan2(passPt.y - pendingCompassCenter.y, passPt.x - pendingCompassCenter.x);
          runCompassAnimation(pendingCompassCenter, passPt, r, startAngle);
        }
        setPendingCompassCenter(null);
      }
      return;
    }
  }, [activeTool, points, segments, validPerpLines, lineIntersections, pendingStart, foldSource, pendingPerpPt, pendingCompassCenter, polygons, validCreaseLines, getCoords, updateCurrentCanvas, runCompassAnimation]);

  /* 펼치기 */
  const handleUnfold = useCallback((polyId: string) => {
    updateCurrentCanvas(prev => ({
      ...prev,
      foldResults: prev.foldResults.filter(f => f.polygonId !== polyId),
    }));
  }, [updateCurrentCanvas]);

  /* 마우스 이동 */
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getCoords(e);
    if (
      (activeTool === "선분" && pendingStart) ||
      (activeTool === "컴퍼스" && pendingCompassCenter) ||
      (activeTool === "수선" && pendingPerpPt) ||
      activeTool === "점"
    ) {
      setCursorPos(coords);
    } else {
      setCursorPos(null);
    }
  }, [activeTool, pendingStart, pendingCompassCenter, pendingPerpPt, getCoords]);

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
          perpLines: (prev.perpLines || []).filter(p => p.fromPtId !== id),
        };
      } else if (selectedItem.type === "segment") {
        return {
          ...prev,
          segments: prev.segments.filter(s => s.id !== selectedItem.id),
          perpLines: (prev.perpLines || []).filter(p => p.targetSegId !== selectedItem.id),
        };
      } else if (selectedItem.type === "perpLine") {
        return {
          ...prev,
          perpLines: (prev.perpLines || []).filter(p => p.id !== selectedItem.id),
        };
      }
      return prev;
    });
    setSelectedItem(null);
  }, [selectedItem, updateCurrentCanvas]);

  /* 현재 도화지만 초기화 */
  const handleClearCurrent = () => {
    setCanvases(prev => ({
      ...prev,
      [currentCanvasId]: initialCanvasData(),
    }));
    setSelectedItem(null);
    setPendingStart(null);
    setCursorPos(null);
    setFoldSource(null);
    setPendingPerpPt(null);
    setPendingCompassCenter(null);
    setCompassAnim(null);
  };

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
    setPendingPerpPt(null);
    setPendingCompassCenter(null);
    setCompassAnim(null);
  };

  /* 삼각형 자동 생성 — 2배 크기 완전 무작위화 */
  const generateTriangle = useCallback((type: "acute" | "right" | "obtuse") => {
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    const width = rect && rect.width > 200 ? rect.width : 780;
    const height = rect && rect.height > 200 ? rect.height : 480;

    let rawPts: Pt2[] = [];

    if (type === "acute") {
      const R = 150 + Math.random() * 90;
      const baseAngle = Math.random() * Math.PI * 2;

      let a1 = 70 + Math.random() * 70;
      let a2 = 70 + Math.random() * 70;
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
      const L1 = 180 + Math.random() * 180;
      const L2 = 160 + Math.random() * 180;
      const rot = Math.random() * Math.PI * 2;

      const P2: Pt2 = { x: 0, y: 0 };
      const P1: Pt2 = { x: L1 * Math.cos(rot), y: L1 * Math.sin(rot) };
      const P3: Pt2 = { x: -L2 * Math.sin(rot), y: L2 * Math.cos(rot) };

      rawPts = [P1, P2, P3];
    } else {
      /* ── 둔각삼각형 (외심 (0,0)이 도화지 안에 무조건 포함되도록 생성) ── */
      const R = 140 + Math.random() * 80;
      const baseAngle = Math.random() * Math.PI * 2;

      const a1 = 190 + Math.random() * 45;
      const rem = 360 - a1;
      const a2 = 40 + Math.random() * (rem - 80);

      const t1 = baseAngle;
      const t2 = t1 + (a1 * Math.PI) / 180;
      const t3 = t2 + (a2 * Math.PI) / 180;

      const P1: Pt2 = { x: R * Math.cos(t1), y: R * Math.sin(t1) };
      const P2: Pt2 = { x: R * Math.cos(t2), y: R * Math.sin(t2) };
      const P3: Pt2 = { x: R * Math.cos(t3), y: R * Math.sin(t3) };
      const circumcenter: Pt2 = { x: 0, y: 0 }; // 외심

      rawPts = [P1, P2, P3, circumcenter];
    }

    const fitted = fitInCanvas(rawPts, width, height, 35);
    const finalPts = fitted.slice(0, 3);

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
    : (activeTool === "선분" && pendingStart) || (activeTool === "수선" && pendingPerpPt) || activeTool === "컴퍼스" ? "crosshair" : "cell";

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

            {/* 1. 기본 도구 목록 (3열 2행 깔끔한 그리드) */}
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

              {/* 선분 */}
              <button
                type="button"
                onClick={() => changeTool("선분")}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all cursor-pointer ${
                  activeTool === "선분"
                    ? "bg-[#CBA7D2]/20 border-[#CBA7D2] shadow-md"
                    : "bg-gray-50/80 border-gray-200 hover:bg-gray-100/80 hover:border-[#CBA7D2]/50"
                }`}
                style={{ padding: "0.75rem 0.3rem", fontFamily: "var(--font-chalk)" }}
              >
                <span className={`text-xl leading-none ${activeTool === "선분" ? "text-[#CBA7D2]" : "text-gray-400"}`}>∕</span>
                <span className={`font-extrabold text-sm ${activeTool === "선분" ? "text-[#CBA7D2]" : "text-gray-600"}`}>선분</span>
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

              {/* 수선 */}
              <button
                type="button"
                onClick={() => changeTool("수선")}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all cursor-pointer ${
                  activeTool === "수선"
                    ? "bg-[#CBA7D2]/20 border-[#CBA7D2] shadow-md"
                    : "bg-gray-50/80 border-gray-200 hover:bg-gray-100/80 hover:border-[#CBA7D2]/50"
                }`}
                style={{ padding: "0.75rem 0.3rem", fontFamily: "var(--font-chalk)" }}
              >
                <span className="flex items-center justify-center">
                  <PerpendicularIcon size={20} color={activeTool === "수선" ? "#CBA7D2" : "#9CA3AF"} />
                </span>
                <span className={`font-extrabold text-sm ${activeTool === "수선" ? "text-[#CBA7D2]" : "text-gray-600"}`}>수선</span>
              </button>

              {/* 컴퍼스 */}
              <button
                type="button"
                onClick={() => changeTool("컴퍼스")}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all cursor-pointer ${
                  activeTool === "컴퍼스"
                    ? "bg-[#CBA7D2]/20 border-[#CBA7D2] shadow-md"
                    : "bg-gray-50/80 border-gray-200 hover:bg-gray-100/80 hover:border-[#CBA7D2]/50"
                }`}
                style={{ padding: "0.75rem 0.3rem", fontFamily: "var(--font-chalk)" }}
              >
                <span className="flex items-center justify-center">
                  <CompassIcon size={20} color={activeTool === "컴퍼스" ? "#CBA7D2" : "#9CA3AF"} />
                </span>
                <span className={`font-extrabold text-sm ${activeTool === "컴퍼스" ? "text-[#CBA7D2]" : "text-gray-600"}`}>컴퍼스</span>
              </button>
            </div>

            {/* 2. 삼각형 생성 도구 (3열 그리드) */}
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
              {activeTool === "선분" && (
                <div className="rounded-2xl bg-[#CBA7D2]/10 border border-dashed border-[#CBA7D2]/40 text-[#CBA7D2] text-xs leading-relaxed" style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-body)" }}>
                  {pendingStart ? <><span className="font-bold">{pendingStart.label}</span> 에서 시작 — 끝점을 클릭하세요.</> : "시작점을 클릭하세요."}
                </div>
              )}
              {activeTool === "선택" && selectedItem && (
                <div className="rounded-2xl bg-rose-50 border border-dashed border-rose-300/60 text-rose-500 text-xs leading-relaxed" style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-body)" }}>
                  {selectedItem.type === "point" ? "점" : selectedItem.type === "segment" ? "선분" : "수선"}이 선택됨 — 도화지의 <span className="font-bold">삭제</span> 버튼을 클릭하세요.
                </div>
              )}
              {activeTool === "종이접기" && (
                <div className="rounded-2xl bg-[#CBA7D2]/10 border border-dashed border-[#CBA7D2]/40 text-[#CBA7D2] text-xs leading-relaxed" style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-body)" }}>
                  {foldSource ? (
                    foldSource.type === "point" ? (
                      <>
                        <span className="font-bold text-[#A855F7]">{foldSource.pt.label}</span> 꼭짓점 선택됨 — 맞포갤 다른 꼭짓점을 클릭하세요.
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-[#A855F7]">첫 번째 변</span> 선택됨 — 처음 변이 포개어질 두 번째 변을 클릭하세요.
                      </>
                    )
                  ) : (
                    "접을 두 꼭짓점 또는 두 변을 차례로 클릭하세요."
                  )}
                </div>
              )}
              {activeTool === "수선" && (
                <div className="rounded-2xl bg-[#CBA7D2]/10 border border-dashed border-[#CBA7D2]/40 text-[#CBA7D2] text-xs leading-relaxed" style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-body)" }}>
                  {pendingPerpPt ? (
                    <>
                      <span className="font-bold text-[#A855F7]">{pendingPerpPt.label}</span> 점에서 수선을 내릴 선분을 클릭하세요.
                    </>
                  ) : (
                    "수선을 내릴 기준 점을 클릭하세요."
                  )}
                </div>
              )}
              {activeTool === "컴퍼스" && (
                <div className="rounded-2xl bg-[#CBA7D2]/10 border border-dashed border-[#CBA7D2]/40 text-[#CBA7D2] text-xs leading-relaxed" style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-body)" }}>
                  {pendingCompassCenter ? (
                    <>
                      <span className="font-bold text-[#A855F7]">{pendingCompassCenter.label}</span> 중심 — 원이 지나갈 점을 클릭하세요.
                    </>
                  ) : (
                    "원의 중심이 될 점을 클릭하세요."
                  )}
                </div>
              )}
            </div>

            {/* 초기화 — 좌우 반반 (현재 초기화 / 전체 초기화) */}
            <div className="grid grid-cols-2 gap-2" style={{ marginTop: "auto", paddingTop: "0.65rem" }}>
              <button
                type="button"
                onClick={handleClearCurrent}
                className="w-full flex items-center justify-center rounded-2xl border-2 border-dashed border-rose-300/60 text-rose-400 hover:bg-rose-50/60 transition-all cursor-pointer font-bold"
                style={{ padding: "0.65rem 0.5rem", fontFamily: "var(--font-chalk)", fontSize: "0.95rem" }}
              >
                현재 초기화
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="w-full flex items-center justify-center rounded-2xl border-2 border-dashed border-rose-400 text-rose-500 hover:bg-rose-50 transition-all cursor-pointer font-bold"
                style={{ padding: "0.65rem 0.5rem", fontFamily: "var(--font-chalk)", fontSize: "0.95rem" }}
              >
                전체 초기화
              </button>
            </div>
          </div>

          {/* ════ 우측: 도화지 ════ */}
          <div className="xl:col-span-9 chalk-box flex flex-col bg-white/85 backdrop-blur-md" style={{ padding: "0.85rem", minHeight: "520px" }}>

            {/* 1, 2, 3 도화지 선택 버튼 영역 */}
            <div
              className="flex items-center gap-2.5"
              style={{ marginBottom: "1.25rem" }}
            >
              <span className="text-sm font-bold text-gray-600 mr-1" style={{ fontFamily: "var(--font-chalk)" }}>
                도화지:
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
                      setPendingPerpPt(null);
                      setPendingCompassCenter(null);
                      setCompassAnim(null);
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

                {/* ── 1. 접힌 흔적(Crease lines) 연장된 직선 렌더링 ── */}
                {validCreaseLines.map(cl => (
                  <line key={cl.id}
                    x1={cl.x1} y1={cl.y1} x2={cl.x2} y2={cl.y2}
                    stroke="#9CA3AF" strokeWidth={1.5}
                    strokeDasharray="6 4" strokeLinecap="round" />
                ))}

                {/* ── 2. 수선(Perpendicular lines) 렌더링 ── */}
                {validPerpLines.map(pl => {
                  const isSel = selectedItem?.type === "perpLine" && selectedItem.id === pl.id;
                  const targetSeg = segments.find(s => s.id === pl.targetSegId);

                  // 직각 표시 (Right Angle Symbol) 계산
                  const dx = pl.x1 - pl.x2; // H -> P 방향
                  const dy = pl.y1 - pl.y2;
                  const perpLen = Math.hypot(dx, dy);

                  let rightAnglePath = "";
                  if (perpLen > 10) {
                    const upx = dx / perpLen;
                    const upy = dy / perpLen;

                    let sx = -upy;
                    let sy = upx;

                    if (targetSeg) {
                      const segDx = targetSeg.x2 - targetSeg.x1;
                      const segDy = targetSeg.y2 - targetSeg.y1;
                      const segLen = Math.hypot(segDx, segDy);
                      if (segLen > 1e-4) {
                        sx = segDx / segLen;
                        sy = segDy / segLen;
                      }
                    }

                    const s = 10;
                    const p1 = { x: pl.x2 + upx * s, y: pl.y2 + upy * s };
                    const p2 = { x: pl.x2 + upx * s + sx * s, y: pl.y2 + upy * s + sy * s };
                    const p3 = { x: pl.x2 + sx * s, y: pl.y2 + sy * s };
                    rightAnglePath = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`;
                  }

                  return (
                    <g key={pl.id}>
                      <line
                        x1={pl.x1} y1={pl.y1} x2={pl.x2} y2={pl.y2}
                        stroke={isSel ? "#CBA7D2" : "#0D9488"}
                        strokeWidth={isSel ? 2.5 : 1.8}
                        strokeDasharray="6 4"
                        strokeLinecap="round"
                      />
                      {rightAnglePath && (
                        <path
                          d={rightAnglePath}
                          fill="none"
                          stroke={isSel ? "#CBA7D2" : "#0D9488"}
                          strokeWidth={1.5}
                        />
                      )}
                    </g>
                  );
                })}

                {/* ── 3. 원(Circles) 렌더링 ── */}
                {circles.map(c => (
                  <circle
                    key={c.id}
                    cx={c.cx}
                    cy={c.cy}
                    r={c.r}
                    fill="none"
                    stroke="#CBA7D2"
                    strokeWidth={2}
                  />
                ))}

                {/* ── 4. 다각형 렌더링 ── */}
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

                {/* ── 5. 선분 렌더링 ── */}
                {segments.map(seg => {
                  if (foldedPolySegIds.has(seg.id)) return null;
                  const sel = selectedItem?.type === "segment" && selectedItem.id === seg.id;
                  const isFoldSelected = foldSource?.type === "segment" && foldSource.seg.id === seg.id;
                  return (
                    <line key={seg.id}
                      x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                      stroke={isFoldSelected ? "#A855F7" : sel ? "#CBA7D2" : "#374151"}
                      strokeWidth={isFoldSelected ? 3.5 : sel ? 3 : 2}
                      strokeDasharray={isFoldSelected ? "5 3" : undefined}
                      strokeLinecap="round" />
                  );
                })}

                {/* ── 6. 선분 미리보기 ── */}
                {activeTool === "선분" && pendingStart && cursorPos && (
                  <line x1={pendingStart.x} y1={pendingStart.y} x2={cursorPos.x} y2={cursorPos.y}
                    stroke="#CBA7D2" strokeWidth={1.5} strokeDasharray="6 4" strokeLinecap="round" />
                )}

                {/* ── 6.5. 수선 미리보기 ── */}
                {activeTool === "수선" && pendingPerpPt && cursorPos && (
                  <g>
                    {(() => {
                      let hoveredSeg: Segment | null = null;
                      let minD = 20;
                      for (const s of segments) {
                        const d = distSeg(cursorPos.x, cursorPos.y, s.x1, s.y1, s.x2, s.y2);
                        if (d < minD) { minD = d; hoveredSeg = s; }
                      }

                      if (hoveredSeg) {
                        const H = computePerpendicularFoot(pendingPerpPt, hoveredSeg);
                        return (
                          <g>
                            <line
                              x1={pendingPerpPt.x} y1={pendingPerpPt.y} x2={H.x} y2={H.y}
                              stroke="#0D9488" strokeWidth={1.8} strokeDasharray="5 3" strokeLinecap="round"
                            />
                            <circle cx={H.x} cy={H.y} r={4} fill="#0D9488" fillOpacity={0.6} />
                          </g>
                        );
                      }

                      return (
                        <line
                          x1={pendingPerpPt.x} y1={pendingPerpPt.y} x2={cursorPos.x} y2={cursorPos.y}
                          stroke="#0D9488" strokeWidth={1.5} strokeDasharray="5 3" strokeLinecap="round" opacity={0.6}
                        />
                      );
                    })()}
                  </g>
                )}

                {/* ── 7. 컴퍼스 반지름 미리보기 ── */}
                {activeTool === "컴퍼스" && pendingCompassCenter && cursorPos && (
                  <g>
                    <line x1={pendingCompassCenter.x} y1={pendingCompassCenter.y} x2={cursorPos.x} y2={cursorPos.y}
                      stroke="#CBA7D2" strokeWidth={1.5} strokeDasharray="4 3" strokeLinecap="round" />
                    <circle cx={pendingCompassCenter.x} cy={pendingCompassCenter.y}
                      r={Math.hypot(cursorPos.x - pendingCompassCenter.x, cursorPos.y - pendingCompassCenter.y)}
                      fill="none" stroke="#CBA7D2" strokeWidth={1.2} strokeDasharray="4 4" opacity={0.6} />
                  </g>
                )}

                {/* ── 7.5. 점 도구 교점 스냅 인디케이터 ── */}
                {activeTool === "점" && hoveredSnapPt && (
                  <g className="pointer-events-none">
                    <circle cx={hoveredSnapPt.x} cy={hoveredSnapPt.y} r={8}
                      fill="rgba(168, 85, 247, 0.2)"
                      stroke="#A855F7" strokeWidth={1.8} strokeDasharray="3 2" />
                    <circle cx={hoveredSnapPt.x} cy={hoveredSnapPt.y} r={3}
                      fill="#A855F7" />
                    <text x={hoveredSnapPt.x + 9} y={hoveredSnapPt.y - 7}
                      fill="#A855F7" fontSize={11} fontWeight="bold"
                      style={{ fontFamily: "var(--font-chalk)", userSelect: "none" }}>
                      교점
                    </text>
                  </g>
                )}

                {/* ── 8. 컴퍼스 원 그리기 애니메이션 ── */}
                {compassAnim && (
                  <g>
                    {/* 진행 중인 원호 */}
                    <path
                      d={describeArc(compassAnim.cx, compassAnim.cy, compassAnim.r, compassAnim.startAngle, compassAnim.currentAngle)}
                      fill="none"
                      stroke="#CBA7D2"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />

                    {/* 컴퍼스 힌지(상단 관절) 계산 */}
                    {(() => {
                      const midX = (compassAnim.cx + compassAnim.px) / 2;
                      const midY = (compassAnim.cy + compassAnim.py) / 2;
                      const legDx = compassAnim.px - compassAnim.cx;
                      const legDy = compassAnim.py - compassAnim.cy;
                      const legLen = Math.hypot(legDx, legDy);
                      const normX = -legDy / (legLen || 1);
                      const normY = legDx / (legLen || 1);
                      const hingeHeight = Math.max(70, compassAnim.r * 0.9);
                      const hingeX = midX + normX * hingeHeight;
                      const hingeY = midY + normY * hingeHeight;

                      return (
                        <g>
                          {/* 침 다리 (Needle leg) */}
                          <line x1={hingeX} y1={hingeY} x2={compassAnim.cx} y2={compassAnim.cy}
                            stroke="#475569" strokeWidth={4} strokeLinecap="round" />
                          <circle cx={compassAnim.cx} cy={compassAnim.cy} r={3} fill="#0F172A" />

                          {/* 연필 다리 (Pencil leg) */}
                          <line x1={hingeX} y1={hingeY} x2={compassAnim.px} y2={compassAnim.py}
                            stroke="#9333EA" strokeWidth={4} strokeLinecap="round" />
                          <circle cx={compassAnim.px} cy={compassAnim.py} r={3.5} fill="#CBA7D2" stroke="#6B21A8" strokeWidth={1} />

                          {/* 중간 고정 연결 바 */}
                          <line
                            x1={hingeX + (compassAnim.cx - hingeX) * 0.45}
                            y1={hingeY + (compassAnim.cy - hingeY) * 0.45}
                            x2={hingeX + (compassAnim.px - hingeX) * 0.45}
                            y2={hingeY + (compassAnim.py - hingeY) * 0.45}
                            stroke="#64748B" strokeWidth={2.5}
                          />

                          {/* 상단 힌지 머리 / 손잡이 */}
                          <circle cx={hingeX} cy={hingeY} r={6} fill="#E2E8F0" stroke="#334155" strokeWidth={2} />
                          <line x1={hingeX} y1={hingeY - 6} x2={hingeX + normX * 12} y2={hingeY - 6 + normY * 12}
                            stroke="#334155" strokeWidth={3} strokeLinecap="round" />
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* ── 9. 점 렌더링 ── */}
                {points.map(pt => {
                  const isPending = pendingStart?.id === pt.id;
                  const isSel     = selectedItem?.type === "point" && selectedItem.id === pt.id;
                  const isFoldSrc = foldSource?.type === "point" && foldSource.pt.id === pt.id;
                  const isPerpSrc = pendingPerpPt?.id === pt.id;
                  const isCompassCenter = pendingCompassCenter?.id === pt.id;
                  const hl = isPending || isSel || isFoldSrc || isPerpSrc || isCompassCenter;
                  return (
                    <g key={pt.id}>
                      {hl && <circle cx={pt.x} cy={pt.y} r={11}
                        fill={isFoldSrc || isPerpSrc || isCompassCenter ? "rgba(168,85,247,0.2)" : "rgba(203,167,210,0.2)"}
                        stroke={isFoldSrc || isPerpSrc || isCompassCenter ? "#A855F7" : "#CBA7D2"}
                        strokeWidth={1.8} strokeDasharray="4 3" />}
                      <circle cx={pt.x} cy={pt.y} r={5}
                        fill={isFoldSrc || isPerpSrc || isCompassCenter ? "#A855F7" : hl ? "#CBA7D2" : "#374151"}
                        stroke="white" strokeWidth={1.5} />
                      <text x={pt.x + 9} y={pt.y - 7}
                        fill={isFoldSrc || isPerpSrc || isCompassCenter ? "#A855F7" : hl ? "#CBA7D2" : "#4B5563"}
                        fontSize={13} fontWeight="bold"
                        style={{ fontFamily: "var(--font-chalk)", userSelect: "none" }}>
                        {pt.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* 삭제 버튼 (도화지 내부에 머무르도록 클램프) */}
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

              {/* 펼치기 버튼들 (도화지 내부에 머무르도록 클램프) */}
              {validFoldResults.map(fold => {
                const allPts = [...fold.gonePoly, ...fold.flapPoly, ...fold.remainingPoly];
                if (!allPts.length) return null;
                const maxX = Math.max(...allPts.map(p => p.x));
                const minY = Math.min(...allPts.map(p => p.y));

                const svg = svgRef.current;
                const maxW = svg && svg.clientWidth > 200 ? svg.clientWidth : 780;
                const maxH = svg && svg.clientHeight > 200 ? svg.clientHeight : 480;

                const clampedX = Math.max(8, Math.min(maxW - 75, maxX + 10));
                const clampedY = Math.max(8, Math.min(maxH - 36, minY));

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
                      left: clampedX,
                      top: clampedY,
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
