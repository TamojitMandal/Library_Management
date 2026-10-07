import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { studentSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Support lookup by either database cuid 'id' or human 'studentId' (e.g. STU2025001)
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id }, { studentId: id.toUpperCase() }],
      },
      include: {
        issues: {
          include: {
            book: true,
          },
          orderBy: { issueDate: "desc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const activeIssues = student.issues.filter(
      (issue) => issue.status === "ISSUED" || issue.status === "OVERDUE"
    );
    const returnedIssues = student.issues.filter((issue) => issue.status === "RETURNED");

    return NextResponse.json({
      success: true,
      data: {
        ...student,
        activeIssues,
        returnedIssues,
        activeCount: activeIssues.length,
        totalHistoryCount: student.issues.length,
      },
    });
  } catch (error) {
    console.error("GET /api/students/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch student profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = studentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || "Invalid student data" },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    // Check duplicate studentId
    if (data.studentId.toUpperCase() !== existingStudent.studentId) {
      const duplicateId = await prisma.student.findUnique({
        where: { studentId: data.studentId.toUpperCase() },
      });
      if (duplicateId) {
        return NextResponse.json(
          { success: false, error: `Student ID "${data.studentId}" is already used by ${duplicateId.name}` },
          { status: 409 }
        );
      }
    }

    // Check duplicate email
    if (data.email.toLowerCase() !== existingStudent.email) {
      const duplicateEmail = await prisma.student.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (duplicateEmail) {
        return NextResponse.json(
          { success: false, error: `Email "${data.email}" is already used by ${duplicateEmail.name}` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        studentId: data.studentId.toUpperCase(),
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        department: data.department,
        year: data.year,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/students/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        issues: {
          where: {
            status: { in: ["ISSUED", "OVERDUE"] },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    if (student.issues.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete student. They currently have ${student.issues.length} active issued book(s). Please ensure all books are returned before deleting.`,
        },
        { status: 400 }
      );
    }

    // Delete any returned issue history if safe
    await prisma.issue.deleteMany({
      where: { studentId: id },
    });

    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Student record deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/students/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete student" }, { status: 500 });
  }
}
