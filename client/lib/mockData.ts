import { Receipt, MonthlySummary, CategorySummary, SpendingTrend, Budget, UserProfile, Category } from "./types";

export const CATEGORIES: Category[] = [
  { id: "food", name: "Food & Dining", icon: "🍔", color: "#7C3AED" },
  { id: "transport", name: "Transport", icon: "🚗", color: "#F97316" },
  { id: "shopping", name: "Shopping", icon: "🛍️", color: "#3B82F6" },
  { id: "bills", name: "Bills & Utilities", icon: "💡", color: "#10B981" },
  { id: "health", name: "Healthcare", icon: "🏥", color: "#EF4444" },
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "#F59E0B" },
  { id: "groceries", name: "Groceries", icon: "🛒", color: "#6366F1" },
];

export const MOCK_USER: UserProfile = {
  name: "Omkar Padalkar",
  email: "omkar@example.com",
  initials: "OP",
};

export const MOCK_SUMMARY: MonthlySummary = {
  totalSpent: 12450,
  budget: 20000,
  remaining: 7550,
  percentUsed: 62,
  month: "March",
  year: 2026,
};

export const MOCK_TRENDS: SpendingTrend[] = [
  { month: "Oct", amount: 14200, isCurrent: false },
  { month: "Nov", amount: 11800, isCurrent: false },
  { month: "Dec", amount: 18500, isCurrent: false },
  { month: "Jan", amount: 9600, isCurrent: false },
  { month: "Feb", amount: 15300, isCurrent: false },
  { month: "Mar", amount: 12450, isCurrent: true },
];

export const MOCK_CATEGORY_SUMMARY: CategorySummary[] = [
  { category: "Food & Dining", spent: 4500, budget: 6000, remaining: 1500, icon: "🍔", color: "#7C3AED" },
  { category: "Transport", spent: 2400, budget: 2000, remaining: -400, icon: "🚗", color: "#F97316" },
  { category: "Shopping", spent: 1800, budget: 3000, remaining: 1200, icon: "🛍️", color: "#3B82F6" },
  { category: "Bills & Utilities", spent: 1500, budget: 2500, remaining: 1000, icon: "💡", color: "#10B981" },
  { category: "Healthcare", spent: 800, budget: 2000, remaining: 1200, icon: "🏥", color: "#EF4444" },
  { category: "Entertainment", spent: 950, budget: 2000, remaining: 1050, icon: "🎬", color: "#F59E0B" },
  { category: "Groceries", spent: 500, budget: 2500, remaining: 2000, icon: "🛒", color: "#6366F1" },
];

export const MOCK_RECEIPTS: Receipt[] = [
  {
    id: "r1",
    merchantName: "Big Bazaar",
    category: "Groceries",
    amount: 845.5,
    date: "2026-03-03",
    imageUrl: "/receipt-placeholder.jpg",
    isVerified: true,
    ocrConfidence: 0.95,
    notes: "Monthly grocery shopping",
    lineItems: [
      { id: "li1", name: "Rice 5kg", quantity: 1, unitPrice: 320, total: 320 },
      { id: "li2", name: "Cooking Oil 1L", quantity: 2, unitPrice: 145, total: 290 },
      { id: "li3", name: "Dal 1kg", quantity: 1, unitPrice: 120, total: 120 },
      { id: "li4", name: "Spices Pack", quantity: 1, unitPrice: 115.5, total: 115.5 },
    ],
  },
  {
    id: "r2",
    merchantName: "Uber India",
    category: "Transport",
    amount: 342,
    date: "2026-03-03",
    imageUrl: "/receipt-placeholder.jpg",
    isVerified: false,
    ocrConfidence: 0.82,
    lineItems: [
      { id: "li5", name: "Ride - Office to Home", quantity: 1, unitPrice: 342, total: 342 },
    ],
  },
  {
    id: "r3",
    merchantName: "Zomato",
    category: "Food & Dining",
    amount: 520,
    date: "2026-03-02",
    imageUrl: "/receipt-placeholder.jpg",
    isVerified: true,
    ocrConfidence: 0.91,
    lineItems: [
      { id: "li6", name: "Biryani", quantity: 1, unitPrice: 350, total: 350 },
      { id: "li7", name: "Bottled Water", quantity: 2, unitPrice: 20, total: 40 },
      { id: "li8", name: "Delivery Fee", quantity: 1, unitPrice: 30, total: 30 },
      { id: "li9", name: "Taxes & Charges", quantity: 1, unitPrice: 100, total: 100 },
    ],
  },
  {
    id: "r4",
    merchantName: "Amazon India",
    category: "Shopping",
    amount: 1299,
    date: "2026-03-01",
    imageUrl: "/receipt-placeholder.jpg",
    isVerified: true,
    ocrConfidence: 0.98,
    notes: "Phone case and screen guard",
    lineItems: [
      { id: "li10", name: "Phone Case", quantity: 1, unitPrice: 799, total: 799 },
      { id: "li11", name: "Screen Guard", quantity: 1, unitPrice: 500, total: 500 },
    ],
  },
  {
    id: "r5",
    merchantName: "Apollo Pharmacy",
    category: "Healthcare",
    amount: 680,
    date: "2026-02-28",
    imageUrl: "/receipt-placeholder.jpg",
    isVerified: false,
    ocrConfidence: 0.55,
    lineItems: [
      { id: "li12", name: "Medicines", quantity: 1, unitPrice: 680, total: 680 },
    ],
  },
  {
    id: "r6",
    merchantName: "PVR Cinemas",
    category: "Entertainment",
    amount: 950,
    date: "2026-02-27",
    imageUrl: "/receipt-placeholder.jpg",
    isVerified: true,
    ocrConfidence: 0.88,
    lineItems: [
      { id: "li13", name: "Movie Ticket", quantity: 2, unitPrice: 350, total: 700 },
      { id: "li14", name: "Popcorn Combo", quantity: 1, unitPrice: 250, total: 250 },
    ],
  },
  {
    id: "r7",
    merchantName: "Reliance Fresh",
    category: "Groceries",
    amount: 1120,
    date: "2026-02-26",
    imageUrl: "/receipt-placeholder.jpg",
    isVerified: true,
    ocrConfidence: 0.92,
    lineItems: [
      { id: "li15", name: "Fruits & Vegetables", quantity: 1, unitPrice: 450, total: 450 },
      { id: "li16", name: "Milk 1L", quantity: 4, unitPrice: 60, total: 240 },
      { id: "li17", name: "Bread", quantity: 2, unitPrice: 45, total: 90 },
      { id: "li18", name: "Eggs (12pk)", quantity: 1, unitPrice: 85, total: 85 },
      { id: "li19", name: "Snacks", quantity: 1, unitPrice: 255, total: 255 },
    ],
  },
];

export const MOCK_BUDGETS: Budget[] = [
  { category: "Food & Dining", amount: 6000, icon: "🍔" },
  { category: "Transport", amount: 2000, icon: "🚗" },
  { category: "Shopping", amount: 3000, icon: "🛍️" },
  { category: "Bills & Utilities", amount: 2500, icon: "💡" },
  { category: "Healthcare", amount: 2000, icon: "🏥" },
  { category: "Entertainment", amount: 2000, icon: "🎬" },
  { category: "Groceries", amount: 2500, icon: "🛒" },
];
