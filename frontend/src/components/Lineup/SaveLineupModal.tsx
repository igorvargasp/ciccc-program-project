"use client";

import React, { useState } from "react";

interface SaveLineupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, formation: string) => void;
  currentFormation: string;
}

export default function SaveLineupModal({
  isOpen,
  onClose,
  onSave,
  currentFormation,
}: SaveLineupModalProps) {
  const [title, setTitle] = useState("");
  const [shareableLink, setShareableLink] = useState("");

  if (!isOpen) return null;

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title, currentFormation);
    setShareableLink(
      `https://operatorsystem.app/lineup/share/${Math.random().toString(36).substring(7)}`,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-[#14171c] border border-[#00d2fd]/30 rounded-xl p-6 shadow-2xl flex flex-col space-y-6">
        <div className="flex items-center justify-between border-b border-[#414755]/30 pb-4">
          <span className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em]">
            Save & Share Dream Team
          </span>
          <button
            onClick={onClose}
            className="text-[#8b90a0] hover:text-[#e2e2e8] cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {!shareableLink ? (
          <form onSubmit={handleSaveAction} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider mb-2">
                Lineup Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Galácticos 2026"
                className="w-full p-3 bg-[#0d0f12] border border-[#414755]/30 focus:border-[#00d2fd] text-xs text-[#e2e2e8] rounded outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider mb-2">
                Selected Formation
              </label>
              <input
                type="text"
                value={currentFormation}
                disabled
                className="w-full p-3 bg-[#0d0f12]/50 border border-[#414755]/20 text-xs text-[#8b90a0] rounded uppercase tracking-widest cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#00d2fd] hover:bg-[#00b5df] text-[#0d0f12] text-xs font-black uppercase tracking-widest rounded transition-all cursor-pointer shadow-lg"
            >
              Generate Share Link
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-xs text-[#e2e2e8]">
              Your dream team has been successfully saved! Share the link below:
            </p>
            <input
              type="text"
              value={shareableLink}
              readOnly
              className="w-full p-3 bg-[#0d0f12] border border-[#00d2fd]/50 text-xs text-[#00d2fd] rounded text-center select-all"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareableLink);
                alert("Link copied to clipboard!");
              }}
              className="w-full py-3 bg-[#00d2fd] hover:bg-[#00b5df] text-[#0d0f12] text-xs font-black uppercase tracking-widest rounded transition-all cursor-pointer"
            >
              Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
