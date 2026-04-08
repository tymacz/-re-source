"use client";

import { useState } from "react";

export interface TypeItem {
  id: string;
  libelle: string;
}

interface TypeManagerProps {
  title: string;
  items: TypeItem[];
  onCreate: (data: { libelle: string }) => void;
  onUpdate: (id: string, data: { libelle: string }) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function TypeManager({
  title,
  items,
  onCreate,
  onUpdate,
  onDelete,
  isLoading,
  error,
}: TypeManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [libelle, setLibelle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function handleOpenAdd() {
    setEditingId(null);
    setLibelle("");
    setFormError(null);
    setShowAddForm(true);
  }

  function handleOpenEdit(item: TypeItem) {
    setShowAddForm(false);
    setEditingId(item.id);
    setLibelle(item.libelle);
    setFormError(null);
  }

  function handleCancel() {
    setShowAddForm(false);
    setEditingId(null);
    setLibelle("");
    setFormError(null);
  }

  function validateForm(): boolean {
    const trimmed = libelle.trim();
    if (trimmed.length < 2) {
      setFormError("Le libellé doit contenir au moins 2 caractères");
      return false;
    }
    if (trimmed.length > 100) {
      setFormError("Le libellé ne peut pas dépasser 100 caractères");
      return false;
    }
    setFormError(null);
    return true;
  }

  function handleSubmit() {
    if (!validateForm()) return;
    const data = { libelle: libelle.trim() };
    if (editingId) {
      onUpdate(editingId, data);
    } else {
      onCreate(data);
    }
    handleCancel();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {!showAddForm && !editingId && (
          <button
            onClick={handleOpenAdd}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            + Ajouter
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {(showAddForm || editingId) && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {editingId ? "Modifier" : "Nouveau"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Libellé <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                placeholder="Ex: Article, Vidéo..."
                maxLength={100}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-400">{libelle.length}/100</p>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? "Enregistrement..." : editingId ? "Modifier" : "Créer"}
              </button>
              <button
                onClick={handleCancel}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && items.length === 0 ? (
        <p className="text-sm text-gray-500">Chargement...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-500">Aucun élément pour l'instant</p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 text-sm text-indigo-600 hover:underline"
          >
            Créer le premier
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  Libellé
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.libelle}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {deleteConfirmId === item.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-gray-600">Confirmer ?</span>
                        <button
                          onClick={() => {
                            onDelete(item.id);
                            setDeleteConfirmId(null);
                          }}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          Non
                        </button>
                      </span>
                    ) : (
                      <span className="inline-flex gap-3">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-indigo-600 hover:underline"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="text-red-500 hover:underline"
                        >
                          Supprimer
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
