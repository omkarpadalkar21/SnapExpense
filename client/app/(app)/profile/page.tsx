"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  LogOut,
  Lock,
  BellRing,
  Calculator,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUserProfile, useDeleteUserProfile } from "@/hooks/useApi";

export default function ProfilePage() {
  const router = useRouter();
  const { data: user, isPending } = useUserProfile();

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login"); // ← was "/login", now correct
  };

  return (
    <div className="px-4 pt-6 space-y-6">
      {/* Profile Header */}
      {user && (
        <div className="flex flex-col items-center text-center animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user.initials || user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-lg font-bold mt-3">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      )}

      {/* Sections */}
      <div
        className="space-y-2 animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
      >
        <h3 className="text-xs text-muted-foreground uppercase font-semibold tracking-wider px-1 mb-2">
          Management
        </h3>
        <Link
          href="/budgets"
          className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Budgets</p>
            <p className="text-xs text-muted-foreground">
              Set monthly category budgets
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div
        className="space-y-2 animate-fade-in-up"
        style={{ animationDelay: "160ms" }}
      >
        <h3 className="text-xs text-muted-foreground uppercase font-semibold tracking-wider px-1 mb-2">
          Account Settings
        </h3>
        <button className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Change Password</p>
            <p className="text-xs text-muted-foreground">
              Update your password
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <BellRing className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Notification Preferences</p>
            <p className="text-xs text-muted-foreground">
              Manage push notifications
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "220ms" }}>
        <Button
          onClick={handleLogout}
          variant="destructive-outline"
          className="w-full"
          size="lg"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
