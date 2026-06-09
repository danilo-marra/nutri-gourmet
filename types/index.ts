export type UserRole = "pending" | "operador" | "supervisor" | "admin";

export type Feature = string;

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  features: Feature[];
  created_at: Date;
  updated_at: Date;
}

export interface AnonymousUser {
  features: Feature[];
}

export type RequestUser = User | AnonymousUser;

export interface Session {
  id: string;
  token: string;
  user_id: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ActivationToken {
  id: string;
  user_id: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Student {
  id: string;
  name: string;
  class: string;
  is_full_time: boolean;
  balance: string;
  created_at: Date;
  updated_at: Date;
}

export type ProductCategory =
  | "lanche"
  | "bebida"
  | "vitamina"
  | "refeicao"
  | "sobremesa";

export interface Product {
  id: string;
  name: string;
  price: string;
  category: ProductCategory;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type PaymentMethod = "credit" | "cash" | "card" | "pix";

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  qty: number;
  unit_price: string;
}

export interface Sale {
  id: string;
  student_id: string;
  operator_id: string;
  payment_method: PaymentMethod;
  total: string;
  reversed_at: Date | null;
  reversed_by: string | null;
  created_at: Date;
  updated_at: Date;
  items?: SaleItem[];
}

export type CreditType = "manual" | "package" | "stone";

export interface CreditTransaction {
  id: string;
  student_id: string;
  operator_id: string;
  amount: string;
  type: CreditType;
  balance_after: string;
  expires_at: Date | null;
  stone_payment_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CashClose {
  id: string;
  operator_id: string;
  operator_username: string;
  closed_by_id: string | null;
  date: string;
  total_sales: string;
  total_credit: string;
  total_cash: string;
  total_card: string;
  total_pix: string;
  created_at: Date;
  updated_at: Date;
}

export interface StonePayment {
  id: string;
  stone_payment_id: string;
  amount: string;
  payer_name: string | null;
  payer_email: string | null;
  payment_method: string;
  matched_at: Date | null;
  matched_by_id: string | null;
  credit_transaction_id: string | null;
  created_at: Date;
}

export interface Migration {
  path: string;
  name: string;
  timestamp: number;
}
