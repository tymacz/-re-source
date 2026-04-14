"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { useDebounce } from "@/hooks/use-debounce";
import { CatalogueFilters } from "./_components/CatalogueFilters";
import { RessourceList } from "./_components/RessourceList";
import { BookOpen } from "lucide-react";

export default function CataloguePage() {
  const [recherche, setRecherche] = useState("");
  const [categorieId, setCategorieId] = useState<string | undefined>(undefined);

  const debouncedRecherche = useDebounce(recherche, 400);

  const { data: categories, isLoading: isLoadingCats } = api.ressource.getCategories.useQuery();
  
  const { data: ressources, isLoading: isLoadingRessources } = api.ressource.getAllPublic.useQuery({
    recherche: debouncedRecherche === "" ? undefined : debouncedRecherche,
    categorieId: categorieId,
  });

  return (
    <div className="min-h-screen bg-background pb-16">
      <section className="bg-primary/5 py-12 px-4 mb-8 border-b">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="inline-flex p-3 rounded-xl bg-primary/20 text-primary">
              <BookOpen className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black md:text-4xl">Catalogue des ressources</h1>
          </div>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl">
            Explorez notre bibliothèque publique. Filtrez par catégorie ou recherchez une thématique précise pour cultiver la qualité de vos relations.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4">
        <CatalogueFilters
          recherche={recherche}
          setRecherche={setRecherche}
          categorieId={categorieId}
          setCategorieId={setCategorieId}
          categories={categories ?? []}
          isLoadingCategories={isLoadingCats}
        />

        <RessourceList 
          ressources={ressources} 
          isLoading={isLoadingRessources} 
        />
      </section>
    </div>
  );
}