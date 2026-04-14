"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenLine, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreerRessourcePage() {
  const router = useRouter();

  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [categorieId, setCategorieId] = useState("");
  const [typeRelationId, setTypeRelationId] = useState("");
  const [typeRessourceId, setTypeRessourceId] = useState("");
  const [visibilite, setVisibilite] = useState<"PUBLIQUE" | "PARTAGEE" | "PRIVEE">("PRIVEE");

  const { data: categories, isLoading: isCatLoading } = api.ressource.getCategories.useQuery();
  const { data: typesRelation, isLoading: isRelLoading } = api.ressource.getTypesRelation.useQuery();
  const { data: typesRessource, isLoading: isResLoading } = api.ressource.getTypesRessource.useQuery();

  const createMutation = api.ressource.create.useMutation({
    onSuccess: () => {
      toast.success("Votre ressource a été créée avec succès !", { position: "bottom-right" });
      router.push("/tableau-de-bord");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message, { position: "bottom-right" });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      titre,
      contenu,
      categorie_id: categorieId,
      type_relation_id: typeRelationId,
      type_ressource_id: typeRessourceId,
      visibilite,
    });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        
        <Link href="/tableau-de-bord" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Link>

        <Card className="border-border/50 shadow-md">
          <CardHeader className="bg-primary/5 border-b border-border/50 pb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <PenLine className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Créer une ressource</CardTitle>
            </div>
            <CardDescription className="text-base text-muted-foreground">
              Partagez votre expérience ou vos outils pour aider la communauté à cultiver de meilleures relations.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8">
            <form onSubmit={onSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label htmlFor="titre" className="text-sm font-medium">Titre de la ressource *</label>
                <Input
                  id="titre"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: 5 conseils pour mieux communiquer en couple"
                  required
                  minLength={3}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Catégorie */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catégorie *</label>
                  <Select value={categorieId} onValueChange={setCategorieId} required>
                    <SelectTrigger disabled={isCatLoading}>
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    {/* Ajout de position="popper" ici 👇 */}
                    <SelectContent position="popper" sideOffset={4}>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.libelle}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type de relation */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type de relation *</label>
                  <Select value={typeRelationId} onValueChange={setTypeRelationId} required>
                    <SelectTrigger disabled={isRelLoading}>
                      <SelectValue placeholder="Choisir un type de relation" />
                    </SelectTrigger>
                    {/* Ajout de position="popper" ici 👇 */}
                    <SelectContent position="popper" sideOffset={4}>
                      {typesRelation?.map((rel) => (
                        <SelectItem key={rel.id} value={rel.id}>{rel.libelle}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Type de ressource */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type de ressource *</label>
                  <Select value={typeRessourceId} onValueChange={setTypeRessourceId} required>
                    <SelectTrigger disabled={isResLoading}>
                      <SelectValue placeholder="Choisir un format" />
                    </SelectTrigger>
                    {/* Ajout de position="popper" ici 👇 */}
                    <SelectContent position="popper" sideOffset={4}>
                      {typesRessource?.map((res) => (
                        <SelectItem key={res.id} value={res.id}>{res.libelle}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Visibilité */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibilité *</label>
                  <Select value={visibilite} onValueChange={(val: "PUBLIQUE" | "PARTAGEE" | "PRIVEE") => setVisibilite(val)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Niveau de visibilité" />
                    </SelectTrigger>
                    {/* Ajout de position="popper" ici 👇 */}
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="PRIVEE">Privée (Seulement moi)</SelectItem>
                      <SelectItem value="PARTAGEE">Partagée (Lien direct)</SelectItem>
                      <SelectItem value="PUBLIQUE">Publique (Soumis à modération)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="contenu" className="text-sm font-medium">Contenu *</label>
                <Textarea
                  id="contenu"
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  placeholder="Rédigez le contenu de votre ressource ici..."
                  className="min-h-[200px] resize-y"
                  required
                  minLength={10}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full sm:w-auto"
                disabled={createMutation.isPending || !categorieId || !typeRelationId || !typeRessourceId}
              >
                {createMutation.isPending ? "Création en cours..." : "Enregistrer la ressource"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}