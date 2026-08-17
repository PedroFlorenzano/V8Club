"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName?: string;
  isOwn: boolean;
  readAt: string | null;
  createdAt: string;
}

interface Props {
  vehicleId: string;
}

export default function ChatSection({ vehicleId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSeller, setIsSeller] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null); // receiverId para vendedor
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    fetchMessages();
    // Polling a cada 5s
    pollInterval.current = setInterval(fetchMessages, 5000);
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (shouldScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setShouldScroll(false);
    }
  }, [messages, shouldScroll]);

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/messages`);
      if (res.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      setIsLoggedIn(true);
      const data = await res.json();
      setMessages(data.messages || []);
      setIsSeller(data.isSeller);
    } catch {
      // silently fail
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage.trim(),
          receiverId: isSeller ? replyTo : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setMessages((prev) => [...prev, data.message]);
      setShouldScroll(true);
      setNewMessage("");
    } catch {
      setError("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "agora";
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  // Agrupar mensagens por remetente (para vendedor ver conversas separadas)
  const conversations = isSeller
    ? messages.reduce((acc, msg) => {
        const otherId = msg.senderId === msg.receiverId ? msg.senderId : (msg.isOwn ? msg.receiverId : msg.senderId);
        if (!acc[otherId]) acc[otherId] = { name: msg.isOwn ? (msg.receiverName || "Comprador") : msg.senderName, messages: [] };
        acc[otherId].messages.push(msg);
        return acc;
      }, {} as Record<string, { name: string; messages: Message[] }>)
    : null;

  // Se não está logado
  if (isLoggedIn === false) {
    return (
      <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-6">
        <h2 className="text-lg font-bold text-white mb-3">💬 Falar com o Vendedor</h2>
        <div className="text-center py-6">
          <p className="text-gray-400 mb-4">Faça login para enviar mensagens ao vendedor</p>
          <a
            href="/login"
            className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold px-6 py-2.5 rounded-lg transition inline-block"
          >
            Fazer Login
          </a>
        </div>
      </div>
    );
  }

  if (isLoggedIn === null) return null; // Loading

  return (
    <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">
          💬 {isSeller ? "Mensagens de Interessados" : "Falar com o Vendedor"}
        </h2>
        {messages.length > 0 && (
          <span className="text-xs text-gray-500">{messages.length} mensagem(ns)</span>
        )}
      </div>

      {/* Aviso anti-contato */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 mb-4 text-xs text-gray-500">
        🔒 Por segurança, dados de contato (telefone, email, redes sociais) são bloqueados nas mensagens.
        Os contatos serão liberados automaticamente após a venda ser concluída.
      </div>

      {/* Vista do vendedor: conversas agrupadas */}
      {isSeller && conversations && Object.keys(conversations).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(conversations).map(([userId, conv]) => (
            <div key={userId} className="border border-[#2a2a2a] rounded-lg overflow-hidden">
              <div
                className={`px-4 py-2 bg-[#0a0a0a] flex items-center justify-between cursor-pointer ${
                  replyTo === userId ? "border-b border-[#d4a853]" : ""
                }`}
                onClick={() => setReplyTo(replyTo === userId ? null : userId)}
              >
                <span className="text-sm font-medium text-white">
                  {conv.name}
                  <span className="text-gray-500 text-xs ml-2">({conv.messages.length} msgs)</span>
                </span>
                <span className="text-xs text-gray-500">
                  {replyTo === userId ? "▲ Responder" : "▼ Abrir"}
                </span>
              </div>
              {replyTo === userId && (
                <div className="p-3 max-h-[200px] overflow-y-auto space-y-2">
                  {conv.messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} timeAgo={timeAgo} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !isSeller ? (
        /* Vista do comprador: chat simples */
        <div className="max-h-[300px] overflow-y-auto space-y-2 mb-4">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              Nenhuma mensagem ainda. Envie uma pergunta ao vendedor!
            </p>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} timeAgo={timeAgo} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-4 mb-4">
          Nenhum interessado enviou mensagem ainda
        </p>
      )}

      {/* Input de mensagem */}
      {((!isSeller) || (isSeller && replyTo)) && (
        <form onSubmit={sendMessage} className="mt-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-red-400 text-xs mb-3">
              ⚠️ {error}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isSeller ? "Responder ao interessado..." : "Envie uma pergunta ao vendedor..."}
              maxLength={1000}
              className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:border-[#d4a853] outline-none"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-gray-700 text-white font-bold px-4 py-2.5 rounded-lg transition text-sm"
            >
              {sending ? "..." : "Enviar"}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5">
            {newMessage.length}/1000 caracteres
          </p>
        </form>
      )}
    </div>
  );
}

function MessageBubble({ msg, timeAgo }: { msg: Message; timeAgo: (d: string) => string }) {
  return (
    <div className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          msg.isOwn
            ? "bg-[#dc2626]/20 border border-[#dc2626]/30"
            : "bg-[#2a2a2a]"
        }`}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-medium ${msg.isOwn ? "text-[#dc2626]" : "text-[#d4a853]"}`}>
            {msg.isOwn ? "Você" : msg.senderName}
          </span>
          <span className="text-[10px] text-gray-600">{timeAgo(msg.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-200">{msg.content}</p>
      </div>
    </div>
  );
}
