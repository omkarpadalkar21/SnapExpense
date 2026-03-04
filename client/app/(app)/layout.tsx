"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/layout/BottomNav";
import { FAB } from "@/components/layout/FAB";
import { ReceiptUploadSheet } from "@/components/receipts/ReceiptUploadSheet";
import { getQueryClient } from "@/lib/queryClient";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <main className="max-w-md mx-auto pb-24">{children}</main>
        <BottomNav />
        <FAB onClick={() => setUploadOpen(true)} />
        <ReceiptUploadSheet open={uploadOpen} onOpenChange={setUploadOpen} />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "16px",
              fontSize: "14px",
            },
          }}
        />
      </div>
    </QueryClientProvider>
  );
}
