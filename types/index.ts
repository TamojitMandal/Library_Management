import { IssueStatus } from "@prisma/client";

export type { IssueStatus };

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  coverUrl: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    issues: number;
  };
}

export interface StudentItem {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  year: number;
  createdAt: string | Date;
  _count?: {
    issues: number;
  };
  activeIssuesCount?: number;
}

export interface IssueItem {
  id: string;
  bookId: string;
  studentId: string;
  issueDate: string | Date;
  dueDate: string | Date;
  returnDate: string | Date | null;
  status: IssueStatus;
  fine: number;
  createdAt: string | Date;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    coverUrl?: string | null;
    shelfLocation?: string;
  };
  student: {
    id: string;
    studentId: string;
    name: string;
    email: string;
    department: string;
    year: number;
    phone: string;
  };
}

export interface DashboardStats {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  currentlyIssued: number;
  overdueCount: number;
  totalStudents: number;
  totalFinesCollected: number;
  pendingFines: number;
  issuesTimeline: {
    date: string;
    issues: number;
    returns: number;
  }[];
  categoryDistribution: {
    category: string;
    count: number;
    copies: number;
  }[];
  recentIssues: IssueItem[];
  overdueAlerts: IssueItem[];
}
