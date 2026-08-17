import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Fotos reais de carros (Unsplash - uso livre)
const CAR_IMAGES = {
  golfGti: [
    "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800&q=80",
    "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80",
  ],
  maverick: [
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80",
  ],
  civicSi: [
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
    "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800&q=80",
  ],
  unoTurbo: [
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
  ],
};

export async function POST() {
  // Limpar dados anteriores
  await prisma.sale.deleteMany();
  await prisma.message.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.vehicleImage.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // Criar usuários de teste
  const passwordHash = await bcrypt.hash("123456", 10);

  const seller = await prisma.user.create({
    data: {
      name: "Carlos Entusiasta",
      email: "vendedor@teste.com",
      passwordHash,
      cpf: "12345678909",
      phone: "11999999999",
      verificationStatus: "verified",
      verifiedAt: new Date(),
    },
  });

  const buyer = await prisma.user.create({
    data: {
      name: "João Colecionador",
      email: "comprador@teste.com",
      passwordHash,
      cpf: "98765432100",
      phone: "11988888888",
      verificationStatus: "verified",
      verifiedAt: new Date(),
    },
  });

  // Admin para testes
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@teste.com",
      passwordHash,
      role: "admin",
      verificationStatus: "verified",
      verifiedAt: new Date(),
    },
  });

  // Criar veículos de exemplo
  const vehiclesData = [
    {
      brand: "Volkswagen",
      model: "Golf GTI",
      year: 2015,
      version: "MK7 2.0 TSI",
      color: "Branco",
      mileage: 58000,
      fuel: "Gasolina",
      transmission: "Manual",
      title: "VW Golf GTI MK7 Manual - Único Dono - Revisado",
      description:
        "Golf GTI MK7 em estado impecável. Câmbio manual de 6 marchas (raríssimo no Brasil). Único dono, todas as revisões na concessionária. Pintura original, sem retoques. Pneus novos, freios recém trocados. Carro de garagem, nunca bateu.",
      highlights: "Câmbio Manual 6M|Único Dono|58.000km originais|Todas revisões em concessionária|Pneus novos",
      startingBid: 12000000,
      reservePrice: 14000000,
      fipePrice: 14500000,
      aiScore: 8.5,
      aiApproved: true,
      status: "approved",
      auctionStart: new Date(),
      auctionEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      sellerId: seller.id,
      images: CAR_IMAGES.golfGti,
    },
    {
      brand: "Ford",
      model: "Maverick",
      year: 1977,
      version: "GT V8 302",
      color: "Vermelho",
      mileage: 89000,
      fuel: "Gasolina",
      transmission: "Manual",
      title: "Ford Maverick GT V8 302 1977 - Restaurado",
      description:
        "Maverick GT com motor V8 302 original. Restauração completa realizada em 2022 com documentação fotográfica. Pintura na cor original vermelho Mônaco. Interior todo refeito em couro. Motor retificado, câmbio revisado. Documentação em dia, placa preta.",
      highlights: "V8 302 Original|Restauração Completa 2022|Placa Preta|Pintura Original|Interior em Couro",
      startingBid: 25000000,
      reservePrice: 32000000,
      fipePrice: null,
      aiScore: 10,
      aiApproved: true,
      status: "active",
      auctionStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      auctionEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      sellerId: seller.id,
      images: CAR_IMAGES.maverick,
    },
    {
      brand: "Honda",
      model: "Civic Si",
      year: 2008,
      version: "2.0 16V VTEC",
      color: "Preto",
      mileage: 112000,
      fuel: "Gasolina",
      transmission: "Manual",
      title: "Honda Civic Si 2008 - Estado de Novo",
      description:
        "Civic Si com motor 2.0 VTEC de 192cv. Câmbio manual de 6 marchas. Carro muito bem cuidado, sem modificações. Suspensão original, escapamento original. Todas as manutenções preventivas em dia. IPVA 2026 pago.",
      highlights: "Motor VTEC 192cv|Câmbio 6M|Sem modificações|Manutenção em dia|IPVA pago",
      startingBid: 8000000,
      reservePrice: 9500000,
      fipePrice: 8500000,
      aiScore: 7.8,
      aiApproved: true,
      status: "approved",
      auctionStart: new Date(),
      auctionEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      sellerId: seller.id,
      images: CAR_IMAGES.civicSi,
    },
    {
      brand: "Fiat",
      model: "Uno Turbo",
      year: 1994,
      version: "1.4 Turbo i.e.",
      color: "Cinza",
      mileage: 145000,
      fuel: "Gasolina",
      transmission: "Manual",
      title: "Fiat Uno Turbo 1994 - Raridade Nacional",
      description:
        "Uno Turbo i.e. original de fábrica. Um dos poucos exemplares sobreviventes no Brasil. Motor 1.4 turbo com intercooler original. Pintura boa para a idade, sem ferrugem. Banco Recaro original. Turbo funcionando perfeitamente, sem vazamentos.",
      highlights: "Turbo Original de Fábrica|Banco Recaro|Sem Ferrugem|Motor Perfeito|Raridade",
      startingBid: 7000000,
      reservePrice: null,
      fipePrice: null,
      aiScore: 9.2,
      aiApproved: true,
      status: "approved",
      auctionStart: new Date(),
      auctionEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sellerId: seller.id,
      images: CAR_IMAGES.unoTurbo,
    },
  ];

  const createdVehicles = [];
  for (const { images, ...vehicleData } of vehiclesData) {
    const vehicle = await prisma.vehicle.create({
      data: {
        ...vehicleData,
        aiAnalysis: JSON.stringify({
          approved: true,
          score: vehicleData.aiScore,
          reason: `Veículo aprovado! ${vehicleData.brand} ${vehicleData.model} é um modelo com apelo para entusiastas.`,
          tags: ["esportivo", "câmbio-manual", "entusiasta"],
          marketAnalysis: `Score de desejabilidade: ${vehicleData.aiScore}/10.`,
        }),
      },
    });

    // Criar imagens
    for (let i = 0; i < images.length; i++) {
      await prisma.vehicleImage.create({
        data: {
          url: images[i],
          filename: `photo-${i}.jpg`,
          order: i,
          isCover: i === 0,
          vehicleId: vehicle.id,
        },
      });
    }

    createdVehicles.push(vehicle);
  }

  // Criar lances no Maverick
  const maverick = createdVehicles[1];
  await prisma.bid.createMany({
    data: [
      {
        amount: 26000000,
        vehicleId: maverick.id,
        bidderId: buyer.id,
        paymentMethod: "pix",
        message: "Tenho interesse! Posso buscar em SP.",
        platformFee: 500000, // cap
        status: "pending",
      },
      {
        amount: 27500000,
        vehicleId: maverick.id,
        bidderId: buyer.id,
        paymentMethod: "financiamento",
        message: "Financiamento já aprovado no Itaú, posso fechar esta semana.",
        platformFee: 500000,
        status: "pending",
      },
      {
        amount: 25000000,
        vehicleId: maverick.id,
        bidderId: buyer.id,
        paymentMethod: "troca",
        tradeVehicle: "Camaro SS 2019 + R$ 80.000 de complemento via PIX",
        message: "Meu Camaro está impecável, 30mil km. Posso mostrar por vídeo.",
        platformFee: 500000,
        status: "pending",
      },
    ],
  });

  // Criar comentários
  await prisma.comment.createMany({
    data: [
      { content: "Carro sensacional! Motor original mesmo?", vehicleId: maverick.id, authorId: buyer.id },
      { content: "Sim, motor 302 100% original com nota fiscal da retífica.", vehicleId: maverick.id, authorId: seller.id },
      { content: "Esse câmbio manual é raro demais! Boa sorte na venda.", vehicleId: createdVehicles[0].id, authorId: buyer.id },
    ],
  });

  // Criar mensagens de exemplo (chat interno)
  await prisma.message.createMany({
    data: [
      {
        content: "Boa tarde! O carro está disponível para vistoria presencial?",
        senderId: buyer.id,
        receiverId: seller.id,
        vehicleId: maverick.id,
      },
      {
        content: "Olá! Sim, pode agendar qualquer dia da semana das 9h às 18h. Estou em Campinas/SP.",
        senderId: seller.id,
        receiverId: buyer.id,
        vehicleId: maverick.id,
      },
      {
        content: "Perfeito, vou passar com meu mecânico na quinta-feira. O motor tem algum vazamento?",
        senderId: buyer.id,
        receiverId: seller.id,
        vehicleId: maverick.id,
      },
      {
        content: "Nenhum vazamento. Acabou de fazer retífica completa, menos de 5000km rodados depois.",
        senderId: seller.id,
        receiverId: buyer.id,
        vehicleId: maverick.id,
      },
    ],
  });

  return NextResponse.json({
    message: "Seed concluído com imagens!",
    users: { seller: seller.email, buyer: buyer.email, admin: "admin@teste.com", password: "123456" },
    vehicles: createdVehicles.length,
  });
}
