import { User, Vehicle, Bid, BidStatus, Sale, Message, WatchlistItem } from "@/domain/entities";

// === User Repository ===
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByCpf(cpf: string): Promise<User | null>;
  create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

// === Vehicle Repository ===
export interface IVehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findByStatus(statuses: string[]): Promise<Vehicle[]>;
  updateStatus(id: string, status: string): Promise<void>;
}

// === Bid Repository ===
export interface CreateBidData {
  amount: number;
  paymentMethod: string;
  message: string | null;
  tradeVehicle: string | null;
  platformFee: number;
  termsAccepted: boolean;
  vehicleId: string;
  bidderId: string;
}

export interface IBidRepository {
  findById(id: string): Promise<Bid | null>;
  findByVehicleId(vehicleId: string): Promise<Bid[]>;
  create(data: CreateBidData): Promise<Bid>;
  updateStatus(id: string, status: BidStatus): Promise<void>;
  rejectAllPendingExcept(vehicleId: string, exceptBidId: string): Promise<void>;
}

// === Sale Repository ===
export interface CreateSaleData {
  vehicleId: string;
  bidId: string;
  buyerId: string;
  sellerId: string;
  salePrice: number;
  platformFee: number;
  paymentMethod: string;
  buyerEmail: string;
  buyerPhone: string | null;
  buyerCpf: string | null;
  sellerEmail: string;
  sellerPhone: string | null;
  sellerCpf: string | null;
}

export interface ISaleRepository {
  findById(id: string): Promise<Sale | null>;
  findByVehicleId(vehicleId: string): Promise<Sale | null>;
  create(data: CreateSaleData): Promise<Sale>;
}

// === Message Repository ===
export interface CreateMessageData {
  content: string;
  senderId: string;
  receiverId: string;
  vehicleId: string;
}

export interface IMessageRepository {
  findByVehicleAndUsers(vehicleId: string, userId1: string, userId2: string): Promise<Message[]>;
  findByVehicle(vehicleId: string): Promise<Message[]>;
  create(data: CreateMessageData): Promise<Message>;
  markAsRead(vehicleId: string, receiverId: string): Promise<void>;
}

// === Watchlist Repository ===
export interface IWatchlistRepository {
  findByUserId(userId: string): Promise<WatchlistItem[]>;
  exists(userId: string, vehicleId: string): Promise<boolean>;
  add(userId: string, vehicleId: string): Promise<WatchlistItem>;
  remove(userId: string, vehicleId: string): Promise<void>;
}

// === Auth Ports ===
export interface IHasher {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hashed: string): Promise<boolean>;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  verificationStatus: string;
}

export interface ITokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload | null;
}

export interface ISessionService {
  set(token: string): Promise<void>;
  clear(): Promise<void>;
  get(): Promise<TokenPayload | null>;
}

// === External Services ===
export interface IPriceProvider {
  getPrice(brand: string, model: string, year: number): Promise<number | null>;
}

export interface IPaymentGateway {
  tokenize(cardData: { number: string; expiry: string; holder: string }): Promise<string>;
}
