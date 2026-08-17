"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string;
  verificationStatus: string;
  hasDocuments: boolean;
  hasSelfie: boolean;
}

export default function VerifyPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // File states
  const [docFront, setDocFront] = useState<File | null>(null);
  const [docBack, setDocBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  // Previews
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(file: File | null, type: "front" | "back" | "selfie") {
    if (!file) return;
    
    // Validar tipo
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }
    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setError("");
    const preview = URL.createObjectURL(file);

    switch (type) {
      case "front":
        setDocFront(file);
        setFrontPreview(preview);
        break;
      case "back":
        setDocBack(file);
        setBackPreview(preview);
        break;
      case "selfie":
        setSelfie(file);
        setSelfiePreview(preview);
        break;
    }
  }

  async function uploadDocuments() {
    if (!docFront || !docBack) {
      setError("Envie frente e verso do documento");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("docFront", docFront);
    formData.append("docBack", docBack);

    try {
      const res = await fetch("/api/auth/kyc", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess(data.message);
      setDocFront(null);
      setDocBack(null);
      setFrontPreview(null);
      setBackPreview(null);
      await fetchProfile();
    } catch {
      setError("Erro ao enviar documentos");
    } finally {
      setUploading(false);
    }
  }

  async function uploadSelfie() {
    if (!selfie) {
      setError("Selecione uma selfie");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("selfie", selfie);

    try {
      const res = await fetch("/api/auth/kyc", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess(data.message);
      setSelfie(null);
      setSelfiePreview(null);
      await fetchProfile();
    } catch {
      setError("Erro ao enviar selfie");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  // Status completions
  const steps = [
    { id: 1, label: "Cadastro", done: true },
    { id: 2, label: "Documentos", done: user.hasDocuments },
    { id: 3, label: "Selfie", done: user.hasSelfie },
    { id: 4, label: "Verificado", done: user.verificationStatus === "verified" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Verificação de Identidade</h1>
          <p className="text-gray-400">
            Complete as etapas abaixo para poder fazer ofertas no V8 Club
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-10 px-4">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    step.done
                      ? "bg-[#d4a853] text-black"
                      : "bg-[#2a2a2a] text-gray-500"
                  }`}
                >
                  {step.done ? "✓" : step.id}
                </div>
                <span className={`text-xs mt-1.5 ${step.done ? "text-[#d4a853]" : "text-gray-500"}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${step.done ? "bg-[#d4a853]" : "bg-[#2a2a2a]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Status Badge */}
        {user.verificationStatus === "verified" && (
          <div className="bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-xl p-6 text-center mb-8">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-[#d4a853] mb-2">Conta Verificada</h2>
            <p className="text-gray-400">
              Você pode fazer ofertas e vender veículos no marketplace.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold px-6 py-2 rounded-lg transition"
            >
              Ir para o V8 Club
            </Link>
          </div>
        )}

        {user.verificationStatus === "pending_review" && (
          <div className="bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-xl p-6 text-center mb-8">
            <div className="text-4xl mb-3">⏳</div>
            <h2 className="text-xl font-bold text-[#d4a853] mb-2">Em Análise</h2>
            <p className="text-gray-400">
              Seus documentos estão sendo revisados. Isso geralmente leva até 24 horas.
            </p>
          </div>
        )}

        {user.verificationStatus === "rejected" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center mb-8">
            <div className="text-4xl mb-3">❌</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Verificação Recusada</h2>
            <p className="text-gray-400">
              Seus documentos foram rejeitados. Você pode reenviar abaixo.
            </p>
          </div>
        )}

        {/* Mensagens */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-6">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm mb-6">
            ✓ {success}
          </div>
        )}

        {/* Seção de Documentos */}
        {(user.verificationStatus === "unverified" ||
          user.verificationStatus === "pending_docs" ||
          user.verificationStatus === "rejected") && (
          <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-1">📄 Documento de Identidade</h2>
            <p className="text-sm text-gray-400 mb-5">
              Envie fotos legíveis da sua CNH (frente e verso). Aceito: RG ou CNH.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Frente */}
              <div
                onClick={() => frontRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[180px] transition hover:border-[#d4a853] ${
                  frontPreview ? "border-green-500" : "border-[#2a2a2a]"
                }`}
              >
                {frontPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={frontPreview} alt="Frente" className="max-h-[140px] rounded object-contain" />
                ) : (
                  <>
                    <span className="text-3xl mb-2">📷</span>
                    <span className="text-sm text-gray-400 text-center">Frente do documento</span>
                  </>
                )}
                <input
                  ref={frontRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null, "front")}
                />
              </div>

              {/* Verso */}
              <div
                onClick={() => backRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[180px] transition hover:border-[#d4a853] ${
                  backPreview ? "border-green-500" : "border-[#2a2a2a]"
                }`}
              >
                {backPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={backPreview} alt="Verso" className="max-h-[140px] rounded object-contain" />
                ) : (
                  <>
                    <span className="text-3xl mb-2">📷</span>
                    <span className="text-sm text-gray-400 text-center">Verso do documento</span>
                  </>
                )}
                <input
                  ref={backRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null, "back")}
                />
              </div>
            </div>

            {/* Dicas */}
            <div className="bg-[#0a0a0a] rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500">
                💡 <strong className="text-gray-400">Dicas:</strong> Foto com boa iluminação, sem reflexos,
                todos os dados legíveis, sem cortes. Formatos: JPG, PNG ou WebP (máx 10MB).
              </p>
            </div>

            <button
              onClick={uploadDocuments}
              disabled={!docFront || !docBack || uploading}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
            >
              {uploading ? "Enviando..." : "Enviar Documentos"}
            </button>
          </div>
        )}

        {/* Seção de Selfie */}
        {(user.verificationStatus === "pending_selfie" || user.verificationStatus === "rejected") && (
          <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-1">🤳 Selfie de Verificação</h2>
            <p className="text-sm text-gray-400 mb-5">
              Tire uma selfie mostrando seu rosto claramente. Será comparada com a foto do documento.
            </p>

            <div
              onClick={() => selfieRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[220px] transition hover:border-[#d4a853] ${
                selfiePreview ? "border-green-500" : "border-[#2a2a2a]"
              }`}
            >
              {selfiePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selfiePreview} alt="Selfie" className="max-h-[180px] rounded object-contain" />
              ) : (
                <>
                  <span className="text-5xl mb-3">🤳</span>
                  <span className="text-sm text-gray-400">Clique para selecionar sua selfie</span>
                  <span className="text-xs text-gray-600 mt-1">ou tire uma foto pela câmera</span>
                </>
              )}
              <input
                ref={selfieRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null, "selfie")}
              />
            </div>

            {/* Dicas selfie */}
            <div className="bg-[#0a0a0a] rounded-lg p-3 mt-4 mb-4">
              <p className="text-xs text-gray-500">
                💡 <strong className="text-gray-400">Dicas:</strong> Rosto centralizado, boa iluminação,
                sem óculos escuros, sem chapéu/boné, fundo neutro.
              </p>
            </div>

            <button
              onClick={uploadSelfie}
              disabled={!selfie || uploading}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
            >
              {uploading ? "Enviando..." : "Enviar Selfie"}
            </button>
          </div>
        )}

        {/* Documentos já enviados */}
        {user.hasDocuments && user.verificationStatus !== "pending_docs" && user.verificationStatus !== "unverified" && (
          <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-sm text-gray-300">Documentos enviados</span>
            </div>
          </div>
        )}

        {user.hasSelfie && user.verificationStatus !== "pending_selfie" && (
          <div className="bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] p-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-sm text-gray-300">Selfie enviada</span>
            </div>
          </div>
        )}

        {/* Segurança */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            🔒 Seus documentos são armazenados de forma segura e acessados apenas para verificação.
            <br />Em conformidade com a LGPD (Lei 13.709/2018).
          </p>
        </div>
      </div>
    </div>
  );
}
