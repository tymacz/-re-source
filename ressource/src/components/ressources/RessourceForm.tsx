"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ressourceSchema, type RessourceFormValues } from "@/lib/validations/ressource";
import { db } from "@/server/db";
import router from "next/router";
import { createRessourceAction } from "@/app/(main)/ressource/action";

interface SelectOption {
  id: string;
  libelle: string;
}

interface RessourceFormProps {
  categories: SelectOption[];
  typeRelations: SelectOption[];
  typeRessources: SelectOption[];
}

export function RessourceForm({ categories, typeRelations, typeRessources }: RessourceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RessourceFormValues>({
    resolver: zodResolver(ressourceSchema),
    defaultValues: {
      visibilite: "PRIVEE",
      statut_publication: "BROUILLON",
    },
  });

const onSubmit = async (data: RessourceFormValues) => {
    try {
      // ✅ Appel de la Server Action au lieu du setTimeout
      await createRessourceAction(data);
      
      toast.success("Ressource publiée avec succès !");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg- p-8 rounded-[2rem] border border-border shadow-sm">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-primary tracking-tight">Nouvelle Ressource</h2>
        <p className="text-muted-foreground font-medium">Partagez votre savoir avec la communauté (RE)Sources.</p>
      </div>

      <div className="grid gap-6">
        {/* Titre */}
        <div className="flex flex-col gap-2">
          <label htmlFor="titre" className="text-sm font-bold text-primary px-1">TITRE</label>
          <input
            id="titre"
            {...register("titre")}
            className="bg-brand-ivory/40 border-none rounded-2xl p-4 focus:ring-2 focus:ring-brand-coral outline-none transition-all placeholder:text-muted-foreground/50"
            placeholder="Quel est le sujet principal ?"
          />
          {errors.titre && <p className="text-destructive text-xs font-bold px-1">{errors.titre.message}</p>}
        </div>

        {/* Contenu */}
        <div className="flex flex-col gap-2">
          <label htmlFor="contenu" className="text-sm font-bold text-primary px-1">CONTENU</label>
          <textarea
            id="contenu"
            rows={6}
            {...register("contenu")}
            className="bg-brand-ivory/40 border-none rounded-2xl p-4 focus:ring-2 focus:ring-brand-coral outline-none transition-all resize-none"
            placeholder="Développez votre pensée ici..."
          />
          {errors.contenu && <p className="text-destructive text-xs font-bold px-1">{errors.contenu.message}</p>}
        </div>

        {/* Sélecteurs en grille */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="categorie_id" className="text-sm font-bold text-primary px-1">CATÉGORIE</label>
            <select id="categorie_id" {...register("categorie_id")} className="bg-brand-ivory/40 border-none rounded-xl p-3 focus:ring-2 focus:ring-brand-coral outline-none font-medium">
              <option value="">Choisir...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="type_relation_id" className="text-sm font-bold text-primary px-1">RELATION</label>
            <select id="type_relation_id" {...register("type_relation_id")} className="bg-brand-ivory/40 border-none rounded-xl p-3 focus:ring-2 focus:ring-brand-coral outline-none font-medium">
              <option value="">Choisir...</option>
              {typeRelations.map((tr) => <option key={tr.id} value={tr.id}>{tr.libelle}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="type_ressource_id" className="text-sm font-bold text-primary px-1">TYPE</label>
            <select id="type_ressource_id" {...register("type_ressource_id")} className="bg-brand-ivory/40 border-none rounded-xl p-3 focus:ring-2 focus:ring-brand-coral outline-none font-medium">
              <option value="">Choisir...</option>
              {typeRessources.map((tr) => <option key={tr.id} value={tr.id}>{tr.libelle}</option>)}
            </select>
          </div>
        </div>

        {/* Visibilité - Style bannière douce */}
        <div className="flex items-center justify-between p-4 bg-brand-seafoam/10 rounded-2xl border border-brand-seafoam/20">
          <label htmlFor="visibilite" className="font-bold text-primary">Qui peut voir ceci ?</label>
          <select id="visibilite" {...register("visibilite")} className="bg-white border-none rounded-lg p-2 font-bold text-primary text-sm shadow-sm">
            <option value="PRIVEE">Privé</option>
            <option value="PARTAGEE">Partagé</option>
            <option value="PUBLIQUE">Public</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-brand-coral hover:bg-accessible-darkCoral text-white font-black py-4 rounded-full shadow-lg shadow-brand-coral/20 transition-all active:scale-95 disabled:opacity-50"
      >
        {isSubmitting ? "CRÉATION EN COURS..." : "PUBLIER LA RESSOURCE"}
      </button>
    </form>
  );
}