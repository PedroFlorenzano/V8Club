# V8 Club — Regras de Desenvolvimento

Este documento define as regras obrigatórias para qualquer agente de IA ou desenvolvedor que trabalhe neste codebase. **Leia integralmente antes de fazer qualquer alteração.**

---

## 1. Arquitetura

O projeto segue **Clean Architecture** com 4 camadas. A regra de dependência é estrita:

```
Domain ← Application ← Infrastructure ← Presentation (API Routes)
```

- **Domain** não importa NADA de outras camadas
- **Application** importa apenas Domain
- **Infrastructure** importa Application + Domain
- **Presentation** importa Infrastructure + Application + Domain

### Estrutura de Pastas

```
src/
├── domain/              # Regras de negócio puras (ZERO dependências externas)
│   ├── entities/        # Interfaces TypeScript (tipos de dados)
│   ├── value-objects/   # Classes com validação encapsulada (CPF, CardNumber, etc)
│   ├── services/        # Lógica de negócio pura (sem I/O)
│   └── errors/          # Hierarquia de erros tipados
├── application/         # Orquestração (use cases)
│   ├── ports/           # Interfaces (contratos que infrastructure implementa)
│   ├── dtos/            # Validação de entrada com Zod
│   └── use-cases/       # Casos de uso (1 classe = 1 operação)
├── infrastructure/      # Implementações concretas
│   ├── repositories/    # Implementações Prisma dos ports
│   ├── auth/            # JWT, bcrypt, cookies
│   ├── services/        # APIs externas (FIPE, payment gateway)
│   ├── database/        # Prisma client singleton
│   └── container.ts     # Composição de dependências (DI container)
├── presentation/        # Middleware HTTP
│   └── middleware/      # withAuth, withVerified, handleError
├── app/                 # Next.js App Router (thin controllers + pages)
│   ├── api/             # Route handlers (máx 30 linhas de lógica)
│   └── [pages]/         # Páginas React (client components)
├── components/          # Componentes React reutilizáveis
└── tests/
    ├── unit/            # Testes sem I/O (mocks)
    └── integration/     # Testes com banco real
```

---

## 2. Regras por Camada

### 2.1 Domain (`src/domain/`)

| Regra | Descrição |
|-------|-----------|
| Zero imports externos | Não importar Prisma, Next.js, bcrypt, JWT, Zod, ou qualquer lib |
| Apenas TypeScript puro | Classes, interfaces, enums, funções puras |
| Sem side effects | Nenhuma função faz I/O (fetch, banco, filesystem) |
| Imutável | Value objects são imutáveis (constructor privado + factory `create()`) |
| Testável sem mocks | Tudo testável com `expect(result).toBe(expected)` |

**Para criar nova entity:**
```typescript
// src/domain/entities/index.ts (adicionar)
export interface NovaEntity {
  id: string;
  // ... campos
  createdAt: Date;
}
```

**Para criar novo value object:**
```typescript
// src/domain/value-objects/novo-vo.ts
export class NovoVO {
  private constructor(private readonly value: string) {}

  static create(raw: string): NovoVO {
    if (!NovoVO.isValid(raw)) throw new ValidationError("...");
    return new NovoVO(raw);
  }

  static isValid(value: string): boolean {
    // validação pura
  }

  get formatted(): string { /* ... */ }
}
```

**Para criar novo domain service:**
```typescript
// src/domain/services/index.ts (adicionar)
export class NovoService {
  static calcular(input: Tipo): Resultado {
    // lógica pura, sem I/O
  }
}
```

### 2.2 Application (`src/application/`)

| Regra | Descrição |
|-------|-----------|
| Depende apenas de Domain | Importa entities, VOs, services, errors |
| Usa interfaces (ports) | Nunca importa implementação concreta (Prisma, bcrypt) |
| 1 use case = 1 arquivo | Cada operação é uma classe com método `execute()` |
| Recebe deps no constructor | Injeção de dependência via construtor |
| DTOs validam com Zod | Toda entrada externa é validada antes de chegar ao use case |

**Para criar novo use case:**
```typescript
// src/application/use-cases/index.ts (adicionar)
export class NovoUseCase {
  constructor(
    private readonly repo: IAlgumRepository,
    private readonly outroRepo: IOutroRepository,
  ) {}

  async execute(input: NovoInput): Promise<NovoOutput> {
    // 1. Buscar dados via repos
    // 2. Aplicar regras de negócio (domain services)
    // 3. Persistir resultado
    // 4. Retornar
  }
}
```

**Para criar novo port (interface):**
```typescript
// src/application/ports/index.ts (adicionar)
export interface INovoRepository {
  findById(id: string): Promise<NovaEntity | null>;
  create(data: CreateNovoData): Promise<NovaEntity>;
  // ...
}
```

**Para criar novo DTO:**
```typescript
// src/application/dtos/index.ts (adicionar)
export const NovoInputSchema = z.object({
  campo: z.string().min(1),
  // ...
});
export type NovoInput = z.infer<typeof NovoInputSchema>;
```

### 2.3 Infrastructure (`src/infrastructure/`)

| Regra | Descrição |
|-------|-----------|
| Implementa ports | Cada repository implementa a interface definida em application/ports |
| Singleton via container | Instâncias criadas em `container.ts` |
| Prisma é interno | Nenhuma outra camada importa `@prisma/client` diretamente |
| Erros de infra → domain errors | Converter PrismaClientKnownRequestError em NotFoundError, ConflictError, etc |

**Para criar novo repository:**
```typescript
// src/infrastructure/repositories/ (novo arquivo ou adicionar no existente)
export class PrismaNovoRepository implements INovoRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<NovaEntity | null> {
    return this.db.novo.findUnique({ where: { id } }) as Promise<NovaEntity | null>;
  }
  // ...
}
```

**Registrar no container:**
```typescript
// src/infrastructure/container.ts
const novoRepo = new PrismaNovoRepository(prisma);
const novoUseCase = new NovoUseCase(novoRepo, outroRepo);

export const container = {
  // ... existentes
  novoUseCase,
  novoRepo,
};
```

### 2.4 Presentation (`src/app/api/`)

| Regra | Descrição |
|-------|-----------|
| Thin controller | Máximo 30 linhas de lógica por handler |
| Sem lógica de negócio | Apenas: parse input → chamar use case → retornar JSON |
| Usar middlewares | `withAuth`, `withVerified` para proteção |
| Usar `handleError` | Nunca retornar erro manualmente (exceto 401 no middleware) |
| Validação via Zod | `Schema.parse(body)` no início do handler |

**Template para nova rota:**
```typescript
// src/app/api/novo/route.ts
import { NextResponse } from "next/server";
import { NovoInputSchema } from "@/application/dtos";
import { container } from "@/infrastructure/container";
import { withAuth } from "@/presentation/middleware/auth.middleware";
import { handleError } from "@/presentation/middleware/error-handler";

export const POST = withAuth(async (request, { session }) => {
  try {
    const body = await request.json();
    const input = NovoInputSchema.parse(body);
    const result = await container.novoUseCase.execute({ ...input, userId: session.userId });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});
```

---

## 3. Fluxo para Adicionar Nova Feature

Ordem obrigatória de implementação:

```
1. Domain    → Criar entity/VO/service (se necessário)
2. Tests     → Escrever testes unitários do domain
3. Ports     → Definir interface do repository
4. DTOs      → Criar schema Zod de validação
5. Use Case  → Implementar lógica de orquestração
6. Tests     → Escrever testes do use case (com mocks)
7. Repo      → Implementar repository Prisma
8. Container → Registrar no DI container
9. Route     → Criar thin controller
10. Frontend → Criar/atualizar componente React
11. Build    → `npm run build` deve passar
12. Tests    → `npm test` deve passar (106+ testes)
```

**NUNCA pule etapas.** Se o domain não precisa mudar, comece na etapa 3.

---

## 4. Regras de Código

### 4.1 Geral

- TypeScript strict (sem `any`, sem `@ts-ignore`)
- Sem código morto (remover funções não usadas)
- Sem `console.log` em produção (apenas em `handleError` para erros 500)
- Imports absolutos com `@/` (configurado no tsconfig)
- Nomes em inglês no código, textos de UI em português
- Barrel exports (`index.ts`) em cada diretório

### 4.2 Naming Conventions

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Interface | `I` + PascalCase | `IUserRepository` |
| Classe | PascalCase | `CreateBidUseCase` |
| Método/função | camelCase | `findByEmail()` |
| Constante | UPPER_SNAKE | `PAYMENT_METHODS` |
| Arquivo (classe) | kebab-case | `platform-fee.calculator.ts` |
| Arquivo (barrel) | `index.ts` | `src/domain/entities/index.ts` |
| DTO Schema | PascalCase + `Schema` | `CreateBidInputSchema` |
| DTO Type | PascalCase + `Input`/`Output` | `CreateBidInput` |
| Erro | PascalCase + `Error` | `InvalidCPFError` |
| Teste | mesmo nome + `.test.ts` | `cpf.test.ts` |

### 4.3 Erros

- Toda exceção de negócio estende `DomainError`
- Cada erro tem `code` (string) e `statusCode` (number)
- O `handleError` converte automaticamente em resposta HTTP
- Nunca usar `throw new Error("...")` — sempre usar erros tipados

```typescript
// Certo:
throw new NotFoundError("Veículo não encontrado");
throw new ForbiddenError("Apenas o vendedor pode aceitar");
throw new ValidationError("Valor deve ser positivo");

// Errado:
throw new Error("not found");
return NextResponse.json({ error: "..." }, { status: 404 });
```

### 4.4 Testes

- Todo domain service/VO **deve** ter teste unitário
- Todo use case **deve** ter teste com mocks
- Usar `vi.fn()` para mocks (Vitest)
- Testes de integração usam banco SQLite real
- Rodar `npm test` antes de qualquer commit
- Mínimo: 1 teste para caso feliz + 1 teste para cada regra de negócio

---

## 5. Regras de Segurança

| Regra | Implementação |
|-------|---------------|
| Auth obrigatória | Toda rota sensível usa `withAuth` ou `withVerified` |
| sellerId da sessão | NUNCA confiar no body para identificar o vendedor |
| Contatos ocultos | Email/phone/CPF nunca expostos antes da venda fechar |
| Anti-bypass | Chat filtra telefone, email, WhatsApp, Instagram via regex |
| Senhas hasheadas | bcrypt 12 rounds, nunca salvar plain text |
| JWT em httpOnly cookie | Nunca expor token em localStorage |
| Validação de entrada | Zod parse em TODA entrada de usuário |
| Uploads privados | Docs KYC em `/uploads/` (fora do public), servidos com auth |

---

## 6. Banco de Dados

### Schema

- Definido em `prisma/schema.prisma`
- Toda alteração: `npx prisma db push` (dev) ou migration (prod)
- Após alterar schema: `npx prisma generate`
- Campos monetários em **centavos** (Int, não Float)
- Datas como `DateTime`
- IDs como `cuid()`

### Convenção de campos

- `createdAt` / `updatedAt` em toda tabela
- `status` como `String` com enum no domain (não no Prisma)
- Relações explícitas com `onDelete` quando apropriado
- `@@unique` para constraints compostas

---

## 7. Stack e Versões

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Next.js | 16 | Framework fullstack |
| TypeScript | 5.x | Tipagem |
| Prisma | 7 | ORM |
| SQLite | - | Banco (dev), migrar para PostgreSQL em prod |
| Tailwind CSS | 4 | Styling |
| Vitest | 2.1 | Testes |
| Zod | 3.23 | Validação de DTOs |
| bcryptjs | - | Hash de senhas |
| jsonwebtoken | - | JWT |

---

## 8. Comandos

```bash
npm run dev          # Servidor de desenvolvimento (localhost:3000)
npm run build        # Build de produção (DEVE passar sem erros)
npm test             # Rodar todos os testes (DEVE ter 0 falhas)
npm run test:watch   # Testes em modo watch
npm run test:coverage # Coverage report
```

---

## 9. Checklist de Validação

Antes de finalizar qualquer alteração, verificar:

- [ ] `npm test` — todos os testes passando
- [ ] `npm run build` — build sem erros de tipo
- [ ] Nova feature tem teste unitário
- [ ] Use case tem teste com mocks
- [ ] Nenhum import quebrando regra de dependência entre camadas
- [ ] Nenhum `any` ou `@ts-ignore` adicionado
- [ ] Erros usam hierarquia `DomainError`
- [ ] DTOs têm schema Zod
- [ ] Route é thin controller (máx 30 linhas de lógica)
- [ ] Dados sensíveis (senha, CPF, cartão) nunca logados ou expostos

---

## 10. Regras para Agentes de IA

Se você é uma IA trabalhando neste código:

1. **LEIA este arquivo inteiro** antes de começar
2. **LEIA os testes existentes** para entender padrões
3. **NÃO coloque lógica de negócio em routes** — crie use case
4. **NÃO importe Prisma fora de infrastructure/** — use ports
5. **NÃO crie funções utilitárias soltas** — use domain services ou VOs
6. **SEMPRE rode `npm test` e `npm run build`** após alterações
7. **SEMPRE crie testes** para código novo
8. **SIGA o fluxo da seção 3** (Domain → Tests → Port → DTO → UseCase → Tests → Repo → Container → Route)
9. **USE os erros tipados** (NotFoundError, ForbiddenError, ValidationError, ConflictError)
10. **USE os middlewares** (withAuth, withVerified, handleError)

### Ao iniciar uma sessão neste projeto:

```
1. Ler DEVELOPMENT_RULES.md (este arquivo)
2. Rodar `npm test` para validar estado atual
3. Rodar `npm run build` para confirmar que compila
4. Só então começar a trabalhar
```

---

## 11. Paleta de Design (Frontend)

| Elemento | Cor | Uso |
|----------|-----|-----|
| Background principal | `#0a0a0a` | Body, páginas |
| Card/Surface | `#1c1c1c` | Cards, modais |
| Border | `#2a2a2a` | Divisórias, inputs |
| CTA / Urgência | `#dc2626` | Botões principais, alertas |
| Valor / Preço | `#d4a853` | Preços, badges premium, dourado |
| Texto principal | `white` | Títulos, conteúdo |
| Texto secundário | `gray-400` | Descrições, labels |
| Texto terciário | `gray-600` | Placeholders, notas |

**Logo**: V8 (branco) Club (vermelho `#dc2626`)

---

## 12. Termos de Negócio

| Termo | Usar | NÃO usar |
|-------|------|----------|
| Ofertas | ✅ | ❌ Leilão, lance, bid (na UI) |
| Vitrine | ✅ | ❌ Auction |
| Anúncio | ✅ | ❌ Listing (na UI) |
| V8 Club | ✅ | ❌ Carros & Ofertas, marketplace |
| Forma de pagamento | ✅ | ❌ Método de pagamento |
| Vendedor/Comprador | ✅ | ❌ Seller/Buyer (na UI) |

**Razão legal**: O Decreto 21.981/32 regulamenta leilões no Brasil. O V8 Club NÃO é um leiloeiro — é um marketplace de ofertas entre particulares com intermediação tecnológica apenas.
