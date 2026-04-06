"use client";

import { useState, useCallback } from "react";
import type { UploadStep, Receipt } from "@/lib/types";
import { useUploadReceipt, useCreateReceipt } from "./useApi";

interface UseReceiptUploadReturn {
  step: UploadStep;
  file: File | null;
  previewUrl: string | null;
  extractedData: Partial<Receipt> | null;
  progress: number;
  statusText: string;
  selectFile: (file: File) => void;
  uploadAndScan: () => Promise<void>;
  confirmAndSave: (data: Partial<Receipt>) => Promise<void>;
  reset: () => void;
}

export function useReceiptUpload(): UseReceiptUploadReturn {
  const [step, setStep] = useState<UploadStep>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<Receipt> | null>(null);
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
      const response = await uploadReceipt({ image: file });
      setProgress(100);
      setStatusText("Done ✓");
      setExtractedData(response as Partial<Receipt>);
      setStep("reviewing");
    } catch (error) {
      console.error(error);
      setStatusText("Failed to upload");
      setStep("idle");
    }
  }, [file, uploadReceipt]);

  const confirmAndSave = useCallback(async (data: Partial<Receipt>) => {
    try {
      await createReceipt(data);
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
