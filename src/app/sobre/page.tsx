export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-2">
            V8<span className="text-[#dc2626]"> Club</span>
          </h1>
          <p className="text-gray-400 text-lg">O clube dos carros especiais do Brasil</p>
        </div>

        {/* O que é */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">O que é o V8 Club?</h2>
          <div className="text-gray-300 leading-relaxed space-y-3">
            <p>
              O V8 Club é um marketplace de ofertas exclusivo para veículos entusiastas — esportivos,
              clássicos, raros e especiais. Diferente de classificados genéricos, aqui cada carro passa
              por uma curadoria com inteligência artificial que avalia desejabilidade, raridade e estado
              de conservação.
            </p>
            <p>
              Nosso modelo é inspirado nos melhores marketplaces de carros do mundo, adaptado para a
              realidade brasileira: formas de pagamento locais (PIX, financiamento, consórcio, troca),
              verificação de identidade com CPF e CNH, e total transparência nas ofertas.
            </p>
          </div>
        </section>

        {/* Como funciona */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Como funciona?</h2>
          <div className="space-y-4">
            <Step number={1} title="Vendedor submete o carro">
              Fotos, vídeo, descrição e histórico. É grátis.
            </Step>
            <Step number={2} title="IA faz a curadoria">
              Nossa inteligência artificial analisa o veículo e decide se ele é especial o
              suficiente para entrar no V8 Club.
            </Step>
            <Step number={3} title="7 dias de ofertas">
              O carro fica visível para todos os membros. Compradores fazem ofertas
              com forma de pagamento e mensagem ao vendedor.
            </Step>
            <Step number={4} title="Vendedor escolhe">
              O vendedor vê todas as ofertas (valor, forma de pagamento, mensagem) e
              aceita a que preferir — não necessariamente a maior.
            </Step>
            <Step number={5} title="Contatos liberados">
              Após o aceite, comprador e vendedor recebem os dados de contato um do outro
              para finalizar a transação.
            </Step>
          </div>
        </section>

        {/* Custos */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Quanto custa?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-6">
              <div className="text-3xl mb-3">🚗</div>
              <h3 className="text-white font-bold mb-2">Para Vendedores</h3>
              <div className="text-[#d4a853] text-2xl font-bold mb-2">Grátis</div>
              <p className="text-gray-400 text-sm">
                Listar é 100% gratuito. Você recebe o valor integral da venda.
              </p>
            </div>
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-6">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-white font-bold mb-2">Para Compradores</h3>
              <div className="text-[#d4a853] text-2xl font-bold mb-2">5% <span className="text-sm text-gray-400 font-normal">(máx R$ 5.000)</span></div>
              <p className="text-gray-400 text-sm">
                Taxa cobrada apenas se sua oferta for aceita pelo vendedor. Não é reembolsável.
              </p>
            </div>
          </div>
        </section>

        {/* Segurança */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Segurança</h2>
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-6 space-y-3">
            <SecurityItem icon="🪪" text="Verificação de identidade obrigatória (CPF + CNH + selfie)" />
            <SecurityItem icon="🔒" text="Contatos ocultos até a venda ser concluída" />
            <SecurityItem icon="💬" text="Chat interno com filtro anti-contato (sem bypass)" />
            <SecurityItem icon="📋" text="Ofertas vinculantes — compromisso legal do comprador" />
            <SecurityItem icon="💳" text="Cartão vinculado à conta para cobrança automática da taxa" />
            <SecurityItem icon="🤖" text="Curadoria por IA — só carros especiais entram" />
          </div>
        </section>

        {/* Que tipo de carro */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Que tipo de carro entra?</h2>
          <p className="text-gray-300 mb-4">
            O V8 Club é para carros que fazem o coração bater mais forte. Nossa IA analisa:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Tag>Esportivos</Tag>
            <Tag>Clássicos</Tag>
            <Tag>Muscle cars</Tag>
            <Tag>Turbo de fábrica</Tag>
            <Tag>Câmbio manual</Tag>
            <Tag>Edições limitadas</Tag>
            <Tag>Baixa quilometragem</Tag>
            <Tag>Importados</Tag>
            <Tag>Preparados</Tag>
            <Tag>Único dono</Tag>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            Carros comuns, sem histórico especial ou configuração diferenciada, podem não ser aprovados pela curadoria.
          </p>
        </section>

        {/* Legal */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Informações Legais</h2>
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6 text-sm text-gray-400 space-y-2">
            <p>
              O V8 Club é um marketplace de ofertas entre particulares com intermediação tecnológica.
              Não somos leiloeiros e não realizamos leilões.
            </p>
            <p>
              A plataforma conecta compradores e vendedores, facilitando a negociação.
              A responsabilidade pela transação, documentação e transferência de propriedade
              é das partes envolvidas.
            </p>
            <p>
              Em conformidade com a LGPD (Lei 13.709/2018). Documentos de verificação são
              armazenados de forma segura e utilizados exclusivamente para validação de identidade.
            </p>
          </div>
        </section>

        {/* Contato */}
        <section className="text-center">
          <h2 className="text-xl font-bold text-white mb-3">Dúvidas?</h2>
          <p className="text-gray-400 mb-4">
            Entre em contato conosco
          </p>
          <a
            href="mailto:contato@v8club.com.br"
            className="inline-block bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold px-6 py-3 rounded-lg transition"
          >
            contato@v8club.com.br
          </a>
        </section>
      </div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 bg-[#dc2626] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-white font-semibold">{title}</h3>
        <p className="text-gray-400 text-sm mt-0.5">{children}</p>
      </div>
    </div>
  );
}

function SecurityItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <span className="text-gray-300 text-sm">{text}</span>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-center text-sm text-gray-300">
      {children}
    </div>
  );
}
