"use server";
import { ressourceSchema } from "@/lib/validations/ressource";
import { revalidatePath } from "next/cache";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { redirect } from "next/navigation";

export async function createRessourceAction(formData: unknown) {
  // 1. Vérification de l'authentification
  const session = await auth.api.getSession({
    headers: await import("next/headers").then(h => h.headers())
  });

  if (!session?.user) {
    throw new Error("Vous devez être connecté pour créer une ressource.");
  }

  // 2. Validation des données avec Zod
  const result = ressourceSchema.safeParse(formData);

  if (!result.success) {
    throw new Error("Données invalides : " + result.error.message);
  }

  const data = result.data;

  // 3. Insertion dans la base de données
  const nouvelleRessource = await db.ressource.create({
    data: {
      titre: data.titre,
      contenu: data.contenu,
      visibilite: data.visibilite,
      statut_publication: data.statut_publication,
      auteur_id: session.user.id, // On lie l'auteur via la session
      categorie_id: data.categorie_id,
      type_relation_id: data.type_relation_id,
      type_ressource_id: data.type_ressource_id,
    },
  });

  redirect('/ressource')
  
  return nouvelleRessource;
}