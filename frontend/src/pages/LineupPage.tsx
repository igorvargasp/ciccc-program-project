import { useState, useRef } from "react";
import FootballPitch from "@/components/modals/FootballPitch";
import PlayerSearchModal from "@/components/modals/PlayerSearchModal";
import type { LineupSlotPlayer as Player } from "@/types";

export function LineupPage() {
  const [formation, setFormation] = useState<string>("4-3-3");
  const [lineupPlayers, setLineupPlayers] = useState<Record<number, Player>>(
    {},
  );

  // Estados para controlar o modal e o slot ativo
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // States for the Coach
  const [coachName, setCoachName] = useState<string>("Coach Name");
  const [coachPhoto, setCoachPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectSlot = (index: number) => {
    setSelectedSlotIndex(index);
    setIsModalOpen(true); // Abre o modal ao clicar no slot do campo
  };

  const handleSelectPlayer = (player: Player) => {
    if (selectedSlotIndex !== null) {
      setLineupPlayers((prev) => ({
        ...prev,
        [selectedSlotIndex]: player,
      }));
    }
    setIsModalOpen(false);
    setSelectedSlotIndex(null);
  };

  // Function for handling the technician's image file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCoachPhoto(imageUrl);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file);
      setCoachPhoto(imageUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Header with the Training Selector */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#14171c] border border-[#414755]/30 rounded-xl p-5 gap-4">
        <div>
          <h2 className="text-sm font-black text-[#00d2fd] uppercase tracking-[0.2em]">
            Lineup Builder
          </h2>
          <p className="text-xs text-[#8b90a0]">
            Customize your tactical formation, technical staff and starting XI.
          </p>
        </div>

        {/* Tactical Formation Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#8b90a0] uppercase">
            Formation:
          </span>
          {["4-3-3", "4-4-2", "3-5-2"].map((fmt) => (
            <button
              key={fmt}
              onClick={() => {
                setFormation(fmt);
                setLineupPlayers({});
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer border ${
                formation === fmt
                  ? "bg-[#00d2fd]/20 text-[#00d2fd] border-[#00d2fd]"
                  : "bg-[#0d0f12] text-[#8b90a0] border-[#414755]/30 hover:border-[#00d2fd]/50"
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Main area divided between the Field and the Sidelines (Coach) */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
        {/* Tactical Soccer Field */}
        <div className="flex justify-center flex-1 w-full">
          <FootballPitch
            formation={formation}
            lineupPlayers={lineupPlayers}
            onSelectSlot={handleSelectSlot}
          />
        </div>

        {/* Coach's Box (Sideline) */}
        <div className="w-full lg:w-72 bg-[#14171c] border border-[#414755]/30 rounded-xl p-5 flex flex-col items-center gap-4 shadow-xl">
          <div className="w-full text-left">
            <h3 className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em]">
              Technical Staff
            </h3>
            <p className="text-[11px] text-[#8b90a0]">Head Coach</p>
          </div>

          {/* Coach Photo Drop-off / Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="relative w-28 h-28 rounded-full bg-[#0d0f12] border-2 border-dashed border-[#414755] hover:border-[#00d2fd] flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all"
            title="Clique ou arraste uma foto"
          >
            {coachPhoto ? (
              <img
                src={coachPhoto}
                alt="Coach"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="flex flex-col items-center text-center p-2">
                <span className="text-[10px] font-bold text-[#8b90a0] group-hover:text-[#00d2fd] transition-colors">
                  Drop image or click
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Input for Editing the coach's Name */}
          <div className="w-full space-y-1">
            <label className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider">
              Coach Name
            </label>
            <input
              type="text"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              className="w-full bg-[#0d0f12] border border-[#414755]/40 rounded px-3 py-2 text-xs font-bold text-[#e2e2e8] focus:outline-none focus:border-[#00d2fd] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Modal de Pesquisa de Jogadores */}
      <PlayerSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectPlayer={handleSelectPlayer}
      />
    </div>
  );
}
