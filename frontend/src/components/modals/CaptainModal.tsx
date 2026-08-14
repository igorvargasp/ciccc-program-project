import { X, Award, User } from "lucide-react";
import type { LineupSlotPlayer as Player } from "@/types";

interface CaptainModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Record<number, Player>; // Aceita o objeto de jogadores da LineupPage
  captainId: string | number | null;
  onSelectCaptain: (playerId: string | number, playerName: string) => void;
}

export default function CaptainModal({
  isOpen,
  onClose,
  players,
  captainId,
  onSelectCaptain,
}: CaptainModalProps) {
  if (!isOpen) return null;

  // Converte o objeto de jogadores em um array filtrando apenas os slots preenchidos
  const activeEntries = players
    ? Object.entries(players).filter(([_, player]) => player && player.id)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-edge/25 w-full max-w-lg p-6 space-y-4 rounded-2xl shadow-2xl relative text-foreground">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Select Team Captain
          </h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-muted">
          Choose a player from your starting XI to wear the captain armband.
        </p>

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {activeEntries.length === 0 ? (
            <p className="text-xs text-muted text-center py-8">
              No players added to the starting XI yet.
            </p>
          ) : (
            activeEntries.map(([slotIndex, player]) => {
              const isCurrentCaptain = captainId === player.id;
              const playerName = player.fullName || player.name || "Player";
              const playerPhoto =
                player.photoUrl || player.badgeUrl || player.crestUrl;

              return (
                <div
                  key={slotIndex}
                  onClick={() => {
                    onSelectCaptain(player.id, playerName);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                    isCurrentCaptain
                      ? "bg-amber-500/10 border-amber-500 text-foreground"
                      : "bg-surface-2/50 border-edge/10 hover:border-brand/40 text-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface border border-edge/40 flex items-center justify-center overflow-hidden shrink-0">
                      {playerPhoto ? (
                        <img
                          src={playerPhoto}
                          alt={playerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-muted" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-foreground">
                        {playerName}
                      </p>
                      <span className="text-[10px] text-brand font-bold">
                        {player.position}{" "}
                        {player.teamName ? `• ${player.teamName}` : ""}
                      </span>
                    </div>
                  </div>

                  {isCurrentCaptain && (
                    <span className="bg-amber-500 text-black font-black text-[10px] px-2 py-0.5 rounded">
                      CAPTAIN (C)
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
