"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Preencha email e senha");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao fazer login");
        return;
      }

      // Redirecionar baseado no status de verificação
      if (data.user.verificationStatus === "unverified" || data.user.verificationStatus === "pending_docs") {
        router.push("/verificar");
      } else {
        router.push("/");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Entrar</h1>
          <p className="text-gray-400">Acesse sua conta no V8 Club</p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#d4a853] focus:ring-1 focus:ring-[#d4a853] outline-none transition"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#d4a853] focus:ring-1 focus:ring-[#d4a853] outline-none transition"
                placeholder="Sua senha"
                autoComplete="current-password"
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition text-lg"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-400 text-sm">
              Não tem conta?{" "}
              <Link href="/cadastro" className="text-[#d4a853] hover:text-[#e8c76a] font-medium">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
