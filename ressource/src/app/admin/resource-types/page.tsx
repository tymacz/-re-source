"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { TypeManager } from "@/app/admin/_components/TypeManager";

export default function ResourceTypesPage() {
  const utils = api.useUtils();
  const { data: types = [], isLoading } = api.typeRessource.getAll.useQuery();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const create = api.typeRessource.create.useMutation({
    onSuccess: () => utils.typeRessource.getAll.invalidate(),
    onError: (e) => setMutationError(e.message),
  });

  const update = api.typeRessource.update.useMutation({
    onSuccess: () => utils.typeRessource.getAll.invalidate(),
    onError: (e) => setMutationError(e.message),
  });

  const remove = api.typeRessource.delete.useMutation({
    onSuccess: () => utils.typeRessource.getAll.invalidate(),
    onError: (e) => setMutationError(e.message),
  });

  const isMutating = create.isPending || update.isPending || remove.isPending;

  return (
    <TypeManager
      title="Types de ressources"
      items={types}
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
