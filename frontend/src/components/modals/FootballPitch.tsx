import { useState, useRef } from "react";
import { User, Move, Globe } from "lucide-react";
import type { LineupSlotPlayer as Player } from "@/types";

export type Language = "pt" | "en" | "es";

const TRANSLATIONS = {
  pt: {
    dragInstructions:
      "Arraste e solte os cards dos jogadores em qualquer lugar do campo para criar seu layout personalizado!",
    doubleClickTip:
      "Dê um duplo clique em qualquer posição para abrir o modal de seleção de jogadores.",
    positionFallback: "POS",
  },
  en: {
    dragInstructions:
      "Drag and drop player cards anywhere on the pitch to build your custom layout!",
    doubleClickTip:
      "Double-click any position to open the player selection modal.",
    positionFallback: "POS",
  },
  es: {
    dragInstructions:
      "¡Arrastra y suelta las tarjetas de los jugadores en cualquier lugar del campo para crear tu diseño personalizado!",
    doubleClickTip:
      "Haz doble clic en cualquier posición para abrir el modal de selección de jugadores.",
    positionFallback: "POS",
  },
};

export const PITCH_STYLES = {
  modern: {
    name: "Modern",
    bg: "bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 border-emerald-500/40",
    lines: "border-emerald-500/30",
    accent: "text-emerald-400",
  },
  classic: {
    name: "Classic",
    bg: "bg-gradient-to-b from-green-800 via-green-700 to-green-900 border-green-600/55",
    lines: "border-white/30",
    accent: "text-white",
  },
  dark: {
    name: "Dark",
    bg: "bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-zinc-700/50",
    lines: "border-zinc-700/60",
    accent: "text-zinc-300",
  },
  retro: {
    name: "Retro",
    bg: "bg-gradient-to-b from-teal-900 via-teal-800 to-teal-950 border-teal-600/40",
    lines: "border-teal-300/30",
    accent: "text-teal-200",
  },
};

const FORMATION_POSITIONS: Record<
  string,
  { x: number; y: number; label: string }[]
> = {
  "4-3-3": [
    { x: 50, y: 88, label: "GK" },
    { x: 15, y: 70, label: "LB" },
    { x: 38, y: 72, label: "CB" },
    { x: 62, y: 72, label: "CB" },
    { x: 85, y: 70, label: "RB" },
    { x: 30, y: 48, label: "CM" },
    { x: 50, y: 52, label: "CDM" },
    { x: 70, y: 48, label: "CM" },
    { x: 18, y: 25, label: "LW" },
    { x: 50, y: 20, label: "ST" },
    { x: 82, y: 25, label: "RW" },
  ],
  "4-4-2": [
    { x: 50, y: 88, label: "GK" },
    { x: 15, y: 70, label: "LB" },
    { x: 38, y: 72, label: "CB" },
    { x: 62, y: 72, label: "CB" },
    { x: 85, y: 70, label: "RB" },
    { x: 18, y: 45, label: "LM" },
    { x: 38, y: 48, label: "CM" },
    { x: 62, y: 48, label: "CM" },
    { x: 82, y: 45, label: "RM" },
    { x: 38, y: 22, label: "ST" },
    { x: 62, y: 22, label: "ST" },
  ],
  "3-5-2": [
    { x: 50, y: 88, label: "GK" },
    { x: 20, y: 70, label: "CB" },
    { x: 50, y: 72, label: "CB" },
    { x: 80, y: 70, label: "CB" },
    { x: 10, y: 48, label: "LWB" },
    { x: 32, y: 45, label: "CM" },
    { x: 50, y: 50, label: "CDM" },
    { x: 68, y: 45, label: "CM" },
    { x: 90, y: 48, label: "RWB" },
    { x: 38, y: 22, label: "ST" },
    { x: 62, y: 22, label: "ST" },
  ],
  "4-5-1": [
    { x: 50, y: 88, label: "GK" },
    { x: 15, y: 70, label: "LB" },
    { x: 38, y: 72, label: "CB" },
    { x: 62, y: 72, label: "CB" },
    { x: 85, y: 70, label: "RB" },
    { x: 15, y: 45, label: "LM" },
    { x: 35, y: 48, label: "CM" },
    { x: 50, y: 42, label: "CAM" },
    { x: 65, y: 48, label: "CM" },
    { x: 85, y: 45, label: "RM" },
    { x: 50, y: 20, label: "ST" },
  ],
  "4-1-4-1": [
    { x: 50, y: 88, label: "GK" },
    { x: 15, y: 70, label: "LB" },
    { x: 38, y: 72, label: "CB" },
    { x: 62, y: 72, label: "CB" },
    { x: 85, y: 70, label: "RB" },
    { x: 50, y: 60, label: "CDM" },
    { x: 15, y: 42, label: "LM" },
    { x: 38, y: 45, label: "CM" },
    { x: 62, y: 45, label: "CM" },
    { x: 85, y: 42, label: "RM" },
    { x: 50, y: 20, label: "ST" },
  ],
  "3-4-3": [
    { x: 50, y: 88, label: "GK" },
    { x: 22, y: 72, label: "CB" },
    { x: 50, y: 74, label: "CB" },
    { x: 78, y: 72, label: "CB" },
    { x: 15, y: 45, label: "LM" },
    { x: 38, y: 48, label: "CM" },
    { x: 62, y: 48, label: "CM" },
    { x: 85, y: 45, label: "RM" },
    { x: 18, y: 22, label: "LW" },
    { x: 50, y: 18, label: "ST" },
    { x: 82, y: 22, label: "RW" },
  ],
  "4-2-3-1": [
    { x: 50, y: 88, label: "GK" },
    { x: 15, y: 70, label: "LB" },
    { x: 38, y: 72, label: "CB" },
    { x: 62, y: 72, label: "CB" },
    { x: 85, y: 70, label: "RB" },
    { x: 38, y: 58, label: "CDM" },
    { x: 62, y: 58, label: "CDM" },
    { x: 18, y: 38, label: "LM" },
    { x: 50, y: 42, label: "CAM" },
    { x: 82, y: 38, label: "RM" },
    { x: 50, y: 20, label: "ST" },
  ],
  CUSTOM: [
    { x: 50, y: 88, label: "GK" },
    { x: 15, y: 70, label: "LB" },
    { x: 38, y: 72, label: "CB" },
    { x: 62, y: 72, label: "CB" },
    { x: 85, y: 70, label: "RB" },
    { x: 30, y: 48, label: "CM" },
    { x: 50, y: 52, label: "CDM" },
    { x: 70, y: 48, label: "CM" },
    { x: 18, y: 25, label: "LW" },
    { x: 50, y: 20, label: "ST" },
    { x: 82, y: 25, label: "RW" },
  ],
};

interface FootballPitchProps {
  formation: string;
  lineupPlayers: Record<number, Player>;
  onSelectSlot: (index: number) => void;
  captainId: string | number | null;
  pitchStyle?: keyof typeof PITCH_STYLES;
  onPitchStyleChange?: (style: keyof typeof PITCH_STYLES) => void;
  customPositions?: Record<number, { x: number; y: number }>;
  onUpdateCustomPosition?: (
    index: number,
    coords: { x: number; y: number },
  ) => void;
  language?: Language; // Adicionado suporte a idioma opcional
}

export default function FootballPitch({
  formation,
  lineupPlayers,
  onSelectSlot,
  captainId,
  pitchStyle = "modern",
  customPositions = {},
  onUpdateCustomPosition,
  language = "pt", // Padrão português
}: FootballPitchProps) {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const t = TRANSLATIONS[language] || TRANSLATIONS.pt;
  const styleConfig = PITCH_STYLES[pitchStyle] || PITCH_STYLES.modern;
  const isCustomMode = formation === "CUSTOM";
  const basePositions =
    FORMATION_POSITIONS[formation] || FORMATION_POSITIONS["4-3-3"];

  const handleDragStart = (
    index: number,
    e: React.MouseEvent | React.TouchEvent,
  ) => {
    if (!isCustomMode) return;
    e.stopPropagation();
    setDraggingIndex(index);
  };

  const handleDragMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    if (draggingIndex === null || !pitchRef.current || !isCustomMode) return;

    const rect = pitchRef.current.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));

    onUpdateCustomPosition?.(draggingIndex, { x, y });
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 px-2 sm:px-0">
      {isCustomMode && (
        <div className="w-full max-w-[480px] bg-brand/10 border border-brand/30 px-3 py-2 rounded-xl text-xs text-foreground/90 flex items-center gap-2 shadow-sm">
          <Move className="w-4 h-4 text-brand shrink-0 animate-pulse" />
          <span>
            <strong>{t.dragInstructions}</strong> {t.doubleClickTip}
          </span>
        </div>
      )}

      {/* Contenhador com responsividade otimizada para telas pequenas, médias e grandes */}
      <div
        ref={pitchRef}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        className={`relative w-full max-w-[90vw] sm:max-w-[420px] md:max-w-[480px] aspect-[3/4] rounded-2xl border-2 ${styleConfig.bg} shadow-xl overflow-hidden select-none flex flex-col items-center justify-between p-4 sm:p-6`}
      >
        <div
          className={`absolute inset-3 sm:inset-4 border-2 ${styleConfig.lines} rounded-xl pointer-events-none`}
        />
        <div
          className={`absolute top-1/2 left-0 w-full h-0.5 ${styleConfig.lines.replace("border-", "bg-")} opacity-40 pointer-events-none`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 border-2 ${styleConfig.lines} rounded-full pointer-events-none`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 ${styleConfig.lines.replace("border-", "bg-")} rounded-full pointer-events-none`}
        />

        <div
          className={`absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-36 sm:w-48 h-16 sm:h-20 border-b-2 border-x-2 ${styleConfig.lines} rounded-b-xl pointer-events-none`}
        />
        <div
          className={`absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-36 sm:w-48 h-16 sm:h-20 border-t-2 border-x-2 ${styleConfig.lines} rounded-t-xl pointer-events-none`}
        />

        <div className="absolute inset-0 w-full h-full pointer-events-auto">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => {
            const player = lineupPlayers[index];
            const isCaptain =
              player &&
              (player.id === captainId ||
                String(player.id) === String(captainId));

            const defaultPos = basePositions[index] || {
              x: 50,
              y: 50,
              label: t.positionFallback,
            };
            let pos = { x: defaultPos.x, y: defaultPos.y };

            if (isCustomMode && customPositions[index]) {
              pos = customPositions[index];
            }

            const playerName = player?.fullName || player?.name;
            const playerPhoto =
              player?.photoUrl || player?.badgeUrl || player?.crestUrl;

            const currentPositionLabel = player?.position || defaultPos.label;

            return (
              <div
                key={index}
                onMouseDown={(e) => handleDragStart(index, e)}
                onTouchStart={(e) => handleDragStart(index, e)}
                onClick={() => {
                  if (!isCustomMode && draggingIndex === null) {
                    onSelectSlot(index);
                  }
                }}
                onDoubleClick={() => {
                  onSelectSlot(index);
                }}
                style={{
                  top: `${pos.y}%`,
                  left: `${pos.x}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute flex flex-col items-center group z-10 transition-transform ${isCustomMode ? "cursor-grab active:cursor-grabbing hover:scale-105" : "cursor-pointer hover:scale-105"}`}
              >
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-surface/90 backdrop-blur-md border-2 border-edge/30 group-hover:border-brand flex items-center justify-center shadow-lg overflow-hidden transition-all">
                  {player ? (
                    <>
                      {playerPhoto ? (
                        <img
                          src={playerPhoto}
                          alt={playerName || "Player"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-muted" />
                      )}

                      {isCaptain && (
                        <div className="absolute top-1 right-1 bg-amber-500 text-black font-black text-[8px] sm:text-[9px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shadow-md">
                          C
                        </div>
                      )}

                      {isCustomMode && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Move className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted group-hover:text-brand">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-tighter">
                        {currentPositionLabel}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-1 bg-black/60 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded-md border border-white/10 max-w-[70px] sm:max-w-[80px] text-center shadow-md flex flex-col items-center">
                  {player ? (
                    <>
                      <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-tight block truncate w-full">
                        {playerName?.split(" ").pop()}
                      </span>
                      <span className="text-[7px] sm:text-[8px] font-bold text-[#00d2fd] uppercase tracking-wider block truncate w-full">
                        {currentPositionLabel}
                      </span>
                    </>
                  ) : (
                    <span className="text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-tight block truncate w-full">
                      {currentPositionLabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
