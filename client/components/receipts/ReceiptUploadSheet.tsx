"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Camera, ImageIcon, Upload, CheckCircle2, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReceiptUpload } from "@/hooks/useReceiptUpload";
import { useGetCategories } from "@/hooks/useApi"; // ← ADD THIS

interface ReceiptUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptUploadSheet({
  open,
  onOpenChange,
}: ReceiptUploadSheetProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const {
    step,
    previewUrl,
    progress,
    statusText,
    extractedData,
    selectFile,
    uploadAndScan,
    confirmAndSave,
    reset,
  } = useReceiptUpload();

  const { data: categories } = useGetCategories(); // ← FETCH CATEGORIES

  const [reviewData, setReviewData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (step === "reviewing" && extractedData) {
      setReviewData(extractedData);
      setErrorMsg("");
    }
  }, [step, extractedData]);

  const handleConfirm = useCallback(() => {
    if (!reviewData) return;

    // Validations
    if (reviewData.totalAmount < 0) {
      setErrorMsg("Total Amount cannot be negative.");
      return;
    }
    const itemsTotal =
      reviewData.items?.reduce(
        (sum: number, item: any) => sum + Number(item.totalPrice),
        0,
      ) ?? 0;
    if (reviewData.totalAmount < itemsTotal) {
      setErrorMsg(
        `Total Amount ${reviewData.totalAmount} cannot be less than sum of items ${itemsTotal}.`,
      );
      return;
    }

    // Require a category
    if (!reviewData.categoryId) {
      setErrorMsg("Please select a category.");
      return;
    }

    setErrorMsg("");
    confirmAndSave(reviewData);
  }, [reviewData, confirmAndSave]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) selectFile(file);
    },
    [selectFile],
  );

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) reset();
      onOpenChange(isOpen);
    },
    [onOpenChange, reset],
  );

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Scan Receipt</SheetTitle>
          <SheetDescription>
            Upload or photograph a receipt to extract expense data
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-8 mt-4 space-y-4">
          {/* Step 1 – Capture */}
          {step === "idle" && (
            <div className="space-y-3 animate-fade-in-up">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Camera className="h-7 w-7 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Take Photo</p>
                  <p className="text-xs text-muted-foreground">
                    Use camera to capture receipt
                  </p>
                </div>
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 transition-all duration-200 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <ImageIcon className="h-7 w-7 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">
                    Choose from Gallery
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Select an existing image
                  </p>
                </div>
              </button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Empty state */}
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                  <Receipt className="h-10 w-10 text-primary/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Scan your first receipt to start tracking expenses
                </p>
              </div>
            </div>
          )}

          {/* Step 2 – Preview / Upload */}
          {step === "uploading" && previewUrl && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="w-full max-h-64 object-contain"
                />
              </div>
              {progress > 0 && progress < 100 ? (
                <div className="space-y-2">
                  <Progress
                    value={progress}
                    className="h-2 indicator-class-name:bg-primary"
                  />
                  <div className="flex items-center gap-2 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {statusText}
                    </p>
                  </div>
                </div>
              ) : null}
              <Button onClick={uploadAndScan} className="w-full" size="lg">
                <Upload className="h-5 w-5 mr-2" />
                Upload &amp; Scan
              </Button>
            </div>
          )}

          {/* Step 3 – Processing */}
          {step === "processing" && (
            <div className="flex flex-col items-center py-12 animate-fade-in-up">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">{statusText}</p>
              <Progress
                value={progress}
                className="h-2 mt-4 max-w-xs indicator-class-name:bg-primary"
              />
            </div>
          )}

          {/* Step 4 – Review */}
          {step === "reviewing" && reviewData && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-800">
                    Data extracted successfully! Review and edit.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-3">
                  <p className="text-sm font-medium text-red-800">{errorMsg}</p>
                </div>
              )}

              <div className="space-y-3">
                {/* Merchant */}
                <div>
                  <label className="text-xs text-muted-foreground">
                    Merchant
                  </label>
                  <Input
                    value={reviewData.merchantName}
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        merchantName: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Total Amount */}
                <div>
                  <label className="text-xs text-muted-foreground">
                    Total Amount
                  </label>
                  <Input
                    type="number"
                    value={reviewData.totalAmount ?? 0}
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        totalAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs text-muted-foreground">Date</label>
                  <Input
                    type="date"
                    value={
                      reviewData.receiptDate ??
                      new Date().toISOString().split("T")[0]
                    }
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        receiptDate: e.target.value,
                      })
                    }
                  />
                </div>

                {/* ✅ Category — NEW FIELD */}
                <div>
                  <label className="text-xs text-muted-foreground">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={reviewData.categoryId?.toString() ?? ""}
                    onValueChange={(val) =>
                      setReviewData({
                        ...reviewData,
                        categoryId: parseInt(val),
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs text-muted-foreground">Notes</label>
                  <Input
                    value={reviewData.notes ?? ""}
                    onChange={(e) =>
                      setReviewData({ ...reviewData, notes: e.target.value })
                    }
                    placeholder="Add notes..."
                  />
                </div>
              </div>

              {/* Line Items table (unchanged) */}
              {reviewData.items && reviewData.items.length > 0 && (
                <div className="mt-4">
                  <label className="text-xs text-muted-foreground block mb-2">
                    Items
                  </label>
                  <div className="border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground text-xs uppercase">
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Price</th>
                          <th className="px-3 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {reviewData.items.map((item: any, idx: number) => (
                          <tr key={idx} className="bg-background">
                            <td className="px-3 py-2">
                              <Input
                                className="h-8 text-xs px-2"
                                value={item.name}
                                onChange={(e) => {
                                  const newItems = [...reviewData.items];
                                  newItems[idx].name = e.target.value;
                                  setReviewData({
                                    ...reviewData,
                                    items: newItems,
                                  });
                                }}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                className="h-8 text-xs px-2 w-16 text-right ml-auto"
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newItems = [...reviewData.items];
                                  newItems[idx].quantity =
                                    parseFloat(e.target.value) || 0;
                                  setReviewData({
                                    ...reviewData,
                                    items: newItems,
                                  });
                                }}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                className="h-8 text-xs px-2 w-20 text-right ml-auto"
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const newItems = [...reviewData.items];
                                  newItems[idx].unitPrice =
                                    parseFloat(e.target.value) || 0;
                                  setReviewData({
                                    ...reviewData,
                                    items: newItems,
                                  });
                                }}
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              <Input
                                className="h-8 text-xs px-2 w-20 text-right ml-auto"
                                type="number"
                                value={item.totalPrice}
                                onChange={(e) => {
                                  const newItems = [...reviewData.items];
                                  newItems[idx].totalPrice =
                                    parseFloat(e.target.value) || 0;
                                  setReviewData({
                                    ...reviewData,
                                    items: newItems,
                                  });
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Button onClick={handleConfirm} className="w-full" size="lg">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Confirm &amp; Save
              </Button>
            </div>
          )}

          {/* Step 5 – Saved */}
          {step === "saved" && (
            <div className="flex flex-col items-center py-12 animate-scale-in">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <p className="text-lg font-semibold">Receipt Saved!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your expense has been recorded
              </p>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                className="mt-6"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Receipt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}
