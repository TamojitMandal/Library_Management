import { PrismaClient, IssueStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing records in proper dependency order
  await prisma.issue.deleteMany();
  await prisma.book.deleteMany();
  await prisma.student.deleteMany();
  await prisma.admin.deleteMany();

  // 2. Create Admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@college.edu";
  const adminName = process.env.ADMIN_NAME || "Head Librarian";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.create({
    data: {
      name: adminName,
      email: adminEmail,
      passwordHash,
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // 3. Create 10 Students
  const studentsData = [
    {
      studentId: "STU2025001",
      name: "Aarav Sharma",
      email: "aarav.sharma@college.edu",
      phone: "+91 98765 43210",
      department: "Computer Science & Engineering",
      year: 3,
    },
    {
      studentId: "STU2025002",
      name: "Diya Patel",
      email: "diya.patel@college.edu",
      phone: "+91 98765 43211",
      department: "Information Technology",
      year: 2,
    },
    {
      studentId: "STU2025003",
      name: "Rohan Verma",
      email: "rohan.verma@college.edu",
      phone: "+91 98765 43212",
      department: "Electrical Engineering",
      year: 4,
    },
    {
      studentId: "STU2025004",
      name: "Ananya Iyer",
      email: "ananya.iyer@college.edu",
      phone: "+91 98765 43213",
      department: "Electronics & Communication",
      year: 1,
    },
    {
      studentId: "STU2025005",
      name: "Kabir Sengupta",
      email: "kabir.sengupta@college.edu",
      phone: "+91 98765 43214",
      department: "Mechanical Engineering",
      year: 3,
    },
    {
      studentId: "STU2025006",
      name: "Meera Nair",
      email: "meera.nair@college.edu",
      phone: "+91 98765 43215",
      department: "Data Science & AI",
      year: 2,
    },
    {
      studentId: "STU2025007",
      name: "Vikram Malhotra",
      email: "vikram.malhotra@college.edu",
      phone: "+91 98765 43216",
      department: "Civil Engineering",
      year: 4,
    },
    {
      studentId: "STU2025008",
      name: "Sanya Roy",
      email: "sanya.roy@college.edu",
      phone: "+91 98765 43217",
      department: "Mathematics & Computing",
      year: 1,
    },
    {
      studentId: "STU2025009",
      name: "Arjun Reddy",
      email: "arjun.reddy@college.edu",
      phone: "+91 98765 43218",
      department: "Computer Science & Engineering",
      year: 2,
    },
    {
      studentId: "STU2025010",
      name: "Pooja Banerjee",
      email: "pooja.banerjee@college.edu",
      phone: "+91 98765 43219",
      department: "Chemical Engineering",
      year: 3,
    },
  ];

  const students = await Promise.all(
    studentsData.map((s) => prisma.student.create({ data: s }))
  );
  console.log(`Created ${students.length} students`);

  // 4. Create 20 Books
  const booksData = [
    {
      title: "Introduction to Algorithms, 4th Edition",
      author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
      isbn: "978-0262046305",
      category: "Computer Science",
      totalCopies: 6,
      availableCopies: 4,
      shelfLocation: "CS-A1-04",
      coverUrl: "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      author: "Robert C. Martin",
      isbn: "978-0132350884",
      category: "Computer Science",
      totalCopies: 5,
      availableCopies: 3,
      shelfLocation: "CS-B2-12",
      coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      isbn: "978-1449373320",
      category: "Computer Science",
      totalCopies: 4,
      availableCopies: 3,
      shelfLocation: "CS-C3-08",
      coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Artificial Intelligence: A Modern Approach, 4th Edition",
      author: "Stuart Russell, Peter Norvig",
      isbn: "978-0134610993",
      category: "Data Science & AI",
      totalCopies: 5,
      availableCopies: 4,
      shelfLocation: "AI-A1-02",
      coverUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Deep Learning",
      author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
      isbn: "978-0262035613",
      category: "Data Science & AI",
      totalCopies: 4,
      availableCopies: 2,
      shelfLocation: "AI-B1-15",
      coverUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Linear Algebra and Its Applications",
      author: "Gilbert Strang",
      isbn: "978-0030105678",
      category: "Mathematics",
      totalCopies: 7,
      availableCopies: 5,
      shelfLocation: "MATH-L1-01",
      coverUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Calculus: Early Transcendentals, 9th Edition",
      author: "James Stewart, Daniel K. Clegg, Saleem Watson",
      isbn: "978-1337613927",
      category: "Mathematics",
      totalCopies: 8,
      availableCopies: 7,
      shelfLocation: "MATH-C2-04",
      coverUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "The Feynman Lectures on Physics, Vol. 1",
      author: "Richard P. Feynman, Robert B. Leighton, Matthew Sands",
      isbn: "978-0465024933",
      category: "Physics",
      totalCopies: 5,
      availableCopies: 3,
      shelfLocation: "PHY-F1-10",
      coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Principles of Quantum Mechanics, 2nd Edition",
      author: "R. Shankar",
      isbn: "978-0306447908",
      category: "Physics",
      totalCopies: 4,
      availableCopies: 4,
      shelfLocation: "PHY-Q2-03",
      coverUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Microelectronic Circuits, 8th Edition",
      author: "Adel S. Sedra, Kenneth C. Smith",
      isbn: "978-0190853464",
      category: "Electrical Engineering",
      totalCopies: 6,
      availableCopies: 5,
      shelfLocation: "EE-M1-07",
      coverUrl: "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Electric Machinery Fundamentals, 5th Edition",
      author: "Stephen J. Chapman",
      isbn: "978-0073529547",
      category: "Electrical Engineering",
      totalCopies: 5,
      availableCopies: 4,
      shelfLocation: "EE-E3-11",
      coverUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Shigley's Mechanical Engineering Design, 11th Edition",
      author: "Richard G. Budynas, J. Keith Nisbett",
      isbn: "978-0073398204",
      category: "Mechanical Engineering",
      totalCopies: 6,
      availableCopies: 5,
      shelfLocation: "ME-S1-05",
      coverUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Fundamentals of Fluid Mechanics, 8th Edition",
      author: "Bruce R. Munson, Alric P. Rothmayer, Theodore H. Okiishi",
      isbn: "978-1119080701",
      category: "Mechanical Engineering",
      totalCopies: 4,
      availableCopies: 4,
      shelfLocation: "ME-F2-08",
      coverUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Design of Reinforced Concrete, 10th Edition",
      author: "Jack C. McCormac, Russell H. Brown",
      isbn: "978-1118879108",
      category: "Civil Engineering",
      totalCopies: 5,
      availableCopies: 5,
      shelfLocation: "CE-R1-02",
      coverUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Principles of Economics, 9th Edition",
      author: "N. Gregory Mankiw",
      isbn: "978-0357038314",
      category: "Economics & Management",
      totalCopies: 8,
      availableCopies: 6,
      shelfLocation: "ECON-M1-09",
      coverUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Computer Networks: A Systems Approach, 6th Edition",
      author: "Larry L. Peterson, Bruce S. Davie",
      isbn: "978-0128182000",
      category: "Computer Science",
      totalCopies: 5,
      availableCopies: 5,
      shelfLocation: "CS-N2-03",
      coverUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Operating System Concepts, 10th Edition",
      author: "Abraham Silberschatz, Peter B. Galvin, Greg Gagne",
      isbn: "978-1119800361",
      category: "Computer Science",
      totalCopies: 7,
      availableCopies: 6,
      shelfLocation: "CS-OS-01",
      coverUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      isbn: "978-0060935467",
      category: "Literature & Arts",
      totalCopies: 4,
      availableCopies: 4,
      shelfLocation: "LIT-T1-14",
      coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Organic Chemistry, 8th Edition",
      author: "Paula Yurkanis Bruice",
      isbn: "978-0134042282",
      category: "Chemistry",
      totalCopies: 4,
      availableCopies: 3,
      shelfLocation: "CHEM-O2-06",
      coverUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Environmental Engineering: Fundamentals, Sustainability, Design",
      author: "James R. Mihelcic, Julie B. Zimmerman",
      isbn: "978-1118741498",
      category: "Environmental Science",
      totalCopies: 5,
      availableCopies: 5,
      shelfLocation: "ENV-M1-04",
      coverUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const books = await Promise.all(
    booksData.map((b) => prisma.book.create({ data: b }))
  );
  console.log(`Created ${books.length} books`);

  // 5. Create Sample Issue Records:
  // - Some RETURNED (on time and with fine)
  // - Some ACTIVE (ISSUED within due date)
  // - Some OVERDUE (due date in past, no return date yet)
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const issuesToCreate = [
    // 1. Returned on time (no fine)
    {
      bookId: books[0].id, // Cormen
      studentId: students[0].id, // Aarav
      issueDate: new Date(now.getTime() - 25 * dayMs),
      dueDate: new Date(now.getTime() - 11 * dayMs),
      returnDate: new Date(now.getTime() - 12 * dayMs),
      status: IssueStatus.RETURNED,
      fine: 0,
    },
    // 2. Returned late (5 days late -> Rs. 25 fine)
    {
      bookId: books[1].id, // Clean Code
      studentId: students[1].id, // Diya
      issueDate: new Date(now.getTime() - 30 * dayMs),
      dueDate: new Date(now.getTime() - 16 * dayMs),
      returnDate: new Date(now.getTime() - 11 * dayMs),
      status: IssueStatus.RETURNED,
      fine: 25,
    },
    // 3. Active - Issued recently, due in 8 days
    {
      bookId: books[0].id, // Cormen (copy 1 active)
      studentId: students[2].id, // Rohan
      issueDate: new Date(now.getTime() - 6 * dayMs),
      dueDate: new Date(now.getTime() + 8 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 4. Active - Cormen (copy 2 active)
    {
      bookId: books[0].id, // Cormen
      studentId: students[3].id, // Ananya
      issueDate: new Date(now.getTime() - 2 * dayMs),
      dueDate: new Date(now.getTime() + 12 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 5. Active - Clean Code (copy 1 active)
    {
      bookId: books[1].id, // Clean Code
      studentId: students[4].id, // Kabir
      issueDate: new Date(now.getTime() - 4 * dayMs),
      dueDate: new Date(now.getTime() + 10 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 6. Overdue - Clean Code (copy 2 active, 6 days overdue)
    {
      bookId: books[1].id, // Clean Code
      studentId: students[0].id, // Aarav (second book)
      issueDate: new Date(now.getTime() - 20 * dayMs),
      dueDate: new Date(now.getTime() - 6 * dayMs),
      returnDate: null,
      status: IssueStatus.OVERDUE,
      fine: 30, // 6 days * 5
    },
    // 7. Active - Designing Data-Intensive Applications
    {
      bookId: books[2].id, // Kleppmann
      studentId: students[5].id, // Meera
      issueDate: new Date(now.getTime() - 1 * dayMs),
      dueDate: new Date(now.getTime() + 13 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 8. Overdue - AI Modern Approach (4 days overdue)
    {
      bookId: books[3].id, // Russell & Norvig
      studentId: students[6].id, // Vikram
      issueDate: new Date(now.getTime() - 18 * dayMs),
      dueDate: new Date(now.getTime() - 4 * dayMs),
      returnDate: null,
      status: IssueStatus.OVERDUE,
      fine: 20, // 4 days * 5
    },
    // 9. Active - Deep Learning (copy 1)
    {
      bookId: books[4].id, // Goodfellow
      studentId: students[7].id, // Sanya
      issueDate: new Date(now.getTime() - 5 * dayMs),
      dueDate: new Date(now.getTime() + 9 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 10. Overdue - Deep Learning (copy 2, 8 days overdue)
    {
      bookId: books[4].id, // Goodfellow
      studentId: students[8].id, // Arjun
      issueDate: new Date(now.getTime() - 22 * dayMs),
      dueDate: new Date(now.getTime() - 8 * dayMs),
      returnDate: null,
      status: IssueStatus.OVERDUE,
      fine: 40, // 8 days * 5
    },
    // 11. Overdue - Linear Algebra (2 days overdue)
    {
      bookId: books[5].id, // Strang
      studentId: students[8].id, // Arjun (second book)
      issueDate: new Date(now.getTime() - 16 * dayMs),
      dueDate: new Date(now.getTime() - 2 * dayMs),
      returnDate: null,
      status: IssueStatus.OVERDUE,
      fine: 10,
    },
    // 12. Active - Linear Algebra (copy 2)
    {
      bookId: books[5].id, // Strang
      studentId: students[9].id, // Pooja
      issueDate: new Date(now.getTime() - 3 * dayMs),
      dueDate: new Date(now.getTime() + 11 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 13. Active - Feynman Lectures (copy 1)
    {
      bookId: books[7].id, // Feynman
      studentId: students[1].id, // Diya
      issueDate: new Date(now.getTime() - 7 * dayMs),
      dueDate: new Date(now.getTime() + 7 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 14. Active - Feynman Lectures (copy 2)
    {
      bookId: books[7].id, // Feynman
      studentId: students[4].id, // Kabir
      issueDate: new Date(now.getTime() - 8 * dayMs),
      dueDate: new Date(now.getTime() + 6 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 15. Active - Microelectronic Circuits
    {
      bookId: books[9].id, // Sedra
      studentId: students[3].id, // Ananya
      issueDate: new Date(now.getTime() - 5 * dayMs),
      dueDate: new Date(now.getTime() + 9 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 16. Active - Electric Machinery
    {
      bookId: books[10].id, // Chapman
      studentId: students[2].id, // Rohan
      issueDate: new Date(now.getTime() - 9 * dayMs),
      dueDate: new Date(now.getTime() + 5 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 17. Active - Shigley Mechanical
    {
      bookId: books[11].id, // Shigley
      studentId: students[6].id, // Vikram
      issueDate: new Date(now.getTime() - 10 * dayMs),
      dueDate: new Date(now.getTime() + 4 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 18. Active - Economics Mankiw (copy 1)
    {
      bookId: books[14].id, // Mankiw
      studentId: students[7].id, // Sanya
      issueDate: new Date(now.getTime() - 3 * dayMs),
      dueDate: new Date(now.getTime() + 11 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 19. Active - Economics Mankiw (copy 2)
    {
      bookId: books[14].id, // Mankiw
      studentId: students[9].id, // Pooja
      issueDate: new Date(now.getTime() - 4 * dayMs),
      dueDate: new Date(now.getTime() + 10 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 20. Active - Operating Systems
    {
      bookId: books[16].id, // Silberschatz
      studentId: students[5].id, // Meera
      issueDate: new Date(now.getTime() - 6 * dayMs),
      dueDate: new Date(now.getTime() + 8 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
    // 21. Active - Organic Chemistry
    {
      bookId: books[18].id, // Bruice
      studentId: students[9].id, // Pooja (third book)
      issueDate: new Date(now.getTime() - 1 * dayMs),
      dueDate: new Date(now.getTime() + 13 * dayMs),
      returnDate: null,
      status: IssueStatus.ISSUED,
      fine: 0,
    },
  ];

  for (const issue of issuesToCreate) {
    await prisma.issue.create({ data: issue });
  }
  console.log(`Created ${issuesToCreate.length} issue records`);

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
