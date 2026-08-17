# V8 Club 🏎️

O clube brasileiro de carros especiais, esportivos e clássicos — com curadoria por IA.

**v8club.com.br**

---

## O que é

V8 Club é um marketplace de ofertas para veículos entusiastas no Brasil. Diferente de classificados genéricos, aqui só entram carros que passam pela curadoria da nossa inteligência artificial — priorizando raridade, estado de conservação, configuração especial e desejabilidade.

Inspirado no modelo do [Cars & Bids](https://carsandbids.com), adaptado para a realidade brasileira: formas de pagamento locais (PIX, financiamento, consórcio, troca), conformidade legal (sem uso do termo "leilão"), e verificação de identidade com CPF + CNH.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes (App Router) |
| Banco de Dados | SQLite + Prisma 7 |
| Autenticação | JWT (cookie httpOnly) + bcrypt |
| IA/Curadoria | Heurísticas + API FIPE gratuita |

---

## Features

### Para Compradores
- 🔍 Navegar veículos curados por IA
- 💰 Fazer ofertas com forma de pagamento (PIX, financiamento, consórcio, troca + valor, boleto)
- 💬 Chat interno com vendedor (dados de contato ocultos até a venda)
- ☆ Lista de observação (watchlist)
- 📊 Painel "Meus Resultados" com histórico de ofertas
- 🔒 Verificação de identidade (CPF + CNH + selfie)
- 💳 Cartão vinculado (crédito/débito) para cobrança da taxa

### Para Vendedores
- 📝 Submissão gratuita com curadoria por IA
- 📸 Galeria de fotos com lightbox fullscreen
- 🎥 Seção de vídeos (walk-around, cold start)
- 📨 Receber ofertas com mensagens e forma de pagamento
- ✓ Aceitar/recusar ofertas individualmente
- 🤝 Contatos liberados apenas após aceitar oferta

### Segurança & Anti-Bypass
- 🚫 Chat com filtro anti-contato (bloqueia telefone, email, WhatsApp, Instagram)
- 📋 Ofertas vinculantes (termo legal aceito pelo comprador)
- 🔐 Contatos só liberados pós-venda (comprador e vendedor não se conhecem antes)
- 💰 Taxa de 5% (máx R$ 5.000) cobrada automaticamente no aceite
- 🪪 KYC obrigatório para fazer ofertas (CPF + documento + selfie)

### Monetização
- Vendedor lista **grátis** e recebe 100% do valor
- Comprador paga taxa de **5% (cap R$ 5.000)** — só cobrada se oferta for aceita
- Modelo: receita por transação concluída

---

## Rodando localmente

### Pré-requisitos
- Node.js 18+
- npm

### Instalação

```bash
git clone https://github.com/PedroFlorenzano/V8Club.git
cd V8Club
npm install
```

### Configurar banco de dados

```bash
npx prisma db push
npx prisma generate
```

### Rodar

```bash
npm run dev
```

Acesse: http://localhost:3000

### Popular com dados de teste

```bash
# Com o servidor rodando:
curl -X POST http://localhost:3000/api/seed
```

### Credenciais de teste

| Usuário | Email | Senha | Role |
|---------|-------|-------|------|
| Vendedor | vendedor@teste.com | 123456 | user (verificado) |
| Comprador | comprador@teste.com | 123456 | user (verificado) |
| Admin | admin@teste.com | 123456 | admin |

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx                  # Home (grid de veículos)
│   ├── layout.tsx                # Layout global (header + footer)
│   ├── cadastro/                 # Página de registro
│   ├── login/                    # Página de login
│   ├── conta/                    # Perfil + cartão vinculado
│   ├── verificar/                # Upload CNH + selfie (KYC)
│   ├── resultados/               # Meus veículos, ofertas, vendas
│   ├── observando/               # Watchlist
│   ├── submit/                   # Submeter veículo
│   ├── admin/                    # Painel admin (aprovar docs)
│   ├── vehicles/[id]/            # Detalhe do veículo
│   ├── venda/[id]/               # Pós-venda (contatos liberados)
│   └── api/
│       ├── auth/                 # Register, login, logout, me, KYC
│       ├── account/              # Perfil + cartão
│       ├── admin/                # Gerenciar usuários
│       ├── vehicles/[id]/        # CRUD + bids + messages + finalize
│       ├── watchlist/            # Lista de observação
│       ├── resultados/           # Dados do painel do usuário
│       ├── sales/[id]/           # Dados da venda concluída
│       └── seed/                 # Popular banco com dados de teste
├── components/
│   ├── HeaderAuth.tsx            # Header dinâmico (logado/não logado)
│   └── WatchButton.tsx           # Botão observar (toggle)
├── lib/
│   ├── auth.ts                   # JWT, bcrypt, validação CPF
│   ├── curation.ts              # IA de curadoria (FIPE + heurísticas)
│   ├── prisma.ts                # Cliente Prisma
│   └── utils.ts                 # Formatação (moeda, data, km)
prisma/
├── schema.prisma                 # Schema do banco
docs/
└── KYC_PRODUCAO.md              # Arquitetura KYC para produção
```

---

## Fluxo Principal

```
1. Vendedor submete carro
        ↓
2. IA analisa (FIPE + heurísticas) → aprova ou rejeita
        ↓
3. Carro fica visível no V8 Club por 7 dias
        ↓
4. Compradores fazem ofertas (vinculantes, com forma de pagamento)
        ↓
5. Vendedor vê ofertas + conversa via chat interno
        ↓
6. Vendedor aceita uma oferta → taxa cobrada → contatos liberados
        ↓
7. Página /venda com dados de ambas as partes + checklist pós-venda
```

---

## Design

- **Tema escuro** inspirado em Cars & Bids
- **Paleta Ferrari**: preto profundo (#0a0a0a), vermelho (#dc2626), dourado (#d4a853)
- **Tipografia**: system fonts, clean e legível
- **Layout**: header fixo, grid de 4 colunas, sidebar "ending soon", sticky bar no detalhe

---

## Roadmap

- [ ] Deploy em produção (Vercel + PostgreSQL)
- [ ] Integração com gateway de pagamento real (Stripe/Pagar.me)
- [ ] KYC automatizado (Serpro + idwall + Unico Check)
- [ ] Notificações por email (Resend/SES)
- [ ] App mobile (React Native)
- [ ] Sistema de reputação (avaliações pós-venda)
- [ ] Integração com Denatran (verificar restrições do veículo)
- [ ] Financiamento pré-aprovado integrado

---

## Legal

- Não utiliza o termo "leilão" — opera como marketplace de ofertas entre particulares (Decreto 21.981/32)
- Intermediação tecnológica apenas
- Em conformidade com LGPD (Lei 13.709/2018)

---

## Licença

Privado. Todos os direitos reservados.
