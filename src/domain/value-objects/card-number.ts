import { InvalidCardNumberError } from "@/domain/errors";

export type CardBrand =
  | "visa"
  | "mastercard"
  | "elo"
  | "amex"
  | "hipercard"
  | "discover"
  | "outro";

export class CardNumber {
  private readonly digits: string;
  readonly brand: CardBrand;
  readonly last4: string;

  private constructor(digits: string) {
    this.digits = digits;
    this.brand = CardNumber.detectBrand(digits);
    this.last4 = digits.slice(-4);
  }

  static create(raw: string): CardNumber {
    const cleaned = raw.replace(/\D/g, "");
    if (!CardNumber.isValidLuhn(cleaned)) {
      throw new InvalidCardNumberError();
    }
    return new CardNumber(cleaned);
  }

  static isValidLuhn(n: string): boolean {
    if (n.length < 13 || n.length > 19) return false;
    let sum = 0;
    let isEven = false;
    for (let i = n.length - 1; i >= 0; i--) {
      let digit = parseInt(n[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }

  static detectBrand(n: string): CardBrand {
    if (/^4/.test(n)) return "visa";
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
    if (/^3[47]/.test(n)) return "amex";
    if (/^(606282|3841|637)/.test(n)) return "hipercard";
    if (/^(636368|636297|504175|438935|451416|509048|509067|509049)/.test(n))
      return "elo";
    if (/^6(?:011|5)/.test(n)) return "discover";
    return "outro";
  }
}
