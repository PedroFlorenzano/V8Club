import { IPriceProvider, IPaymentGateway } from "@/application/ports";

// === FIPE Price Provider ===
export class FipePriceProvider implements IPriceProvider {
  private readonly baseUrl = "https://parallelum.com.br/fipe/api/v1/carros";

  async getPrice(brand: string, model: string, year: number): Promise<number | null> {
    try {
      // Buscar marca
      const brandsRes = await fetch(`${this.baseUrl}/marcas`);
      if (!brandsRes.ok) return null;
      const brands = await brandsRes.json();
      const brandData = brands.find(
        (b: { nome: string }) => b.nome.toLowerCase().includes(brand.toLowerCase())
      );
      if (!brandData) return null;

      // Buscar modelo
      const modelsRes = await fetch(`${this.baseUrl}/marcas/${brandData.codigo}/modelos`);
      if (!modelsRes.ok) return null;
      const { modelos } = await modelsRes.json();
      const modelData = modelos.find(
        (m: { nome: string }) => m.nome.toLowerCase().includes(model.toLowerCase())
      );
      if (!modelData) return null;

      // Buscar ano
      const yearsRes = await fetch(`${this.baseUrl}/marcas/${brandData.codigo}/modelos/${modelData.codigo}/anos`);
      if (!yearsRes.ok) return null;
      const years = await yearsRes.json();
      const yearData = years.find((y: { nome: string }) => y.nome.includes(String(year)));
      if (!yearData) return null;

      // Buscar preço
      const priceRes = await fetch(
        `${this.baseUrl}/marcas/${brandData.codigo}/modelos/${modelData.codigo}/anos/${yearData.codigo}`
      );
      if (!priceRes.ok) return null;
      const priceData = await priceRes.json();

      // Converter "R$ 85.000,00" para centavos
      const priceStr = priceData.Valor?.replace(/[^\d,]/g, "").replace(",", ".");
      return priceStr ? Math.round(parseFloat(priceStr) * 100) : null;
    } catch {
      return null;
    }
  }
}

// === Fake Payment Gateway (MVP) ===
export class FakePaymentGateway implements IPaymentGateway {
  async tokenize(cardData: { number: string; expiry: string; holder: string }): Promise<string> {
    // Em produção: Stripe/Pagar.me tokenizaria o cartão
    const last4 = cardData.number.slice(-4);
    return `tok_fake_${last4}_${Date.now()}`;
  }
}
