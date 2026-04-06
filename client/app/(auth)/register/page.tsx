"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthRegister } from "@/hooks/useApi";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: register, isPending: registering } = useAuthRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(
      { name, email, password },
      {
        // ↓ tokens already stored inside useAuthRegister's onSuccess — don't duplicate here
        onSuccess: () => router.push("/"), // ← was "/", now correct
        onError: (err) => console.error("Registration failed:", err),
      },
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center px-6 py-12">
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ScanLine className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start tracking your expenses with SnapExpense
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Full Name</label>
            <Input placeholder="Omkar Padalkar" value={name}
              onChange={(e) => setName(e.target.value)} className="mt-1.5" required />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} className="mt-1.5" required />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <div className="relative mt-1.5">
              <Input type={showPassword ? "text" : "password"} placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={registering}>
            {registering ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}