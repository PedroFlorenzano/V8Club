import { PrismaClient } from "@prisma/client";
import { ISaleRepository, IMessageRepository, IWatchlistRepository, CreateSaleData, CreateMessageData } from "@/application/ports";
import { Sale, Message, WatchlistItem } from "@/domain/entities";

// === Sale Repository ===
export class PrismaSaleRepository implements ISaleRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Sale | null> {
    return this.db.sale.findUnique({ where: { id } }) as Promise<Sale | null>;
  }

  async findByVehicleId(vehicleId: string): Promise<Sale | null> {
    return this.db.sale.findUnique({ where: { vehicleId } }) as Promise<Sale | null>;
  }

  async create(data: CreateSaleData): Promise<Sale> {
    return this.db.sale.create({ data }) as Promise<Sale>;
  }
}

// === Message Repository ===
export class PrismaMessageRepository implements IMessageRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByVehicleAndUsers(vehicleId: string, userId1: string, userId2: string): Promise<Message[]> {
    return this.db.message.findMany({
      where: {
        vehicleId,
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      orderBy: { createdAt: "asc" },
    }) as Promise<Message[]>;
  }

  async findByVehicle(vehicleId: string): Promise<Message[]> {
    return this.db.message.findMany({
      where: { vehicleId },
      orderBy: { createdAt: "asc" },
    }) as Promise<Message[]>;
  }

  async create(data: CreateMessageData): Promise<Message> {
    return this.db.message.create({ data }) as Promise<Message>;
  }

  async markAsRead(vehicleId: string, receiverId: string): Promise<void> {
    await this.db.message.updateMany({
      where: { vehicleId, receiverId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}

// === Watchlist Repository ===
export class PrismaWatchlistRepository implements IWatchlistRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUserId(userId: string): Promise<WatchlistItem[]> {
    return this.db.watchlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }) as Promise<WatchlistItem[]>;
  }

  async exists(userId: string, vehicleId: string): Promise<boolean> {
    const item = await this.db.watchlist.findUnique({
      where: { userId_vehicleId: { userId, vehicleId } },
    });
    return !!item;
  }

  async add(userId: string, vehicleId: string): Promise<WatchlistItem> {
    return this.db.watchlist.create({
      data: { userId, vehicleId },
    }) as Promise<WatchlistItem>;
  }

  async remove(userId: string, vehicleId: string): Promise<void> {
    await this.db.watchlist.deleteMany({
      where: { userId, vehicleId },
    });
  }
}
