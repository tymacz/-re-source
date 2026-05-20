"use client";

import { Loader2, Save, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { api } from "@/trpc/react";

export default function ProfilPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const { data: profile, isLoading } = api.profil.getMe.useQuery(undefined, {
    enabled: !!session,
  });

  const updateProfile = api.profil.updateMe.useMutation({
    onSuccess: async () => {
      toast.success("Profil mis a jour.");
      await utils.profil.getMe.invalidate();
      authClient.$store.notify("$sessionSignal");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteAccount = api.profil.deleteMe.useMutation({
    onSuccess: async () => {
      toast.success("Compte supprime et donnees personnelles anonymisees.");
      try {
        await authClient.signOut();
      } finally {
        authClient.$store.notify("$sessionSignal");
        router.replace("/");
        router.refresh();
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.replace("/connexion");
    }
  }, [isSessionPending, router, session]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
    }
  }, [profile]);

  const handleUpdateProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile.mutate({ email, name });
  };

  const handleDeleteAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    deleteAccount.mutate({ confirmation: "SUPPRIMER" });
  };

  if (isSessionPending || isLoading || !profile) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement du profil...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-16">
      <section className="bg-primary/5 mb-8 border-b px-4 py-10">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-2 flex items-center gap-4">
            <div className="bg-primary/20 text-primary inline-flex rounded-xl p-3">
              <UserRound className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black md:text-4xl">Mon profil</h1>
              <p className="text-muted-foreground font-medium">
                Gestion du compte et droits RGPD.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Ces informations sont utilisees pour identifier votre compte dans
              l'application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom affiche</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                {!profile.emailVerified && (
                  <p className="text-muted-foreground text-sm">
                    Cette adresse n'est pas encore verifiee.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="min-w-36"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
                <p className="text-muted-foreground text-sm">
                  Role actuel :{" "}
                  {profile.role_id === "ADMIN" ? "Administrateur" : "Citoyen"}
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="text-primary h-5 w-5" />
                Donnees RGPD
              </CardTitle>
              <CardDescription>
                Vous pouvez modifier vos informations ou demander la suppression
                de votre compte.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3 text-sm">
              <p>
                Creation du compte :{" "}
                {new Intl.DateTimeFormat("fr-FR").format(profile.date_creation)}
              </p>
              <p>
                Les logs statistiques associes a votre compte sont anonymises
                lors de la suppression.
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Supprimer mon compte
              </CardTitle>
              <CardDescription>
                Le compte sera desactive et les donnees personnelles seront
                anonymisees. Cette action est definitive.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="delete-confirmation">
                    Tapez SUPPRIMER pour confirmer
                  </Label>
                  <Input
                    id="delete-confirmation"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    autoComplete="off"
                  />
                </div>

                <Button
                  type="submit"
                  variant="destructive"
                  disabled={
                    confirmation !== "SUPPRIMER" || deleteAccount.isPending
                  }
                >
                  {deleteAccount.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Supprimer mon compte
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
