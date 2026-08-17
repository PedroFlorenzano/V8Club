import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateBidUseCase } from "@/application/use-cases";
import { IBidRepository, IVehicleRepository } from "@/application/ports";

describe("CreateBidUseCase", () => {
  let useCase: CreateBidUseCase;
  let mockBidRepo: IBidRepository;
  let mockVehicleRepo: IVehicleRepository;

  const mockVehicle = {
    id: "v-1",
    sellerId: "seller-1",
    status: "approved" as const,
    auctionEnd: new Date(Date.now() + 86400000),
    brand: "VW",
    model: "Golf",
    year: 2015,
    version: null,
    color: "Branco",
    mileage: 50000,
    fuel: "Gasolina",
    transmission: "Manual",
    plate: null,
    chassi: null,
    title: "Golf GTI",
    description: "test",
    highlights: null,
    fipePrice: null,
    reservePrice: null,
    startingBid: 0,
    auctionStart: null,
    aiScore: null,
    aiAnalysis: null,
    aiApproved: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockBidRepo = {
      findById: vi.fn(),
      findByVehicleId: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: "bid-1", amount: 100000, platformFee: 5000 }),
      updateStatus: vi.fn(),
      rejectAllPendingExcept: vi.fn(),
    };
    mockVehicleRepo = {
      findById: vi.fn().mockResolvedValue(mockVehicle),
      findByStatus: vi.fn(),
      updateStatus: vi.fn(),
    };
    useCase = new CreateBidUseCase(mockBidRepo, mockVehicleRepo);
  });

  it("should create bid with calculated platform fee", async () => {
    const result = await useCase.execute({
      vehicleId: "v-1",
      bidderId: "buyer-1",
      verificationStatus: "verified",
      amount: 100000,
      paymentMethod: "pix",
    });

    expect(result.platformFee).toBe(5000);
    expect(mockBidRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 100000,
        platformFee: 5000,
        paymentMethod: "pix",
        bidderId: "buyer-1",
      })
    );
  });

  it("should activate vehicle on first bid", async () => {
    await useCase.execute({
      vehicleId: "v-1",
      bidderId: "buyer-1",
      verificationStatus: "verified",
      amount: 100000,
      paymentMethod: "pix",
    });

    expect(mockVehicleRepo.updateStatus).toHaveBeenCalledWith("v-1", "active");
  });

  it("should NOT activate vehicle if already active", async () => {
    (mockVehicleRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockVehicle,
      status: "active",
    });

    await useCase.execute({
      vehicleId: "v-1",
      bidderId: "buyer-1",
      verificationStatus: "verified",
      amount: 100000,
      paymentMethod: "pix",
    });

    expect(mockVehicleRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("should reject if seller bids on own vehicle", async () => {
    await expect(
      useCase.execute({
        vehicleId: "v-1",
        bidderId: "seller-1",
        verificationStatus: "verified",
        amount: 100000,
        paymentMethod: "pix",
      })
    ).rejects.toThrow("Vendedor não pode fazer oferta");
  });

  it("should reject if user not verified", async () => {
    await expect(
      useCase.execute({
        vehicleId: "v-1",
        bidderId: "buyer-1",
        verificationStatus: "unverified",
        amount: 100000,
        paymentMethod: "pix",
      })
    ).rejects.toThrow("verificar sua identidade");
  });

  it("should reject if vehicle not found", async () => {
    (mockVehicleRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      useCase.execute({
        vehicleId: "v-999",
        bidderId: "buyer-1",
        verificationStatus: "verified",
        amount: 100000,
        paymentMethod: "pix",
      })
    ).rejects.toThrow("Veículo não encontrado");
  });

  it("should cap platform fee at R$5.000", async () => {
    await useCase.execute({
      vehicleId: "v-1",
      bidderId: "buyer-1",
      verificationStatus: "verified",
      amount: 20_000_000, // R$ 200.000
      paymentMethod: "pix",
    });

    expect(mockBidRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ platformFee: 500_000 })
    );
  });
});
