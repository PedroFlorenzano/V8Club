// === User ===
export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const VERIFICATION_STATUSES = [
  "unverified",
  "pending_docs",
  "pending_selfie",
  "pending_review",
  "verified",
  "rejected",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  cpf: string | null;
  phone: string | null;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  verifiedAt: Date | null;
  docFrontUrl: string | null;
  docBackUrl: string | null;
  selfieUrl: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  cardType: string | null;
  cardExpiry: string | null;
  cardHolderName: string | null;
  cardToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// === Vehicle ===
export const VEHICLE_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "active",
  "sold",
  "expired",
] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  version: string | null;
  color: string;
  mileage: number;
  fuel: string;
  transmission: string;
  plate: string | null;
  chassi: string | null;
  title: string;
  description: string;
  highlights: string | null;
  fipePrice: number | null;
  reservePrice: number | null;
  startingBid: number;
  status: VehicleStatus;
  auctionStart: Date | null;
  auctionEnd: Date | null;
  aiScore: number | null;
  aiAnalysis: string | null;
  aiApproved: boolean | null;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// === Bid ===
export const BID_STATUSES = ["pending", "accepted", "rejected", "expired"] as const;
export type BidStatus = (typeof BID_STATUSES)[number];

export const PAYMENT_METHODS = [
  "pix",
  "financiamento",
  "consorcio",
  "troca",
  "boleto",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Bid {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  message: string | null;
  tradeVehicle: string | null;
  status: BidStatus;
  platformFee: number;
  termsAccepted: boolean;
  vehicleId: string;
  bidderId: string;
  createdAt: Date;
}

// === Sale ===
export interface Sale {
  id: string;
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
  paymentConfirmed: boolean;
  vehicleDelivered: boolean;
  titleTransferred: boolean;
  createdAt: Date;
  completedAt: Date | null;
}

// === Message ===
export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  vehicleId: string;
  readAt: Date | null;
  createdAt: Date;
}

// === Watchlist ===
export interface WatchlistItem {
  id: string;
  userId: string;
  vehicleId: string;
  createdAt: Date;
}
