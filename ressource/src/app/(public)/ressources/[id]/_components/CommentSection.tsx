"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { authClient } from "@/lib/auth-client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, Reply, Send, UserCircle2 } from "lucide-react";
import Link from "next/link";

type Auteur = { id: string; name: string };
type Reponse = { id: string; contenu: string; date_publication: Date; auteur: Auteur };
type Commentaire = { id: string; contenu: string; date_publication: Date; auteur: Auteur; reponses: Reponse[] };

export function CommentSection({ ressourceId }: { ressourceId: string }) {
  const utils = api.useUtils();
  const { data: session } = authClient.useSession();
  
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [reponseA, setReponseA] = useState<string | null>(null);
  const [texteReponse, setTexteReponse] = useState("");

  const { data: commentaires, isLoading } = api.commentaire.getByRessource.useQuery({ ressourceId });

  const ajouterMutation = api.commentaire.ajouter.useMutation({
    onSuccess: () => {
      toast.success("Commentaire publié !");
      setNouveauCommentaire("");
      setTexteReponse("");
      setReponseA(null);
      void utils.commentaire.getByRessource.invalidate({ ressourceId });
    },
    onError: () => toast.error("Erreur lors de la publication."),
  });

  const supprimerMutation = api.commentaire.supprimer.useMutation({
    onSuccess: () => {
      toast.success("Commentaire supprimé.");
      void utils.commentaire.getByRessource.invalidate({ ressourceId });
    },
  });

  const handleAjouter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauCommentaire.trim()) return;
    ajouterMutation.mutate({ ressourceId, contenu: nouveauCommentaire });
  };

  const handleRepondre = (parentId: string) => {
    if (!texteReponse.trim()) return;
    ajouterMutation.mutate({ ressourceId, contenu: texteReponse, parentId });
  };

  if (isLoading) return <div className="animate-pulse h-32 bg-muted rounded-lg w-full mt-8" />;

  const typedCommentaires = (commentaires as Commentaire[]) || [];

  return (
    <section className="mt-16 pt-8 border-t border-border/50">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-8">
        <MessageSquare className="h-6 w-6" /> 
        Commentaires ({typedCommentaires.length + typedCommentaires.reduce((acc, c) => acc + c.reponses.length, 0)})
      </h2>
      {session ? (
        <form onSubmit={handleAjouter} className="mb-10 bg-muted/20 p-4 rounded-xl border border-border/50">
          <textarea
            value={nouveauCommentaire}
            onChange={(e) => setNouveauCommentaire(e.target.value)}
            placeholder="Partagez votre avis ou posez une question..."
            className="w-full bg-background border rounded-md p-3 text-sm min-h-25 resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!nouveauCommentaire.trim() || ajouterMutation.isPending}>
              <Send className="h-4 w-4 mr-2" /> Publier
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-muted/30 p-6 rounded-xl text-center mb-10 border border-border/50">
          <p className="text-muted-foreground mb-4">Vous devez être connecté pour participer à la discussion.</p>
          <Button asChild variant="outline">
            <Link href="/auth/connexion">Se connecter</Link>
          </Button>
        </div>
      )}

      <div className="space-y-8">
        {typedCommentaires.length === 0 ? (
          <p className="text-center text-muted-foreground italic py-8">Soyez le premier à commenter cette ressource !</p>
        ) : (
          typedCommentaires.map((com) => (
            <div key={com.id} className="flex gap-4">
              <div className="shrink-0 mt-1">
                <UserCircle2 className="h-10 w-10 text-muted-foreground/50" />
              </div>
              
              <div className="grow space-y-4">
                <div className="bg-card border shadow-sm rounded-2xl rounded-tl-none p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{com.auteur.name}</span>
                      <span className="text-xs text-muted-foreground">
                        il y a {formatDistanceToNow(new Date(com.date_publication), { locale: fr })}
                      </span>
                    </div>
                    
                    {(session?.user.id === com.auteur.id || session?.user.role_id === "ADMIN") && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => { if(confirm("Supprimer ce commentaire ?")) supprimerMutation.mutate({ id: com.id }) }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{com.contenu}</p>
                  
                  {session && (
                    <button onClick={() => setReponseA(reponseA === com.id ? null : com.id)} className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1 mt-3 transition-colors">
                      <Reply className="h-3 w-3" /> Répondre
                    </button>
                  )}
                </div>

                {reponseA === com.id && (
                  <div className="flex gap-3 pl-4 animate-in slide-in-from-top-2">
                    <UserCircle2 className="h-8 w-8 text-primary/50 shrink-0" />
                    <div className="grow flex gap-2">
                      <input 
                        type="text" 
                        autoFocus
                        value={texteReponse} 
                        onChange={(e) => setTexteReponse(e.target.value)} 
                        placeholder={`Répondre à ${com.auteur.name}...`} 
                        className="grow bg-background border rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        onKeyDown={(e) => { if(e.key === "Enter") handleRepondre(com.id); }}
                      />
                      <Button size="sm" disabled={!texteReponse.trim()} onClick={() => handleRepondre(com.id)}>Envoyer</Button>
                    </div>
                  </div>
                )}

                {com.reponses.length > 0 && (
                  <div className="space-y-4 pl-4 sm:pl-8 border-l-2 border-muted/50 mt-4">
                    {com.reponses.map((rep) => (
                      <div key={rep.id} className="flex gap-3">
                        <UserCircle2 className="h-8 w-8 text-muted-foreground/40 shrink-0 mt-1" />
                        <div className="grow bg-muted/30 rounded-2xl rounded-tl-none p-3 border border-border/50">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs">{rep.auteur.name}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(rep.date_publication), { locale: fr })}
                              </span>
                            </div>
                            {(session?.user.id === rep.auteur.id || session?.user.role_id === "ADMIN") && (
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => { if(confirm("Supprimer cette réponse ?")) supprimerMutation.mutate({ id: rep.id }) }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-foreground/80">{rep.contenu}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}