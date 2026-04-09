import { z } from "zod";

export const ressourceSchema = z.object({
  titre: z.string().min(5, "Le titre doit contenir au moins 5 caractères"),
  contenu: z.string().min(20, "Le contenu doit être plus détaillé (min. 20 caractères)"),
  visibilite: z.enum(["PUBLIQUE", "PARTAGEE", "PRIVEE"]),
  statut_publication: z.enum(["BROUILLON", "EN_ATTENTE", "VALIDEE", "SUSPENDUE"]),
  categorie_id: z.string().min(1, "La catégorie est requise"),
  type_relation_id: z.string().min(1, "Le type de relation est requis"),
  type_ressource_id: z.string().min(1, "Le type de ressource est requis"),
});

export type RessourceFormValues = z.infer<typeof ressourceSchema>;