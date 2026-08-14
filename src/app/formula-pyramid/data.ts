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
    { id: "G", op: "÷", num: 8 }, { id: "H", op: "÷", num: 3 }, { id: "I", op: "-", num: 8 }, { id: "J", op: "×", num: 3 },
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
