"use client";

import React from "react";
import { X, Check, LayoutGrid, Move } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFormation: string;
  onSelectFormation: (formation: string) => void;
}

const FORMATIONS_DATA = [
  { id: "4-3-3", name: "4-3-3", key: "balancedAttack" },
  { id: "4-4-2", name: "4-4-2", key: "classicBlock" },
  { id: "4-5-1", name: "4-5-1", key: "midfieldControl" },
  { id: "3-5-2", name: "3-5-2", key: "wingBackDomination" },
  { id: "4-1-4-1", name: "4-1-4-1", key: "defensiveShield" },
  { id: "3-4-3", name: "3-4-3", key: "ultraOffensive" },
  { id: "4-2-3-1", name: "4-2-3-1", key: "modernPivot" },
  { id: "CUSTOM", name: "CUSTOM", key: "freePlacement", isCustom: true },
];

export default function FormationModal({
  isOpen,
  onClose,
  currentFormation,
  onSelectFormation,
}: FormationModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-edge/25 w-full max-w-lg p-4 sm:p-6 space-y-4 sm:space-y-5 rounded-2xl shadow-2xl relative text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-brand/10 text-brand rounded-xl border border-brand/20 shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight truncate">
                {t("lineup.selectFormation") || "Select Tactical Formation"}
              </h3>
              <p className="text-xs text-muted truncate">
                {t("lineup.selectFormationDesc") ||
                  "Choose the structural formation for your starting lineup."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground rounded-xl bg-surface-2 hover:bg-surface border border-edge/20 transition-all cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Formações */}
        <div className="grid grid-cols-1 gap-2.5 max-h-[55vh] sm:max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          {FORMATIONS_DATA.map((fmt) => {
            const isSelected = currentFormation === fmt.id;
            const descriptionText =
              t(`lineup.formations.${fmt.key}`) || fmt.key;

            return (
              <div
                key={fmt.id}
                onClick={() => {
                  onSelectFormation(fmt.id);
                  onClose();
                }}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer gap-3 ${
                  isSelected
                    ? "bg-brand/10 border-brand text-foreground shadow-sm"
                    : "bg-surface-2 border-edge/20 hover:border-brand/50 text-foreground"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {fmt.isCustom && (
                      <Move className="w-4 h-4 text-brand animate-pulse shrink-0" />
                    )}
                    <span className="text-base font-black tracking-wider text-brand">
                      {fmt.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold bg-brand text-brand-foreground px-2 py-0.5 rounded-full uppercase shrink-0">
                        {t("lineup.active") || "Active"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5 truncate sm:whitespace-normal">
                    {descriptionText}
                  </p>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${
                    isSelected
                      ? "bg-brand border-brand text-brand-foreground"
                      : "border-edge/40 text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
