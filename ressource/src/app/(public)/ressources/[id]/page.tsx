"use client";

import { use } from "react";
import { api } from "@/trpc/react";
import { authClient } from "@/lib/auth-client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Calendar, User, Tag, Layers, HeartHandshake, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CommentSection } from "./_components/CommentSection";

export default function DetailRessourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const { data: session } = authClient.useSession();

  const { data: ressource, isLoading, error } = api.ressource.getById.useQuery({
    id: id,
  });

  const creerSession = api.session.creer.useMutation({
    onSuccess: (nouvelleSession) => {
      router.push(`/sessions/${nouvelleSession.id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-12 w-3/4 mb-6" />
        <div className="flex gap-4 mb-12">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-100 w-full" />
      </div>
    );
  }

  if (error || !ressource) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Ressource introuvable</h1>
        <p className="text-muted-foreground mb-8">
          La ressource que vous cherchez n&apos;existe pas ou n&aposs;est plus disponible publiquement.
        </p>
        <Link href="/catalogue">
          <Button>Retourner au catalogue</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <main className="container mx-auto max-w-4xl px-4 py-12">
        
        <Link href="/catalogue" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au catalogue
        </Link>

        <header className="mb-10 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground text-sm flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              {ressource.categorie.libelle}
            </Badge>
            <Badge variant="outline" className="text-sm flex items-center gap-1.5 border-primary/20">
              <HeartHandshake className="h-3.5 w-3.5 text-primary" />
              {ressource.type_relation.libelle}
            </Badge>
            <Badge variant="outline" className="text-sm flex items-center gap-1.5 border-primary/20">
              <Layers className="h-3.5 w-3.5 text-primary" />
              {ressource.type_ressource.libelle}
            </Badge>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
            {ressource.titre}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-6 border-y border-border/50 py-4">
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium text-foreground">Par {ressource.auteur.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Publié le {format(new Date(ressource.date_creation), "d MMMM yyyy", { locale: fr })}</span>
              </div>
            </div>

            {session ? (
              <Button 
                onClick={() => creerSession.mutate({ ressourceId: id })}
                disabled={creerSession.isPending}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                {creerSession.isPending ? "Création en cours..." : "Démarrer une activité"}
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/auth/connexion">Connectez-vous pour démarrer une activité</Link>
              </Button>
            )}
          </div>
        </header>

        <article className="prose prose-lg prose-slate max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">
            {ressource.contenu}
          </div>
        </article>

        <CommentSection ressourceId={id} />

      </main>
    </div>
  );
}