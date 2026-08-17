"use client";

import { useState } from "react";

interface CurationResult {
  approved: boolean;
  score: number;
  reason: string;
  tags: string[];
  fipePrice?: number;
  marketAnalysis: string;
  suggestions?: string[];
}

export default function SubmitPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    vehicle: { id: string };
    curation: CurationResult;
  } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const form = new FormData(e.currentTarget);
    const data = {
      brand: form.get("brand"),
      model: form.get("model"),
      year: parseInt(form.get("year") as string),
      version: form.get("version"),
      color: form.get("color"),
      mileage: parseInt(form.get("mileage") as string) || 0,
      fuel: form.get("fuel"),
      transmission: form.get("transmission"),
      title: form.get("title"),
      description: form.get("description"),
      highlights: form.get("highlights"),
      startingBid: Math.round(parseFloat(form.get("startingBid") as string || "0") * 100),
      reservePrice: form.get("reservePrice")
        ? Math.round(parseFloat(form.get("reservePrice") as string) * 100)
        : null,
      sellerId: "placeholder",
    };

    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "vendedor@teste.com", password: "123456" }),
      });

      if (loginRes.ok) {
        const user = await loginRes.json();
        data.sellerId = user.id;
      } else {
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Vendedor Teste",
            email: "vendedor@teste.com",
            password: "123456",
          }),
        });
        if (regRes.ok) {
          const user = await regRes.json();
          data.sellerId = user.id;
        }
      }

      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao submeter");
      }

      const json = await res.json();
      setResult(json);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#1a2332] to-[#1a1a1a] py-16 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Venda seu carro para quem{" "}
            <span className="text-[#dc2626]">entende o valor dele</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Nossa IA analisa seu veículo em segundos. Sem esperar dias por aprovação.
            Curadoria inteligente para garantir que seu carro esteja na vitrine certa.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#dc2626] text-lg">🤖</span>
              <span className="text-gray-300">Análise por IA em segundos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#dc2626] text-lg">💰</span>
              <span className="text-gray-300">100% do valor é seu</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#dc2626] text-lg">🎯</span>
              <span className="text-gray-300">Público entusiasta</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - estilo C&B */}
      {step === 1 && !result && (
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Como funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { icon: "📝", title: "Envie os dados", desc: "Preencha marca, modelo, ano e fotos do seu carro" },
              { icon: "🤖", title: "IA analisa", desc: "Nossa curadoria por IA avalia desejabilidade e mercado em segundos" },
              { icon: "✅", title: "Aprovação instantânea", desc: "Se aprovado, seu anúncio vai ao ar com período de ofertas de 7 dias" },
              { icon: "💸", title: "Receba o pagamento", desc: "Venda concluída, você recebe 100% do valor" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-[#1c1c1c] rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                  {item.icon}
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-gray-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep(2)}
              className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold px-8 py-3 rounded-lg text-lg transition"
            >
              Submeter Meu Carro
            </button>
            <p className="text-gray-600 text-xs mt-3">
              Gratuito · Sem compromisso · Leva 3 minutos
            </p>
          </div>
        </section>
      )}

      {/* Formulário - Step 2 */}
      {step === 2 && !result && (
        <section className="max-w-3xl mx-auto px-4 py-8">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#dc2626] rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <span className="text-white text-sm font-medium">Dados</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-sm font-bold">2</div>
              <span className="text-gray-500 text-sm">Fotos</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-sm font-bold">3</div>
              <span className="text-gray-500 text-sm">Resultado IA</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados do veículo */}
            <div className="bg-[#1c1c1c] rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Dados do Veículo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="brand" className="block text-sm text-gray-400 mb-1">Marca *</label>
                  <input id="brand" name="brand" type="text" required placeholder="Ex: Volkswagen"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none" />
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm text-gray-400 mb-1">Modelo *</label>
                  <input id="model" name="model" type="text" required placeholder="Ex: Golf GTI"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label htmlFor="year" className="block text-sm text-gray-400 mb-1">Ano *</label>
                  <input id="year" name="year" type="number" required min="1950" max="2026" placeholder="2015"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none" />
                </div>
                <div>
                  <label htmlFor="version" className="block text-sm text-gray-400 mb-1">Versão</label>
                  <input id="version" name="version" type="text" placeholder="Ex: MK7 2.0 TSI"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none" />
                </div>
                <div>
                  <label htmlFor="mileage" className="block text-sm text-gray-400 mb-1">Quilometragem</label>
                  <input id="mileage" name="mileage" type="number" min="0" placeholder="58000"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label htmlFor="color" className="block text-sm text-gray-400 mb-1">Cor</label>
                  <input id="color" name="color" type="text" placeholder="Branco"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none" />
                </div>
                <div>
                  <label htmlFor="fuel" className="block text-sm text-gray-400 mb-1">Combustível</label>
                  <select id="fuel" name="fuel" className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none">
                    <option>Gasolina</option><option>Etanol</option><option>Flex</option><option>Diesel</option><option>Elétrico</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="transmission" className="block text-sm text-gray-400 mb-1">Câmbio</label>
                  <select id="transmission" name="transmission" className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none">
                    <option>Manual</option><option>Automático</option><option>CVT</option><option>Automatizado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Anúncio */}
            <div className="bg-[#1c1c1c] rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Sobre o Carro</h3>
              <div>
                <label htmlFor="title" className="block text-sm text-gray-400 mb-1">Título do anúncio *</label>
                <input id="title" name="title" type="text" required placeholder="Ex: VW Golf GTI MK7 Manual - Único Dono"
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none" />
              </div>
              <div className="mt-4">
                <label htmlFor="description" className="block text-sm text-gray-400 mb-1">Descrição *</label>
                <textarea id="description" name="description" required rows={5}
                  placeholder="Descreva o histórico, condição, manutenções, modificações..."
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none" />
              </div>
              <div className="mt-4">
                <label htmlFor="highlights" className="block text-sm text-gray-400 mb-1">
                  Destaques <span className="text-gray-600">(separados por |)</span>
                </label>
                <input id="highlights" name="highlights" type="text" placeholder="Ex: Câmbio Manual|Único Dono|Baixa km"
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none" />
              </div>
            </div>

            {/* Fotos */}
            <div className="bg-[#1c1c1c] rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Fotos</h3>
              <p className="text-gray-500 text-sm mb-4">Envie pelo menos 6 fotos do veículo (exterior, interior, motor, documentos)</p>
              <div className="grid grid-cols-3 gap-3">
                {["Frente", "Lateral", "Traseira", "Interior", "Painel", "Motor"].map((label) => (
                  <div key={label} className="aspect-[4/3] border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center hover:border-[#dc2626] transition cursor-pointer">
                    <span className="text-2xl mb-1">📷</span>
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                MVP: upload de fotos será implementado na próxima versão. A IA analisa os dados textuais por enquanto.
              </p>
            </div>

            {/* Preços */}
            <div className="bg-[#1c1c1c] rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Valores</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startingBid" className="block text-sm text-gray-400 mb-1">Lance Inicial (R$)</label>
                  <input id="startingBid" name="startingBid" type="number" min="0" step="0.01" placeholder="120000"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none" />
                </div>
                <div>
                  <label htmlFor="reservePrice" className="block text-sm text-gray-400 mb-1">
                    Preço de Reserva (R$) <span className="text-gray-600">opcional</span>
                  </label>
                  <input id="reservePrice" name="reservePrice" type="number" min="0" step="0.01" placeholder="150000"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Sem reserva = mais ofertas e interesse. Com reserva = venda só se atingir o mínimo.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
            >
              {loading ? "🤖 IA analisando seu veículo..." : "Submeter para Curadoria IA"}
            </button>
          </form>
        </section>
      )}

      {/* Resultado - Step 3 */}
      {result && (
        <section className="max-w-3xl mx-auto px-4 py-8">
          <div className={`p-8 rounded-xl border ${
            result.curation.approved
              ? "bg-[#dc2626]/5 border-[#dc2626]/30"
              : "bg-red-900/10 border-red-800/30"
          }`}>
            <div className="text-center mb-6">
              <span className="text-5xl">
                {result.curation.approved ? "✅" : "❌"}
              </span>
              <h2 className="text-2xl font-bold text-white mt-3">
                {result.curation.approved ? "Veículo Aprovado!" : "Não Aprovado"}
              </h2>
              <p className="text-gray-400 mt-2">{result.curation.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 uppercase">Score IA</div>
                <div className="text-3xl font-bold text-[#dc2626] mt-1">
                  {result.curation.score}/10
                </div>
              </div>
              {result.curation.fipePrice && (
                <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 uppercase">Ref. FIPE</div>
                  <div className="text-3xl font-bold text-white mt-1">
                    R$ {(result.curation.fipePrice / 100).toLocaleString("pt-BR")}
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-400 mb-4">{result.curation.marketAnalysis}</p>

            {result.curation.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {result.curation.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-[#1c1c1c] border border-gray-700 text-gray-300 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {result.curation.suggestions && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-300 mb-2">💡 Sugestões:</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  {result.curation.suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              {result.curation.approved && (
                <a
                  href={`/vehicles/${result.vehicle.id}`}
                  className="flex-1 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 rounded-lg transition text-center"
                >
                  Ver Meu Anúncio →
                </a>
              )}
              <button
                onClick={() => { setResult(null); setStep(2); }}
                className="flex-1 bg-[#1c1c1c] hover:bg-[#2a2a2a] text-white font-bold py-3 rounded-lg transition border border-gray-700"
              >
                Submeter Outro Veículo
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

