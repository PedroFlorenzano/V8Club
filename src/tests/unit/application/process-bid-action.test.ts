import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProcessBidActionUseCase } from "@/application/use-cases";
import { IBidRepository, IVehicleRepository } from "@/application/ports";

describe("ProcessBidActionUseCase", () => {
  let useCase: ProcessBidActionUseCase;
  let mockBidRepo: IBidRepository;
  let mockVehicleRepo: IVehicleRepository;

  const mockVehicle = { id: "v-1", sellerId: "seller-1", status: "active" };
  const mockBid = { id: "bid-1", vehicleId: "v-1", bidderId: "buyer-1", status: "pending" };

  beforeEach(() => {
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
    useCase = new ProcessBidActionUseCase(mockBidRepo, mockVehicleRepo);
  });

  describe("accept", () => {
    it("should update bid to accepted", async () => {
      await useCase.execute({ bidId: "bid-1", action: "accept", vehicleId: "v-1", sellerId: "seller-1" });
      expect(mockBidRepo.updateStatus).toHaveBeenCalledWith("bid-1", "accepted");
    });

    it("should reject all other pending bids", async () => {
      await useCase.execute({ bidId: "bid-1", action: "accept", vehicleId: "v-1", sellerId: "seller-1" });
      expect(mockBidRepo.rejectAllPendingExcept).toHaveBeenCalledWith("v-1", "bid-1");
    });

    it("should mark vehicle as sold", async () => {
      await useCase.execute({ bidId: "bid-1", action: "accept", vehicleId: "v-1", sellerId: "seller-1" });
      expect(mockVehicleRepo.updateStatus).toHaveBeenCalledWith("v-1", "sold");
    });

    it("should return success message", async () => {
      const result = await useCase.execute({ bidId: "bid-1", action: "accept", vehicleId: "v-1", sellerId: "seller-1" });
      expect(result.message).toContain("aceita");
    });
  });

  describe("reject", () => {
    it("should update bid to rejected", async () => {
      await useCase.execute({ bidId: "bid-1", action: "reject", vehicleId: "v-1", sellerId: "seller-1" });
      expect(mockBidRepo.updateStatus).toHaveBeenCalledWith("bid-1", "rejected");
    });

    it("should NOT reject other bids", async () => {
      await useCase.execute({ bidId: "bid-1", action: "reject", vehicleId: "v-1", sellerId: "seller-1" });
      expect(mockBidRepo.rejectAllPendingExcept).not.toHaveBeenCalled();
    });

    it("should NOT change vehicle status", async () => {
      await useCase.execute({ bidId: "bid-1", action: "reject", vehicleId: "v-1", sellerId: "seller-1" });
      expect(mockVehicleRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("should reject if not the seller", async () => {
      await expect(
        useCase.execute({ bidId: "bid-1", action: "accept", vehicleId: "v-1", sellerId: "random-user" })
      ).rejects.toThrow("Apenas o vendedor");
    });

    it("should reject if vehicle not found", async () => {
      (mockVehicleRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(
        useCase.execute({ bidId: "bid-1", action: "accept", vehicleId: "v-999", sellerId: "seller-1" })
      ).rejects.toThrow("Veículo não encontrado");
    });

    it("should reject if bid not found", async () => {
      (mockBidRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(
        useCase.execute({ bidId: "bid-999", action: "accept", vehicleId: "v-1", sellerId: "seller-1" })
      ).rejects.toThrow("Oferta não encontrada");
    });

    it("should reject if bid belongs to different vehicle", async () => {
      (mockBidRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockBid, vehicleId: "v-other" });
      await expect(
        useCase.execute({ bidId: "bid-1", action: "accept", vehicleId: "v-1", sellerId: "seller-1" })
      ).rejects.toThrow("Oferta não encontrada");
    });
  });
});
