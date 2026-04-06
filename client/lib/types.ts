export interface Receipt {
  id?: string;
  merchantName: string;
  category?: { id: number; name: string };
  categoryId?: number; // for create request
  totalAmount: number;
  receiptDate: string;
  imageUrl?: string;
  isVerified: boolean;
  ocrConfidence: number;
  notes?: string;
  items: LineItem[];
}

export interface LineItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface MonthlySummary {
  totalSpent: number;
  budget: number;
  remaining: number;
  percentUsed: number;
  month: string;
  year: number;
}

export interface CategorySummary {
  category: string;
  spent: number;
  budget: number;
  remaining: number;
  icon: string;
  color: string;
}

export interface SpendingTrend {
  month: string;
  amount: number;
  isCurrent: boolean;
}

export interface Budget {
  category: string;
  amount: number;
  icon: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  initials: string;
}

export type UploadStep =
  | "idle"
  | "uploading"
  | "processing"
  | "reviewing"
  | "saved";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RegistrationResponse {
  id: string;
  name: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}
