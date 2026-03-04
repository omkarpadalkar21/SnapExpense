"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Save, Trash2, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OCRStatusBanner } from "@/components/shared/OCRStatusBanner";
import { LineItemsAccordion } from "@/components/receipts/LineItemsAccordion";
import { formatCurrency } from "@/lib/formatCurrency";
import { MOCK_RECEIPTS, CATEGORIES } from "@/lib/mockData";

export default function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const receipt = MOCK_RECEIPTS.find((r) => r.id === id) || MOCK_RECEIPTS[0];
  const [isVerified, setIsVerified] = useState(receipt.isVerified);

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Receipt Detail</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          aria-label={isEditing ? "Cancel edit" : "Edit receipt"}
        >
          {isEditing ? <X className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
        </button>
      </div>

      {/* Receipt Image */}
      <div className="rounded-2xl overflow-hidden bg-gray-100 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center mx-auto mb-2 shadow-sm">
              <svg className="h-8 w-8 text-primary/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                <path d="M8 7h8M8 11h8M8 15h5" />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">Receipt Image Preview</p>
          </div>
        </div>
      </div>

      {/* OCR Banner */}
      <OCRStatusBanner
        isVerified={isVerified}
        ocrConfidence={receipt.ocrConfidence}
        onVerify={() => setIsVerified(true)}
      />

      {/* Receipt Data */}
      <Card className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Merchant</label>
            {isEditing ? (
              <Input defaultValue={receipt.merchantName} className="mt-1" />
            ) : (
              <p className="text-sm font-medium mt-0.5">{receipt.merchantName}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Date</label>
            {isEditing ? (
              <Input type="date" defaultValue={receipt.date} className="mt-1" />
            ) : (
              <p className="text-sm font-medium mt-0.5">{format(parseISO(receipt.date), "dd MMM yyyy")}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Category</label>
            {isEditing ? (
              <Select defaultValue={receipt.category}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium mt-0.5">{receipt.category}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Amount</label>
            {isEditing ? (
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <Input type="number" defaultValue={receipt.amount} className="pl-7" />
              </div>
            ) : (
              <p className="text-lg font-bold text-accent mt-0.5">{formatCurrency(receipt.amount)}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Notes</label>
            {isEditing ? (
              <Input defaultValue={receipt.notes || ""} placeholder="Add notes..." className="mt-1" />
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">
                {receipt.notes || "No notes"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
        <CardContent className="p-5">
          <LineItemsAccordion items={receipt.lineItems} editable={isEditing} />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <Button className="w-full" size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive-outline" className="w-full" size="lg">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Receipt
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Receipt?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this receipt and all associated data.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-danger text-white hover:bg-danger/90"
                onClick={() => router.push("/receipts")}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
