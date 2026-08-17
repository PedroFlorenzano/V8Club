/**
 * Testes de integração - PrismaBidRepository
 * Testa CRUD de bids + lógica de rejectAllPendingExcept
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaBidRepository } from "@/infrastructure/repositories";
import path from "path";

let prisma: PrismaClient;
let repo: PrismaBidRepository;
let testVehicleId: string;
let testBuyerId: string;
let testSellerId: string;

beforeAll(async () => {
  const adapter = new PrismaBetterSqlite3({
    url: path.resolve(process.cwd(), "dev.db"),
  });
  prisma = new PrismaClient({ adapter });
  repo = new PrismaBidRepository(prisma);

  // Criar dados base para testes
  await prisma.sale.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.vehicleImage.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const seller = await prisma.user.create({
    data: {
      name: "Bid Test Seller",
      email: "bid-seller@test.com",
      passwordHash: "hash",
    },
  });
  testSellerId = seller.id;

  const buyer = await prisma.user.create({
    data: {
      name: "Bid Test Buyer",
      email: "bid-buyer@test.com",
      passwordHash: "hash",
    },
  });
  testBuyerId = buyer.id;

  const vehicle = await prisma.vehicle.create({
    data: {
      brand: "VW",
      model: "Golf",
      year: 2015,
      color: "Branco",
      mileage: 50000,
      title: "Golf GTI Test",
      description: "Test vehicle",
      status: "active",
      sellerId: testSellerId,
    },
  });
  testVehicleId = vehicle.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.bid.deleteMany();
});

describe("PrismaBidRepository - Integration", () => {
  it("should create a bid", async () => {
    const bid = await repo.create({
      amount: 150000,
      paymentMethod: "pix",
      message: "Tenho interesse!",
      tradeVehicle: null,
      platformFee: 7500,
      termsAccepted: true,
      vehicleId: testVehicleId,
      bidderId: testBuyerId,
    });

    expect(bid).toBeDefined();
    expect(bid.id).toBeTruthy();
    expect(bid.amount).toBe(150000);
    expect(bid.paymentMethod).toBe("pix");
    expect(bid.platformFee).toBe(7500);
    expect(bid.status).toBe("pending");
  });

  it("should find bid by id", async () => {
    const created = await repo.create({
      amount: 200000,
      paymentMethod: "financiamento",
      message: null,
      tradeVehicle: null,
      platformFee: 10000,
      termsAccepted: true,
      vehicleId: testVehicleId,
      bidderId: testBuyerId,
    });

    const found = await repo.findById(created.id);
    expect(found).not.toBeNull();
    expect(found!.amount).toBe(200000);
  });

  it("should find bids by vehicleId", async () => {
    await repo.create({
      amount: 100000, paymentMethod: "pix", message: null, tradeVehicle: null,
      platformFee: 5000, termsAccepted: true, vehicleId: testVehicleId, bidderId: testBuyerId,
    });
    await repo.create({
      amount: 120000, paymentMethod: "boleto", message: null, tradeVehicle: null,
      platformFee: 6000, termsAccepted: true, vehicleId: testVehicleId, bidderId: testBuyerId,
    });

    const bids = await repo.findByVehicleId(testVehicleId);
    expect(bids).toHaveLength(2);
    // Deve estar ordenado por createdAt desc
    expect(bids[0].amount).toBe(120000);
  });

  it("should update bid status", async () => {
    const bid = await repo.create({
      amount: 300000, paymentMethod: "pix", message: null, tradeVehicle: null,
      platformFee: 15000, termsAccepted: true, vehicleId: testVehicleId, bidderId: testBuyerId,
    });

    await repo.updateStatus(bid.id, "accepted");

    const updated = await repo.findById(bid.id);
    expect(updated!.status).toBe("accepted");
  });

  it("should reject all pending except one", async () => {
    const bid1 = await repo.create({
      amount: 100000, paymentMethod: "pix", message: null, tradeVehicle: null,
      platformFee: 5000, termsAccepted: true, vehicleId: testVehicleId, bidderId: testBuyerId,
    });
    const bid2 = await repo.create({
      amount: 200000, paymentMethod: "pix", message: null, tradeVehicle: null,
      platformFee: 10000, termsAccepted: true, vehicleId: testVehicleId, bidderId: testBuyerId,
    });
    const bid3 = await repo.create({
      amount: 300000, paymentMethod: "pix", message: null, tradeVehicle: null,
      platformFee: 15000, termsAccepted: true, vehicleId: testVehicleId, bidderId: testBuyerId,
    });

    // Aceitar bid2, rejeitar as outras
    await repo.updateStatus(bid2.id, "accepted");
    await repo.rejectAllPendingExcept(testVehicleId, bid2.id);

    const result1 = await repo.findById(bid1.id);
    const result2 = await repo.findById(bid2.id);
    const result3 = await repo.findById(bid3.id);

    expect(result1!.status).toBe("rejected");
    expect(result2!.status).toBe("accepted"); // não foi tocada
    expect(result3!.status).toBe("rejected");
  });

  it("should return null for non-existent bid", async () => {
    const found = await repo.findById("non-existent-id");
    expect(found).toBeNull();
  });

  it("should handle troca payment method with trade vehicle", async () => {
    const bid = await repo.create({
      amount: 250000,
      paymentMethod: "troca",
      message: "Tenho um Civic 2020",
      tradeVehicle: "Honda Civic 2020 + R$ 50.000 via PIX",
      platformFee: 12500,
      termsAccepted: true,
      vehicleId: testVehicleId,
      bidderId: testBuyerId,
    });

    expect(bid.paymentMethod).toBe("troca");
    expect(bid.tradeVehicle).toBe("Honda Civic 2020 + R$ 50.000 via PIX");
    expect(bid.message).toBe("Tenho um Civic 2020");
  });
});
