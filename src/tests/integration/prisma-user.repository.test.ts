/**
 * Testes de integração - PrismaUserRepository
 * Usa banco SQLite real (dev.db) para validar queries
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaUserRepository } from "@/infrastructure/repositories";
import path from "path";

let prisma: PrismaClient;
let repo: PrismaUserRepository;

beforeAll(async () => {
  const adapter = new PrismaBetterSqlite3({
    url: path.resolve(process.cwd(), "dev.db"),
  });
  prisma = new PrismaClient({ adapter });
  repo = new PrismaUserRepository(prisma);

  // Limpar apenas dados de teste de integração (emails específicos)
  await prisma.sale.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.vehicleImage.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PrismaUserRepository - Integration", () => {
  const testUser = {
    name: "Test User",
    email: "integration-test@v8club.com",
    passwordHash: "$2a$12$fakehashforintegrationtest",
    role: "user" as const,
    cpf: "52998224725",
    phone: "11999999999",
    verificationStatus: "unverified" as const,
    verificationNote: null,
    verifiedAt: null,
    docFrontUrl: null,
    docBackUrl: null,
    selfieUrl: null,
    cardBrand: null,
    cardLast4: null,
    cardType: null,
    cardExpiry: null,
    cardHolderName: null,
    cardToken: null,
  };

  let createdUserId: string;

  it("should create a user", async () => {
    const user = await repo.create(testUser);

    expect(user).toBeDefined();
    expect(user.id).toBeTruthy();
    expect(user.name).toBe("Test User");
    expect(user.email).toBe("integration-test@v8club.com");
    expect(user.cpf).toBe("52998224725");
    expect(user.verificationStatus).toBe("unverified");

    createdUserId = user.id;
  });

  it("should find user by id", async () => {
    const user = await repo.findById(createdUserId);

    expect(user).not.toBeNull();
    expect(user!.id).toBe(createdUserId);
    expect(user!.email).toBe("integration-test@v8club.com");
  });

  it("should find user by email", async () => {
    const user = await repo.findByEmail("integration-test@v8club.com");

    expect(user).not.toBeNull();
    expect(user!.id).toBe(createdUserId);
  });

  it("should find user by CPF", async () => {
    const user = await repo.findByCpf("52998224725");

    expect(user).not.toBeNull();
    expect(user!.id).toBe(createdUserId);
  });

  it("should return null for non-existent email", async () => {
    const user = await repo.findByEmail("nonexistent@v8club.com");
    expect(user).toBeNull();
  });

  it("should return null for non-existent id", async () => {
    const user = await repo.findById("non-existent-id");
    expect(user).toBeNull();
  });

  it("should update user fields", async () => {
    const updated = await repo.update(createdUserId, {
      name: "Updated Name",
      verificationStatus: "verified",
      verifiedAt: new Date(),
    });

    expect(updated.name).toBe("Updated Name");
    expect(updated.verificationStatus).toBe("verified");
    expect(updated.verifiedAt).toBeTruthy();
  });

  it("should update card fields", async () => {
    const updated = await repo.update(createdUserId, {
      cardBrand: "visa",
      cardLast4: "1234",
      cardType: "credit",
      cardExpiry: "12/28",
      cardHolderName: "TEST USER",
      cardToken: "tok_test_123",
    });

    expect(updated.cardBrand).toBe("visa");
    expect(updated.cardLast4).toBe("1234");
    expect(updated.cardType).toBe("credit");
  });
});
