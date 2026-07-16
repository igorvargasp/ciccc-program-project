import React from "react";
import { HiMiniArrowLongLeft } from "react-icons/hi2";

interface TermsPageProps {
  onBack: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  return (
    <div
      className="min-h-screen text-[#e2e2e8] flex flex-col items-center p-6 md:p-12 relative overflow-hidden font-['Archivo_Narrow']"
      style={{
        background:
          "radial-gradient(circle, #051429 0%, #0d0f13 60%, #000000 100%)",
      }}
    >
      {/* Header Fixo de Navegação */}
      <header className="fixed top-0 left-0 w-full h-25 flex items-center justify-between px-8 z-50 bg-[#111317]/80 backdrop-blur-md border-b border-[#414755]/30">
        <div className="h-20 flex items-center">
          <img
            src="/aliscorelogo.png"
            alt="Ali Score Logo"
            className="h-full w-auto object-contain"
          />
        </div>

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-[#414755] bg-[#1a1c20]/50 hover:bg-[#1a1c20] text-[#c1c6d7] hover:text-[#00d2fd] hover:border-[#00d2fd] transition-all duration-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">
            <HiMiniArrowLongLeft />
          </span>
          Back to Register
        </button>
      </header>

      {/* Conteúdo dos Termos */}
      <main className="w-full max-w-4xl bg-[#1e2024] border border-[#414755]/80 p-8 md:p-12 shadow-2xl mt-28 mb-12 relative z-10 hover:border-[#00d2fd] transition-colors duration-300">
        <div className="border-b border-[#414755]/40 pb-6 mb-8">
          <span className="text-xs font-bold tracking-widest text-[#00d2fd] uppercase block mb-2">
            LEGAL PROTOCOL
          </span>
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-[#e2e2e8]">
            Terms of Protocol & Privacy Policy
          </h1>
          <p className="text-sm text-[#8b90a0] mt-2">Last updated: July 2026</p>
        </div>

        <div className="space-y-8 text-[#c1c6d7] text-sm md:text-base leading-relaxed">
          {/* Seção 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#e2e2e8] uppercase tracking-wider flex items-center gap-2">
              <span className="text-[#00d2fd]">01.</span> Acceptance of Protocol
            </h2>
            <p>
              By accessing and utilizing the platform, you agree to comply with
              our automated data monitoring and processing frameworks. This
              system acts as a decentralized intelligence engine for sports
              performance tracking.
            </p>
          </section>

          {/* Seção 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#e2e2e8] uppercase tracking-wider flex items-center gap-2">
              <span className="text-[#00d2fd]">02.</span> User Data & Privacy
            </h2>
            <p>
              We respect your privacy. All personalized inputs, including your
              preferred team selections and account information, are securely
              stored and utilized solely to optimize your strategic intelligence
              feeds. We do not sell user data to third-party brokers.
            </p>
          </section>

          {/* Seção 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#e2e2e8] uppercase tracking-wider flex items-center gap-2">
              <span className="text-[#00d2fd]">03.</span> System Access Security
            </h2>
            <p>
              Users are strictly responsible for maintaining the confidentiality
              of their credentials. Any suspicious activity detected under your
              node will result in immediate isolation and verification
              procedures.
            </p>
          </section>
        </div>

        {/* Botão de Ação no Fim */}
        <div className="mt-12 pt-8 border-t border-[#414755]/40 flex justify-end">
          <button
            onClick={onBack}
            className="bg-[#4b8eff] text-[#00285c] hover:bg-[#00d2fd] font-bold px-8 py-3 tracking-widest text-sm transition-all duration-300 rounded-none cursor-pointer uppercase"
          >
            I Acknowledge
          </button>
        </div>
      </main>
    </div>
  );
};
