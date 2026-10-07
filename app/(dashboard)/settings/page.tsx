"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Clock,
  Coins,
  RefreshCw,
  Database,
  CheckCircle2,
  Info,
  Server,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  MAX_ACTIVE_ISSUES_PER_STUDENT,
  DEFAULT_ISSUE_DURATION_DAYS,
  FINE_PER_DAY_INR,
} from "@/lib/constants";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  const handleRunOverdueCron = async () => {
    try {
      setIsRunningCron(true);
      setCronResult(null);
      const res = await fetch("/api/cron/mark-overdue", { method: "POST" });
      const json = await res.json();

      if (json.success) {
        setCronResult(`Successfully processed ${json.updatedCount} overdue records and updated fines.`);
        toast.success(`Overdue scan complete: ${json.updatedCount} records marked overdue`);
      } else {
        toast.error(json.error || "Failed to run overdue job");
      }
    } catch (err) {
      console.error("Cron trigger error:", err);
      toast.error("Network error triggering background job");
    } finally {
      setIsRunningCron(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        heading="System Settings & Policies"
        subheading="Circulation rules, fine computation parameters, and automated maintenance jobs."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Circulation Policies */}
        <Card className="p-6">
          <CardTitle className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-indigo-500" />
            <span>Circulation Rules & Constants</span>
          </CardTitle>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-[hsl(var(--border))]">
              <div>
                <p className="font-semibold text-[hsl(var(--foreground))]">
                  Maximum Active Borrowings
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Simultaneous book loans permitted per student
                </p>
              </div>
              <span className="font-mono font-bold text-base text-indigo-600 dark:text-indigo-400">
                {MAX_ACTIVE_ISSUES_PER_STUDENT} books
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-[hsl(var(--border))]">
              <div>
                <p className="font-semibold text-[hsl(var(--foreground))]">
                  Standard Loan Period
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Default checkout window before book is overdue
                </p>
              </div>
              <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                {DEFAULT_ISSUE_DURATION_DAYS} days
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-[hsl(var(--border))]">
              <div>
                <p className="font-semibold text-[hsl(var(--foreground))]">
                  Overdue Fine Rate
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Accrued automatically per day for late returns
                </p>
              </div>
              <span className="font-mono font-bold text-base text-rose-600 dark:text-rose-400">
                ₹{FINE_PER_DAY_INR} / day
              </span>
            </div>
          </div>
        </Card>

        {/* Database & Cron Maintenance */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 mb-2">
              <Server className="h-5 w-5 text-amber-500" />
              <span>Automated Overdue Maintenance</span>
            </CardTitle>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
              Endpoint: <code className="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">/api/cron/mark-overdue</code>
            </p>

            <p className="text-sm text-[hsl(var(--foreground))] mb-4 leading-relaxed">
              The system dynamically computes overdue statuses and fines in real-time. You can also trigger the batch job manually to persist current overdue states.
            </p>

            {cronResult && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{cronResult}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[hsl(var(--border))]">
            <Button
              onClick={handleRunOverdueCron}
              isLoading={isRunningCron}
              className="w-full bg-[#1e2a5a] hover:bg-[#162045] text-white gap-2 shadow-xs"
            >
              <RefreshCw className={`h-4 w-4 ${isRunningCron ? "animate-spin" : ""}`} />
              <span>Run Overdue Status Batch Scan</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Tech Stack Info Banner */}
      <Card className="p-6 bg-gradient-to-r from-stone-50 to-stone-100/50 dark:from-stone-900 dark:to-[#131b38] border-[hsl(var(--border))]">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] dark:text-indigo-300">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold font-serif-title text-base text-[hsl(var(--foreground))]">
              Production Architecture Notes
            </h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 max-w-2xl leading-relaxed">
              Powered by Next.js 15 App Router, TypeScript strict mode, Prisma ORM with PostgreSQL database transactions, Auth.js v5 credentials with rate-limiting, and Tailwind CSS responsive design system tokens.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
