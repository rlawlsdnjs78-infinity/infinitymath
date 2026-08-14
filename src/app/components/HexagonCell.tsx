import { memo } from "react";
import { PyramidNode } from "../formula-pyramid/data";

/* ─── 정육각형(Hexagon) SVG 컴포넌트 ────────────────────────────────────── */
const HexagonCell = memo(function HexagonCell({
  node,
  isSelected,
  masked = false,
}: {
  node: PyramidNode;
  isSelected: boolean;
  masked?: boolean;
}) {
  return (
    <div
      className={`relative select-none w-[64px] h-[73.9px] sm:w-[68px] sm:h-[78.5px] flex items-center justify-center ${
        isSelected ? "drop-shadow-[0_0_16px_rgba(203,167,210,0.95)]" : ""
      }`}
    >
      <svg viewBox="0 0 100 115.47" className="w-full h-full absolute inset-0 filter drop-shadow-md">
        <polygon
          points="50,4.62 96,31.18 96,84.30 50,110.85 4,84.30 4,31.18"
          fill={isSelected ? "rgba(203,167,210,0.3)" : "rgba(255, 255, 255, 0.92)"}
          stroke={isSelected ? "#CBA7D2" : "rgba(0, 0, 0, 0.15)"}
          strokeWidth="3.5"
          strokeDasharray={isSelected ? "none" : "4 2"}
        />
        <polygon
          points="50,4.62 67.32,14.62 67.32,34.62 50,44.62 32.68,34.62 32.68,14.62"
          fill={isSelected ? "#CBA7D2" : "rgba(203,167,210,0.25)"}
          stroke={isSelected ? "#ffffff" : "var(--chalk-yellow)"}
          strokeWidth="2"
        />
        <text x="50" y="31" textAnchor="middle" fill={isSelected ? "#ffffff" : "var(--chalk-yellow)"} fontSize="28" fontWeight="bold" fontFamily="var(--font-chalk)">
          {node.id}
        </text>
        <text x="50" y="85" textAnchor="middle" fill={isSelected ? "#CBA7D2" : "var(--chalk-white)"} fontSize={masked ? "52" : "44"} fontWeight="bold" fontFamily="var(--font-chalk)">
          {masked ? "?" : node.display}
        </text>
      </svg>
    </div>
  );
});

export default HexagonCell;
