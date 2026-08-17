import { describe, it, expect } from "vitest";
import { Phone, Password } from "@/domain/value-objects/phone-password";

describe("Phone Value Object", () => {
  describe("isValid", () => {
    it("should validate 11-digit cellphone", () => {
      expect(Phone.isValid("11999999999")).toBe(true);
    });

    it("should validate 10-digit landline", () => {
      expect(Phone.isValid("1133334444")).toBe(true);
    });

    it("should validate with formatting", () => {
      expect(Phone.isValid("(11) 99999-9999")).toBe(true);
    });

    it("should reject too short", () => {
      expect(Phone.isValid("119999")).toBe(false);
    });

    it("should reject too long", () => {
      expect(Phone.isValid("119999999999")).toBe(false);
    });

    it("should reject empty", () => {
      expect(Phone.isValid("")).toBe(false);
    });
  });

  describe("create", () => {
    it("should create from valid number", () => {
      const phone = Phone.create("(11) 99999-9999");
      expect(phone.digits).toBe("11999999999");
    });

    it("should throw on invalid", () => {
      expect(() => Phone.create("123")).toThrow("Telefone inválido");
    });
  });

  describe("formatted", () => {
    it("should format cellphone", () => {
      const phone = Phone.create("11999999999");
      expect(phone.formatted).toBe("(11) 99999-9999");
    });

    it("should format landline", () => {
      const phone = Phone.create("1133334444");
      expect(phone.formatted).toBe("(11) 3333-4444");
    });
  });
});

describe("Password Validation", () => {
  describe("validate", () => {
    it("should accept strong password", () => {
      const result = Password.validate("Senha123!");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject too short", () => {
      const result = Password.validate("Ab1");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Mínimo 8 caracteres");
    });

    it("should reject without uppercase", () => {
      const result = Password.validate("senha12345");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Pelo menos 1 letra maiúscula");
    });

    it("should reject without lowercase", () => {
      const result = Password.validate("SENHA12345");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Pelo menos 1 letra minúscula");
    });

    it("should reject without number", () => {
      const result = Password.validate("SenhaForte");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Pelo menos 1 número");
    });

    it("should accumulate multiple errors", () => {
      const result = Password.validate("abc");
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("isStrong", () => {
    it("should return true for strong password", () => {
      expect(Password.isStrong("Senha123")).toBe(true);
    });

    it("should return false for weak password", () => {
      expect(Password.isStrong("fraca")).toBe(false);
    });
  });
});
