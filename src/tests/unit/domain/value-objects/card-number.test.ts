import { describe, it, expect } from "vitest";
import { CardNumber } from "@/domain/value-objects/card-number";

describe("CardNumber Value Object", () => {
  describe("Luhn validation", () => {
    it("should validate correct Visa number", () => {
      expect(CardNumber.isValidLuhn("4111111111111111")).toBe(true);
    });

    it("should validate correct Mastercard number", () => {
      expect(CardNumber.isValidLuhn("5500000000000004")).toBe(true);
    });

    it("should reject invalid number", () => {
      expect(CardNumber.isValidLuhn("4111111111111112")).toBe(false);
    });

    it("should reject too short", () => {
      expect(CardNumber.isValidLuhn("411111")).toBe(false);
    });

    it("should reject too long", () => {
      expect(CardNumber.isValidLuhn("41111111111111111111")).toBe(false);
    });
  });

  describe("brand detection", () => {
    it("should detect Visa", () => {
      expect(CardNumber.detectBrand("4111111111111111")).toBe("visa");
    });

    it("should detect Mastercard", () => {
      expect(CardNumber.detectBrand("5500000000000004")).toBe("mastercard");
    });

    it("should detect Amex", () => {
      expect(CardNumber.detectBrand("371449635398431")).toBe("amex");
    });

    it("should return 'outro' for unknown", () => {
      expect(CardNumber.detectBrand("9000000000000001")).toBe("outro");
    });
  });

  describe("create", () => {
    it("should create from valid number", () => {
      const card = CardNumber.create("4111 1111 1111 1111");
      expect(card.brand).toBe("visa");
      expect(card.last4).toBe("1111");
    });

    it("should throw on invalid number", () => {
      expect(() => CardNumber.create("1234567890123456")).toThrow("Número de cartão inválido");
    });
  });
});
