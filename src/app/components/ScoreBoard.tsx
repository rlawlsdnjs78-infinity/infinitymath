import { memo } from "react";
import { Trophy } from "lucide-react";

interface ScoreBoardProps {
  players: { name: string; score: number; isHost?: boolean }[];
  myNickname: string;
  maxH?: string;
}

const ScoreBoard = memo(function ScoreBoard({ players, myNickname, maxH = "120px" }: ScoreBoardProps) {
  const nonHostPlayers = players.filter((p) => !p.isHost);
  const sortedPlayers = nonHostPlayers.slice().sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#CBA7D2] font-extrabold text-lg" style={{ fontFamily: "var(--font-chalk)" }}>
          <Trophy size={18} className="text-[#CBA7D2]" />
          <span>실시간 점수판</span>
        </div>
        <span className="text-xs text-gray-600 font-medium">({nonHostPlayers.length}명)</span>
      </div>
      <div className="w-full border-t border-dashed border-gray-300/70" style={{ marginTop: "0.2rem", marginBottom: "0.3rem" }} />
      <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: maxH }}>
        {sortedPlayers.length > 0 ? (
          sortedPlayers.map((p, idx) => (
            <div
              key={p.name}
              className={`flex items-center justify-between px-4 py-2 rounded-2xl border transition-all ${
                p.name === myNickname ? "bg-[#CBA7D2]/20 backdrop-blur-sm border-[#CBA7D2] text-gray-600 shadow-sm" : "bg-white/60 backdrop-blur-sm border-gray-200/80 text-gray-700 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-[#CBA7D2] w-4 flex-shrink-0 text-center">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                </span>
                <span className="font-bold text-xs sm:text-sm" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.015em" }}>{p.name}</span>
              </div>
              <span className="font-extrabold text-base text-[#CBA7D2] flex-shrink-0" style={{ fontFamily: "var(--font-chalk)" }}>{p.score}점</span>
            </div>
          ))
        ) : (
          <div className="py-3 text-center text-gray-500 text-xs" style={{ fontFamily: "var(--font-body)" }}>플레이어 참가 대기 중...</div>
        )}
      </div>
    </div>
  );
});

export default ScoreBoard;
