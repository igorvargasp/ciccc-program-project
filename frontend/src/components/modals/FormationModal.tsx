"use client";

import React from "react";
import { X, Check, LayoutGrid, Move } from "lucide-react";

interface FormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFormation: string;
  onSelectFormation: (formation: string) => void;
}

const AVAILABLE_FORMATIONS = [
  { id: "4-3-3", name: "4-3-3", desc: "Balanced attacking setup with wingers" },
  { id: "4-4-2", name: "4-4-2", desc: "Classic rigid and solid block" },
  { id: "4-5-1", name: "4-5-1", desc: "Strong midfield control and counter" },
  {
    id: "3-5-2",
    name: "3-5-2",
    desc: "Wing-back domination with double strikers",
  },
  {
    id: "4-1-4-1",
    name: "4-1-4-1",
    desc: "Defensive shield with wide midfielders",
  },
  { id: "3-4-3", name: "3-4-3", desc: "Ultra offensive with three forwards" },
  {
    id: "4-2-3-1",
    name: "4-2-3-1",
    desc: "Modern double pivot with attacking midfielder",
  },
  {
    id: "CUSTOM",
    name: "CUSTOM",
    desc: "Free placement mode with drag and drop for every player",
    isCustom: true,
  },
];

export default function FormationModal({
  isOpen,
  onClose,
  currentFormation,
  onSelectFormation,
}: FormationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-edge/25 w-full max-w-lg p-6 space-y-5 rounded-2xl shadow-2xl relative text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand/10 text-brand rounded-xl border border-brand/20">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">
                Select Tactical Formation
              </h3>
              <p className="text-xs text-muted">
                Choose the structural formation for your starting lineup.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground rounded-xl bg-surface-2 hover:bg-surface border border-edge/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Formações */}
        <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {AVAILABLE_FORMATIONS.map((fmt) => {
            const isSelected = currentFormation === fmt.id;

            return (
              <div
                key={fmt.id}
                onClick={() => {
                  onSelectFormation(fmt.id);
                  onClose();
                }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand/10 border-brand text-foreground shadow-sm"
                    : "bg-surface-2 border-edge/20 hover:border-brand/50 text-foreground"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    {fmt.isCustom && (
                      <Move className="w-4 h-4 text-brand animate-pulse" />
                    )}
                    <span className="text-base font-black tracking-wider text-brand">
                      {fmt.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold bg-brand text-brand-foreground px-2 py-0.5 rounded-full uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">{fmt.desc}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border ${
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
