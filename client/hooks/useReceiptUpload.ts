"use client";

import { useState, useCallback } from "react";
import type { UploadStep, Receipt } from "@/lib/types";

interface UseReceiptUploadReturn {
  step: UploadStep;
  file: File | null;
  previewUrl: string | null;
  extractedData: Partial<Receipt> | null;
  progress: number;
  statusText: string;
  selectFile: (file: File) => void;
  uploadAndScan: () => Promise<void>;
  confirmAndSave: () => Promise<void>;
  reset: () => void;
}

export function useReceiptUpload(): UseReceiptUploadReturn {
  const [step, setStep] = useState<UploadStep>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<Receipt> | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  const selectFile = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setStep("uploading");
  }, []);

  const uploadAndScan = useCallback(async () => {
    if (!file) return;

    setStep("uploading");
    setProgress(20);
    setStatusText("Uploading...");

    // Simulate upload progress
    await new Promise((r) => setTimeout(r, 1000));
    setProgress(50);
    setStatusText("Extracting text...");

    await new Promise((r) => setTimeout(r, 1500));
    setProgress(80);
    setStatusText("Processing...");

    await new Promise((r) => setTimeout(r, 800));
    setProgress(100);
    setStatusText("Done ✓");

    // Simulate extracted data
    setExtractedData({
      merchantName: "Scanned Store",
      category: "Groceries",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      isVerified: false,
      ocrConfidence: 0.85,
      lineItems: [],
    });

    setStep("reviewing");
  }, [file]);

  const confirmAndSave = useCallback(async () => {
    setStep("saved");
    // In production: POST to /api/receipts
    await new Promise((r) => setTimeout(r, 500));
  }, []);

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
