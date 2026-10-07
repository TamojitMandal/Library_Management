"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookmarkPlus,
  Search,
  BookOpen,
  Calendar,
  AlertCircle,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DEFAULT_ISSUE_DURATION_DAYS, MAX_ACTIVE_ISSUES_PER_STUDENT } from "@/lib/constants";
import { BookItem } from "@/types";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

interface StudentPreview {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  year: number;
  activeCount: number;
  activeIssues: { id: string; book: { title: string } }[];
}

function IssueBookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStudentId = searchParams.get("studentId") || "";
  const initialBookId = searchParams.get("bookId") || "";

  const [studentInput, setStudentInput] = useState(initialStudentId);
  const [isVerifyingStudent, setIsVerifyingStudent] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState<StudentPreview | null>(null);
  const [studentError, setStudentError] = useState("");

  const [bookSearch, setBookSearch] = useState("");
  const [booksList, setBooksList] = useState<BookItem[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const defaultDueStr = format(addDays(new Date(), DEFAULT_ISSUE_DURATION_DAYS), "yyyy-MM-dd");
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(defaultDueStr);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const verifyStudent = async (studentIdToVerify: string) => {
    if (!studentIdToVerify.trim()) return;
    try {
      setIsVerifyingStudent(true);
      setStudentError("");
      const res = await fetch(`/api/students/${encodeURIComponent(studentIdToVerify.trim())}`);
      const json = await res.json();
      if (!json.success || !json.data) {
        setVerifiedStudent(null);
        setStudentError(json.error || `Student with ID "${studentIdToVerify}" was not found.`);
        return;
      }
      setVerifiedStudent(json.data);
      if (json.data.activeCount >= MAX_ACTIVE_ISSUES_PER_STUDENT) {
        setStudentError(
          `This student has already reached the maximum limit of ${MAX_ACTIVE_ISSUES_PER_STUDENT} active books.`
        );
      }
    } catch (err) {
      console.error("Student verify error:", err);
      setStudentError("Network error verifying student.");
    } finally {
      setIsVerifyingStudent(false);
    }
  };

  const searchBooks = async (query = "") => {
    try {
      setIsLoadingBooks(true);
      const res = await fetch(
        `/api/books?search=${encodeURIComponent(query)}&available=true&pageSize=20`
      );
      const json = await res.json();
      if (json.success) {
        setBooksList(json.data.items);
        if (initialBookId && !selectedBook) {
          const match = json.data.items.find((b: BookItem) => b.id === initialBookId);
          if (match) setSelectedBook(match);
        }
      }
    } catch (err) {
      console.error("Books search error:", err);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  useEffect(() => {
    searchBooks();
    if (initialStudentId) {
      verifyStudent(initialStudentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStudentSearch = (e: React.FormEvent) => {
    e.preventDefault();
    verifyStudent(studentInput);
  };

  const isStudentLimitReached =
    verifiedStudent && verifiedStudent.activeCount >= MAX_ACTIVE_ISSUES_PER_STUDENT;

  const canSubmit =
    verifiedStudent &&
    !isStudentLimitReached &&
    selectedBook &&
    selectedBook.availableCopies > 0 &&
    new Date(dueDate) > new Date(issueDate);

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !verifiedStudent || !selectedBook) return;

    setSubmitError("");
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: verifiedStudent.studentId,
          bookId: selectedBook.id,
          issueDate,
          dueDate,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setSubmitError(json.error || "Failed to issue book.");
        toast.error(json.error || "Could not complete book checkout");
        return;
      }
      toast.success(`Successfully issued "${selectedBook.title}" to ${verifiedStudent.name}!`);
      router.push("/records");
    } catch (err) {
      console.error("Issue submission error:", err);
      setSubmitError("An unexpected error occurred during book checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        heading="Issue Book to Student"
        subheading="Verify student borrowing eligibility, select available physical copies, and schedule the loan period."
      />

      {submitError && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: Verify Student */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">1</div>
              <h2 className="text-lg font-bold font-serif-title text-[hsl(var(--foreground))]">Student Verification</h2>
            </div>
            <form onSubmit={handleStudentSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <Input
                  placeholder="Enter Student ID (e.g. STU2025001)..."
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Button type="submit" className="h-11 px-5 bg-[#1e2a5a] hover:bg-[#162045] text-white" isLoading={isVerifyingStudent}>
                Verify Student
              </Button>
            </form>
            {studentError && (
              <div className="mt-3 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{studentError}</span>
              </div>
            )}
            {verifiedStudent && (
              <div className="mt-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-white font-serif-title font-bold text-lg shadow-sm">
                      {verifiedStudent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[hsl(var(--foreground))]">{verifiedStudent.name}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 font-bold">{verifiedStudent.studentId}</span>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{verifiedStudent.department} · Year {verifiedStudent.year}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${isStudentLimitReached ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                      {verifiedStudent.activeCount} / {MAX_ACTIVE_ISSUES_PER_STUDENT} Active Books
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* STEP 2: Select Book */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">2</div>
              <div>
                <h2 className="text-lg font-bold font-serif-title text-[hsl(var(--foreground))]">Select Available Book</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Only books with available copies are shown</p>
              </div>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                placeholder="Search by title, author, or ISBN..."
                value={bookSearch}
                onChange={(e) => { setBookSearch(e.target.value); searchBooks(e.target.value); }}
                className="pl-10"
              />
            </div>
            {selectedBook && (
              <div className="mb-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-12 w-9 rounded-md bg-stone-200 dark:bg-stone-800 shrink-0 overflow-hidden">
                    {selectedBook.coverUrl ? (
                      <img src={selectedBook.coverUrl} alt={selectedBook.title} className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen className="h-4 w-4 m-auto mt-3 text-stone-400" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-sm text-[hsl(var(--foreground))] truncate">{selectedBook.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">by {selectedBook.author} · Shelf: {selectedBook.shelfLocation}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  {selectedBook.availableCopies} avail
                </span>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {isLoadingBooks ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
                ))
              ) : booksList.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-6">No books matching search with available copies.</p>
              ) : (
                booksList.map((book) => {
                  const isSelected = selectedBook?.id === book.id;
                  return (
                    <div
                      key={book.id}
                      onClick={() => setSelectedBook(book)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? "border-[hsl(var(--primary))] bg-indigo-50/40 dark:bg-indigo-950/30" : "border-[hsl(var(--border))] hover:bg-stone-50 dark:hover:bg-stone-900"}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-10 w-7 rounded bg-stone-200 dark:bg-stone-800 shrink-0 overflow-hidden">
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                          ) : (
                            <BookOpen className="h-3 w-3 m-auto mt-3 text-stone-400" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-xs sm:text-sm text-[hsl(var(--foreground))] truncate">{book.title}</p>
                          <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">{book.author} · ISBN: {book.isbn}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{book.availableCopies} avail</span>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Shelf: {book.shelfLocation}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* STEP 3: Dates */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">3</div>
              <div>
                <h2 className="text-lg font-bold font-serif-title text-[hsl(var(--foreground))]">Loan Schedule</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Standard loan period is {DEFAULT_ISSUE_DURATION_DAYS} calendar days</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  <span>Issue Date</span>
                </label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => {
                    setIssueDate(e.target.value);
                    setDueDate(format(addDays(new Date(e.target.value), DEFAULT_ISSUE_DURATION_DAYS), "yyyy-MM-dd"));
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-stone-400" />
                  <span>Due Return Date</span>
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  min={issueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Summary Card */}
        <div>
          <Card className="p-6 sticky top-28 border-[hsl(var(--border))] shadow-md">
            <h3 className="text-base font-bold font-serif-title text-[hsl(var(--foreground))] pb-3 border-b border-[hsl(var(--border))]">
              Checkout Summary
            </h3>
            <div className="space-y-4 my-5 text-xs">
              <div>
                <span className="text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wider text-[10px]">Borrower</span>
                {verifiedStudent ? (
                  <div className="mt-1">
                    <p className="font-semibold text-sm text-[hsl(var(--foreground))]">{verifiedStudent.name}</p>
                    <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{verifiedStudent.studentId}</p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{verifiedStudent.department}</p>
                  </div>
                ) : (
                  <p className="mt-1 text-stone-400 italic">No student verified yet</p>
                )}
              </div>
              <div className="pt-3 border-t border-[hsl(var(--border))]">
                <span className="text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wider text-[10px]">Selected Book</span>
                {selectedBook ? (
                  <div className="mt-1">
                    <p className="font-semibold text-sm text-[hsl(var(--foreground))]">{selectedBook.title}</p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">by {selectedBook.author}</p>
                    <p className="text-[11px] font-mono text-stone-500 mt-0.5">Shelf: {selectedBook.shelfLocation}</p>
                  </div>
                ) : (
                  <p className="mt-1 text-stone-400 italic">No book selected</p>
                )}
              </div>
              <div className="pt-3 border-t border-[hsl(var(--border))] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Issue Date:</span>
                  <span className="font-semibold text-[hsl(var(--foreground))]">{format(new Date(issueDate), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Due Date:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{format(new Date(dueDate), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex justify-between text-stone-400 text-[11px]">
                  <span>Overdue Rate:</span>
                  <span>₹5 / day</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleSubmitIssue}
              disabled={!canSubmit || isSubmitting}
              isLoading={isSubmitting}
              className="w-full h-11 bg-[#1e2a5a] hover:bg-[#162045] text-white font-semibold text-sm shadow-md"
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              <span>Confirm &amp; Issue Book</span>
            </Button>
            {!canSubmit && (
              <p className="mt-3 text-[11px] text-center text-stone-400 leading-tight">
                Complete student verification and book selection to enable issue.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function IssueBookPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full animate-pulse bg-stone-100 dark:bg-stone-900 rounded-2xl" />}>
      <IssueBookContent />
    </Suspense>
  );
}
