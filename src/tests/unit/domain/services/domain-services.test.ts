import { describe, it, expect } from "vitest";
import {
  PlatformFeeCalculator,
  ContentModerationService,
  BidRulesService,
} from "@/domain/services";

describe("PlatformFeeCalculator", () => {
  it("should calculate 5% for normal amounts", () => {
    expect(PlatformFeeCalculator.calculate(100_000)).toBe(5_000);
  });

  it("should calculate correctly for R$ 10.000 (1M centavos)", () => {
    expect(PlatformFeeCalculator.calculate(1_000_000)).toBe(50_000);
  });

  it("should cap at R$ 5.000 (500.000 centavos)", () => {
    expect(PlatformFeeCalculator.calculate(20_000_000)).toBe(500_000);
  });

  it("should cap at exact boundary", () => {
    // 10M centavos = R$ 100.000 → 5% = R$ 5.000 (exatamente o cap)
    expect(PlatformFeeCalculator.calculate(10_000_000)).toBe(500_000);
  });

  it("should return 0 for 0 amount", () => {
    expect(PlatformFeeCalculator.calculate(0)).toBe(0);
  });

  it("should return 0 for negative amount", () => {
    expect(PlatformFeeCalculator.calculate(-100)).toBe(0);
  });

  it("should round correctly", () => {
    // 333 centavos × 5% = 16.65 → rounds to 17
    expect(PlatformFeeCalculator.calculate(333)).toBe(17);
  });
});

describe("ContentModerationService", () => {
  it("should allow normal message", () => {
    expect(ContentModerationService.check("Boa tarde! O carro está disponível?")).toEqual({
      allowed: true,
    });
  });

  it("should block phone number", () => {
    const result = ContentModerationService.check("Me liga: 11 99999-9999");
    expect(result.allowed).toBe(false);
    expect(result.violation).toBe("telefone");
  });

  it("should block email", () => {
    const result = ContentModerationService.check("Manda pra joao@email.com");
    expect(result.allowed).toBe(false);
    expect(result.violation).toBe("email");
  });

  it("should block WhatsApp mention", () => {
    const result = ContentModerationService.check("Chama no whatsapp");
    expect(result.allowed).toBe(false);
    expect(result.violation).toBe("mensageiro");
  });

  it("should block Instagram", () => {
    const result = ContentModerationService.check("Me segue @carros_premium");
    expect(result.allowed).toBe(false);
    expect(result.violation).toBe("rede social");
  });

  it("should block 'zap'", () => {
    const result = ContentModerationService.check("Chama no zap");
    expect(result.allowed).toBe(false);
  });

  it("should allow car-related numbers", () => {
    // "2015" or "V8" should not trigger phone detection
    expect(ContentModerationService.check("Golf GTI 2015 MK7").allowed).toBe(true);
  });
});

describe("BidRulesService", () => {
  const baseParams = {
    vehicleStatus: "active",
    vehicleSellerId: "seller-1",
    bidderId: "buyer-1",
    auctionEnd: new Date(Date.now() + 86400000), // tomorrow
    verificationStatus: "verified",
  };

  it("should allow valid bid", () => {
    expect(BidRulesService.canBid(baseParams)).toEqual({ allowed: true });
  });

  it("should reject unverified user", () => {
    const result = BidRulesService.canBid({ ...baseParams, verificationStatus: "unverified" });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("verificar");
  });

  it("should reject seller bidding on own vehicle", () => {
    const result = BidRulesService.canBid({ ...baseParams, bidderId: "seller-1" });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Vendedor");
  });

  it("should reject expired auction", () => {
    const result = BidRulesService.canBid({
      ...baseParams,
      auctionEnd: new Date(Date.now() - 86400000), // yesterday
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("encerrado");
  });

  it("should reject inactive vehicle", () => {
    const result = BidRulesService.canBid({ ...baseParams, vehicleStatus: "sold" });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("não está ativo");
  });

  it("should allow null auctionEnd", () => {
    expect(BidRulesService.canBid({ ...baseParams, auctionEnd: null })).toEqual({
      allowed: true,
    });
  });
});
