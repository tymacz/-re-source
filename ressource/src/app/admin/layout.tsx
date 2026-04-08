import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role_id: true },
  });

  if (user?.role_id !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center gap-8">
            <span className="font-bold text-gray-900">Administration</span>
            <div className="flex gap-4">
              <Link
                href="/admin/categories"
                className="text-sm text-gray-600 transition hover:text-gray-900"
              >
                Catégories
              </Link>
              <Link
                href="/admin/relation-types"
                className="text-sm text-gray-600 transition hover:text-gray-900"
              >
                Types de relations
              </Link>
              <Link
                href="/admin/resource-types"
                className="text-sm text-gray-600 transition hover:text-gray-900"
              >
                Types de ressources
              </Link>
            </div>
            <div className="ml-auto">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
                ← Retour au site
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
