import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  User,
  Camera,
  Star,
  Save,
  RotateCcw,
  LayoutGrid,
  Palette,
  Move,
  Check,
} from "lucide-react";
import FootballPitch, { PITCH_STYLES } from "@/components/modals/FootballPitch";
import FormationModal from "@/components/modals/FormationModal";
import PlayerSearchModal from "@/components/modals/PlayerSearchModal";
import CaptainModal from "@/components/modals/CaptainModal";
import type { LineupSlotPlayer as Player } from "@/types";

interface SavedLineup {
  id: string;
  name: string;
  formation: string;
  coachName: string;
  coachPhoto: string | null;
  lineupPlayers: Record<number, Player>;
  subPlayers: Record<number, Player>;
  captainId: string | number | null;
  pitchStyle: string;
  customPositions?: Record<number, { x: number; y: number }>;
  createdAt: string;
}

export function LineupPage() {
  const { t } = useTranslation();

  // Estados de Formação, Estilo do Campo e Jogadores (Titulares e Reservas)
  const [formation, setFormation] = useState<string>("4-3-3");
  const [pitchStyle, setPitchStyle] =
    useState<keyof typeof PITCH_STYLES>("modern");
  const [lineupPlayers, setLineupPlayers] = useState<Record<number, Player>>(
    {},
  );
  const [subPlayers, setSubPlayers] = useState<Record<number, Player>>({});

  // Posições Customizadas para o modo Drag & Drop
  const [customPositions, setCustomPositions] = useState<
    Record<number, { x: number; y: number }>
  >({});

  // Capitão do time
  const [captainId, setCaptainId] = useState<string | number | null>(null);

  // Estado para controlar a expansão lateral do menu de Design
  const [isDesignOpen, setIsDesignOpen] = useState<boolean>(false);

  // Modais (Inicia como false para não abrir sempre; o useEffect gerencia o primeiro acesso)
  const [isCoachModalOpen, setIsCoachModalOpen] = useState<boolean>(false);
  const [isFormationModalOpen, setIsFormationModalOpen] =
    useState<boolean>(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [isCaptainModalOpen, setIsCaptainModalOpen] = useState<boolean>(false);

  // Controle de qual slot está sendo editado
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isSubSlot, setIsSubSlot] = useState<boolean>(false);

  // States do Técnico
  const [coachName, setCoachName] = useState<string>("Head Coach");
  const [coachPhoto, setCoachPhoto] = useState<string | null>(null);
  const coachFileRef = useRef<HTMLInputElement>(null);

  // Gerenciamento de Escalações Salvas
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>([]);
  const [lineupName, setLineupName] = useState<string>("My Dream Team");

  // Time Favorito salvo no localStorage
  const [favoriteTeam, setFavoriteTeam] = useState<any>(null);

  useEffect(() => {
    // Carregar dados salvos do Coach
    const savedCoach = localStorage.getItem("my_coach_profile");
    if (savedCoach) {
      try {
        const { name, photo } = JSON.parse(savedCoach);
        setCoachName(name);
        setCoachPhoto(photo);
        setIsCoachModalOpen(false); // Mantém fechado se já foi configurado antes
      } catch (e) {
        console.error("Error parsing saved coach profile", e);
        setIsCoachModalOpen(true);
      }
    } else {
      // Se não houver coach salvo, abre o modal automaticamente no primeiro acesso
      setIsCoachModalOpen(true);
    }

    const savedFav = localStorage.getItem("favorite_team");
    if (savedFav) {
      try {
        setFavoriteTeam(JSON.parse(savedFav));
      } catch (e) {
        console.error("Error parsing favorite team", e);
      }
    }

    // Carregar escalações salvas do localStorage
    const localLineups = localStorage.getItem("saved_tactical_lineups");
    if (localLineups) {
      try {
        setSavedLineups(JSON.parse(localLineups));
      } catch (e) {
        console.error("Error parsing saved lineups", e);
      }
    }
  }, []);

  // Salvar Escalação atual
  const handleSaveLineup = () => {
    const starterCount = Object.keys(lineupPlayers).length;
    if (starterCount < 11) {
      toast.error("Please fill all 11 starting positions before saving!");
      return;
    }

    const newEntry: SavedLineup = {
      id: Date.now().toString(),
      name: lineupName.trim() || "Tactical Setup",
      formation,
      coachName,
      coachPhoto,
      lineupPlayers,
      subPlayers,
      captainId,
      pitchStyle,
      customPositions: formation === "CUSTOM" ? customPositions : undefined,
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [newEntry, ...savedLineups];
    setSavedLineups(updated);
    localStorage.setItem("saved_tactical_lineups", JSON.stringify(updated));
    toast.success("Lineup saved successfully!");
  };

  // Carregar uma escalação salva
  const handleLoadLineup = (item: SavedLineup) => {
    setFormation(item.formation);
    setCoachName(item.coachName);
    setCoachPhoto(item.coachPhoto);
    setLineupPlayers(item.lineupPlayers);
    setSubPlayers(item.subPlayers || {});
    setCaptainId(item.captainId);
    setLineupName(item.name);

    if (item.customPositions) {
      setCustomPositions(item.customPositions);
    } else {
      setCustomPositions({});
    }

    if (
      item.pitchStyle &&
      PITCH_STYLES[item.pitchStyle as keyof typeof PITCH_STYLES]
    ) {
      setPitchStyle(item.pitchStyle as keyof typeof PITCH_STYLES);
    }
    toast.success(`Loaded lineup: ${item.name}`);
  };

  // Deletar escalação salva
  const handleDeleteSavedLineup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedLineups.filter((item) => item.id !== id);
    setSavedLineups(updated);
    localStorage.setItem("saved_tactical_lineups", JSON.stringify(updated));
    toast.success("Lineup deleted.");
  };

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

  // Atualizar posição customizada do jogador via Drag & Drop
  const handleUpdateCustomPosition = (
    index: number,
    coords: { x: number; y: number },
  ) => {
    setCustomPositions((prev) => ({
      ...prev,
      [index]: coords,
    }));
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
      {/* Header Limpo (Apenas Nome da Tática, Capitão e Salvar) */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-surface border border-edge/25 rounded-2xl p-5 gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-bold text-brand uppercase tracking-widest bg-brand/10 px-2.5 py-1 border border-brand/30 rounded-md">
            Tactical Management
          </span>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={lineupName}
              onChange={(e) => setLineupName(e.target.value)}
              className="text-2xl font-black uppercase tracking-tight bg-transparent border-b border-transparent hover:border-edge/40 focus:border-brand focus:outline-none text-foreground w-64 transition-all"
              placeholder="Team Tactical Name"
            />
          </div>
          <p className="text-xs text-muted mt-0.5">
            Customize your tactical formation, pitch styles, technical staff,
            and save lineups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Botão de Escolher Capitão */}
          <button
            type="button"
            onClick={() => setIsCaptainModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface border border-edge/20 rounded-xl text-xs font-bold text-foreground transition-all cursor-pointer"
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            {captainId ? "Change Captain" : "Select Captain"}
          </button>

          {/* Botão de Salvar Escalação */}
          <button
            type="button"
            onClick={handleSaveLineup}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand/90 text-brand-foreground rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Lineup
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Controles de Formação/Estilo + Campo de Futebol */}
        <div className="lg:col-span-7 flex flex-col items-center bg-surface border border-edge/25 rounded-2xl p-6 shadow-sm gap-4">
          {/* Controles do Campo (Design com Expansão Lateral Suave & Formation) */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-edge/10">
            {/* Seletor de Estilo do Campo (Design) com Animação Lateral Suave */}
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setIsDesignOpen(!isDesignOpen)}
                className="flex items-center gap-2 px-3.5 py-2 bg-surface-2 hover:bg-surface border border-edge/20 rounded-xl text-xs font-bold text-foreground transition-all cursor-pointer shadow-sm"
              >
                <Palette className="w-3.5 h-3.5 text-brand" />
                <span className="text-[10px] text-muted uppercase">
                  Design:
                </span>
                <span className="text-brand font-black">
                  {PITCH_STYLES[pitchStyle].name}
                </span>
              </button>

              {/* Opções expandidas lateralmente */}
              <div
                className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 ease-in-out pl-2 ${
                  isDesignOpen
                    ? "max-w-[400px] opacity-100 translate-x-0"
                    : "max-w-0 opacity-0 -translate-x-3 pointer-events-none"
                }`}
              >
                {Object.entries(PITCH_STYLES).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setPitchStyle(key as any);
                      setIsDesignOpen(false);
                    }}
                    className={`px-3 py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-sm border ${
                      pitchStyle === key
                        ? "bg-brand text-brand-foreground border-brand"
                        : "bg-surface-2 text-muted hover:text-foreground border-edge/20 hover:border-edge/40"
                    }`}
                  >
                    {pitchStyle === key && <Check className="w-3 h-3" />}
                    {value.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Botão de Abrir Modal de Formação */}
            <button
              type="button"
              onClick={() => setIsFormationModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface border border-edge/20 rounded-xl text-xs font-bold text-foreground transition-all cursor-pointer shadow-sm"
            >
              {formation === "CUSTOM" ? (
                <Move className="w-4 h-4 text-brand animate-pulse" />
              ) : (
                <LayoutGrid className="w-4 h-4 text-brand" />
              )}
              <span className="text-[10px] text-muted uppercase">
                Formation:
              </span>
              <span className="text-brand font-black">{formation}</span>
            </button>
          </div>

          {formation === "CUSTOM" && (
            <div className="w-full bg-brand/10 border border-brand/30 rounded-xl px-4 py-2 text-center text-xs text-brand font-medium flex items-center justify-center gap-2">
              <Move className="w-4 h-4 animate-bounce" />
              <span>
                Drag and drop player cards anywhere on the pitch to build your
                custom layout!
              </span>
            </div>
          )}

          <FootballPitch
            formation={formation}
            lineupPlayers={lineupPlayers}
            onSelectSlot={handleSelectSlot}
            captainId={captainId}
            pitchStyle={pitchStyle}
            customPositions={customPositions}
            onUpdateCustomPosition={handleUpdateCustomPosition}
          />
        </div>

        {/* Coluna Direita: Staff Técnico + Banco de Reservas + Escalações Salvas */}
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

          {/* Escalações Salvas (Saved Lineups) */}
          <div className="bg-surface border border-edge/25 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
              Saved Lineups ({savedLineups.length})
            </h3>
            {savedLineups.length === 0 ? (
              <p className="text-xs text-muted py-2">
                No lineups saved yet. Build your squad and click "Save Lineup".
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {savedLineups.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadLineup(item)}
                    className="flex items-center justify-between p-3 bg-surface-2 border border-edge/20 hover:border-brand rounded-xl cursor-pointer transition-all group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-muted">
                        Formation: {item.formation} • Coach: {item.coachName} •{" "}
                        {item.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        title="Load Lineup"
                        className="p-1.5 text-muted hover:text-brand transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSavedLineup(item.id, e)}
                        title="Delete"
                        className="p-1.5 text-muted hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL 1: SETUP DO TÉCNICO (Salva no localStorage) --- */}
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

                // Persiste os dados do coach para não pedir novamente nas próximas vezes
                localStorage.setItem(
                  "my_coach_profile",
                  JSON.stringify({ name: coachName, photo: coachPhoto }),
                );

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

      {/* --- MODAL 2: SELEÇÃO DE FORMAÇÃO TÁTICA --- */}
      <FormationModal
        isOpen={isFormationModalOpen}
        onClose={() => setIsFormationModalOpen(false)}
        currentFormation={formation}
        onSelectFormation={(newFmt) => {
          setFormation(newFmt);
          if (newFmt !== "CUSTOM") {
            setCustomPositions({});
          }
          setLineupPlayers({});
          setSubPlayers({});
          setCaptainId(null);
          toast.success(`Formation changed to ${newFmt}`);
        }}
      />

      {/* --- MODAL 3: SELEÇÃO DE JOGADOR --- */}
      <PlayerSearchModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        onSelectPlayer={handleSelectPlayer}
      />

      {/* --- MODAL 4: ESCOLHER CAPITÃO --- */}
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
