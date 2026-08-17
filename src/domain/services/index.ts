/**
 * Calcula taxa da plataforma: 5% do valor, cap em R$ 5.000 (500.000 centavos)
 */
export class PlatformFeeCalculator {
  private static readonly RATE = 0.05;
  private static readonly CAP_CENTAVOS = 500_000;

  static calculate(amountCentavos: number): number {
    if (amountCentavos <= 0) return 0;
    const fee = Math.round(amountCentavos * this.RATE);
    return Math.min(fee, this.CAP_CENTAVOS);
  }

  static getRate(): number {
    return this.RATE;
  }

  static getCap(): number {
    return this.CAP_CENTAVOS;
  }
}

/**
 * Moderação de conteúdo — bloqueia dados de contato nas mensagens
 */
export interface ModerationResult {
  allowed: boolean;
  violation?: string;
}

export class ContentModerationService {
  private static readonly PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
    { pattern: /\b\d{2}[\s.-]?\d{4,5}[\s.-]?\d{4}\b/, reason: "telefone" },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, reason: "email" },
    { pattern: /whatsapp|whats|zap|wpp|telegram/i, reason: "mensageiro" },
    { pattern: /instagram|insta|ig:|@\w+/i, reason: "rede social" },
  ];

  static check(content: string): ModerationResult {
    for (const { pattern, reason } of this.PATTERNS) {
      if (pattern.test(content)) {
        return { allowed: false, violation: reason };
      }
    }
    return { allowed: true };
  }
}

/**
 * Regras de negócio para ofertas
 */
export class BidRulesService {
  static canBid(params: {
    vehicleStatus: string;
    vehicleSellerId: string;
    bidderId: string;
    auctionEnd: Date | null;
    verificationStatus: string;
  }): { allowed: boolean; reason?: string } {
    if (params.verificationStatus !== "verified") {
      return { allowed: false, reason: "Você precisa verificar sua identidade antes de fazer ofertas" };
    }
    if (params.vehicleStatus !== "approved" && params.vehicleStatus !== "active") {
      return { allowed: false, reason: "Período de ofertas não está ativo" };
    }
    if (params.auctionEnd && new Date(params.auctionEnd) < new Date()) {
      return { allowed: false, reason: "Período de ofertas encerrado" };
    }
    if (params.vehicleSellerId === params.bidderId) {
      return { allowed: false, reason: "Vendedor não pode fazer oferta no próprio veículo" };
    }
    return { allowed: true };
  }
}
