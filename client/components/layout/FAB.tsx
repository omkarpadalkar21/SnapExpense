"use client";

import { Plus } from "lucide-react";

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      id="fab-button"
      onClick={onClick}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full bg-accent text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
      aria-label="Scan Receipt"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </button>
  );
}
