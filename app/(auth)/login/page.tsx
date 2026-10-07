"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Library,
  BookOpen,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAutofill = () => {
    setEmail("admin@college.edu");
    setPassword("AdminPassword123!");
    setErrorMessage("");
    toast.info("Admin demo credentials filled");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email address and password.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setErrorMessage(
          res?.error === "CredentialsSignin"
            ? "Invalid email address or password. Please verify your credentials."
            : res?.error || "Login failed. Please verify credentials."
        );
        toast.error("Authentication failed");
        return;
      }

      toast.success("Welcome back! Redirecting to Dashboard...");
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error("Sign-in error:", err);
      setErrorMessage("An unexpected error occurred during sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Mobile brand header */}
      <div className="lg:hidden flex items-center gap-3 mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-white shadow-md">
          <Library className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-serif-title text-[hsl(var(--foreground))]">
            Athenaeum Library
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Administrator Sign In
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif-title text-[hsl(var(--foreground))]">
          Admin Portal Login
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Enter your librarian credentials to access circulation and cataloging.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-700 dark:text-rose-400 animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]"
          >
            College Admin Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              id="email"
              type="email"
              placeholder="admin@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-11"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base font-semibold shadow-md bg-[#1e2a5a] hover:bg-[#162045] text-white"
          isLoading={isLoading}
        >
          Sign In to Management Console
        </Button>
      </form>

      {/* Quick Demo Helper */}
      <div className="pt-6 border-t border-[hsl(var(--border))] rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 p-4 border-dashed">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[hsl(var(--foreground))]">
              Default Seed Credentials
            </p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
              admin@college.edu &middot; AdminPassword123!
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutofill}
            className="text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
          >
            Auto-fill
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      {/* Left Column: Academic Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-[#121831] via-[#1a2347] to-[#0c1022] text-white overflow-hidden border-r border-indigo-950">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 shadow-lg shadow-amber-500/20">
            <Library className="h-7 w-7 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-serif-title tracking-tight text-white">
              Athenaeum
            </h1>
            <p className="text-xs uppercase font-medium tracking-widest text-amber-300">
              College Library Information System
            </p>
          </div>
        </div>

        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-300 mb-6">
            <GraduationCap className="h-4 w-4" />
            <span>Academic Circulation Portal</span>
          </div>

          <blockquote className="text-2xl sm:text-3xl font-serif-title font-medium leading-relaxed text-stone-100">
            &ldquo;A library is not a luxury but one of the necessities of life.&rdquo;
          </blockquote>
          <p className="mt-3 text-sm text-stone-400 font-medium">
            — Henry Ward Beecher
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 text-amber-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Smart Catalog</p>
                <p className="text-xs text-stone-400">Real-time copy tracking</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Safe Circulation</p>
                <p className="text-xs text-stone-400">Automated fine computing</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-stone-400 flex items-center justify-between">
          <span>&copy; 2025 College Library Administration</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> High Reliability Stack
          </span>
        </div>
      </div>

      {/* Right Column: Authentication Form wrapped in Suspense */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse bg-stone-100 dark:bg-stone-900 rounded-2xl" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
