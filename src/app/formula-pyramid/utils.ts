import { PyramidNode } from "./data";

/* ─── TARGET을 만드는 모든 수학적 정답 조합 동적 계산 ───────────────────────────── */
export const getAllValidSolutions = (
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

/* ─── 노드 순서 무관 정답 비교를 위한 정규화 헬퍼 ─── */
export const normalizeNodesKey = (nodes: string | string[]): string => {
  const arr = Array.isArray(nodes) ? nodes : nodes.trim().split(/\s+/);
  return arr.slice().sort().join(" ");
};
