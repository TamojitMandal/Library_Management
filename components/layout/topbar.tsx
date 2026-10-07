"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import {
  Menu,
  Search,
  Sun,
  Moon,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface TopbarProps {
  onMenuClick: () => void;
  adminName?: string;
}

export function Topbar({ onMenuClick, adminName = "Head Librarian" }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Default search forwards to books catalog
    router.push(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const todayStr = format(new Date(), "EEEE, MMMM dd, yyyy");

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 px-4 sm:px-8 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu hamburger */}
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2.5 text-[hsl(var(--muted-foreground))] hover:bg-stone-100 hover:text-[hsl(var(--foreground))] dark:hover:bg-stone-800 lg:hidden transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search catalog by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-stone-50/80 dark:bg-stone-900/60 pl-10 pr-4 text-xs sm:text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] transition-all"
          />
        </form>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Date pill */}
        <div className="hidden md:flex items-center gap-2 rounded-xl bg-stone-100/80 dark:bg-stone-800/80 px-3.5 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
          <Calendar className="h-3.5 w-3.5 text-amber-500" />
          <span>{todayStr}</span>
        </div>

        {/* System Active badge */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Library Portal Live</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shadow-xs"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-300" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-900 animate-in spin-in-180 duration-300" />
          )}
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-[hsl(var(--border))]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-white font-serif-title font-semibold text-sm shadow-sm">
            {adminName.slice(0, 1)}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-[hsl(var(--foreground))] leading-tight">
              {adminName}
            </p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-tight">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
