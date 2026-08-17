"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf: string | null;
  cpfMasked: string | null;
  phone: string | null;
  verificationStatus: string;
  verifiedAt: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  cardType: string | null;
  cardExpiry: string | null;
  cardHolderName: string | null;
  hasCard: boolean;
  createdAt: string;
  _count: { vehicles: number; bids: number };
}

const BRAND_ICONS: Record<string, string> = {
  visa: "💳 Visa",
  mastercard: "💳 Mastercard",
  elo: "💳 Elo",
  amex: "💳 Amex",
  hipercard: "💳 Hipercard",
  outro: "💳 Cartão",
};

const VERIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  unverified: { label: "Não verificado", color: "text-gray-400" },
  pending_docs: { label: "Aguardando documentos", color: "text-yellow-400" },
  pending_selfie: { label: "Aguardando selfie", color: "text-yellow-400" },
  pending_review: { label: "Em análise", color: "text-blue-400" },
  verified: { label: "Verificado ✓", color: "text-green-400" },
  rejected: { label: "Rejeitado", color: "text-red-400" },
};

function formatPhone(phone: string): string {
  if (phone.length === 11) return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

function maskCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 16);
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(" ") : cleaned;
}

function maskExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 4);
  if (cleaned.length > 2) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  return cleaned;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<"info" | "card" | "password">("info");

  // Editar perfil
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Cartão
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardType, setCardType] = useState<"credit" | "debit">("credit");
  const [cardSaving, setCardSaving] = useState(false);
  const [cardMsg, setCardMsg] = useState("");
  const [cardError, setCardError] = useState("");

  // Senha
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState("");

  useEffect(() => {
    fetchAccount();
  }, []);

  async function fetchAccount() {
    try {
      const res = await fetch("/api/account");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setEditName(data.user.name);
      setEditPhone(data.user.phone ? formatPhone(data.user.phone) : "");
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      const data = await res.json();
      setSaveMsg(res.ok ? "✓ Dados salvos" : data.error);
      if (res.ok) await fetchAccount();
    } catch {
      setSaveMsg("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function saveCard() {
    setCardSaving(true);
    setCardError("");
    setCardMsg("");
    try {
      const res = await fetch("/api/account/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber: cardNumber.replace(/\s/g, ""),
          cardExpiry,
          cardHolderName: cardHolder,
          cardType,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCardMsg("✓ Cartão vinculado com sucesso");
        setCardNumber("");
        setCardExpiry("");
        setCardHolder("");
        await fetchAccount();
      } else {
        setCardError(data.error);
      }
    } catch {
      setCardError("Erro ao vincular cartão");
    } finally {
      setCardSaving(false);
    }
  }

  async function removeCard() {
    if (!confirm("Tem certeza que deseja remover o cartão vinculado?")) return;
    try {
      await fetch("/api/account/card", { method: "DELETE" });
      await fetchAccount();
    } catch {
      // ignore
    }
  }

  async function changePassword() {
    setPassSaving(true);
    setPassMsg("");
    if (newPass !== confirmPass) {
      setPassMsg("⚠️ Senhas não conferem");
      setPassSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json();
      setPassMsg(res.ok ? "✓ Senha alterada com sucesso" : `⚠️ ${data.error}`);
      if (res.ok) {
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
      }
    } catch {
      setPassMsg("Erro ao alterar senha");
    } finally {
      setPassSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  const verification = VERIFICATION_LABELS[user.verificationStatus] || VERIFICATION_LABELS.unverified;

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#dc2626] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-gray-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs font-medium ${verification.color}`}>
                  {verification.label}
                </span>
                <span className="text-xs text-gray-600">
                  Membro desde {new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 text-sm border border-[#2a2a2a] px-4 py-2 rounded-lg transition"
          >
            Sair
          </button>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1c1c1c] rounded-lg border border-[#2a2a2a] p-4 text-center">
            <div className="text-2xl font-bold text-white">{user._count.vehicles}</div>
            <div className="text-xs text-gray-500">Veículos</div>
          </div>
          <div className="bg-[#1c1c1c] rounded-lg border border-[#2a2a2a] p-4 text-center">
            <div className="text-2xl font-bold text-white">{user._count.bids}</div>
            <div className="text-xs text-gray-500">Ofertas</div>
          </div>
          <div className="bg-[#1c1c1c] rounded-lg border border-[#2a2a2a] p-4 text-center">
            <div className={`text-2xl font-bold ${user.hasCard ? "text-green-400" : "text-gray-600"}`}>
              {user.hasCard ? "✓" : "—"}
            </div>
            <div className="text-xs text-gray-500">Cartão</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1c1c1c] rounded-lg p-1 mb-6 border border-[#2a2a2a]">
          {[
            { key: "info", label: "Dados Pessoais" },
            { key: "card", label: "Cartão Vinculado" },
            { key: "password", label: "Segurança" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setSection(t.key as typeof section)}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition ${
                section === t.key ? "bg-[#dc2626] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dados Pessoais */}
        {section === "info" && (
          <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-6">
            <h2 className="text-lg font-bold text-white mb-5">Dados Pessoais</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-600 mt-1">O email não pode ser alterado</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">CPF</label>
                <input
                  type="text"
                  value={user.cpfMasked || "Não informado"}
                  disabled
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Telefone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Verificação</label>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${verification.color}`}>
                    {verification.label}
                  </span>
                  {user.verificationStatus !== "verified" && (
                    <Link href="/verificar" className="text-xs text-[#d4a853] hover:text-[#e8c76a]">
                      Verificar agora →
                    </Link>
                  )}
                </div>
              </div>

              {saveMsg && (
                <p className={`text-sm ${saveMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                  {saveMsg}
                </p>
              )}

              <button
                onClick={saveProfile}
                disabled={saving}
                className="bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-gray-700 text-white font-bold px-6 py-2.5 rounded-lg transition"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        )}

        {/* Cartão Vinculado */}
        {section === "card" && (
          <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-6">
            <h2 className="text-lg font-bold text-white mb-2">Cartão Vinculado</h2>
            <p className="text-sm text-gray-400 mb-5">
              Seu cartão é usado para cobrar a taxa de 5% quando uma oferta sua é aceita pelo vendedor.
            </p>

            {/* Cartão atual */}
            {user.hasCard ? (
              <div className="mb-6">
                <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-[#2a2a4a] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs text-gray-400 uppercase">
                      {user.cardType === "credit" ? "Crédito" : "Débito"}
                    </span>
                    <span className="text-sm text-gray-300 font-medium">
                      {BRAND_ICONS[user.cardBrand || "outro"]}
                    </span>
                  </div>
                  <div className="text-xl font-mono text-white tracking-wider mb-4">
                    •••• •••• •••• {user.cardLast4}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase">Titular</div>
                      <div className="text-sm text-gray-300">{user.cardHolderName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase">Validade</div>
                      <div className="text-sm text-gray-300">{user.cardExpiry}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={removeCard}
                  className="mt-3 text-sm text-red-400 hover:text-red-300 transition"
                >
                  Remover cartão
                </button>
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-dashed border-[#2a2a2a] rounded-xl p-6 mb-6 text-center">
                <p className="text-gray-500 mb-1">Nenhum cartão vinculado</p>
                <p className="text-xs text-gray-600">
                  Vincule um cartão para poder fazer ofertas
                </p>
              </div>
            )}

            {/* Formulário de novo cartão */}
            <div className="border-t border-[#2a2a2a] pt-5">
              <h3 className="text-sm font-bold text-white mb-4">
                {user.hasCard ? "Trocar cartão" : "Vincular cartão"}
              </h3>

              <div className="space-y-4">
                {/* Tipo */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tipo</label>
                  <div className="flex gap-3">
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                        cardType === "credit" ? "border-[#dc2626] bg-[#dc2626]/5" : "border-[#2a2a2a]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cardType"
                        value="credit"
                        checked={cardType === "credit"}
                        onChange={() => setCardType("credit")}
                        className="sr-only"
                      />
                      <span className="text-sm text-white">💳 Crédito</span>
                    </label>
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                        cardType === "debit" ? "border-[#dc2626] bg-[#dc2626]/5" : "border-[#2a2a2a]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cardType"
                        value="debit"
                        checked={cardType === "debit"}
                        onChange={() => setCardType("debit")}
                        className="sr-only"
                      />
                      <span className="text-sm text-white">🏧 Débito</span>
                    </label>
                  </div>
                </div>

                {/* Número */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Número do cartão</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white font-mono focus:border-[#d4a853] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Validade */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Validade</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(maskExpiry(e.target.value))}
                      placeholder="MM/AA"
                      maxLength={5}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white font-mono focus:border-[#d4a853] outline-none"
                    />
                  </div>

                  {/* Nome */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome no cartão</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="NOME SOBRENOME"
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white uppercase focus:border-[#d4a853] outline-none"
                    />
                  </div>
                </div>

                {cardError && <p className="text-sm text-red-400">⚠️ {cardError}</p>}
                {cardMsg && <p className="text-sm text-green-400">{cardMsg}</p>}

                <button
                  onClick={saveCard}
                  disabled={cardSaving || !cardNumber || !cardExpiry || !cardHolder}
                  className="w-full bg-[#d4a853] hover:bg-[#e8c76a] disabled:bg-gray-700 text-black font-bold py-3 rounded-lg transition"
                >
                  {cardSaving ? "Vinculando..." : "Vincular Cartão"}
                </button>

                <p className="text-[10px] text-gray-600 text-center">
                  🔒 Seus dados são armazenados de forma segura. Em produção, usamos tokenização
                  via gateway de pagamento (nunca salvamos o número completo).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Segurança */}
        {section === "password" && (
          <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-6">
            <h2 className="text-lg font-bold text-white mb-5">Alterar Senha</h2>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Senha atual</label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nova senha</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] outline-none"
                />
              </div>

              {passMsg && (
                <p className={`text-sm ${passMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                  {passMsg}
                </p>
              )}

              <button
                onClick={changePassword}
                disabled={passSaving || !currentPass || !newPass}
                className="bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-gray-700 text-white font-bold px-6 py-2.5 rounded-lg transition"
              >
                {passSaving ? "Alterando..." : "Alterar Senha"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
