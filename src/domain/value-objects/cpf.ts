import { InvalidCPFError } from "@/domain/errors";

export class CPF {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): CPF {
    const cleaned = raw.replace(/\D/g, "");
    if (!CPF.isValid(cleaned)) {
      throw new InvalidCPFError(raw);
    }
    return new CPF(cleaned);
  }

  static isValid(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, "");
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleaned[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleaned[10])) return false;

    return true;
  }

  get digits(): string {
    return this.value;
  }

  get formatted(): string {
    return this.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  get masked(): string {
    return `***.***.${this.value.slice(6, 9)}-**`;
  }

  equals(other: CPF): boolean {
    return this.value === other.value;
  }
}
