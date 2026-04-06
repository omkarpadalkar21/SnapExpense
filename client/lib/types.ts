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
  totalSpent: number;   // was totalSpend in old DTO
  budget: number;       // was totalBudget
  remaining: number;    // was remainingBudget
  percentUsed: number;
  month: string;
  year: number;
}

export interface CategorySummary {
  category: string;     // category name
  icon: string;         // emoji from Category.icon
  color: string;        // hex from Category.color
  spent: number;        // was totalSpend
  budget: number;       // was totalBudget
  remaining: number;    // was remainingBudget
  percentUsed: number;
}

export interface SpendingTrend {
  month: string;        // "yyyy-MM" format
  amount: number;       // was totalSpent
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
