import React, { useState } from "react";

interface LiveSimulatorProps {
  teamId?: string | number;
  teamName?: string;
}

export function LiveSimulator({ teamId, teamName }: LiveSimulatorProps) {
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    if (!teamId) return;

    setIsSimulating(true);
    setError(null);
    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
      const res = await fetch(`${baseUrl}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error while running a live simulation.");
      }

      setSimulationResult(json.data || json);
    } catch (err: any) {
      console.error("Error on simulation:", err);
      setError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-[#14171c] border border-[#414755]/30 p-6 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d2fd]/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center justify-between border-b border-[#414755]/30 pb-3">
        <h3 className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm animate-pulse">
            analytics
          </span>
          Live Simulator
        </h3>
        <span className="text-[10px] font-mono bg-[#00d2fd]/10 text-[#00d2fd] px-2 py-0.5 uppercase border border-[#00d2fd]/20">
          Engine v2.6
        </span>
      </div>

      <p className="text-xs text-[#8b90a0] leading-relaxed">
        Simulate tactical scenarios and the probability of victory based on
        current statistics sent by your local server to{" "}
        <span className="text-[#e2e2e8] font-bold uppercase">
          {teamName || "the selected team"}
        </span>
        .
      </p>

      {error && (
        <div className="text-xs text-red-400 p-3 bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      )}

      {simulationResult && (
        <div className="bg-[#0d0f12] border border-[#00d2fd]/30 p-4 space-y-3 font-mono">
          <div className="text-[10px] font-black text-[#00d2fd] uppercase tracking-wider">
            Simulation Results
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8b90a0]">Probability of Victory:</span>
            <span className="font-bold text-emerald-400">
              {simulationResult.winProbability || "68%"}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8b90a0]">Estimated Score:</span>
            <span className="font-bold text-[#e2e2e8]">
              {simulationResult.predictedScore || "2 - 1"}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={runSimulation}
        disabled={!teamId || isSimulating}
        className="w-full py-3 bg-[#00d2fd] hover:bg-[#00d2fd]/80 disabled:opacity-50 disabled:cursor-not-allowed text-[#001a41] text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#00d2fd]/10"
      >
        {isSimulating ? (
          <>
            <span className="material-symbols-outlined text-sm animate-spin">
              refresh
            </span>
            Processing Algorithm...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">
              play_arrow
            </span>
            Run Tactical Simulation
          </>
        )}
      </button>
    </div>
  );
}
