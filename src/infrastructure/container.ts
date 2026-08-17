import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserRepository, PrismaVehicleRepository, PrismaBidRepository } from "@/infrastructure/repositories";
import { PrismaSaleRepository, PrismaMessageRepository, PrismaWatchlistRepository } from "@/infrastructure/repositories/extended";
import { BcryptHasher, JwtTokenService, CookieSessionService } from "@/infrastructure/auth";
import { FipePriceProvider, FakePaymentGateway } from "@/infrastructure/services";
import { CreateBidUseCase, FinalizeSaleUseCase, ProcessBidActionUseCase } from "@/application/use-cases";

// Repositories (singletons por request lifecycle do Next.js)
const userRepo = new PrismaUserRepository(prisma);
const vehicleRepo = new PrismaVehicleRepository(prisma);
const bidRepo = new PrismaBidRepository(prisma);
const saleRepo = new PrismaSaleRepository(prisma);
const messageRepo = new PrismaMessageRepository(prisma);
const watchlistRepo = new PrismaWatchlistRepository(prisma);

// Infrastructure services
const hasher = new BcryptHasher();
const tokenService = new JwtTokenService();
const sessionService = new CookieSessionService();
const priceProvider = new FipePriceProvider();
const paymentGateway = new FakePaymentGateway();

// Use Cases (instanciados com dependências injetadas)
export const container = {
  // Use Cases
  createBid: new CreateBidUseCase(bidRepo, vehicleRepo),
  processBidAction: new ProcessBidActionUseCase(bidRepo, vehicleRepo),
  finalizeSale: new FinalizeSaleUseCase(saleRepo, bidRepo, vehicleRepo, userRepo),

  // Repositories (acesso direto quando route precisa de query custom)
  userRepo,
  vehicleRepo,
  bidRepo,
  saleRepo,
  messageRepo,
  watchlistRepo,

  // Auth services
  hasher,
  tokenService,
  sessionService,

  // External services
  priceProvider,
  paymentGateway,
};

export type Container = typeof container;
