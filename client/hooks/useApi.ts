import { api } from "@/lib/api";
import { useCanUseAuthenticatedApi } from "@/lib/authHydration";
import {
  Budget,
  CategorySummary,
  LoginResponse,
  MonthlySummary,
  Receipt,
  RegistrationResponse,
  SpendingTrend,
  UserProfile,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// ─── User Profile ──────────────────────────────────────────────────────────────

export const useUserProfile = () => {
  const canFetch = useCanUseAuthenticatedApi();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: () => api.get<UserProfile>("/user/profile"),
    enabled: canFetch,
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) =>
      api.put<UserProfile>("/user/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
};

export const useDeleteUserProfile = () => {
  return useMutation({
    mutationFn: () => api.delete("/user/profile"),
  });
};

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const useAuthLogin = () => {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<LoginResponse>("/auth/login", data),
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
    },
  });
};

export const useAuthRegister = () => {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<RegistrationResponse>("/auth/register", data),
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
    },
  });
};

// ─── Categories ────────────────────────────────────────────────────────────────

export const useGetCategories = () => {
  const canFetch = useCanUseAuthenticatedApi();
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ id: number; name: string; icon: string; color: string }[]>("/categories"),
    enabled: canFetch,
    staleTime: Infinity, // Categories rarely change — cache forever per session
  });
};

// Shape matching the backend's GetBudgetResponse DTO
interface GetBudgetResponse {
  categoryId: number;
  categoryName: string;
  month: string;
  budget: number;
}

// Shape matching the backend's SetBudgetRequest.BudgetEntry DTO
interface BudgetEntry {
  categoryId: number;
  budget: number;
}

export const useGetBudgetByMonth = (month?: string) => {
  const canFetch = useCanUseAuthenticatedApi();
  return useQuery({
    queryKey: ["budgets", month],
    queryFn: () => api.get<GetBudgetResponse[]>("/budgets", month ? { month } : undefined),
    enabled: canFetch,
  });
};

export const useSetBudgetByMonth = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { month: string; budgets: BudgetEntry[] }) =>
      api.put<{ month: string; updated: number }>("/budgets", data),
    onSuccess: (_, variables) => {
      // Refresh budgets for this month
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.month] });
      // Also refresh expenses so analytics (category cards, donut chart) update
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
};

// ─── Expenses ──────────────────────────────────────────────────────────────────

export const useExpensesSummary = (month?: string) => {
  const canFetch = useCanUseAuthenticatedApi();
  return useQuery({
    queryKey: ["expenses", "summary", month],
    queryFn: () =>
      api.get<MonthlySummary>(
        "/expenses/summary",
        month ? { month } : undefined,
      ),
    enabled: canFetch,
  });
};

export const useExpensesSummaryCategories = (month?: string) => {
  const canFetch = useCanUseAuthenticatedApi();
  return useQuery({
    queryKey: ["expenses", "categories", month],
    queryFn: () =>
      api.get<CategorySummary[]>(
        "/expenses/summary/categories",
        month ? { month } : undefined,
      ),
    enabled: canFetch,
  });
};

export const useSpendingTrend = (months: number = 6) => {
  const canFetch = useCanUseAuthenticatedApi();
  return useQuery({
    queryKey: ["expenses", "trend", months],
    queryFn: () =>
      api.get<SpendingTrend[]>("/expenses/trend", {
        months: months.toString(),
      }),
    enabled: canFetch,
  });
};

// ─── Receipts ──────────────────────────────────────────────────────────────────

export const useGetReceipts = (params?: {
  month?: string;
  categoryId?: string;
  page?: number;
  size?: number;
  sort?: string;
}) => {
  const canFetch = useCanUseAuthenticatedApi();
  return useQuery({
    queryKey: ["receipts", params],
    queryFn: () => {
      const qParams: Record<string, string> = {};
      if (params?.month) qParams.month = params.month;
      if (params?.categoryId) qParams.categoryId = params.categoryId;
      if (params?.page !== undefined) qParams.page = params.page.toString();
      if (params?.size !== undefined) qParams.size = params.size.toString();
      if (params?.sort) qParams.sort = params.sort;
      return api.get<PageResponse<Receipt>>("/receipts", qParams);
    },
    enabled: canFetch,
  });
};

export const useGetReceiptById = (id: string) => {
  const canFetch = useCanUseAuthenticatedApi();
  return useQuery({
    queryKey: ["receipts", id],
    queryFn: () => api.get<Receipt>(`/receipts/${id}`),
    enabled: !!id && canFetch,
  });
};

export const useUpdateReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Receipt> }) =>
      api.put<Receipt>(`/receipts/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["receipts", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
};

export const useDeleteReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/receipts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
};

export const useVerifyReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<Receipt>(`/receipts/${id}/verify`, {}),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["receipts", id] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
    },
  });
};

export const useUploadReceipt = () => {
  return useMutation({
    mutationFn: (data: { image: File; categoryId?: string; notes?: string }) => {
      const formData = new FormData();
      formData.append("image", data.image);
      if (data.categoryId) formData.append("categoryId", data.categoryId);
      if (data.notes) formData.append("notes", data.notes);
      return api.upload<Receipt>("/receipts/upload", formData);
    },
  });
};

export const useCreateReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Receipt>) =>
      api.post<Receipt>("/receipts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
};