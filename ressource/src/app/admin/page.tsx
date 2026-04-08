import Link from "next/link";

export default function AdminPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Tableau de bord</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/categories"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-gray-900">Catégories</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gérer les catégories de ressources
          </p>
        </Link>
        <Link
          href="/admin/relation-types"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Types de relations
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gérer les types de relations entre ressources
          </p>
        </Link>
        <Link
          href="/admin/resource-types"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Types de ressources
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gérer les types de ressources disponibles
          </p>
        </Link>
      </div>
    </div>
  );
}
