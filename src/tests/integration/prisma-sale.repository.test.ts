/**
 * Testes de integração - PrismaSaleRepository
 * Testa criação de Sale com snapshot de contatos + queries
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaSaleRepository } from "@/infrastructure/repositories/extended";
import path from "path";

let prisma: PrismaClient;
let repo: PrismaSaleRepository;
let testVehicleId: string;
let testBidId: string;
let testBuyerId: string;
let testSellerId: string;

beforeAll(async () => {
  const adapter = new PrismaBetterSqlite3({
    url: path.resolve(process.cwd(), "dev.db"),
  });
  prisma = new PrismaClient({ adapter });
  repo = new PrismaSaleRepository(prisma);

  // Limpar e criar dados base
  await prisma.sale.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.vehicleImage.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const seller = await prisma.user.create({
    data: {
      name: "Sale Test Seller",
      email: "sale-seller@test.com",
      passwordHash: "hash",
      cpf: "52998224725",
      phone: "11999999999",
    },
  });
  testSellerId = seller.id;

  const buyer = await prisma.user.create({
    data: {
      name: "Sale Test Buyer",
      email: "sale-buyer@test.com",
      passwordHash: "hash",
      cpf: "98765432100",
      phone: "11888888888",
    },
  });
  testBuyerId = buyer.id;

  const vehicle = await prisma.vehicle.create({
    data: {
      brand: "Ford",
      model: "Maverick",
      year: 1975,
      color: "Preto",
      mileage: 80000,
      title: "Maverick V8 Test",
      description: "Test vehicle for sale",
      status: "sold",
      sellerId: testSellerId,
    },
  });
  testVehicleId = vehicle.id;

  const bid = await prisma.bid.create({
    data: {
      amount: 26000000,
      paymentMethod: "pix",
      platformFee: 500000,
      status: "accepted",
      vehicleId: testVehicleId,
      bidderId: testBuyerId,
      termsAccepted: true,
    },
  });
  testBidId = bid.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PrismaSaleRepository - Integration", () => {
  let createdSaleId: string;

  it("should create a sale with contact snapshot", async () => {
    const sale = await repo.create({
      vehicleId: testVehicleId,
      bidId: testBidId,
      buyerId: testBuyerId,
      sellerId: testSellerId,
      salePrice: 26000000,
      platformFee: 500000,
      paymentMethod: "pix",
      buyerEmail: "sale-buyer@test.com",
      buyerPhone: "11888888888",
      buyerCpf: "98765432100",
      sellerEmail: "sale-seller@test.com",
      sellerPhone: "11999999999",
      sellerCpf: "52998224725",
    });

    expect(sale).toBeDefined();
    expect(sale.id).toBeTruthy();
    expect(sale.salePrice).toBe(26000000);
    expect(sale.platformFee).toBe(500000);
    expect(sale.buyerEmail).toBe("sale-buyer@test.com");
    expect(sale.sellerEmail).toBe("sale-seller@test.com");
    expect(sale.buyerCpf).toBe("98765432100");
    expect(sale.sellerPhone).toBe("11999999999");

    createdSaleId = sale.id;
  });

  it("should find sale by id", async () => {
    const sale = await repo.findById(createdSaleId);

    expect(sale).not.toBeNull();
    expect(sale!.id).toBe(createdSaleId);
    expect(sale!.vehicleId).toBe(testVehicleId);
    expect(sale!.buyerId).toBe(testBuyerId);
    expect(sale!.sellerId).toBe(testSellerId);
  });

  it("should find sale by vehicleId", async () => {
    const sale = await repo.findByVehicleId(testVehicleId);

    expect(sale).not.toBeNull();
    expect(sale!.id).toBe(createdSaleId);
    expect(sale!.salePrice).toBe(26000000);
  });

  it("should return null for non-existent vehicleId", async () => {
    const sale = await repo.findByVehicleId("non-existent-id");
    expect(sale).toBeNull();
  });

  it("should return null for non-existent sale id", async () => {
    const sale = await repo.findById("non-existent-id");
    expect(sale).toBeNull();
  });

  it("should enforce unique vehicleId constraint", async () => {
    // Tentar criar outra sale para o mesmo veículo deve falhar
    await expect(
      repo.create({
        vehicleId: testVehicleId,
        bidId: testBidId,
        buyerId: testBuyerId,
        sellerId: testSellerId,
        salePrice: 27000000,
        platformFee: 500000,
        paymentMethod: "financiamento",
        buyerEmail: "other@test.com",
        buyerPhone: null,
        buyerCpf: null,
        sellerEmail: "other-seller@test.com",
        sellerPhone: null,
        sellerCpf: null,
      })
    ).rejects.toThrow();
  });
});
