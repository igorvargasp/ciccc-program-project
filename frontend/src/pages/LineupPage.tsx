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

const getPositionByCoordinates = (
  x: number,
  y: number,
): { role: string; label: string } => {
  // Se o Y for baixo (topo do campo visual), consideramos Defesa/Goleiro
  if (y < 20) {
    return { role: "GK", label: "Goleiro" };
  }

  if (y < 45) {
    if (x < 30) return { role: "LB", label: "Lateral Esquerdo" };
    if (x > 70) return { role: "RB", label: "Lateral Direito" };
    return { role: "CB", label: "Zagueiro" };
  }

  if (y < 70) {
    if (x < 30) return { role: "LM", label: "Meia Esquerda" };
    if (x > 70) return { role: "RM", label: "Meia Direita" };
    return { role: "CM", label: "Meio-Campista" };
  }

  // Parte inferior do campo (Ataque)
  if (x < 30) return { role: "LW", label: "Ponta Esquerda" };
  if (x > 70) return { role: "RW", label: "Ponta Direita" };
  return { role: "ST", label: "Atacante" };
};

export function LineupPage() {
  const { t } = useTranslation();

  const [formation, setFormation] = useState<string>("4-3-3");
  const [pitchStyle, setPitchStyle] =
    useState<keyof typeof PITCH_STYLES>("modern");
  const [lineupPlayers, setLineupPlayers] = useState<Record<number, Player>>(
    {},
  );
  const [subPlayers, setSubPlayers] = useState<Record<number, Player>>({});

  const [customPositions, setCustomPositions] = useState<
    Record<number, { x: number; y: number }>
  >({});

  const [captainId, setCaptainId] = useState<string | number | null>(null);
  const [isDesignOpen, setIsDesignOpen] = useState<boolean>(false);

  const [isCoachModalOpen, setIsCoachModalOpen] = useState<boolean>(false);
  const [isFormationModalOpen, setIsFormationModalOpen] =
    useState<boolean>(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [isCaptainModalOpen, setIsCaptainModalOpen] = useState<boolean>(false);

  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isSubSlot, setIsSubSlot] = useState<boolean>(false);

  const [coachName, setCoachName] = useState<string>("Head Coach");
  const [coachPhoto, setCoachPhoto] = useState<string | null>(null);
  const coachFileRef = useRef<HTMLInputElement>(null);

  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>([]);
  const [lineupName, setLineupName] = useState<string>("My Dream Team");
  const [favoriteTeam, setFavoriteTeam] = useState<any>(null);

  // IDs de jogadores já selecionados (tanto titulares quanto reservas) para evitar duplicatas
  const selectedPlayerIds = [
    ...Object.values(lineupPlayers).map((p) => p.id),
    ...Object.values(subPlayers).map((p) => p.id),
  ];

  useEffect(() => {
    const savedCoach = localStorage.getItem("my_coach_profile");
    if (savedCoach) {
      try {
        const { name, photo } = JSON.parse(savedCoach);
        setCoachName(name);
        setCoachPhoto(photo);
        setIsCoachModalOpen(false);
      } catch (e) {
        console.error("Error parsing saved coach profile", e);
        setIsCoachModalOpen(true);
      }
    } else {
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

    const localLineups = localStorage.getItem("saved_tactical_lineups");
    if (localLineups) {
      try {
        setSavedLineups(JSON.parse(localLineups));
      } catch (e) {
        console.error("Error parsing saved lineups", e);
      }
    }
  }, []);

  const handleSaveLineup = () => {
    const starterCount = Object.keys(lineupPlayers).length;
    if (starterCount < 11) {
      toast.error(t("lineup.toast.fillAll"));
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
    toast.success(t("lineup.toast.saved"));
  };

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
    toast.success(`${t("lineup.toast.loaded")} ${item.name}`);
  };

  const handleDeleteSavedLineup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedLineups.filter((item) => item.id !== id);
    setSavedLineups(updated);
    localStorage.setItem("saved_tactical_lineups", JSON.stringify(updated));
    toast.success(t("lineup.toast.deleted"));
  };

  const handleSelectSlot = (index: number) => {
    setActiveSlotIndex(index);
    setIsSubSlot(false);
    setIsPlayerModalOpen(true);
  };

  const handleSelectSubSlot = (index: number) => {
    setActiveSlotIndex(index);
    setIsSubSlot(true);
    setIsPlayerModalOpen(true);
  };

  const handleSelectPlayer = (player: Player) => {
    if (activeSlotIndex !== null) {
      if (isSubSlot) {
        setSubPlayers((prev) => ({ ...prev, [activeSlotIndex]: player }));
      } else {
        setLineupPlayers((prev) => ({ ...prev, [activeSlotIndex]: player }));
      }
      toast.success(t("lineup.toast.playerAdded"));
    }
    setIsPlayerModalOpen(false);
    setActiveSlotIndex(null);
  };

  const handleUpdateCustomPosition = (
    index: number,
    coords: { x: number; y: number },
  ) => {
    setCustomPositions((prev) => ({
      ...prev,
      [index]: coords,
    }));

    setLineupPlayers((prev) => {
      const player = prev[index];
      if (!player) return prev;

      const newPos = getPositionByCoordinates(coords.x, coords.y);

      return {
        ...prev,
        [index]: {
          ...player,
          position: newPos.role,
          role: newPos.label,
        },
      };
    });
  };

  const handleCoachFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        setCoachPhoto(base64Image);

        const coachData = { name: coachName, photo: base64Image };
        localStorage.setItem("my_coach_profile", JSON.stringify(coachData));
        toast.success(t("lineup.toast.coachPhotoUpdated"));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCoachPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoachPhoto(null);
    if (coachFileRef.current) {
      coachFileRef.current.value = "";
    }

    const savedCoach = localStorage.getItem("my_coach_profile");
    if (savedCoach) {
      try {
        const parsed = JSON.parse(savedCoach);
        localStorage.setItem(
          "my_coach_profile",
          JSON.stringify({ ...parsed, photo: null }),
        );
      } catch (err) {
        console.error(err);
      }
    }
    toast.success(
      t("lineup.toast.coachPhotoRemoved") || "Foto do técnico removida",
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 space-y-4 md:space-y-6 pb-12">
      {/* Header Limpo */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-surface border border-edge/25 rounded-2xl p-4 md:p-5 gap-4 shadow-sm">
        <div className="w-full lg:w-auto">
          <span className="text-[10px] font-bold text-brand uppercase tracking-widest bg-brand/10 px-2.5 py-1 border border-brand/30 rounded-md">
            {t("lineup.tacticalManagement")}
          </span>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={lineupName}
              onChange={(e) => setLineupName(e.target.value)}
              className="text-xl md:text-2xl font-black uppercase tracking-tight bg-transparent border-b border-transparent hover:border-edge/40 focus:border-brand focus:outline-none text-foreground w-full sm:w-64 transition-all"
              placeholder={t("lineup.placeholderName")}
            />
          </div>
          <p className="text-xs text-muted mt-0.5">{t("lineup.description")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setIsCaptainModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-surface-2 hover:bg-surface border border-edge/20 rounded-xl text-xs font-bold text-foreground transition-all cursor-pointer"
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            {captainId ? t("lineup.changeCaptain") : t("lineup.selectCaptain")}
          </button>

          <button
            type="button"
            onClick={handleSaveLineup}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-brand hover:bg-brand/90 text-brand-foreground rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {t("lineup.saveLineup")}
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 items-start">
        {/* Coluna Esquerda (Campo) */}
        <div className="xl:col-span-7 flex flex-col items-center bg-surface border border-edge/25 rounded-2xl p-3 sm:p-5 md:p-6 shadow-sm gap-4">
          <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-edge/10">
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setIsDesignOpen(!isDesignOpen)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-2 hover:bg-surface border border-edge/20 rounded-xl text-xs font-bold text-foreground transition-all cursor-pointer shadow-sm"
              >
                <Palette className="w-3.5 h-3.5 text-brand" />
                <span className="text-[10px] text-muted uppercase hidden sm:inline">
                  {t("lineup.design")}
                </span>
                <span className="text-brand font-black">
                  {PITCH_STYLES[pitchStyle].name}
                </span>
              </button>

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

            <button
              type="button"
              onClick={() => setIsFormationModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface border border-edge/20 rounded-xl text-xs font-bold text-foreground transition-all cursor-pointer shadow-sm"
            >
              {formation === "CUSTOM" ? (
                <Move className="w-4 h-4 text-brand animate-pulse" />
              ) : (
                <LayoutGrid className="w-4 h-4 text-brand" />
              )}
              <span className="text-[10px] text-muted uppercase hidden sm:inline">
                {t("lineup.formation")}
              </span>
              <span className="text-brand font-black">{formation}</span>
            </button>
          </div>

          {formation === "CUSTOM" && (
            <div className="w-full bg-brand/10 border border-brand/30 rounded-xl px-4 py-2 text-center text-xs text-brand font-medium flex items-center justify-center gap-2">
              <Move className="w-4 h-4 animate-bounce shrink-0" />
              <span>{t("lineup.customNotice")}</span>
            </div>
          )}

          {/* Wrapper com scroll horizontal para telas menores */}
          <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[540px] flex justify-center">
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
          </div>
        </div>

        {/* Coluna Direita (Coach, Subs, Saved) */}
        <div className="xl:col-span-5 space-y-4 md:space-y-6">
          {/* Box do Técnico */}
          <div className="bg-surface border border-edge/25 rounded-2xl p-4 md:p-5 shadow-sm flex items-center gap-4">
            <div
              onClick={() => coachFileRef.current?.click()}
              className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-surface-2 border-2 border-dashed border-edge/40 hover:border-brand flex items-center justify-center cursor-pointer overflow-hidden group shrink-0 transition-all"
            >
              {coachPhoto ? (
                <>
                  <img
                    key={coachPhoto}
                    src={coachPhoto}
                    alt="Coach"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCoachPhoto}
                    title={t("lineup.removePhoto") || "Remover foto"}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs font-bold shadow-md cursor-pointer z-10"
                  >
                    ✕
                  </button>
                </>
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
                  {t("lineup.headCoach")}
                </span>
                <button
                  onClick={() => setIsCoachModalOpen(true)}
                  className="text-[11px] text-muted hover:text-foreground underline cursor-pointer"
                >
                  {t("lineup.editProfile")}
                </button>
              </div>
              <h3 className="text-sm font-black text-foreground uppercase truncate">
                {coachName}
              </h3>
            </div>
          </div>

          {/* Banco de Reservas */}
          <div className="bg-surface border border-edge/25 rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
                {t("lineup.substitutesBench")}
              </h3>
              <span className="text-[10px] text-muted font-medium">
                {t("lineup.clickToAdd")}
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
                    title={subPlayer ? playerName : t("lineup.clickToAdd")}
                  >
                    {subPlayer ? (
                      <>
                        {playerPhoto ? (
                          <img
                            src={playerPhoto}
                            alt={playerName}
                            className="w-7 h-7 md:w-8 md:h-8 object-cover rounded-full"
                          />
                        ) : (
                          <User className="w-5 h-5 text-muted" />
                        )}
                        <span className="text-[8px] md:text-[9px] font-bold text-foreground truncate w-full text-center mt-1">
                          {playerName?.split(" ").pop()}
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted group-hover:text-brand">
                        <span className="text-base font-light">+</span>
                        <span className="text-[7px] md:text-[8px] uppercase tracking-tighter">
                          {t("lineup.sub")} {subIndex + 1}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Escalações Salvas */}
          <div className="bg-surface border border-edge/25 rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
              {t("lineup.savedLineups")} ({savedLineups.length})
            </h3>
            {savedLineups.length === 0 ? (
              <p className="text-xs text-muted py-2">
                {t("lineup.noSavedLineups")}
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {savedLineups.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadLineup(item)}
                    className="flex items-center justify-between p-3 bg-surface-2 border border-edge/20 hover:border-brand rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <h4 className="text-xs font-bold text-foreground uppercase truncate">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-muted truncate">
                        {t("lineup.formation")}: {item.formation} •{" "}
                        {t("lineup.headCoach")}: {item.coachName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title={t("lineup.loadLineup")}
                        className="p-1.5 text-muted hover:text-brand transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedLineup(item.id, e)}
                        title={t("lineup.delete")}
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

      {/* MODAL 1: SETUP DO TÉCNICO */}
      {isCoachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface border border-edge/25 w-full max-w-md p-6 space-y-5 rounded-2xl shadow-2xl relative text-foreground">
            <h3 className="text-xl font-black uppercase tracking-tight">
              {t("lineup.coachModalTitle")}
            </h3>
            <p className="text-xs text-muted">{t("lineup.coachModalDesc")}</p>

            <div className="space-y-4 pt-2">
              <div className="flex flex-col items-center gap-3">
                <div
                  onClick={() => coachFileRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-surface-2 border-2 border-dashed border-edge/40 hover:border-brand flex items-center justify-center cursor-pointer overflow-hidden relative group"
                >
                  {coachPhoto ? (
                    <>
                      <img
                        key={coachPhoto}
                        src={coachPhoto}
                        alt="Coach"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveCoachPhoto}
                        title={t("lineup.removePhoto") || "Remover foto"}
                        className="absolute top-0 right-0 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs font-bold shadow-md cursor-pointer z-10"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <Camera className="w-8 h-8 text-muted group-hover:text-brand" />
                  )}
                </div>
                <span className="text-[10px] text-muted uppercase font-bold">
                  {t("lineup.uploadPhoto")}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest">
                  {t("lineup.coachNameLabel")}
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
                  return toast.error(t("lineup.toast.coachNameError"));

                localStorage.setItem(
                  "my_coach_profile",
                  JSON.stringify({ name: coachName, photo: coachPhoto }),
                );

                setIsCoachModalOpen(false);
                toast.success(t("lineup.toast.coachUpdated"));
              }}
              className="w-full py-3.5 bg-brand text-brand-foreground text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 cursor-pointer"
            >
              {t("lineup.continueButton")}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: FORMAÇÃO */}
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
          toast.success(`${t("lineup.toast.formationChanged")} ${newFmt}`);
        }}
      />

      {/* MODAL 3: JOGADOR (Com exclusão dos já selecionados) */}
      <PlayerSearchModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        onSelectPlayer={handleSelectPlayer}
        excludePlayerIds={selectedPlayerIds}
      />

      {/* MODAL 4: CAPITÃO */}
      <CaptainModal
        isOpen={isCaptainModalOpen}
        onClose={() => setIsCaptainModalOpen(false)}
        players={lineupPlayers}
        captainId={captainId}
        onSelectCaptain={(playerId, playerName) => {
          setCaptainId(playerId);
          toast.success(`${playerName} ${t("lineup.toast.captainSet")}`);
        }}
      />
    </div>
  );
}
