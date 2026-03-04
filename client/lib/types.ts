export interface Receipt {
  id: string;
  merchantName: string;
  category: string;
  amount: number;
  date: string;
  imageUrl?: string;
  isVerified: boolean;
  ocrConfidence: number;
  notes?: string;
  lineItems: LineItem[];
}

export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
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

export type UploadStep = "idle" | "uploading" | "processing" | "reviewing" | "saved";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}
