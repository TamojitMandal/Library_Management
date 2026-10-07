"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BookmarkPlus,
  BookmarkCheck,
  FileText,
  Settings,
  LogOut,
  Library,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  adminName?: string;
  adminEmail?: string;
}

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Books Catalog",
    href: "/books",
    icon: BookOpen,
  },
  {
    name: "Students",
    href: "/students",
    icon: Users,
  },
  {
    name: "Issue Book",
    href: "/issue",
    icon: BookmarkPlus,
  },
  {
    name: "Return Book",
    href: "/return",
    icon: BookmarkCheck,
  },
  {
    name: "Issue Records",
    href: "/records",
    icon: FileText,
  },
  {
    name: "System Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ isOpen, onClose, adminName = "Head Librarian", adminEmail = "admin@college.edu" }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-[#131b38] text-white shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-indigo-950/60",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 shadow-md group-hover:scale-105 transition-transform">
              <Library className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="block text-lg font-bold font-serif-title tracking-tight text-white">
                Athenaeum
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-amber-300/90">
                College Library
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-300 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-indigo-300/70">
            Circulation & Catalog
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-amber-400 text-stone-950 font-semibold shadow-md shadow-amber-400/20"
                    : "text-indigo-100/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    isActive ? "text-stone-950" : "text-indigo-300/80"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Admin profile and logout */}
        <div className="p-4 border-t border-white/10 bg-[#0d1329]">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/5">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-inner font-serif-title">
                {adminName.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="truncate text-sm font-semibold text-white">
                  {adminName}
                </p>
                <p className="truncate text-xs text-indigo-300/70">
                  {adminEmail}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out"
              className="rounded-lg p-2 text-indigo-300/70 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
