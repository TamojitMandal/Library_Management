"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  BookmarkPlus,
  RefreshCw,
  Eye,
  Phone,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
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
import { STUDENT_DEPARTMENTS, MAX_ACTIVE_ISSUES_PER_STUDENT } from "@/lib/constants";
import { StudentItem, PaginatedResult } from "@/types";
import { toast } from "sonner";

interface StudentFormData {
  studentId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  year: number;
}

const initialFormData: StudentFormData = {
  studentId: "",
  name: "",
  email: "",
  phone: "",
  department: STUDENT_DEPARTMENTS[0],
  year: 1,
};

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [formData, setFormData] = useState<StudentFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<StudentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        search: searchQuery,
        department: selectedDepartment,
        year: selectedYear,
      });

      const res = await fetch(`/api/students?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        const result: PaginatedResult<StudentItem> = json.data;
        setStudents(result.items);
        setTotalItems(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } else {
        toast.error(json.error || "Failed to fetch students");
      }
    } catch (err) {
      console.error("Fetch students error:", err);
      toast.error("Network error fetching students directory");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, selectedDepartment, selectedYear]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData(initialFormData);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: StudentItem) => {
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      phone: student.phone,
      department: student.department,
      year: student.year,
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.studentId || !formData.name || !formData.email || !formData.phone) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = editingStudent
        ? `/api/students/${editingStudent.id}`
        : "/api/students";
      const method = editingStudent ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!json.success) {
        setFormError(json.error || "Operation failed.");
        toast.error(json.error || "Failed to save student record");
        return;
      }

      toast.success(
        editingStudent
          ? `Updated student ${formData.name}`
          : `Registered new student ${formData.name} (${formData.studentId.toUpperCase()})`
      );
      setIsFormOpen(false);
      fetchStudents();
    } catch (err) {
      console.error("Save student error:", err);
      setFormError("An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/students/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error || "Cannot delete student record");
        return;
      }

      toast.success(`Student ${deleteTarget.name} removed successfully`);
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      console.error("Delete student error:", err);
      toast.error("Network error deleting student");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        heading="Student Directory"
        subheading="Manage student memberships, track borrowing allowances, and view issue history."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStudents}
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
              <span>Register Student</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-[hsl(var(--card))]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              placeholder="Search by student ID, name, email, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-white/70 dark:bg-stone-900/60 px-3 text-xs sm:text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              <option value="ALL">All Departments</option>
              {STUDENT_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-white/70 dark:bg-stone-900/60 px-3 text-xs sm:text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              <option value="ALL">All Academic Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
              <option value="5">Year 5</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card className="overflow-hidden border-[hsl(var(--border))]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100/60 dark:bg-stone-800/60 text-xs uppercase font-semibold text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
              <tr>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Student Name & Contact</th>
                <th className="py-3.5 px-4">Department & Year</th>
                <th className="py-3.5 px-4">Active Borrowings</th>
                <th className="py-3.5 px-4">Borrowing Allowance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      icon={Users}
                      title="No students found"
                      description="No registered student records match the search criteria."
                      actionLabel="Register Student"
                      onAction={handleOpenAdd}
                    />
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const activeIssues = student.activeIssuesCount ?? 0;
                  const canIssueMore = activeIssues < MAX_ACTIVE_ISSUES_PER_STUDENT;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      {/* Student ID */}
                      <td className="py-4 px-4">
                        <Link
                          href={`/students/${student.id}`}
                          className="font-mono font-bold text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                        >
                          <span>{student.studentId}</span>
                        </Link>
                      </td>

                      {/* Name & Contact */}
                      <td className="py-4 px-4">
                        <div>
                          <Link
                            href={`/students/${student.id}`}
                            className="font-semibold text-sm text-[hsl(var(--foreground))] hover:text-indigo-600 transition-colors"
                          >
                            {student.name}
                          </Link>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{student.email}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{student.phone}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Year */}
                      <td className="py-4 px-4 text-xs">
                        <p className="font-medium text-[hsl(var(--foreground))]">
                          {student.department}
                        </p>
                        <p className="text-[hsl(var(--muted-foreground))] mt-0.5">
                          Year {student.year}
                        </p>
                      </td>

                      {/* Active Borrowings */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold ${
                              activeIssues > 0
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                : "bg-stone-100 dark:bg-stone-800 text-stone-600"
                            }`}
                          >
                            {activeIssues}
                          </span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            active / {student._count?.issues ?? 0} total
                          </span>
                        </div>
                      </td>

                      {/* Allowance status */}
                      <td className="py-4 px-4">
                        {canIssueMore ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            Available ({MAX_ACTIVE_ISSUES_PER_STUDENT - activeIssues} left)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400">
                            Max Limit Reached (3/3)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canIssueMore && (
                            <Link href={`/issue?studentId=${student.studentId}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                                title="Issue a book to this student"
                              >
                                <BookmarkPlus className="h-3.5 w-3.5 mr-1" />
                                <span>Issue</span>
                              </Button>
                            </Link>
                          )}

                          <Link href={`/students/${student.id}`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-stone-600 hover:text-[hsl(var(--foreground))]"
                              title="View student profile & history"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-stone-600 hover:text-[hsl(var(--foreground))]"
                            onClick={() => handleOpenEdit(student)}
                            title="Edit student record"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-600 hover:bg-rose-500/10"
                            onClick={() => setDeleteTarget(student)}
                            title="Delete student"
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

        {/* Pagination */}
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

      {/* Register / Edit Student Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent
          onClose={() => setIsFormOpen(false)}
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Edit Student Record" : "Register New Student"}
            </DialogTitle>
            <DialogDescription>
              {editingStudent
                ? "Update student contact info, academic department, or class year."
                : "Register a new college student to enable library book borrowings."}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400">
              {formError}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Student ID */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Student ID (Roll Number) *
              </label>
              <Input
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="e.g. STU2025011"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Student Full Name *
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rohan Verma"
              />
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  Email Address *
                </label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@college.edu"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  Contact Phone *
                </label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Department and Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  Academic Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-white/70 dark:bg-stone-900/60 px-3 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                >
                  {STUDENT_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  Year of Study (1 - 5) *
                </label>
                <select
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value, 10) })
                  }
                  className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-white/70 dark:bg-stone-900/60 px-3 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                  <option value={5}>5th Year</option>
                </select>
              </div>
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
                {editingStudent ? "Save Changes" : "Register Student"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Student Record?"
        description={`Are you sure you want to remove student "${deleteTarget?.name}" (${deleteTarget?.studentId})? If this student has active unreturned books, deletion will be blocked.`}
        confirmLabel="Delete Student"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
