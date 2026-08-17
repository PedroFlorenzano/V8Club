import { describe, it, expect } from "vitest";
import { CPF } from "@/domain/value-objects/cpf";

describe("CPF Value Object", () => {
  describe("isValid", () => {
    it("should validate a correct CPF", () => {
      expect(CPF.isValid("52998224725")).toBe(true);
    });

    it("should validate CPF with formatting", () => {
      expect(CPF.isValid("529.982.247-25")).toBe(true);
    });

    it("should reject CPF with all same digits", () => {
      expect(CPF.isValid("11111111111")).toBe(false);
      expect(CPF.isValid("00000000000")).toBe(false);
      expect(CPF.isValid("99999999999")).toBe(false);
    });

    it("should reject CPF with wrong check digits", () => {
      expect(CPF.isValid("52998224726")).toBe(false);
    });

    it("should reject CPF with wrong length", () => {
      expect(CPF.isValid("1234567890")).toBe(false);
      expect(CPF.isValid("123456789012")).toBe(false);
    });

    it("should reject empty string", () => {
      expect(CPF.isValid("")).toBe(false);
    });
  });

  describe("create", () => {
    it("should create from valid CPF", () => {
      const cpf = CPF.create("529.982.247-25");
      expect(cpf.digits).toBe("52998224725");
    });

    it("should throw on invalid CPF", () => {
      expect(() => CPF.create("12345678900")).toThrow("CPF inválido");
    });
  });

  describe("formatting", () => {
    it("should format correctly", () => {
      const cpf = CPF.create("52998224725");
      expect(cpf.formatted).toBe("529.982.247-25");
    });

    it("should mask correctly", () => {
      const cpf = CPF.create("52998224725");
      expect(cpf.masked).toBe("***.***.247-**");
    });
  });

  describe("equality", () => {
    it("should be equal for same digits", () => {
      const a = CPF.create("52998224725");
      const b = CPF.create("529.982.247-25");
      expect(a.equals(b)).toBe(true);
    });
  });
});
