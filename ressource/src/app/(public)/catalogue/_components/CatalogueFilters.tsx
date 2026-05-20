import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Categorie {
  id: string;
  libelle: string;
}

interface CatalogueFiltersProps {
  recherche: string;
  setRecherche: (value: string) => void;
  categorieId: string | undefined;
  setCategorieId: (value: string | undefined) => void;
  categories: Categorie[];
  isLoadingCategories: boolean;
}

export function CatalogueFilters({
  recherche,
  setRecherche,
  categorieId,
  setCategorieId,
  categories,
  isLoadingCategories,
}: CatalogueFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-card p-4 rounded-xl border shadow-sm">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher une ressource..."
          className="pl-10"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </div>

      <div className="w-full sm:w-[250px]">
        <Select
          value={categorieId ?? "toutes"}
          onValueChange={(value) => setCategorieId(value === "toutes" ? undefined : value)}
          disabled={isLoadingCategories}
        >
          <SelectTrigger>
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent className="bg-background/80" >
            <SelectItem value="toutes">Toutes les catégories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.libelle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}