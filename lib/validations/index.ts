import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Book schemas
export const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  author: z.string().trim().min(1, "Author is required").max(150, "Author is too long"),
  isbn: z.string().trim().min(5, "ISBN must be at least 5 characters").max(30, "ISBN is too long"),
  category: z.string().trim().min(1, "Category is required"),
  totalCopies: z.coerce.number().int().min(1, "Total copies must be at least 1"),
  availableCopies: z.coerce.number().int().min(0, "Available copies cannot be negative").optional(),
  shelfLocation: z.string().trim().min(1, "Shelf location is required").max(50),
  coverUrl: z.string().trim().url("Invalid image URL").optional().or(z.literal("")),
});

export type BookInput = z.infer<typeof bookSchema>;

// Student schemas
export const studentSchema = z.object({
  studentId: z
    .string()
    .trim()
    .min(3, "Student ID must be at least 3 characters")
    .max(30, "Student ID is too long")
    .regex(/^[A-Za-z0-9_-]+$/, "Student ID can only contain letters, numbers, hyphens, and underscores"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid college email"),
  phone: z.string().trim().min(7, "Phone number must be at least 7 characters").max(20),
  department: z.string().trim().min(1, "Department is required"),
  year: z.coerce.number().int().min(1, "Year must be between 1 and 5").max(5, "Year must be between 1 and 5"),
});

export type StudentInput = z.infer<typeof studentSchema>;

// Issue Book schemas
export const issueBookSchema = z.object({
  studentId: z.string().trim().min(1, "Student ID is required"),
  bookId: z.string().trim().min(1, "Book selection is required"),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
}).refine(
  (data) => {
    const issueDate = new Date(data.issueDate);
    const dueDate = new Date(data.dueDate);
    return dueDate > issueDate;
  },
  {
    message: "Due date must be after the issue date",
    path: ["dueDate"],
  }
);

export type IssueBookInput = z.infer<typeof issueBookSchema>;

// Return Book schema
export const returnBookSchema = z.object({
  returnDate: z.string().or(z.date()).optional(),
});

export type ReturnBookInput = z.infer<typeof returnBookSchema>;
