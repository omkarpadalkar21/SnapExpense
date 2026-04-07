"use client";

import { useState, useCallback } from "react";
import type { UploadStep } from "@/lib/types";
import { useUploadReceipt, useCreateReceipt } from "./useApi";

// Shape of data used in the review step
export interface ReviewData {
  imageUrl?: string;
  merchantName: string;
  totalAmount: number;
  receiptDate: string;       // always ISO "yyyy-MM-dd"
  categoryId?: number;       // set by the category Select
  ocrConfidence?: number;
  notes?: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

interface UseReceiptUploadReturn {
  step: UploadStep;
  file: File | null;
  previewUrl: string | null;
  extractedData: ReviewData | null;
  progress: number;
  statusText: string;
  selectFile: (file: File) => void;
  uploadAndScan: () => Promise<void>;
  confirmAndSave: (data: ReviewData) => Promise<void>;
  reset: () => void;
}

/** Coerce a receiptDate value (string ISO, array, or null) → ISO "yyyy-MM-dd" string */
function toIsoDate(value: unknown): string {
  if (!value) return new Date().toISOString().split("T")[0];
  if (Array.isArray(value)) {
    // Jackson array format [yyyy, M, d]
    const [y, m, d] = value as number[];
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const str = String(value);
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return new Date().toISOString().split("T")[0];
}

export function useReceiptUpload(): UseReceiptUploadReturn {
  const [step, setStep] = useState<UploadStep>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ReviewData | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  const { mutateAsync: uploadReceipt } = useUploadReceipt();
  const { mutateAsync: createReceipt } = useCreateReceipt();

  const selectFile = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setStep("uploading");
  }, []);

  const uploadAndScan = useCallback(async () => {
    if (!file) return;

    setStep("uploading");
    setProgress(30);
    setStatusText("Uploading and scanning receipt...");

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await uploadReceipt({ image: file }) as any;

      // Normalize response into ReviewData — handle Jackson date array format
      const normalized: ReviewData = {
        imageUrl: response.imageUrl ?? undefined,
        merchantName: response.merchantName ?? "",
        totalAmount: Number(response.totalAmount ?? 0),
        receiptDate: toIsoDate(response.receiptDate),
        // Pre-populate categoryId if the OCR response already has a category
        categoryId: response.category?.id ?? undefined,
        ocrConfidence: response.ocrConfidence != null ? Number(response.ocrConfidence) : undefined,
        notes: response.notes ?? "",
        items: (response.items ?? []).map((item: any) => ({
          name: item.name ?? "",
          quantity: Number(item.quantity ?? 1),
          unitPrice: Number(item.unitPrice ?? 0),
          totalPrice: Number(item.totalPrice ?? 0),
        })),
      };

      setProgress(100);
      setStatusText("Done ✓");
      setExtractedData(normalized);
      setStep("reviewing");
    } catch (error) {
      console.error(error);
      setStatusText("Failed to upload");
      setStep("idle");
    }
  }, [file, uploadReceipt]);

  const confirmAndSave = useCallback(async (data: ReviewData) => {
    try {
      // Build a clean payload that matches ReceiptCreateRequest exactly
      await createReceipt({
        imageUrl: data.imageUrl,
        merchantName: data.merchantName,
        totalAmount: data.totalAmount,
        receiptDate: data.receiptDate,        // ISO string → backend LocalDate
        categoryId: data.categoryId,
        ocrConfidence: data.ocrConfidence,
        notes: data.notes || undefined,
        items: data.items,
      });
      setStep("saved");
    } catch (error) {
      console.error(error);
      setStatusText("Failed to save receipt");
    }
  }, [createReceipt]);

  const reset = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setStep("idle");
    setFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setProgress(0);
    setStatusText("");
  }, [previewUrl]);

  return {
    step,
    file,
    previewUrl,
    extractedData,
    progress,
    statusText,
    selectFile,
    uploadAndScan,
    confirmAndSave,
    reset,
  };
}
