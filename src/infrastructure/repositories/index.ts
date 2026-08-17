import { PrismaClient } from "@prisma/client";
import { IUserRepository, IBidRepository, IVehicleRepository, CreateBidData } from "@/application/ports";
import { User, Vehicle, Bid, BidStatus } from "@/domain/entities";

// === User Repository ===
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } }) as Promise<User | null>;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } }) as Promise<User | null>;
  }

  async findByCpf(cpf: string): Promise<User | null> {
    return this.db.user.findFirst({ where: { cpf } }) as Promise<User | null>;
  }

  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    return this.db.user.create({ data: data as Parameters<typeof this.db.user.create>[0]["data"] }) as Promise<User>;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const { id: _id, createdAt: _c, updatedAt: _u, ...updateData } = data as Record<string, unknown>;
    void _id; void _c; void _u;
    return this.db.user.update({ where: { id }, data: updateData }) as Promise<User>;
  }
}

// === Vehicle Repository ===
export class PrismaVehicleRepository implements IVehicleRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Vehicle | null> {
    return this.db.vehicle.findUnique({ where: { id } }) as Promise<Vehicle | null>;
  }

  async findByStatus(statuses: string[]): Promise<Vehicle[]> {
    return this.db.vehicle.findMany({
      where: { status: { in: statuses } },
      orderBy: { createdAt: "desc" },
    }) as Promise<Vehicle[]>;
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.db.vehicle.update({ where: { id }, data: { status } });
  }
}

// === Bid Repository ===
export class PrismaBidRepository implements IBidRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Bid | null> {
    return this.db.bid.findUnique({ where: { id } }) as Promise<Bid | null>;
  }

  async findByVehicleId(vehicleId: string): Promise<Bid[]> {
    return this.db.bid.findMany({
      where: { vehicleId },
      orderBy: { createdAt: "desc" },
    }) as Promise<Bid[]>;
  }

  async create(data: CreateBidData): Promise<Bid> {
    return this.db.bid.create({
      data: { ...data, status: "pending" },
    }) as Promise<Bid>;
  }

  async updateStatus(id: string, status: BidStatus): Promise<void> {
    await this.db.bid.update({ where: { id }, data: { status } });
  }

  async rejectAllPendingExcept(vehicleId: string, exceptBidId: string): Promise<void> {
    await this.db.bid.updateMany({
      where: { vehicleId, id: { not: exceptBidId }, status: "pending" },
      data: { status: "rejected" },
    });
  }
}
