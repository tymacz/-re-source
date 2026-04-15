"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Trash2, Eye, Clock, AlertTriangle } from "lucide-react";

type RessourceModeree = {
  id: string;
  titre: string;
  date_creation: Date;
  visibilite: "PUBLIQUE" | "PARTAGEE" | "PRIVEE";
  statut_publication: "BROUILLON" | "EN_ATTENTE" | "VALIDEE" | "SUSPENDUE";
  categorie: { libelle: string } | null;
  auteur: { name: string; email: string };
};

interface ListeRessourcesProps {
  liste: RessourceModeree[];
  emptyMessage: string;
  onValider: (id: string) => void;
  onSuspendre: (id: string) => void;
  onSupprimer: (id: string) => void;
}

function ListeRessources({ liste, emptyMessage, onValider, onSuspendre, onSupprimer }: ListeRessourcesProps) {
  if (!liste || liste.length === 0) {
    return (
      <div className="py-12 text-center border rounded-lg bg-card/50 border-dashed mt-4">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 mt-4">
      {liste.map((ressource) => (
        <Card key={ressource.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-hidden">
          <div className="p-4 sm:p-6 grow">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{ressource.categorie?.libelle ?? "Sans catégorie"}</Badge>
              <Badge variant={ressource.visibilite === "PUBLIQUE" ? "default" : "outline"}>
                {ressource.visibilite}
              </Badge>
            </div>
            <h3 className="font-bold text-lg mb-1 line-clamp-1">{ressource.titre}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Par <span className="font-medium text-foreground">{ressource.auteur.name}</span>
              <span>•</span>
              {format(new Date(ressource.date_creation), "d MMM yyyy", { locale: fr })}
            </p>
          </div>

          <div className="p-4 sm:p-6 bg-muted/30 sm:bg-transparent w-full sm:w-auto flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-border/50">
            <Button variant="outline" size="icon" asChild title="Voir la ressource">
              <Link href={`/ressources/${ressource.id}`} target="_blank">
                <Eye className="h-4 w-4" />
              </Link>
            </Button>

            {ressource.statut_publication !== "VALIDEE" && (
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700 text-white" 
                size="icon"
                title="Valider la publication"
                onClick={() => onValider(ressource.id)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}

            {ressource.statut_publication !== "SUSPENDUE" && (
              <Button 
                variant="outline" 
                className="text-orange-600 hover:bg-orange-50" 
                size="icon"
                title="Suspendre la publication"
                onClick={() => onSuspendre(ressource.id)}
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>
            )}

            <Button 
              variant="destructive" 
              size="icon"
              title="Supprimer définitivement"
              onClick={() => {
                if (confirm("Supprimer cette ressource DÉFINITIVEMENT ? Cette action est irréversible.")) {
                  onSupprimer(ressource.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// 3. COMPOSANT PRINCIPAL
export default function ModerationRessourcesPage() {
  const utils = api.useUtils();

  const { data: ressources, isLoading } = api.admin.getAllRessources.useQuery();

  const changerStatut = api.admin.changerStatutRessource.useMutation({
    onSuccess: (_, variables) => {
      const message = variables.nouveauStatut === "VALIDEE" ? "Ressource validée !" : "Ressource suspendue.";
      toast.success(message);
      void utils.admin.getAllRessources.invalidate();
    },
    onError: () => toast.error("Une erreur est survenue lors du changement de statut."),
  });

  const supprimer = api.admin.supprimerRessource.useMutation({
    onSuccess: () => {
      toast.success("Ressource supprimée définitivement.");
      void utils.admin.getAllRessources.invalidate();
    },
    onError: () => toast.error("Erreur lors de la suppression."),
  });

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Chargement des ressources...</div>;
  }

  // On force le typage ici pour que TypeScript soit content
  const typedRessources = (ressources as RessourceModeree[]) || [];

  const enAttente = typedRessources.filter((r) => r.statut_publication === "EN_ATTENTE");
  const validees = typedRessources.filter((r) => r.statut_publication === "VALIDEE");
  const suspendues = typedRessources.filter((r) => r.statut_publication === "SUSPENDUE");

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground">Modération des Ressources</h1>
        <p className="text-muted-foreground">Examinez, validez ou bloquez les publications des citoyens.</p>
      </div>

      <Tabs defaultValue="attente" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="attente" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            En attente
            {enAttente.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                {enAttente.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="validees" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Validées
          </TabsTrigger>
          <TabsTrigger value="suspendues" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" /> Suspendues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attente">
          <ListeRessources 
            liste={enAttente} 
            emptyMessage="Super ! Aucune ressource n'est en attente de modération." 
            onValider={(id) => changerStatut.mutate({ id, nouveauStatut: "VALIDEE" })}
            onSuspendre={(id) => changerStatut.mutate({ id, nouveauStatut: "SUSPENDUE" })}
            onSupprimer={(id) => supprimer.mutate({ id })}
          />
        </TabsContent>

        <TabsContent value="validees">
          <ListeRessources 
            liste={validees} 
            emptyMessage="Aucune ressource n'a encore été validée." 
            onValider={(id) => changerStatut.mutate({ id, nouveauStatut: "VALIDEE" })}
            onSuspendre={(id) => changerStatut.mutate({ id, nouveauStatut: "SUSPENDUE" })}
            onSupprimer={(id) => supprimer.mutate({ id })}
          />
        </TabsContent>

        <TabsContent value="suspendues">
          <ListeRessources 
            liste={suspendues} 
            emptyMessage="Aucune ressource n'est actuellement suspendue." 
            onValider={(id) => changerStatut.mutate({ id, nouveauStatut: "VALIDEE" })}
            onSuspendre={(id) => changerStatut.mutate({ id, nouveauStatut: "SUSPENDUE" })}
            onSupprimer={(id) => supprimer.mutate({ id })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}