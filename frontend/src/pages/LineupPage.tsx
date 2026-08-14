import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { User, Camera, Star } from "lucide-react";
import FootballPitch from "@/components/modals/FootballPitch";
import PlayerSearchModal from "@/components/modals/PlayerSearchModal";
import CaptainModal from "@/components/modals/CaptainModal"; // Importando o novo componente
import type { LineupSlotPlayer as Player } from "@/types";

export function LineupPage() {
  const { t } = useTranslation();

  // Estados de Formação e Jogadores (Titulares e Reservas)
  const [formation, setFormation] = useState<string>("4-3-3");
  const [lineupPlayers, setLineupPlayers] = useState<Record<number, Player>>(
    {},
  );
  const [subPlayers, setSubPlayers] = useState<Record<number, Player>>({});

  // Capitão do time
  const [captainId, setCaptainId] = useState<string | number | null>(null);

  // Modais
  const [isCoachModalOpen, setIsCoachModalOpen] = useState<boolean>(true);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [isCaptainModalOpen, setIsCaptainModalOpen] = useState<boolean>(false);

  // Controle de qual slot está sendo editado (Titular: 0-10, Reserva: 100-104)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isSubSlot, setIsSubSlot] = useState<boolean>(false);

  // States do Técnico
  const [coachName, setCoachName] = useState<string>("Head Coach");
  const [coachPhoto, setCoachPhoto] = useState<string | null>(null);
  const coachFileRef = useRef<HTMLInputElement>(null);

  // Time Favorito salvo no localStorage
  const [favoriteTeam, setFavoriteTeam] = useState<any>(null);

  useEffect(() => {
    const savedFav = localStorage.getItem("favorite_team");
    if (savedFav) {
      try {
        setFavoriteTeam(JSON.parse(savedFav));
      } catch (e) {
        console.error("Error parsing favorite team", e);
      }
    }
  }, []);

  // Abrir modal de jogador (Titular)
  const handleSelectSlot = (index: number) => {
    setActiveSlotIndex(index);
    setIsSubSlot(false);
    setIsPlayerModalOpen(true);
  };

  // Abrir modal de jogador (Reserva)
  const handleSelectSubSlot = (index: number) => {
    setActiveSlotIndex(index);
    setIsSubSlot(true);
    setIsPlayerModalOpen(true);
  };

  // Callback ao selecionar o jogador no modal
  const handleSelectPlayer = (player: Player) => {
    if (activeSlotIndex !== null) {
      if (isSubSlot) {
        setSubPlayers((prev) => ({ ...prev, [activeSlotIndex]: player }));
      } else {
        setLineupPlayers((prev) => ({ ...prev, [activeSlotIndex]: player }));
      }
      toast.success(t("lineup.playerAdded", "Player added to lineup!"));
    }
    setIsPlayerModalOpen(false);
    setActiveSlotIndex(null);
  };

  // Upload de Foto do Coach
  const handleCoachFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoachPhoto(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header com Seletor de Formação e Ações */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-surface border border-edge/25 rounded-2xl p-5 gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-bold text-brand uppercase tracking-widest bg-brand/10 px-2.5 py-1 border border-brand/30 rounded-md">
            Tactical Management
          </span>
          <h2 className="text-2xl font-black uppercase tracking-tight mt-2 text-foreground">
            Lineup Builder
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Customize your tactical formation, technical staff and starting XI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Formação */}
          <div className="flex items-center gap-1.5 bg-surface-2 p-1.5 rounded-xl border border-edge/20">
            <span className="text-[10px] font-bold text-muted uppercase px-2">
              Formation:
            </span>
            {["4-3-3", "4-4-2", "3-5-2"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => {
                  setFormation(fmt);
                  setLineupPlayers({});
                  setCaptainId(null);
                  toast.success(`Formation changed to ${fmt}`);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  formation === fmt
                    ? "bg-brand text-brand-foreground shadow-md"
                    : "text-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Botão de Escolher Capitão */}
          <button
            type="button"
            onClick={() => setIsCaptainModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface border border-edge/20 rounded-xl text-xs font-bold text-foreground transition-all cursor-pointer"
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            {captainId ? "Change Captain" : "Select Captain"}
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Campo de Futebol */}
        <div className="lg:col-span-7 flex justify-center bg-surface border border-edge/25 rounded-2xl p-6 shadow-sm">
          <FootballPitch
            formation={formation}
            lineupPlayers={lineupPlayers}
            onSelectSlot={handleSelectSlot}
            captainId={captainId}
          />
        </div>

        {/* Coluna Direita: Staff Técnico + Banco de Reservas */}
        <div className="lg:col-span-5 space-y-6">
          {/* Box do Técnico */}
          <div className="bg-surface border border-edge/25 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div
              onClick={() => coachFileRef.current?.click()}
              className="relative w-20 h-20 rounded-2xl bg-surface-2 border-2 border-dashed border-edge/40 hover:border-brand flex items-center justify-center cursor-pointer overflow-hidden group shrink-0 transition-all"
            >
              {coachPhoto ? (
                <img
                  src={coachPhoto}
                  alt="Coach"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-6 h-6 text-muted group-hover:text-brand transition-colors" />
              )}
              <input
                ref={coachFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoachFileChange}
              />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand uppercase tracking-widest bg-brand/10 px-2 py-0.5 rounded">
                  Head Coach
                </span>
                <button
                  onClick={() => setIsCoachModalOpen(true)}
                  className="text-[11px] text-muted hover:text-foreground underline cursor-pointer"
                >
                  Edit profile
                </button>
              </div>
              <h3 className="text-sm font-black text-foreground uppercase truncate">
                {coachName}
              </h3>
            </div>
          </div>

          {/* Banco de Reservas */}
          <div className="bg-surface border border-edge/25 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
                Substitutes Bench (+5)
              </h3>
              <span className="text-[10px] text-muted font-medium">
                Click slot to add
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4].map((subIndex) => {
                const subPlayer = subPlayers[subIndex];
                const playerName = subPlayer?.fullName || subPlayer?.name;
                const playerPhoto =
                  subPlayer?.photoUrl ||
                  subPlayer?.badgeUrl ||
                  subPlayer?.crestUrl;

                return (
                  <div
                    key={subIndex}
                    onClick={() => handleSelectSubSlot(subIndex)}
                    className="aspect-square bg-surface-2 border border-edge/20 hover:border-brand rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all relative group overflow-hidden"
                    title={subPlayer ? playerName : "Add Substitute"}
                  >
                    {subPlayer ? (
                      <>
                        {playerPhoto ? (
                          <img
                            src={playerPhoto}
                            alt={playerName}
                            className="w-8 h-8 object-cover rounded-full"
                          />
                        ) : (
                          <User className="w-6 h-6 text-muted" />
                        )}
                        <span className="text-[9px] font-bold text-foreground truncate w-full text-center mt-1">
                          {playerName?.split(" ").pop()}
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted group-hover:text-brand">
                        <span className="text-lg font-light">+</span>
                        <span className="text-[8px] uppercase tracking-tighter">
                          Sub {subIndex + 1}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: SETUP DO TÉCNICO --- */}
      {isCoachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface border border-edge/25 w-full max-w-md p-6 space-y-5 rounded-2xl shadow-2xl relative text-foreground">
            <h3 className="text-xl font-black uppercase tracking-tight">
              Configure Technical Staff
            </h3>
            <p className="text-xs text-muted">
              Set up your coach details before managing your tactical lineup.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex flex-col items-center gap-3">
                <div
                  onClick={() => coachFileRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-surface-2 border-2 border-dashed border-edge/40 hover:border-brand flex items-center justify-center cursor-pointer overflow-hidden relative group"
                >
                  {coachPhoto ? (
                    <img
                      src={coachPhoto}
                      alt="Coach"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-muted group-hover:text-brand" />
                  )}
                </div>
                <span className="text-[10px] text-muted uppercase font-bold">
                  Click to upload coach photo
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest">
                  Coach Name
                </label>
                <input
                  type="text"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder="e.g. Carlo Ancelotti"
                  className="w-full bg-surface-2 border border-edge/20 rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!coachName.trim())
                  return toast.error("Please enter coach name");
                setIsCoachModalOpen(false);
                toast.success("Coach profile updated!");
              }}
              className="w-full py-3.5 bg-brand text-brand-foreground text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 cursor-pointer"
            >
              Continue to Lineup
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 2: SELEÇÃO DE JOGADOR --- */}
      <PlayerSearchModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        onSelectPlayer={handleSelectPlayer}
      />

      {/* --- MODAL 3: ESCOLHER CAPITÃO (Novo Componente Importado) --- */}
      <CaptainModal
        isOpen={isCaptainModalOpen}
        onClose={() => setIsCaptainModalOpen(false)}
        players={lineupPlayers}
        captainId={captainId}
        onSelectCaptain={(playerId, playerName) => {
          setCaptainId(playerId);
          toast.success(`${playerName} is now the team captain! (C)`);
        }}
      />
    </div>
  );
}
