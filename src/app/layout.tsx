import type { Metadata } from "next";
import "./globals.css";
import HeaderAuth from "@/components/HeaderAuth";

export const metadata: Metadata = {
  title: "V8 Club - Marketplace de Carros Entusiastas",
  description:
    "O clube brasileiro de carros especiais, esportivos e clássicos com curadoria por IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0a0a0a] text-white min-h-screen">
        {/* Header */}
        <header className="bg-[#111111] border-b border-[#2a2a2a]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo + Nav */}
              <div className="flex items-center gap-8">
                <a href="/" className="flex items-center">
                  <span className="text-2xl font-black tracking-tight">
                    V8<span className="text-[#dc2626]"> Club</span>
                  </span>
                </a>
                <nav className="hidden md:flex items-center gap-1">
                  <a
                    href="/"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-white/5 transition"
                  >
                    Ofertas
                  </a>
                  <a
                    href="/submit"
                    className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 text-sm font-semibold rounded-md transition"
                  >
                    Vender um Carro
                  </a>
                  <a
                    href="/observando"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-white/5 transition"
                  >
                    Observando
                  </a>
                  <a
                    href="/resultados"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-white/5 transition"
                  >
                    Resultados
                  </a>
                  <a
                    href="/sobre"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-white/5 transition"
                  >
                    Sobre
                  </a>
                </nav>
              </div>

              {/* Search + Sign Up */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center bg-[#1c1c1c] border border-[#2a2a2a] rounded-md px-3 py-2 w-72">
                  <svg
                    className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar carros (ex: Porsche, BMW, Golf)"
                    className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
                  />
                </div>
                <HeaderAuth />
              </div>
            </div>
          </div>
        </header>

        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-[#111111] border-t border-[#2a2a2a] mt-16 py-10">
          <div className="max-w-[1400px] mx-auto px-4 text-center">
            <div className="text-2xl font-black mb-3">
              V8<span className="text-[#dc2626]"> Club</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2026 V8 Club — O clube dos carros entusiastas do Brasil
            </p>
            <p className="mt-1 text-xs text-gray-700">
              Marketplace de ofertas entre particulares. Intermediação
              tecnológica apenas.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
