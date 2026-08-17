# KYC em Produção — Carros & Ofertas

## Visão Geral

Este documento descreve a arquitetura completa de verificação de identidade (KYC — Know Your Customer) para quando o marketplace for ao ar. O objetivo é garantir que compradores e vendedores são pessoas reais, com documentos válidos, reduzindo fraudes e golpes.

---

## Camadas de Verificação

### Camada 1 — Validação Básica (MVP Local) ✅ Implementada

| Etapa | O que faz | Tecnologia |
|-------|-----------|------------|
| CPF | Valida dígitos verificadores | Algoritmo local (módulo 11) |
| Senha | Hash seguro | bcrypt (12 rounds) |
| Upload CNH | Armazena frente/verso | Upload local /uploads |
| Selfie | Armazena foto | Upload local /uploads |
| Verificação | Admin olha docs manualmente | Painel admin |

**Limitações**: Não valida se o CPF pertence à pessoa, não detecta docs falsos, não faz face match automático.

---

### Camada 2 — Verificação Automatizada (Produção)

#### 2.1 Validação de CPF na Receita Federal

**Provedor recomendado**: Serpro — Datavalid

```
POST https://gateway.apiserpro.serpro.gov.br/datavalid/v3/validate/pf
Authorization: Bearer {token}

{
  "key": {
    "cpf": "12345678900"
  },
  "answer": {
    "nome": "João da Silva",
    "data_nascimento": "01/01/1990",
    "situacao_cpf": "regular"
  }
}
```

**Resposta**: Retorna `true/false` para cada campo validado (nome bate? data nascimento bate? CPF regular?).

**Custo**: ~R$ 0,30 por consulta  
**Contrato**: Via portal Serpro, precisa de CNPJ  
**Alternativa mais simples**: BigDataCorp (~R$ 0,10/consulta, retorna nome + situação do CPF)

---

#### 2.2 OCR de Documento (CNH/RG)

**Provedor recomendado**: idwall ou CAF

**Fluxo**:
1. Usuário faz upload da CNH (frente e verso)
2. API extrai via OCR: nome, CPF, data nascimento, nº registro, categoria, validade
3. Cruza dados extraídos com o CPF informado no cadastro
4. Verifica se documento não está vencido

```
POST https://api.idwall.co/documents
Authorization: Bearer {api_key}
Content-Type: multipart/form-data

document_front: [arquivo]
document_back: [arquivo]
document_type: "cnh"
```

**Resposta**:
```json
{
  "status": "valid",
  "extracted_data": {
    "name": "JOAO DA SILVA",
    "cpf": "123.456.789-00",
    "birth_date": "1990-01-01",
    "expiry_date": "2029-05-15",
    "category": "AB",
    "registration": "04123456789"
  },
  "validations": {
    "not_expired": true,
    "cpf_match": true,
    "document_authentic": true
  }
}
```

**Custo**: ~R$ 2-4 por verificação  
**Tempo de resposta**: 5-30 segundos

---

#### 2.3 Face Match + Prova de Vida (Liveness)

**Provedor recomendado**: Unico Check (líder no Brasil) ou CAF

**Fluxo**:
1. Usuário tira selfie pelo celular/webcam
2. SDK captura com liveness detection (pede para piscar, virar cabeça, etc.)
3. API compara o rosto da selfie com a foto do documento
4. Retorna score de similaridade (0-100)

```
POST https://api.unico.io/v1/biometrics/verify
Authorization: Bearer {token}

{
  "selfie_base64": "...",
  "document_photo_base64": "...",
  "liveness_required": true
}
```

**Resposta**:
```json
{
  "match": true,
  "similarity_score": 94.7,
  "liveness_detected": true,
  "fraud_indicators": []
}
```

**Score mínimo recomendado**: 75+ para aprovação automática, 50-75 para revisão manual

**Custo**: ~R$ 1-3 por verificação  
**SDKs disponíveis**: React Native, Web (JS), iOS, Android

---

#### 2.4 Consultas Complementares (Antifraude)

| Consulta | Provedor | Custo | O que retorna |
|----------|----------|-------|---------------|
| Score de crédito | Serasa/Boa Vista | R$ 0,50-2 | Score 0-1000, inadimplência |
| Antecedentes criminais | idwall/BigDataCorp | R$ 1-3 | Processos, mandados |
| Restrição veicular | Denatran via Serpro | R$ 0,50 | Roubo/furto, alienação, recall |
| Endereço | Correios/BigDataCorp | R$ 0,10 | CEP válido, endereço completo |
| Telefone | Nuvemshop/BigDataCorp | R$ 0,10 | Operadora, titular |
| PEP (Pessoa Exposta) | idwall | R$ 0,50 | Se é político/servidor |

---

## Fluxo Completo em Produção

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE CADASTRO + KYC                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. CADASTRO BÁSICO                                              │
│     └─ Email + senha + nome + CPF + telefone                     │
│     └─ Validação local: dígitos CPF, formato email, senha forte  │
│     └─ Status: PENDENTE_DOCUMENTOS                               │
│                                                                   │
│  2. UPLOAD DE DOCUMENTOS                                         │
│     └─ CNH frente + CNH verso (ou RG frente + verso)            │
│     └─ Validação: tamanho, formato, resolução mínima            │
│     └─ Status: PENDENTE_SELFIE                                   │
│                                                                   │
│  3. SELFIE COM PROVA DE VIDA                                    │
│     └─ SDK de liveness (Unico/CAF)                              │
│     └─ Captura com anti-fraude (não aceita foto de foto)        │
│     └─ Status: EM_ANALISE                                        │
│                                                                   │
│  4. VERIFICAÇÃO AUTOMÁTICA (background job)                      │
│     ├─ Serpro: CPF regular? Nome bate?                           │
│     ├─ OCR: Dados do doc batem com cadastro?                     │
│     ├─ Face Match: Selfie = foto do doc? (score > 75?)          │
│     └─ Resultado:                                                │
│        ├─ TUDO OK → Status: VERIFICADO ✓                        │
│        ├─ SCORE 50-75 → Status: REVISAO_MANUAL                  │
│        └─ FALHOU → Status: REJEITADO (com motivo)               │
│                                                                   │
│  5. REVISÃO MANUAL (se necessário)                               │
│     └─ Admin olha docs + selfie + scores                         │
│     └─ Aprova ou rejeita com justificativa                       │
│                                                                   │
│  6. RESULTADO                                                    │
│     └─ Notifica usuário por email/SMS                            │
│     └─ Se rejeitado: pode reenviar docs 1x                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Permissões por Nível de Verificação

| Status | Pode ver carros | Pode comentar | Pode fazer oferta | Pode vender |
|--------|:-:|:-:|:-:|:-:|
| Não logado | ✅ | ❌ | ❌ | ❌ |
| Logado (sem docs) | ✅ | ✅ | ❌ | ❌ |
| Docs enviados (em análise) | ✅ | ✅ | ❌ | ❌ |
| **Verificado** | ✅ | ✅ | ✅ | ✅ |
| Rejeitado | ✅ | ✅ | ❌ | ❌ |

---

## Arquitetura Técnica (Produção)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend  │────▶│   Backend    │────▶│   Workers/Queue  │
│  (Next.js)  │     │  (API REST)  │     │   (Bull/Redis)   │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │                       │
                           ▼                       ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │  PostgreSQL  │     │  APIs Externas   │
                    │  (Supabase)  │     │  Serpro / idwall │
                    └──────────────┘     │  Unico / CAF    │
                           │              └─────────────────┘
                           ▼
                    ┌──────────────┐
                    │  S3 / R2     │
                    │  (Documentos)│
                    └──────────────┘
```

### Stack recomendada para produção:
- **Banco**: PostgreSQL (Supabase ou AWS RDS)
- **Storage de docs**: AWS S3 ou Cloudflare R2 (criptografado, sem acesso público)
- **Fila de processamento**: Bull + Redis (verificações assíncronas)
- **Cache**: Redis (tokens, rate limiting)
- **Email transacional**: Resend ou AWS SES
- **SMS**: Twilio ou Zenvia (para OTP e notificações)

---

## Segurança dos Documentos

### Armazenamento
- Documentos **NUNCA** ficam em pasta pública
- Criptografia at-rest (AES-256) no S3/R2
- URLs pré-assinadas com expiração de 5 min para visualização no admin
- Retenção: deletar docs 30 dias após verificação (LGPD)

### Acesso
- Somente o admin pode visualizar documentos
- Audit log de cada acesso a docs
- 2FA obrigatório para admin

### LGPD
- Consentimento explícito antes do upload
- Direito a exclusão: endpoint para deletar conta + todos os docs
- Política de privacidade clara explicando uso dos dados biométricos
- Base legal: execução de contrato (Art. 7º, V da LGPD)

---

## Custos Estimados por Usuário Verificado

| Etapa | Custo |
|-------|-------|
| Validação CPF (Serpro) | R$ 0,30 |
| OCR de CNH (idwall) | R$ 3,00 |
| Face Match + Liveness (Unico) | R$ 2,00 |
| Score antifraude (BigDataCorp) | R$ 0,50 |
| **Total por usuário** | **~R$ 5,80** |

Para 1.000 usuários/mês: **~R$ 5.800/mês**  
Para 10.000 usuários/mês: **~R$ 58.000/mês** (negociar volume)

**ROI**: Se evita 1 golpe de R$ 50.000, já pagou 10 meses de KYC.

---

## Implementação Gradual Sugerida

### Fase 1 — Lançamento (mês 1-3)
- Login com email/senha + upload de docs
- Verificação manual pelo admin
- Custo: R$ 0

### Fase 2 — Automação parcial (mês 3-6)
- Integrar Serpro Datavalid (validação CPF automática)
- OCR de CNH com idwall (extração de dados)
- Verificação manual só para face match
- Custo: ~R$ 3,30/usuário

### Fase 3 — Automação total (mês 6+)
- Face Match + Liveness com Unico Check
- Aprovação 100% automática para score > 75
- Admin só revê casos borderline
- Custo: ~R$ 5,80/usuário

### Fase 4 — Antifraude avançado (mês 12+)
- Device fingerprinting
- Análise comportamental (ML)
- Monitoramento contínuo de transações
- Integração com Denatran para verificar veículos

---

## APIs e Documentações

| Provedor | Docs | Contato |
|----------|------|---------|
| Serpro Datavalid | https://servicos.serpro.gov.br/datavalid | Portal Serpro |
| idwall | https://docs.idwall.co | comercial@idwall.co |
| Unico Check | https://unico.io/unico-check | Site |
| CAF | https://www.caf.io/docs | Site |
| BigDataCorp | https://docs.bigdatacorp.com.br | Site |
| Sumsub (global) | https://docs.sumsub.com | Site |

---

## Decisão de Provedor

**Recomendação principal**: Começar com **idwall** porque:
1. Faz OCR + Face Match + Consultas tudo numa API
2. Dashboard para revisão manual incluída
3. Bom suporte para docs brasileiros (CNH, RG, CNH-e)
4. Pricing razoável para marketplace

**Alternativa budget**: Serpro (CPF) + face-api.js (face match básico local) — menos seguro mas R$ 0,30/usuário.

---

## Notas para Desenvolvimento

- O sistema atual (Camada 1) já salva os uploads e controla status — a migração para APIs externas é plug-and-play
- O campo `verificationStatus` no schema já comporta todos os estados necessários
- O middleware de proteção já bloqueia ações sem verificação
- Quando integrar API externa, adicionar um worker async que processa a fila de verificações
