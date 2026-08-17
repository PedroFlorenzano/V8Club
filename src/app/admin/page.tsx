"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  verificationStatus: string;
  docFrontUrl: string | null;
  docBackUrl: string | null;
  selfieUrl: string | null;
  createdAt: string;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  verificationStatus: string;
  verifiedAt: string;
  verificationNote: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [recent, setRecent] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setPending(data.pending || []);
      setRecent(data.recent || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(userId: string, action: "approve" | "reject") {
    setActionLoading(userId);
    setMessage("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, note }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setSelectedUser(null);
        setNote("");
        await fetchUsers();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400">Carregando painel admin...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Painel Admin — Verificação KYC</h1>
            <p className="text-gray-400 text-sm mt-1">
              Revise documentos e aprove/rejeite identidades
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#d4a853]/10 text-[#d4a853] text-sm font-medium px-3 py-1.5 rounded-full">
              {pending.filter(u => u.verificationStatus === "pending_review").length} pendente(s)
            </span>
          </div>
        </div>

        {/* Success message */}
        {message && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm mb-6">
            ✓ {message}
          </div>
        )}

        {/* Usuários pendentes */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4">Pendentes de Revisão</h2>
          
          {pending.length === 0 ? (
            <div className="bg-[#1c1c1c] rounded-lg border border-[#2a2a2a] p-8 text-center text-gray-500">
              Nenhum usuário pendente de revisão
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((user) => (
                <div
                  key={user.id}
                  className={`bg-[#1c1c1c] rounded-lg border p-5 transition ${
                    selectedUser?.id === user.id ? "border-[#d4a853]" : "border-[#2a2a2a]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold">{user.name}</h3>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {user.cpf && <span>CPF: ***.***.{user.cpf.slice(6, 9)}-**</span>}
                        {user.phone && <span>Tel: {user.phone}</span>}
                        <span>
                          Cadastro: {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {/* Status */}
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          user.verificationStatus === "pending_review"
                            ? "bg-[#d4a853]/10 text-[#d4a853]"
                            : "bg-gray-700 text-gray-400"
                        }`}>
                          {user.verificationStatus === "pending_review" && "Pronto para revisão"}
                          {user.verificationStatus === "pending_selfie" && "Aguardando selfie"}
                          {user.verificationStatus === "pending_docs" && "Aguardando documentos"}
                        </span>
                      </div>
                    </div>

                    {/* Botão ver docs */}
                    {user.verificationStatus === "pending_review" && (
                      <button
                        onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                        className="bg-[#2a2a2a] hover:bg-[#333] text-white text-sm px-4 py-2 rounded-lg transition"
                      >
                        {selectedUser?.id === user.id ? "Fechar" : "📄 Ver Documentos"}
                      </button>
                    )}
                  </div>

                  {/* Painel de documentos expandido */}
                  {selectedUser?.id === user.id && (
                    <div className="mt-5 pt-5 border-t border-[#2a2a2a]">
                      <div className="grid grid-cols-3 gap-4 mb-5">
                        {/* CNH Frente */}
                        <div>
                          <p className="text-xs text-gray-500 mb-2">📄 CNH Frente</p>
                          {user.docFrontUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.docFrontUrl}
                              alt="CNH Frente"
                              className="w-full rounded-lg border border-[#2a2a2a] object-cover max-h-[200px]"
                            />
                          ) : (
                            <div className="bg-[#0a0a0a] rounded-lg h-[200px] flex items-center justify-center text-gray-600 text-sm">
                              Não enviado
                            </div>
                          )}
                        </div>

                        {/* CNH Verso */}
                        <div>
                          <p className="text-xs text-gray-500 mb-2">📄 CNH Verso</p>
                          {user.docBackUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.docBackUrl}
                              alt="CNH Verso"
                              className="w-full rounded-lg border border-[#2a2a2a] object-cover max-h-[200px]"
                            />
                          ) : (
                            <div className="bg-[#0a0a0a] rounded-lg h-[200px] flex items-center justify-center text-gray-600 text-sm">
                              Não enviado
                            </div>
                          )}
                        </div>

                        {/* Selfie */}
                        <div>
                          <p className="text-xs text-gray-500 mb-2">🤳 Selfie</p>
                          {user.selfieUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.selfieUrl}
                              alt="Selfie"
                              className="w-full rounded-lg border border-[#2a2a2a] object-cover max-h-[200px]"
                            />
                          ) : (
                            <div className="bg-[#0a0a0a] rounded-lg h-[200px] flex items-center justify-center text-gray-600 text-sm">
                              Não enviado
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Checklist manual */}
                      <div className="bg-[#0a0a0a] rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-300 font-medium mb-2">Checklist de verificação:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="accent-[#d4a853]" />
                            Documento legível
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="accent-[#d4a853]" />
                            Documento não vencido
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="accent-[#d4a853]" />
                            Nome bate com cadastro
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="accent-[#d4a853]" />
                            Selfie bate com foto do doc
                          </label>
                        </div>
                      </div>

                      {/* Nota */}
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Nota opcional (visível em caso de rejeição)..."
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white text-sm placeholder-gray-600 focus:border-[#d4a853] outline-none mb-4 resize-none"
                        rows={2}
                      />

                      {/* Botões de ação */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAction(user.id, "approve")}
                          disabled={actionLoading === user.id}
                          className="flex-1 bg-[#d4a853] hover:bg-[#e8c76a] disabled:bg-gray-700 text-black font-bold py-2.5 rounded-lg transition"
                        >
                          {actionLoading === user.id ? "..." : "✓ Aprovar Verificação"}
                        </button>
                        <button
                          onClick={() => handleAction(user.id, "reject")}
                          disabled={actionLoading === user.id}
                          className="flex-1 bg-[#2a2a2a] hover:bg-[#333] disabled:bg-gray-700 text-red-400 font-bold py-2.5 rounded-lg transition"
                        >
                          {actionLoading === user.id ? "..." : "✗ Rejeitar"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico recente */}
        {recent.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Histórico Recente</h2>
            <div className="bg-[#1c1c1c] rounded-lg border border-[#2a2a2a] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#0a0a0a]">
                  <tr>
                    <th className="text-left text-gray-500 font-medium px-4 py-3">Nome</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-3">Email</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-3">Status</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-3">Data</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-3">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {recent.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 text-white">{u.name}</td>
                      <td className="px-4 py-3 text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          u.verificationStatus === "verified"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}>
                          {u.verificationStatus === "verified" ? "Aprovado" : "Rejeitado"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(u.verifiedAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.verificationNote || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
