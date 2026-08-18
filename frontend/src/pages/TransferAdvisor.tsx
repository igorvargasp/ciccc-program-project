import { useState } from "react";
// Importe seus ícones preferidos (lucide-react, por exemplo)
import { BrainCircuit, Search, Loader2, AlertCircle } from "lucide-react";
import {
  apiErrorMessage,
  suggestTransfers,
  type TransferSuggestion,
} from "../api/ai";

export function TransferAdvisorPage({
  teams = [],
}: {
  teams: { id: string; name: string }[];
}) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [suggestions, setSuggestions] = useState<TransferSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSuggestions = async () => {
    if (!selectedTeamId) return;

    setLoading(true);
    setError("");

    try {
      setSuggestions(await suggestTransfers(selectedTeamId));
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Falha ao gerar sugestões"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-600 rounded-lg text-white">
          <BrainCircuit size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfer Advisor</h1>
          <p className="text-gray-500">
            Inteligência artificial para reforçar seu elenco.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione o Clube
        </label>
        <div className="flex gap-2">
          <select
            className="flex-1 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
          >
            <option value="">Escolha um time...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            onClick={fetchSuggestions}
            disabled={loading || !selectedTeamId}
            className="bg-indigo-600 text-white px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Search size={18} />
            )}
            Analisar
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Grid de sugestões */}
      <div className="mt-8 grid gap-4">
        {suggestions.map((s: any, idx) => (
          <div
            key={idx}
            className="bg-white border-l-4 border-l-indigo-500 p-5 shadow-sm rounded-r-xl transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">
                {s.position}
              </span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-medium">
                Fit: {s.fitScore}%
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2">{s.playerName}</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              {s.rationale}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
