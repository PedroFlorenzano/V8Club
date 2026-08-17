import { ValidationError } from "@/domain/errors";

export class Phone {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Phone {
    const cleaned = raw.replace(/\D/g, "");
    if (!Phone.isValid(cleaned)) {
      throw new ValidationError("Telefone inválido. Use formato (XX) XXXXX-XXXX");
    }
    return new Phone(cleaned);
  }

  static isValid(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 10 || cleaned.length === 11;
  }

  get digits(): string {
    return this.value;
  }

  get formatted(): string {
    if (this.value.length === 11) {
      return this.value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return this.value.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export class Password {
  static validate(password: string): PasswordValidationResult {
    const errors: string[] = [];
    if (password.length < 8) errors.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(password)) errors.push("Pelo menos 1 letra maiúscula");
    if (!/[a-z]/.test(password)) errors.push("Pelo menos 1 letra minúscula");
    if (!/\d/.test(password)) errors.push("Pelo menos 1 número");
    return { valid: errors.length === 0, errors };
  }

  static isStrong(password: string): boolean {
    return Password.validate(password).valid;
  }
}
