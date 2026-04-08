"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { TypeManager } from "@/app/admin/_components/TypeManager";

export default function CategoriesPage() {
  const utils = api.useUtils();
  const { data: categories = [], isLoading } = api.categorie.getAll.useQuery();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const create = api.categorie.create.useMutation({
    onSuccess: () => utils.categorie.getAll.invalidate(),
    onError: (e) => setMutationError(e.message),
  });

  const update = api.categorie.update.useMutation({
    onSuccess: () => utils.categorie.getAll.invalidate(),
    onError: (e) => setMutationError(e.message),
  });

  const remove = api.categorie.delete.useMutation({
    onSuccess: () => utils.categorie.getAll.invalidate(),
    onError: (e) => setMutationError(e.message),
  });

  const isMutating = create.isPending || update.isPending || remove.isPending;

  return (
    <TypeManager
      title="Catégories"
      items={categories}
      onCreate={(data) => {
        setMutationError(null);
        create.mutate(data);
      }}
      onUpdate={(id, data) => {
        setMutationError(null);
        update.mutate({ id, ...data });
      }}
      onDelete={(id) => {
        setMutationError(null);
        remove.mutate({ id });
      }}
      isLoading={isLoading || isMutating}
      error={mutationError}
    />
  );
}
