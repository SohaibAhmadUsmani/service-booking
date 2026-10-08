import { PaymentStatus } from "./domain";

export enum PaymentMethod {
  Card = "card",
  BankTransfer = "bank_transfer",
  Cash = "cash",
  Wallet = "wallet",
}

export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  transactionReference?: string;
  failureReason?: string;
  paidAt?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  bookingId: string;
  currency?: string;
  method?: PaymentMethod;
}

export interface PaymentListQuery {
  bookingId?: string;
  customerId?: string;
  providerId?: string;
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}
