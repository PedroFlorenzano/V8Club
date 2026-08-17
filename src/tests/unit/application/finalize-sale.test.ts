import { describe, it, expect, vi, beforeEach } from "vitest";
import { FinalizeSaleUseCase } from "@/application/use-cases";
import { IBidRepository, IVehicleRepository, ISaleRepository, IUserRepository } from "@/application/ports";

describe("FinalizeSaleUseCase", () => {
  let useCase: FinalizeSaleUseCase;
  let mockSaleRepo: ISaleRepository;
  let mockBidRepo: IBidRepository;
  let mockVehicleRepo: IVehicleRepository;
  let mockUserRepo: IUserRepository;

  const mockVehicle = { id: "v-1", sellerId: "seller-1", status: "active" };
  const mockBid = { id: "bid-1", vehicleId: "v-1", bidderId: "buyer-1", amount: 500000, platformFee: 25000, paymentMethod: "pix", status: "pending" };
  const mockBuyer = { id: "buyer-1", email: "buyer@test.com", phone: "11999999999", cpf: "12345678909" };
  const mockSeller = { id: "seller-1", email: "seller@test.com", phone: "11888888888", cpf: "98765432100" };

  beforeEach(() => {
    mockSaleRepo = {
      findById: vi.fn(),
      findByVehicleId: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "sale-1", vehicleId: "v-1" }),
    };
    mockBidRepo = {
      findById: vi.fn().mockResolvedValue(mockBid),
      findByVehicleId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      rejectAllPendingExcept: vi.fn(),
    };
    mockVehicleRepo = {
      findById: vi.fn().mockResolvedValue(mockVehicle),
      findByStatus: vi.fn(),
      updateStatus: vi.fn(),
    };
    mockUserRepo = {
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === "buyer-1") return Promise.resolve(mockBuyer);
        if (id === "seller-1") return Promise.resolve(mockSeller);
        return Promise.resolve(null);
      }),
      findByEmail: vi.fn(),
      findByCpf: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    useCase = new FinalizeSaleUseCase(mockSaleRepo, mockBidRepo, mockVehicleRepo, mockUserRepo);
  });

  it("should create sale with contact snapshot", async () => {
    const result = await useCase.execute({ vehicleId: "v-1", bidId: "bid-1", sellerId: "seller-1" });

    expect(mockSaleRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerEmail: "buyer@test.com",
        sellerEmail: "seller@test.com",
        salePrice: 500000,
      })
    );
    expect(result.id).toBe("sale-1");
  });

  it("should accept bid and reject others", async () => {
    await useCase.execute({ vehicleId: "v-1", bidId: "bid-1", sellerId: "seller-1" });

    expect(mockBidRepo.updateStatus).toHaveBeenCalledWith("bid-1", "accepted");
    expect(mockBidRepo.rejectAllPendingExcept).toHaveBeenCalledWith("v-1", "bid-1");
    expect(mockVehicleRepo.updateStatus).toHaveBeenCalledWith("v-1", "sold");
  });

  it("should reject if not the seller", async () => {
    await expect(
      useCase.execute({ vehicleId: "v-1", bidId: "bid-1", sellerId: "random-user" })
    ).rejects.toThrow("Apenas o vendedor pode finalizar");
  });

  it("should reject if sale already exists", async () => {
    (mockSaleRepo.findByVehicleId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "existing-sale" });

    await expect(
      useCase.execute({ vehicleId: "v-1", bidId: "bid-1", sellerId: "seller-1" })
    ).rejects.toThrow("Venda já finalizada");
  });

  it("should reject if bid not found", async () => {
    (mockBidRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      useCase.execute({ vehicleId: "v-1", bidId: "bid-999", sellerId: "seller-1" })
    ).rejects.toThrow("Oferta não encontrada");
  });

  it("should reject if vehicle not found", async () => {
    (mockVehicleRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      useCase.execute({ vehicleId: "v-999", bidId: "bid-1", sellerId: "seller-1" })
    ).rejects.toThrow("Veículo não encontrado");
  });

  it("should not re-accept already accepted bid", async () => {
    (mockBidRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockBid, status: "accepted" });

    await useCase.execute({ vehicleId: "v-1", bidId: "bid-1", sellerId: "seller-1" });
    expect(mockBidRepo.updateStatus).not.toHaveBeenCalled();
  });
});
