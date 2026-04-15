"use client";

import { api } from "@/trpc/react";
import { authClient } from "@/lib/auth-client"; // Ajuste le chemin si besoin
import { toast } from "sonner";
import { format } from "date-fns";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCheck, UserX, ShieldAlert, Shield, Users, Mail, Calendar } from "lucide-react";

type UtilisateurAdmin = {
  id: string;
  name: string;
  email: string;
  role_id: "USER" | "ADMIN";
  est_actif: boolean;
  date_creation: Date;
};

export default function GestionUtilisateursPage() {
  const utils = api.useUtils();
  
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user.id;

  const { data: utilisateurs, isLoading } = api.admin.getAllUsers.useQuery();

  const changerStatut = api.admin.changerStatutUtilisateur.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.est_actif ? "Compte réactivé." : "Compte désactivé.");
      void utils.admin.getAllUsers.invalidate();
    },
    onError: (error) => toast.error(error.message || "Une erreur est survenue."),
  });

  const changerRole = api.admin.changerRoleUtilisateur.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.role === "ADMIN" ? "Utilisateur promu Administrateur." : "Droits d'administration retirés.");
      void utils.admin.getAllUsers.invalidate();
    },
    onError: (error) => toast.error(error.message || "Une erreur est survenue."),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-96 mb-8" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  const typedUsers = (utilisateurs as UtilisateurAdmin[]) || [];
  
  const citoyens = typedUsers.filter(u => u.role_id === "USER");
  const admins = typedUsers.filter(u => u.role_id === "ADMIN");
  const inactifs = typedUsers.filter(u => !u.est_actif);

  const ListeUtilisateurs = ({ liste }: { liste: UtilisateurAdmin[] }) => {
    if (liste.length === 0) {
      return (
        <div className="py-12 text-center border rounded-lg bg-card/50 border-dashed mt-4">
          <p className="text-muted-foreground">Aucun utilisateur trouvé dans cette catégorie.</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 mt-4">
        {liste.map((user) => {
          const isMe = user.id === currentUserId;

          return (
            <Card key={user.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-hidden ${!user.est_actif ? 'opacity-75 bg-muted/20' : ''}`}>
              <div className="p-4 sm:p-6 grow">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={user.role_id === "ADMIN" ? "default" : "secondary"}>
                    {user.role_id === "ADMIN" ? "Administrateur" : "Citoyen"}
                  </Badge>
                  {!user.est_actif && (
                    <Badge variant="destructive">Compte désactivé</Badge>
                  )}
                  {isMe && (
                    <Badge variant="outline" className="border-primary text-primary">Vous</Badge>
                  )}
                </div>
                
                <h3 className="font-bold text-lg mb-1">{user.name}</h3>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Inscrit le {format(new Date(user.date_creation), "dd/MM/yyyy")}
                  </div>
                </div>
              </div>

              {!isMe && (
                <div className="p-4 sm:p-6 bg-muted/30 sm:bg-transparent w-full sm:w-auto flex flex-wrap items-center gap-2 border-t sm:border-t-0 sm:border-l border-border/50">
                  
                  {user.est_actif ? (
                    <Button 
                      variant="outline" 
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto"
                      onClick={() => {
                        if (confirm(`Voulez-vous vraiment désactiver le compte de ${user.name} ? Il ne pourra plus se connecter.`)) {
                          changerStatut.mutate({ id: user.id, est_actif: false });
                        }
                      }}
                    >
                      <UserX className="h-4 w-4 mr-2" /> Bloquer
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      onClick={() => changerStatut.mutate({ id: user.id, est_actif: true })}
                    >
                      <UserCheck className="h-4 w-4 mr-2" /> Réactiver
                    </Button>
                  )}

                  {user.role_id === "USER" ? (
                    <Button 
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        if (confirm(`Donner les droits d'administration à ${user.name} ?`)) {
                          changerRole.mutate({ id: user.id, role: "ADMIN" });
                        }
                      }}
                    >
                      <Shield className="h-4 w-4 mr-2" /> Nommer Admin
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        if (confirm(`Retirer les droits d'administration de ${user.name} ?`)) {
                          changerRole.mutate({ id: user.id, role: "USER" });
                        }
                      }}
                    >
                      <ShieldAlert className="h-4 w-4 mr-2 text-orange-500" /> Rétrograder
                    </Button>
                  )}

                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground">Gérez les accès, bloquez les comportements abusifs et nommez des administrateurs.</p>
      </div>

      <Tabs defaultValue="tous" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 h-auto p-1 gap-1">
          <TabsTrigger value="tous" className="py-2.5">
            <Users className="h-4 w-4 mr-2" /> Tous ({typedUsers.length})
          </TabsTrigger>
          <TabsTrigger value="citoyens" className="py-2.5">
            Citoyens ({citoyens.length})
          </TabsTrigger>
          <TabsTrigger value="admins" className="py-2.5">
            <Shield className="h-4 w-4 mr-2" /> Admins ({admins.length})
          </TabsTrigger>
          <TabsTrigger value="inactifs" className="py-2.5">
            <UserX className="h-4 w-4 mr-2" /> Bloqués ({inactifs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tous">
          <ListeUtilisateurs liste={typedUsers} />
        </TabsContent>

        <TabsContent value="citoyens">
          <ListeUtilisateurs liste={citoyens} />
        </TabsContent>

        <TabsContent value="admins">
          <ListeUtilisateurs liste={admins} />
        </TabsContent>

        <TabsContent value="inactifs">
          <ListeUtilisateurs liste={inactifs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}