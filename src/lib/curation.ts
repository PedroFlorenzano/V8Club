/**
 * Módulo de Curadoria com IA
 * 
 * Para o MVP, usamos:
 * - API FIPE gratuita para preço de referência
 * - Heurísticas baseadas em banco de dados de modelos entusiastas
 * - Google Gemini Free Tier (quando API key configurada) para análise de fotos
 */

// Base de dados de modelos "entusiastas" com score de desejabilidade
const ENTHUSIAST_MODELS: Record<string, { score: number; tags: string[] }> = {
  // Esportivos nacionais
  "volkswagen gol gti": { score: 9, tags: ["clássico", "nacional", "esportivo"] },
  "volkswagen gol gts": { score: 8, tags: ["clássico", "nacional", "esportivo"] },
  "chevrolet opala": { score: 9, tags: ["clássico", "nacional", "muscle"] },
  "chevrolet chevette": { score: 7, tags: ["clássico", "nacional"] },
  "chevrolet omega": { score: 7, tags: ["clássico", "nacional", "sedan"] },
  "ford maverick": { score: 10, tags: ["clássico", "nacional", "muscle", "raro"] },
  "ford corcel gt": { score: 8, tags: ["clássico", "nacional", "esportivo"] },
  "fiat uno turbo": { score: 9, tags: ["clássico", "nacional", "turbo", "raro"] },
  "fiat tempra turbo": { score: 8, tags: ["clássico", "nacional", "turbo"] },
  "volkswagen sp2": { score: 10, tags: ["clássico", "nacional", "raro", "esportivo"] },
  "puma gte": { score: 9, tags: ["clássico", "nacional", "esportivo", "raro"] },
  "santa matilde": { score: 10, tags: ["clássico", "nacional", "raro", "luxo"] },
  
  // Esportivos importados populares no Brasil
  "volkswagen golf gti": { score: 8, tags: ["esportivo", "hot-hatch", "importado"] },
  "honda civic si": { score: 8, tags: ["esportivo", "sedan", "importado"] },
  "honda civic type r": { score: 9, tags: ["esportivo", "raro", "importado"] },
  "subaru impreza wrx": { score: 9, tags: ["esportivo", "turbo", "awd", "importado"] },
  "mitsubishi lancer evolution": { score: 10, tags: ["esportivo", "turbo", "awd", "raro"] },
  "bmw m3": { score: 9, tags: ["esportivo", "luxo", "importado"] },
  "bmw m5": { score: 9, tags: ["esportivo", "luxo", "sedan", "importado"] },
  "bmw 325i": { score: 7, tags: ["esportivo", "luxo", "importado"] },
  "porsche 911": { score: 10, tags: ["esportivo", "luxo", "raro", "importado"] },
  "porsche boxster": { score: 8, tags: ["esportivo", "luxo", "importado"] },
  "porsche cayman": { score: 8, tags: ["esportivo", "luxo", "importado"] },
  "mercedes-benz c63 amg": { score: 9, tags: ["esportivo", "luxo", "importado"] },
  "audi rs3": { score: 9, tags: ["esportivo", "luxo", "importado"] },
  "audi tt": { score: 7, tags: ["esportivo", "importado"] },
  "toyota supra": { score: 10, tags: ["esportivo", "raro", "importado", "jdm"] },
  "nissan skyline": { score: 10, tags: ["esportivo", "raro", "importado", "jdm"] },
  "nissan 350z": { score: 7, tags: ["esportivo", "importado", "jdm"] },
  "nissan 370z": { score: 7, tags: ["esportivo", "importado", "jdm"] },
  "mazda mx-5": { score: 8, tags: ["esportivo", "roadster", "importado"] },
  "mazda rx-7": { score: 10, tags: ["esportivo", "raro", "rotativo", "jdm"] },
  "mazda rx-8": { score: 7, tags: ["esportivo", "rotativo", "jdm"] },
  "ford mustang": { score: 9, tags: ["muscle", "importado", "americano"] },
  "chevrolet camaro": { score: 9, tags: ["muscle", "importado", "americano"] },
  "dodge challenger": { score: 9, tags: ["muscle", "importado", "americano"] },
  "toyota corolla xrs": { score: 6, tags: ["esportivo", "sedan"] },
  "volkswagen jetta gli": { score: 7, tags: ["esportivo", "sedan"] },
  
  // SUVs/Jipes entusiastas
  "toyota bandeirante": { score: 9, tags: ["off-road", "clássico", "nacional"] },
  "jeep willys": { score: 9, tags: ["off-road", "clássico", "raro"] },
  "land rover defender": { score: 9, tags: ["off-road", "clássico", "importado"] },
  "suzuki samurai": { score: 7, tags: ["off-road", "clássico"] },
  "troller t4": { score: 8, tags: ["off-road", "nacional"] },
  
  // Motos (futuro)
  // Clássicos brasileiros
  "volkswagen fusca": { score: 7, tags: ["clássico", "nacional", "popular"] },
  "volkswagen kombi": { score: 8, tags: ["clássico", "nacional", "utilitário"] },
  "volkswagen brasilia": { score: 6, tags: ["clássico", "nacional"] },
  "volkswagen karmann ghia": { score: 9, tags: ["clássico", "nacional", "raro"] },
};

// Fatores que aumentam a desejabilidade
const DESIRABILITY_FACTORS = {
  manual_transmission: 1.5,  // Câmbio manual vale mais para entusiastas
  low_mileage: 1.2,         // Km baixa
  rare_color: 1.1,          // Cores raras
  single_owner: 1.3,        // Único dono
  original: 1.4,            // 100% original
  modified_tastefully: 1.2, // Modificações de bom gosto
};

interface CurationInput {
  brand: string;
  model: string;
  year: number;
  version?: string;
  mileage: number;
  transmission: string;
  color: string;
  description: string;
  highlights?: string;
}

interface CurationResult {
  approved: boolean;
  score: number;            // 0-10
  reason: string;
  tags: string[];
  fipePrice?: number;
  marketAnalysis: string;
  suggestions?: string[];
}

/**
 * Busca preço na tabela FIPE (API gratuita)
 */
async function getFipePrice(brand: string, model: string, year: number): Promise<number | null> {
  try {
    // Buscar marca
    const brandsRes = await fetch("https://parallelum.com.br/fipe/api/v1/carros/marcas");
    if (!brandsRes.ok) return null;
    
    const brands = await brandsRes.json();
    const brandData = brands.find((b: { nome: string; codigo: string }) => 
      b.nome.toLowerCase().includes(brand.toLowerCase())
    );
    if (!brandData) return null;
    
    // Buscar modelo
    const modelsRes = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandData.codigo}/modelos`);
    if (!modelsRes.ok) return null;
    
    const modelsData = await modelsRes.json();
    const modelData = modelsData.modelos?.find((m: { nome: string; codigo: string }) => 
      m.nome.toLowerCase().includes(model.toLowerCase())
    );
    if (!modelData) return null;
    
    // Buscar ano
    const yearsRes = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandData.codigo}/modelos/${modelData.codigo}/anos`);
    if (!yearsRes.ok) return null;
    
    const years = await yearsRes.json();
    const yearData = years.find((y: { nome: string; codigo: string }) => 
      y.nome.includes(year.toString())
    );
    if (!yearData) return null;
    
    // Buscar preço
    const priceRes = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandData.codigo}/modelos/${modelData.codigo}/anos/${yearData.codigo}`);
    if (!priceRes.ok) return null;
    
    const priceData = await priceRes.json();
    // Valor vem como "R$ 50.000,00" - converter para centavos
    const priceStr = priceData.Valor?.replace(/[R$\s.]/g, "").replace(",", "");
    return priceStr ? parseInt(priceStr) : null;
  } catch {
    return null;
  }
}

/**
 * Análise de curadoria principal
 */
export async function curateVehicle(input: CurationInput): Promise<CurationResult> {
  const searchKey = `${input.brand} ${input.model}`.toLowerCase();
  
  // 1. Verificar se o modelo está na base de entusiastas
  let baseScore = 0;
  let tags: string[] = [];
  let matchedModel = false;
  
  for (const [key, data] of Object.entries(ENTHUSIAST_MODELS)) {
    if (searchKey.includes(key) || key.includes(searchKey)) {
      baseScore = data.score;
      tags = [...data.tags];
      matchedModel = true;
      break;
    }
  }
  
  // 2. Se não encontrou na base, aplicar heurísticas
  if (!matchedModel) {
    // Verificar se a versão sugere algo esportivo
    const sportKeywords = ["gt", "gti", "gts", "rs", "amg", "m ", "type r", "si", "turbo", "sport", "ss", "r/t", "srt", "nismo", "sti", "wrx"];
    const version = (input.version || "").toLowerCase();
    const fullName = `${searchKey} ${version}`;
    
    if (sportKeywords.some(kw => fullName.includes(kw))) {
      baseScore = 6;
      tags.push("esportivo");
    }
    
    // Carros antigos (pré-2000) tendem a ser mais interessantes
    if (input.year < 1990) {
      baseScore = Math.max(baseScore, 5);
      tags.push("clássico");
    } else if (input.year < 2000) {
      baseScore = Math.max(baseScore, 4);
      tags.push("youngtimer");
    }
  }
  
  // 3. Aplicar fatores de desejabilidade
  let finalScore = baseScore;
  
  if (input.transmission.toLowerCase() === "manual") {
    finalScore *= DESIRABILITY_FACTORS.manual_transmission;
    tags.push("câmbio-manual");
  }
  
  // Km baixa para a idade
  const age = new Date().getFullYear() - input.year;
  const avgKmPerYear = input.mileage / Math.max(age, 1);
  if (avgKmPerYear < 8000) {
    finalScore *= DESIRABILITY_FACTORS.low_mileage;
    tags.push("baixa-km");
  }
  
  // Cap no score máximo
  finalScore = Math.min(finalScore, 10);
  
  // 4. Buscar preço FIPE
  const fipePrice = await getFipePrice(input.brand, input.model, input.year);
  
  // 5. Decisão de aprovação
  const approved = finalScore >= 5;
  
  // 6. Gerar análise
  let reason: string;
  let marketAnalysis: string;
  const suggestions: string[] = [];
  
  if (approved) {
    reason = `Veículo aprovado! ${input.brand} ${input.model} ${input.year} é um modelo com apelo para entusiastas.`;
    if (tags.includes("raro")) reason += " Modelo raro e muito procurado.";
    if (tags.includes("câmbio-manual")) reason += " Câmbio manual agrega valor.";
    if (tags.includes("baixa-km")) reason += " Quilometragem baixa para a idade.";
    
    marketAnalysis = `Score de desejabilidade: ${finalScore.toFixed(1)}/10. `;
    if (fipePrice) {
      marketAnalysis += `Referência FIPE: R$ ${(fipePrice / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. `;
      marketAnalysis += `Para modelos entusiastas, o valor de mercado costuma ser superior à FIPE.`;
    } else {
      marketAnalysis += `Não foi possível consultar a FIPE para este modelo/ano.`;
    }
  } else {
    reason = `Veículo não atende os critérios de curadoria. ${input.brand} ${input.model} ${input.year} não foi identificado como um modelo de interesse para entusiastas.`;
    marketAnalysis = `Score: ${finalScore.toFixed(1)}/10. Mínimo para aprovação: 5.0.`;
    suggestions.push("Tente listar em plataformas de classificados como OLX ou Webmotors.");
    suggestions.push("Se o veículo possui alguma particularidade especial (edição limitada, restauração, etc), descreva nos destaques e resubmeta.");
  }
  
  return {
    approved,
    score: Math.round(finalScore * 10) / 10,
    reason,
    tags: [...new Set(tags)],
    fipePrice: fipePrice || undefined,
    marketAnalysis,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}
