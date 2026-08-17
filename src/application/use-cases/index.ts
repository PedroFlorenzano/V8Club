import { IBidRepository, IVehicleRepository, ISaleRepository, IUserRepository } from "@/application/ports";
import { PlatformFeeCalculator, BidRulesService } from "@/domain/services";
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from "@/domain/errors";
import { CreateBidInput } from "@/application/dtos";

// === CreateBidUseCase ===
export class CreateBidUseCase {
  constructor(
    private readonly bidRepo: IBidRepository,
    private readonly vehicleRepo: IVehicleRepository
  ) {}

  async execute(input: CreateBidInput & { vehicleId: string; bidderId: string; verificationStatus: string }) {
    // Buscar veículo
    const vehicle = await this.vehicleRepo.findById(input.vehicleId);
    if (!vehicle) throw new NotFoundError("Veículo não encontrado");

    // Verificar regras de negócio
    const rules = BidRulesService.canBid({
      vehicleStatus: vehicle.status,
      vehicleSellerId: vehicle.sellerId,
      bidderId: input.bidderId,
      auctionEnd: vehicle.auctionEnd,
      verificationStatus: input.verificationStatus,
    });

    if (!rules.allowed) {
      if (rules.reason?.includes("verificar")) throw new ForbiddenError(rules.reason);
      if (rules.reason?.includes("Vendedor")) throw new ForbiddenError(rules.reason);
      throw new ValidationError(rules.reason!);
    }

    // Calcular taxa
    const platformFee = PlatformFeeCalculator.calculate(input.amount);

    // Criar bid
    const bid = await this.bidRepo.create({
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      message: input.message || null,
      tradeVehicle: input.tradeVehicle || null,
      platformFee,
      termsAccepted: true,
      vehicleId: input.vehicleId,
      bidderId: input.bidderId,
    });

    // Ativar veículo se primeira oferta
    if (vehicle.status === "approved") {
      await this.vehicleRepo.updateStatus(input.vehicleId, "active");
    }

    return { bid, platformFee };
  }
}

// === FinalizeSaleUseCase ===
export class FinalizeSaleUseCase {
  constructor(
    private readonly saleRepo: ISaleRepository,
    private readonly bidRepo: IBidRepository,
    private readonly vehicleRepo: IVehicleRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(input: { vehicleId: string; bidId: string; sellerId: string }) {
    const vehicle = await this.vehicleRepo.findById(input.vehicleId);
    if (!vehicle) throw new NotFoundError("Veículo não encontrado");
    if (vehicle.sellerId !== input.sellerId) throw new ForbiddenError("Apenas o vendedor pode finalizar");

    const existingSale = await this.saleRepo.findByVehicleId(input.vehicleId);
    if (existingSale) throw new ConflictError("Venda já finalizada");

    const bid = await this.bidRepo.findById(input.bidId);
    if (!bid || bid.vehicleId !== input.vehicleId) throw new NotFoundError("Oferta não encontrada");

    const buyer = await this.userRepo.findById(bid.bidderId);
    const seller = await this.userRepo.findById(vehicle.sellerId);
    if (!buyer || !seller) throw new NotFoundError("Usuário não encontrado");

    // Aceitar bid + rejeitar outras + marcar como vendido
    if (bid.status !== "accepted") {
      await this.bidRepo.updateStatus(input.bidId, "accepted");
    }
    await this.bidRepo.rejectAllPendingExcept(input.vehicleId, input.bidId);
    await this.vehicleRepo.updateStatus(input.vehicleId, "sold");

    // Criar Sale com snapshot de contatos
    const sale = await this.saleRepo.create({
      vehicleId: input.vehicleId,
      bidId: input.bidId,
      buyerId: bid.bidderId,
      sellerId: vehicle.sellerId,
      salePrice: bid.amount,
      platformFee: bid.platformFee,
      paymentMethod: bid.paymentMethod,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone,
      buyerCpf: buyer.cpf,
      sellerEmail: seller.email,
      sellerPhone: seller.phone,
      sellerCpf: seller.cpf,
    });

    return sale;
  }
}

// === ProcessBidActionUseCase ===
export class ProcessBidActionUseCase {
  constructor(
    private readonly bidRepo: IBidRepository,
    private readonly vehicleRepo: IVehicleRepository
  ) {}

  async execute(input: { bidId: string; action: "accept" | "reject"; vehicleId: string; sellerId: string }) {
    const vehicle = await this.vehicleRepo.findById(input.vehicleId);
    if (!vehicle) throw new NotFoundError("Veículo não encontrado");
    if (vehicle.sellerId !== input.sellerId) throw new ForbiddenError("Apenas o vendedor pode gerenciar ofertas");

    const bid = await this.bidRepo.findById(input.bidId);
    if (!bid || bid.vehicleId !== input.vehicleId) throw new NotFoundError("Oferta não encontrada");

    if (input.action === "accept") {
      await this.bidRepo.updateStatus(input.bidId, "accepted");
      await this.bidRepo.rejectAllPendingExcept(input.vehicleId, input.bidId);
      await this.vehicleRepo.updateStatus(input.vehicleId, "sold");
      return { message: "Oferta aceita! Venda finalizada." };
    } else {
      await this.bidRepo.updateStatus(input.bidId, "rejected");
      return { message: "Oferta recusada." };
    }
  }
}
