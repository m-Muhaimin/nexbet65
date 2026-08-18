"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, Trophy, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/games";

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  at: number;
}

export type AviatorHistoryKind = "bet" | "win" | "loss" | "refund";

export interface AviatorHistoryEntry {
  id: string;
  kind: AviatorHistoryKind;
  amount: number;
  multiplier?: number;
  at: number;
}

export type CurrentBetStatus = "placed" | "won" | "lost";

interface TopWin {
  id: string;
  username: string;
  amount: number;
  multiplier: number;
  at: number;
  isYou?: boolean;
}

interface BotChat {
  id: string;
  username: string;
  text: string;
  at: number;
}

interface LiveLobbyProps {
  history: AviatorHistoryEntry[];
  chatLog: ChatMessage[];
  connected: boolean;
  username: string;
  currentBet: { amount: number; status: CurrentBetStatus } | null;
  multiplier: number;
  onSendChat: (text: string) => void;
}

const BOT_NAMES = [
  "RocketMan_99",
  "LuckyFlyer",
  "CrashMaster",
  "AviatorPro",
  "HighRoller",
  "DiamondHands",
  "MoonShot",
  "Satoshi_88",
  "SkyCaptain",
  "Zephyr",
  "JetStream",
  "PropellerHead",
  "CloudRider",
  "SonicBoom",
  "Vortex_FX",
  "RadarRun",
  "AltitudeKing",
  "Takeoff_Tom",
  "Lucky_7",
  "FlyBy_Night",
];

const BOT_CHAT = [
  "Cashed out at 2.5x, yes!",
  "To the moon! 🚀",
  "Anyone going for a 10x?",
  "Love the new provably fair system here.",
  "Next round is going to be HUGE!",
  "Omg crashed at 1.1x...",
  "Diamond hands, still holding!",
  "Cashed out at 1.5x, safe profit.",
  "Let's go pilots! ✈️",
  "Placing a big bet next round.",
  "Going for 5x this time.",
  "This is crazy climbing!",
  "Is anyone verifying with the seeds?",
  "Provably fair checks out perfectly.",
  "Ah, missed the cashout!",
  "Went all in and won big! 🤑",
  "That 40x hit made my day.",
  "Small profit is still profit.",
  "Betting big next round.",
  "Green run today 🔥",
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const HISTORY_STYLES: Record<
  AviatorHistoryKind,
  { label: string; cls: string }
> = {
  bet: { label: "Bet", cls: "text-white" },
  win: { label: "Won", cls: "text-brand" },
  loss: { label: "Lost", cls: "text-[#ff4d3d]" },
  refund: { label: "Refunded", cls: "text-white/60" },
};

function botWin(now: number, id: string): TopWin {
  const multiplier = Math.round((1.2 + Math.random() * 24) * 100) / 100;
  const stake = Math.round((100 + Math.random() * 900) * 100) / 100;
  const amount = Math.round(stake * multiplier * 100) / 100;
  return {
    id,
    username: pick(BOT_NAMES),
    amount,
    multiplier,
    at: now,
  };
}

function botWinSeed(count: number): TopWin[] {
  const now = Date.now();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const min = dayStart.getTime();
  const wins: TopWin[] = [];
  for (let i = 0; i < count; i++) {
    const at = Math.max(min, now - rand(5, 600) * 60000);
    wins.push(botWin(at, `tb-s${i}-${Math.random().toString(36).slice(2, 6)}`));
  }
  return wins.sort((a, b) => b.amount - a.amount);
}

function botChatSeed(count: number): BotChat[] {
  const now = Date.now();
  const used = new Set<number>();
  const msgs: BotChat[] = [];
  for (let i = 0; i < count; i++) {
    let idx = Math.floor(Math.random() * BOT_CHAT.length);
    while (used.has(idx)) idx = Math.floor(Math.random() * BOT_CHAT.length);
    used.add(idx);
    msgs.push({
      id: `bc-${now}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      username: pick(BOT_NAMES),
      text: BOT_CHAT[idx],
      at: now - rand(1, 20) * 60000,
    });
  }
  return msgs.sort((a, b) => a.at - b.at);
}

export default function LiveLobby({
  history,
  chatLog,
  connected,
  username,
  currentBet,
  multiplier,
  onSendChat,
}: LiveLobbyProps) {
  const [tab, setTab] = useState<"my" | "top" | "chat">("my");
  const [draft, setDraft] = useState("");
  const [botWins, setBotWins] = useState<TopWin[]>([]);
  const [botChat, setBotChat] = useState<BotChat[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBotWins(botWinSeed(9));
    setBotChat(botChatSeed(5));

    const winTimer = setInterval(() => {
      if (Math.random() > 0.55) return;
      setBotWins((w) =>
        [...w, botWin(Date.now(), `tb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)]
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 20)
      );
    }, 30000);

    const chatTimer = setInterval(() => {
      if (Math.random() > 0.45) return;
      setBotChat((c) =>
        [
          ...c,
          {
            id: `bc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            username: pick(BOT_NAMES),
            text: pick(BOT_CHAT),
            at: Date.now(),
          },
        ].slice(-24)
      );
    }, 12000);

    return () => {
      clearInterval(winTimer);
      clearInterval(chatTimer);
    };
  }, []);

  const topWins = useMemo(() => {
    const real: TopWin[] = history
      .filter((e) => e.kind === "win")
      .map((e) => ({
        id: e.id,
        username: username || "You",
        amount: e.amount,
        multiplier: e.multiplier ?? 1,
        at: e.at,
        isYou: true,
      }));
    const seen = new Set<string>();
    return [...botWins, ...real]
      .filter((w) => {
        if (seen.has(w.id)) return false;
        seen.add(w.id);
        return true;
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20);
  }, [botWins, history, username]);

  const mergedChat = useMemo(
    () => [...botChat, ...chatLog].sort((a, b) => a.at - b.at).slice(-50),
    [botChat, chatLog]
  );

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mergedChat]);

  const send = () => {
    const t = draft.trim();
    if (!t || !connected) return;
    onSendChat(t);
    setDraft("");
  };

  const tabCls = (active: boolean) =>
    cn(
      "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-instrument text-xs font-semibold uppercase tracking-wider transition-colors",
      active
        ? "border-brand/30 bg-brand/10 text-brand"
        : "border-transparent text-white/50 hover:text-white/80"
    );

  const empty = (text: string) => (
    <div className="py-8 text-center text-xs text-white/40">{text}</div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#111]">
      <div className="flex items-center gap-1 border-b border-white/5 p-2">
        <button
          type="button"
          onClick={() => setTab("my")}
          className={tabCls(tab === "my")}
        >
          <Wallet size={14} /> My Bet
        </button>
        <button
          type="button"
          onClick={() => setTab("top")}
          className={tabCls(tab === "top")}
        >
          <Trophy size={14} /> Top Bet
        </button>
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={tabCls(tab === "chat")}
        >
          <MessageCircle size={14} /> Chat
        </button>
      </div>

      {tab === "my" ? (
        <div className="max-h-[260px] overflow-y-auto p-2">
          {currentBet && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-brand">
                  Live bet
                </div>
                <div className="text-[10px] text-white/45">
                  {currentBet.status === "won"
                    ? "Cashed out this round"
                    : currentBet.status === "lost"
                      ? "Bet lost this round"
                      : `In play at ${multiplier.toFixed(2)}x`}
                </div>
              </div>
              <span className="font-instrument text-xs font-bold text-white">
                {formatMoney(currentBet.amount)}
              </span>
            </div>
          )}
          {history.length === 0 ? (
            empty("No rounds yet — place your first bet.")
          ) : (
            <ul className="space-y-0.5">
              {history.map((e) => {
                const s = HISTORY_STYLES[e.kind];
                return (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-white/5"
                  >
                    <span className={cn("font-instrument font-semibold", s.cls)}>
                      {s.label} {formatMoney(e.amount)}
                      {(e.kind === "win" || e.kind === "loss") &&
                        ` @ ${(e.multiplier ?? 0).toFixed(2)}x`}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-white/35">
                      {formatTime(e.at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : tab === "top" ? (
        <div className="max-h-[260px] overflow-y-auto p-2">
          {topWins.length === 0 ? (
            empty("No big wins yet today.")
          ) : (
            <ul className="space-y-0.5">
              {topWins.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-instrument text-[9px] font-bold",
                        w.isYou ? "bg-brand text-black" : "bg-white/10 text-white/70"
                      )}
                    >
                      {w.username.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="truncate font-instrument text-xs font-semibold text-white/85">
                          {w.username}
                        </span>
                        {w.isYou && (
                          <span className="rounded bg-brand/15 px-1 py-px text-[8px] font-black text-brand">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] tabular-nums text-white/35">
                        {formatTime(w.at)}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-instrument text-[10px] font-bold tabular-nums",
                        w.multiplier >= 10
                          ? "bg-[#ffb020]/15 text-[#ffb020]"
                          : "bg-brand/10 text-brand"
                      )}
                    >
                      {w.multiplier.toFixed(2)}x
                    </span>
                    <div className="mt-0.5 font-instrument text-xs font-black tabular-nums text-brand">
                      +{formatMoney(w.amount)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                connected
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  : "bg-white/20"
              )}
            />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              {connected ? "Live" : "Offline"}
            </span>
            <span className="ml-auto text-[10px] text-white/30">
              {mergedChat.length} messages
            </span>
          </div>
          <div
            ref={listRef}
            className="max-h-[220px] space-y-1 overflow-y-auto p-2"
          >
            {mergedChat.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/40">
                No messages yet — say hi.
              </div>
            ) : (
              mergedChat.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg px-2 py-1 text-xs leading-relaxed"
                >
                  <span className="font-instrument font-bold text-brand">
                    {m.username}
                  </span>
                  <span className="ml-1.5 text-[10px] text-white/30">
                    {formatTime(m.at)}
                  </span>
                  <div className="break-words text-white/75">{m.text}</div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-white/5 p-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              maxLength={140}
              disabled={!connected}
              placeholder={
                connected ? `Chat as ${username || "Guest"}…` : "Connecting…"
              }
              className="h-9 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white placeholder:text-white/30 focus:border-brand/50 focus:outline-none disabled:opacity-40"
            />
            <button
              type="button"
              onClick={send}
              disabled={!connected || !draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-black transition-all hover:brightness-110 active:scale-95 disabled:opacity-30"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
