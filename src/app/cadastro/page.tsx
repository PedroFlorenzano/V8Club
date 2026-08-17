"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function validateCPFLocal(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10) rem = 0;
  if (rem !== parseInt(cleaned[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10) rem = 0;
  if (rem !== parseInt(cleaned[10])) return false;
  return true;
}

function maskCPF(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

function maskPhone(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 11);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validações em tempo real
  const passwordStrength = (): { score: number; label: string; color: string } => {
    const p = form.password;
    if (!p) return { score: 0, label: "", color: "" };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { score, label: "Fraca", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Média", color: "bg-yellow-500" };
    return { score, label: "Forte", color: "bg-green-500" };
  };

  const cpfValid = form.cpf.replace(/\D/g, "").length === 11 ? validateCPFLocal(form.cpf) : null;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nome é obrigatório";
    if (!form.email.trim()) errs.email = "Email é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email inválido";
    if (!form.password) errs.password = "Senha é obrigatória";
    else {
      if (form.password.length < 8) errs.password = "Mínimo 8 caracteres";
      else if (!/[A-Z]/.test(form.password)) errs.password = "Precisa de letra maiúscula";
      else if (!/[a-z]/.test(form.password)) errs.password = "Precisa de letra minúscula";
      else if (!/\d/.test(form.password)) errs.password = "Precisa de número";
    }
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Senhas não conferem";
    if (form.cpf && !validateCPFLocal(form.cpf)) errs.cpf = "CPF inválido";
    if (form.phone) {
      const phoneClean = form.phone.replace(/\D/g, "");
      if (phoneClean.length < 10 || phoneClean.length > 11) errs.phone = "Telefone inválido";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          cpf: form.cpf || undefined,
          phone: form.phone || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Erro ao criar conta");
        return;
      }

      // Sucesso — redirecionar para verificação ou home
      if (form.cpf) {
        router.push("/verificar");
      } else {
        router.push("/");
      }
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
          <p className="text-gray-400">
            Junte-se ao V8 Club — o clube dos carros especiais do Brasil
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nome completo *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#d4a853] focus:ring-1 focus:ring-[#d4a853] outline-none transition"
                placeholder="Seu nome completo"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#d4a853] focus:ring-1 focus:ring-[#d4a853] outline-none transition"
                placeholder="seu@email.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                CPF
                <span className="text-gray-500 font-normal ml-1">(necessário para ofertas)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                  className={`w-full bg-[#0a0a0a] border rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none transition ${
                    cpfValid === true
                      ? "border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      : cpfValid === false
                      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-[#2a2a2a] focus:border-[#d4a853] focus:ring-1 focus:ring-[#d4a853]"
                  }`}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                {cpfValid === true && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                )}
                {cpfValid === false && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">✗</span>
                )}
              </div>
              {errors.cpf && <p className="text-red-400 text-xs mt-1">{errors.cpf}</p>}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Telefone
                <span className="text-gray-500 font-normal ml-1">(com DDD)</span>
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#d4a853] focus:ring-1 focus:ring-[#d4a853] outline-none transition"
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Senha *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-600 focus:border-[#d4a853] focus:ring-1 focus:ring-[#d4a853] outline-none transition"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all`}
                        style={{ width: `${(strength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs ${
                      strength.score <= 2 ? "text-red-400" : strength.score <= 3 ? "text-yellow-400" : "text-green-400"
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Use maiúscula, minúscula, número e caractere especial
                  </p>
                </div>
              )}
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirmar senha *
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className={`w-full bg-[#0a0a0a] border rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none transition ${
                  form.confirmPassword && form.confirmPassword === form.password
                    ? "border-green-500"
                    : form.confirmPassword && form.confirmPassword !== form.password
                    ? "border-red-500"
                    : "border-[#2a2a2a] focus:border-[#d4a853] focus:ring-1 focus:ring-[#d4a853]"
                }`}
                placeholder="Repita a senha"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Erro do servidor */}
            {serverError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                ⚠️ {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition text-lg"
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>

          {/* Info KYC */}
          <div className="mt-6 p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
            <h4 className="text-sm font-semibold text-[#d4a853] mb-2">🔒 Verificação de Identidade</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Para fazer ofertas, você precisará verificar sua identidade enviando foto da CNH 
              (frente e verso) e uma selfie. Isso garante a segurança de compradores e vendedores.
            </p>
          </div>

          {/* Link login */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-[#d4a853] hover:text-[#e8c76a] font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
