import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, Clock, Users, Award, Zap, ShieldCheck } from 'lucide-react';
import { TournamentData } from '../../types';

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: TournamentData;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
}) => {
  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div
      id="tournamentModalOverlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-lg bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#04060a] border-2 border-[#38bdf8] rounded-2xl p-5 shadow-[0_0_35px_rgba(56,189,248,0.3)] text-white flex flex-col gap-4 overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.8)]">
              <Trophy className="w-6 h-6 text-stone-950" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#ffd25e] uppercase tracking-wider font-['Georgia']">
                {tournament.title}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 text-sky-400">
                  <Clock className="w-3 h-3" /> Ends in: {formatTime(tournament.endsInSeconds)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-zinc-300">
                  <Users className="w-3 h-3" /> {tournament.activeParticipants.toLocaleString()} Live Players
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Prize Pool Hero Banner */}
        <div className="bg-gradient-to-r from-sky-950/80 via-indigo-950/80 to-purple-950/80 border border-sky-500/40 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-sky-300 tracking-wider">
              Total Guaranteed Prize Pool
            </div>
            <div className="text-2xl font-black text-white font-['Georgia']">
              ৳{tournament.prizePool.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
              Your Live Standing
            </div>
            <div className="text-lg font-black text-amber-400 font-mono">
              #{tournament.playerRank} ({tournament.playerScore.toLocaleString()} pts)
            </div>
          </div>
        </div>

        {/* How Points Are Scored */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-[#111c30] border border-[#1e2e48] rounded-lg p-2">
            <div className="font-bold text-amber-300">10 Pts</div>
            <div className="text-[10px] text-zinc-400">Per Spin</div>
          </div>
          <div className="bg-[#111c30] border border-[#1e2e48] rounded-lg p-2">
            <div className="font-bold text-sky-300">50 Pts</div>
            <div className="text-[10px] text-zinc-400">Per Cascade Step</div>
          </div>
          <div className="bg-[#111c30] border border-[#1e2e48] rounded-lg p-2">
            <div className="font-bold text-emerald-400">500 Pts</div>
            <div className="text-[10px] text-zinc-400">Per Big Win (20x+)</div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-[#080d18] border border-[#1e2e48] rounded-xl p-2.5 flex flex-col gap-1.5 flex-1 overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold px-2 pb-1 border-b border-white/5">
            <span>RANK & PLAYER</span>
            <span>SCORE / PRIZE</span>
          </div>

          <div className="overflow-y-auto max-h-48 flex flex-col gap-1 pr-1">
            {tournament.entries.map((entry) => {
              const isTop3 = entry.rank <= 3;
              return (
                <div
                  key={`rank_${entry.rank}`}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    entry.isPlayer
                      ? 'bg-amber-500/20 border border-amber-400 text-amber-200 font-bold'
                      : 'bg-white/[0.03] border border-white/5 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 text-center font-black font-mono ${
                        entry.rank === 1
                          ? 'text-yellow-400'
                          : entry.rank === 2
                          ? 'text-zinc-300'
                          : entry.rank === 3
                          ? 'text-amber-600'
                          : 'text-zinc-500'
                      }`}
                    >
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </span>
                    <span className="text-sm">{entry.avatar}</span>
                    <span className="font-semibold">{entry.name}</span>
                    {entry.isPlayer && (
                      <span className="text-[9px] px-1 rounded bg-amber-400 text-black font-black uppercase">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <span className="font-mono text-zinc-300 text-[11px]">
                      {entry.score.toLocaleString()} pts
                    </span>
                    <span className="font-mono font-bold text-emerald-400 min-w-[65px]">
                      ৳{entry.prize.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[10px] text-center text-zinc-500">
          Tournament scores update in real time with every spin cascade and win celebration!
        </p>
      </motion.div>
    </div>
  );
};
