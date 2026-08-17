import { z } from "zod";
import { PAYMENT_METHODS } from "@/domain/entities";

// === Auth DTOs ===
export const RegisterInputSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(100),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  cpf: z.string().optional(),
  phone: z.string().optional(),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

// === Bid DTOs ===
export const CreateBidInputSchema = z
  .object({
    amount: z.number().int().positive("Valor deve ser positivo"),
    paymentMethod: z.enum(PAYMENT_METHODS),
    message: z.string().max(500).optional(),
    tradeVehicle: z.string().max(200).optional(),
    termsAccepted: z.boolean().optional(),
  })
  .refine((data) => data.paymentMethod !== "troca" || !!data.tradeVehicle, {
    message: "Para ofertas com troca, descreva o veículo oferecido",
    path: ["tradeVehicle"],
  });
export type CreateBidInput = z.infer<typeof CreateBidInputSchema>;

export const BidActionInputSchema = z.object({
  bidId: z.string().min(1),
  action: z.enum(["accept", "reject"]),
});
export type BidActionInput = z.infer<typeof BidActionInputSchema>;

// === Message DTOs ===
export const SendMessageInputSchema = z.object({
  content: z.string().min(1).max(1000),
  receiverId: z.string().optional(),
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

// === Card DTOs ===
export const LinkCardInputSchema = z.object({
  cardNumber: z.string().min(13).max(19),
  cardExpiry: z.string().regex(/^\d{2}\/\d{2}$/, "Use formato MM/AA"),
  cardHolderName: z.string().min(3, "Nome muito curto"),
  cardType: z.enum(["credit", "debit"]),
});
export type LinkCardInput = z.infer<typeof LinkCardInputSchema>;

// === Watchlist DTOs ===
export const AddToWatchlistInputSchema = z.object({
  vehicleId: z.string().min(1),
});
export type AddToWatchlistInput = z.infer<typeof AddToWatchlistInputSchema>;

// === Finalize DTOs ===
export const FinalizeInputSchema = z.object({
  bidId: z.string().min(1),
});
export type FinalizeInput = z.infer<typeof FinalizeInputSchema>;
