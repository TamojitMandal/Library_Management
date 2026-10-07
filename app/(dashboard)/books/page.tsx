"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  BookmarkPlus,
  RefreshCw,
  Layers,
  MapPin,
  Barcode,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BOOK_CATEGORIES } from "@/lib/constants";
import { BookItem, PaginatedResult } from "@/types";
import { toast } from "sonner";
import Link from "next/link";

interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  shelfLocation: string;
  coverUrl: string;
}

const initialFormData: BookFormData = {
  title: "",
  author: "",
  isbn: "",
  category: BOOK_CATEGORIES[0],
  totalCopies: 5,
  shelfLocation: "",
  coverUrl: "",
};

export default function BooksPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [formData, setFormData] = useState<BookFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<BookItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBooks = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        search: searchQuery,
        category: selectedCategory,
        available: availableOnly ? "true" : "false",
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/books?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        const result: PaginatedResult<BookItem> = json.data;
        setBooks(result.items);
        setTotalItems(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } else {
        toast.error(json.error || "Failed to fetch books");
      }
    } catch (err) {
      console.error("Fetch books error:", err);
      toast.error("Network error fetching catalog");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, selectedCategory, availableOnly, sortBy, sortOrder]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleOpenAdd = () => {
    setEditingBook(null);
    setFormData(initialFormData);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (book: BookItem) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      totalCopies: book.totalCopies,
      shelfLocation: book.shelfLocation,
      coverUrl: book.coverUrl || "",
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title || !formData.author || !formData.isbn || !formData.shelfLocation) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = editingBook ? `/api/books/${editingBook.id}` : "/api/books";
      const method = editingBook ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!json.success) {
        setFormError(json.error || "Operation failed.");
        toast.error(json.error || "Failed to save book");
        return;
      }

      toast.success(
        editingBook
          ? `Updated "${formData.title}" successfully`
          : `Added "${formData.title}" to catalog`
      );
      setIsFormOpen(false);
      fetchBooks();
    } catch (err) {
      console.error("Submit book error:", err);
      setFormError("An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/books/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error || "Cannot delete book");
        return;
      }

      toast.success(`"${deleteTarget.title}" deleted from catalog`);
      setDeleteTarget(null);
      fetchBooks();
    } catch (err) {
      console.error("Delete book error:", err);
      toast.error("Network error deleting book");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        heading="Book Catalog Management"
        subheading="Search, add, modify, and track physical shelf copies across all academic disciplines."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBooks}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="bg-[#1e2a5a] hover:bg-[#162045] text-white gap-2 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Book</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-[hsl(var(--card))]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              placeholder="Search by title, author, or ISBN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-white/70 dark:bg-stone-900/60 px-3 text-xs sm:text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              <option value="ALL">All Categories</option>
              {BOOK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-medium cursor-pointer text-[hsl(var(--foreground))] select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => {
                  setAvailableOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="h-4 w-4 rounded-md text-[hsl(var(--primary))] border-[hsl(var(--border))] focus:ring-[hsl(var(--ring))]"
              />
              <span>Available Copies Only</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Books Table */}
      <Card className="overflow-hidden border-[hsl(var(--border))]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100/60 dark:bg-stone-800/60 text-xs uppercase font-semibold text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
              <tr>
                <th className="py-3.5 px-4">Book Title & Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">ISBN</th>
                <th className="py-3.5 px-4">Shelf Location</th>
                <th className="py-3.5 px-4">Copies (Avail / Total)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={BookOpen}
                      title="No books found"
                      description="No books match your current search query or category filter."
                      actionLabel="Add New Book"
                      onAction={handleOpenAdd}
                    />
                  </td>
                </tr>
              ) : (
                books.map((book) => {
                  const isAvailable = book.availableCopies > 0;
                  const issuedCount = book.totalCopies - book.availableCopies;

                  return (
                    <tr
                      key={book.id}
                      className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      {/* Title & Author */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3.5 max-w-sm">
                          <div className="h-14 w-10 rounded-lg bg-stone-200 dark:bg-stone-800 shrink-0 overflow-hidden shadow-xs border border-[hsl(var(--border))]">
                            {book.coverUrl ? (
                              <img
                                src={book.coverUrl}
                                alt={book.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <BookOpen className="h-4 w-4 m-auto mt-4 text-stone-400" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-semibold text-sm text-[hsl(var(--foreground))] line-clamp-1">
                              {book.title}
                            </p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1 mt-0.5">
                              by {book.author}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 text-xs font-medium text-[hsl(var(--foreground))]">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 font-medium">
                          {book.category}
                        </span>
                      </td>

                      {/* ISBN */}
                      <td className="py-4 px-4 text-xs font-mono text-[hsl(var(--muted-foreground))]">
                        {book.isbn}
                      </td>

                      {/* Shelf */}
                      <td className="py-4 px-4 text-xs font-medium text-[hsl(var(--foreground))]">
                        <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                          <MapPin className="h-3.5 w-3.5 text-amber-500" />
                          <span>{book.shelfLocation}</span>
                        </div>
                      </td>

                      {/* Copies */}
                      <td className="py-4 px-4">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className={`font-bold text-sm ${
                              book.availableCopies > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {book.availableCopies}
                          </span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            / {book.totalCopies} copies
                          </span>
                        </div>
                        {issuedCount > 0 && (
                          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium mt-0.5">
                            {issuedCount} currently issued
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <StatusBadge status={isAvailable ? "AVAILABLE" : "OUT_OF_STOCK"} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAvailable && (
                            <Link href={`/issue?bookId=${book.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                                title="Issue this book to a student"
                              >
                                <BookmarkPlus className="h-3.5 w-3.5 mr-1" />
                                <span>Issue</span>
                              </Button>
                            </Link>
                          )}

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-stone-600 hover:text-[hsl(var(--foreground))]"
                            onClick={() => handleOpenEdit(book)}
                            title="Edit book details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-600 hover:bg-rose-500/10"
                            onClick={() => setDeleteTarget(book)}
                            title="Delete book"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </Card>

      {/* Add / Edit Book Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent
          onClose={() => setIsFormOpen(false)}
          className="max-w-xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editingBook ? "Edit Book Catalog Record" : "Add New Book to Catalog"}
            </DialogTitle>
            <DialogDescription>
              {editingBook
                ? "Update book metadata, shelf location, or adjust total copy count."
                : "Fill in book details to register a new title in the college library system."}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400">
              {formError}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Book Title *
              </label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Introduction to Algorithms"
              />
            </div>

            {/* Author */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Author(s) *
              </label>
              <Input
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="e.g. Thomas H. Cormen, Charles E. Leiserson"
              />
            </div>

            {/* Category & ISBN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-white/70 dark:bg-stone-900/60 px-3 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                >
                  {BOOK_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  ISBN *
                </label>
                <Input
                  required
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="e.g. 978-0262046305"
                />
              </div>
            </div>

            {/* Copies and Shelf Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  Total Physical Copies *
                </label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={formData.totalCopies}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalCopies: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
                {editingBook && (
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    Currently issued: {editingBook.totalCopies - editingBook.availableCopies}. Total cannot be lower than this.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  Shelf Location *
                </label>
                <Input
                  required
                  value={formData.shelfLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, shelfLocation: e.target.value })
                  }
                  placeholder="e.g. CS-A1-04"
                />
              </div>
            </div>

            {/* Cover URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Cover Image URL (optional)
              </label>
              <Input
                value={formData.coverUrl}
                onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1e2a5a] hover:bg-[#162045] text-white"
                isLoading={isSubmitting}
              >
                {editingBook ? "Save Changes" : "Add to Catalog"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Book from Catalog?"
        description={`Are you sure you want to remove "${deleteTarget?.title}"? If this book has active issued copies, deletion will be blocked.`}
        confirmLabel="Delete Book"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
