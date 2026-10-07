import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell
      adminName={session.user.name || "Head Librarian"}
      adminEmail={session.user.email || "admin@college.edu"}
    >
      {children}
    </DashboardShell>
  );
}
