import { db } from "@/server/db";
import { RessourceForm } from "@/components/ressources/RessourceForm";
import { redirect } from "next/navigation";
import { auth } from "@/server/better-auth/config";

export const metadata = {
  title: "Créer une ressource | (RE)Sources Relationnel",
};

export default async function NewRessourcePage() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then(h => h.headers())
  });

  if (!session) {
    redirect("/auth/connexion");
  }

  // 2. Récupération des données pour les selects en parallèle
  const [categories, typeRelations, typeRessources] = await Promise.all([
    db.categorie.findMany({ select: { id: true, libelle: true } }),
    db.typeRelation.findMany({ select: { id: true, libelle: true } }),
    db.typeRessource.findMany({ select: { id: true, libelle: true } }),
  ]);

  return (
    <div className="min-h-screen bg-brand-ivory/30 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <RessourceForm 
          categories={categories}
          typeRelations={typeRelations}
          typeRessources={typeRessources}
        />
        
        <p className="text-center mt-8 text-sm text-muted-foreground font-medium">
          Besoin d&apos;aide ? Consultez notre <a href="#" className="text-brand-coral underline">guide de publication</a>.
        </p>
      </div>
    </div>
  );
}