import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { studentSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const department = searchParams.get("department")?.trim() || "";
    const year = searchParams.get("year");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") || "10", 10)));

    const where: Prisma.StudentWhereInput = {};

    if (search) {
      where.OR = [
        { studentId: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (department && department !== "ALL") {
      where.department = department;
    }

    if (year && year !== "ALL") {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        where.year = yearNum;
      }
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: { issues: true },
          },
          issues: {
            where: {
              status: { in: ["ISSUED", "OVERDUE"] },
            },
            select: {
              id: true,
            },
          },
        },
      }),
    ]);

    const formattedStudents = students.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      name: s.name,
      email: s.email,
      phone: s.phone,
      department: s.department,
      year: s.year,
      createdAt: s.createdAt,
      _count: s._count,
      activeIssuesCount: s.issues.length,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: formattedStudents,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = studentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || "Invalid student data" },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check duplicate studentId
    const existingId = await prisma.student.findUnique({
      where: { studentId: data.studentId },
    });
    if (existingId) {
      return NextResponse.json(
        { success: false, error: `Student ID "${data.studentId}" is already registered (${existingId.name})` },
        { status: 409 }
      );
    }

    // Check duplicate email
    const existingEmail = await prisma.student.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: `Email "${data.email}" is already registered (${existingEmail.name})` },
        { status: 409 }
      );
    }

    const student = await prisma.student.create({
      data: {
        studentId: data.studentId.toUpperCase(),
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        department: data.department,
        year: data.year,
      },
    });

    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (error) {
    console.error("POST /api/students error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create student" },
      { status: 500 }
    );
  }
}
