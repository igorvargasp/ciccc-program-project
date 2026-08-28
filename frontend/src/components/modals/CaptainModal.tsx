import { X, Award, User } from "lucide-react";
import type { LineupSlotPlayer as Player } from "@/types";
import { useTranslation } from "react-i18next";

interface CaptainModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Record<number, Player>; // Accepts the lineup players object
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
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Converts the players object into an array filtering only filled slots
  const activeEntries = players
    ? Object.entries(players).filter(([_, player]) => player && player.id)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-surface border border-edge/25 w-full max-w-lg p-4 sm:p-6 space-y-3 sm:space-y-4 rounded-2xl shadow-2xl relative text-foreground">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="truncate">
              {t("lineup.selectCaptain") || "Select Team Captain"}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground cursor-pointer p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-muted">
          {t("lineup.changeCaptain") ||
            "Choose a player from your starting XI to wear the captain armband."}
        </p>

        {/* Player List */}
        <div className="max-h-[60vh] sm:max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {activeEntries.length === 0 ? (
            <p className="text-xs text-muted text-center py-8">
              {t("lineup.noSavedLineups") ||
                "No players added to the starting XI yet."}
            </p>
          ) : (
            activeEntries.map(([slotIndex, player]) => {
              const isCurrentCaptain = captainId === player.id;
              const playerName = player.fullName || player.name || "Player";
              const playerPhoto =
                player.photoUrl || player.badgeUrl || player.crestUrl;
              const translatedPos =
                t(`positions.${player.position}`) || player.position;

              return (
                <div
                  key={slotIndex}
                  onClick={() => {
                    onSelectCaptain(player.id, playerName);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 sm:p-3 border rounded-xl cursor-pointer transition-all gap-2 ${
                    isCurrentCaptain
                      ? "bg-amber-500/10 border-amber-500 text-foreground"
                      : "bg-surface-2/50 border-edge/10 hover:border-brand/40 text-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface border border-edge/40 flex items-center justify-center overflow-hidden shrink-0">
                      {playerPhoto ? (
                        <img
                          src={playerPhoto}
                          alt={playerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase text-foreground truncate">
                        {playerName}
                      </p>
                      <span className="text-[10px] text-brand font-bold truncate block">
                        {translatedPos}{" "}
                        {player.teamName ? `• ${player.teamName}` : ""}
                      </span>
                    </div>
                  </div>

                  {isCurrentCaptain && (
                    <span className="bg-amber-500 text-black font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded shrink-0">
                      {t("lineup.captainBadge") || "CAPTAIN (C)"}
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
