"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OCRStatusBannerProps {
  isVerified: boolean;
  ocrConfidence: number;
  onVerify?: () => void;
}

export function OCRStatusBanner({ isVerified, ocrConfidence, onVerify }: OCRStatusBannerProps) {
  if (isVerified && ocrConfidence >= 0.7) return null;

  if (ocrConfidence < 0.7) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-4 animate-fade-in-up">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-danger mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Low confidence OCR result</p>
            <p className="text-xs text-red-600 mt-1">Manual review recommended. OCR confidence: {Math.round(ocrConfidence * 100)}%</p>
          </div>
        </div>
        {!isVerified && onVerify && (
          <Button onClick={onVerify} variant="accent" size="sm" className="w-full mt-3">
            Verify ✓
          </Button>
        )}
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 animate-fade-in-up">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">⚠ OCR extracted this data</p>
            <p className="text-xs text-amber-600 mt-1">Please verify before saving.</p>
          </div>
        </div>
        {onVerify && (
          <Button onClick={onVerify} variant="accent" size="sm" className="w-full mt-3">
            Verify ✓
          </Button>
        )}
      </div>
    );
  }

  return null;
}
