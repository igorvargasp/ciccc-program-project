import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { listCompetitions } from "../api/competitions";
import { SkeletonCard } from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";

// Exact desired order (in lowercase to facilitate comparison)
const COMPETITION_ORDER = [
  "bundesliga",
  "la liga",
  "campeonato brasileiro",
  "premier league",
  "eredivisie",
  "ligue 1",
  "serie a",
  "uefa champions league",
  "copa libertadores",
  "primeira liga",
  "major league soccer",
  "championship",
  "liga mx",
];

export default function Competitions() {
  const { t } = useTranslation();

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: async () => {
      const data = await listCompetitions();
      if (!data) return [];

      // Sort based on the sequence defined above
      return [...data].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

        // Find the corresponding index in the order list
        const indexA = COMPETITION_ORDER.findIndex((order) =>
          nameA.includes(order),
        );
        const indexB = COMPETITION_ORDER.findIndex((order) =>
          nameB.includes(order),
        );

        // If both are found in the list, sort by position
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // If only A is in the list, it comes first
        if (indexA !== -1) return -1;
        // If only B is in the list, it comes first
        if (indexB !== -1) return 1;

        // If neither is in the list, maintain the original alphabetical/default order
        return nameA.localeCompare(nameB);
      });
    },
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-foreground">
        {t("competitions.title")}
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !competitions?.length ? (
        <EmptyState
          icon={<Trophy className="w-12 h-12" />}
          title={t("competitions.noCompetitions")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {competitions.map((comp) => (
            <Link key={comp.id} to={`/competitions/${comp.id}`}>
              <div className="group bg-surface border border-edge/12 rounded-xl p-5 flex items-center gap-4 hover:border-brand/30 transition-all duration-150">
                {comp.logoUrl ? (
                  <img
                    src={comp.logoUrl}
                    alt={comp.name}
                    className="w-12 h-12 object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-muted" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-foreground group-hover:text-brand transition-colors truncate">
                    {comp.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {comp.country && (
                      <span className="text-xs text-muted">{comp.country}</span>
                    )}
                    <span className="text-xs text-muted capitalize">
                      {comp.type}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
