import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HelpCircle, BookOpen, UserPlus, ShieldAlert, Mail } from "lucide-react";

export default function AidePage() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen pb-16">
      
      {/* En-tête de la page d'aide */}
      <section className="w-full bg-gradient-to-b from-primary/10 to-background px-4 py-16 text-center md:px-8 lg:py-24">
        <div className="container mx-auto max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
            <HelpCircle className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl text-foreground">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium text-muted-foreground">
            Retrouvez ici toutes les informations nécessaires pour bien utiliser la plateforme (RE)Sources Relationnelles.
          </p>
        </div>
      </section>

      {/* Section FAQ (Foire Aux Questions) */}
      <section className="container mx-auto px-4 py-12 md:px-8 max-w-5xl">
        <div className="grid gap-6 md:grid-cols-2">
          
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="mb-2 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-bold">Quapos;est-ce que le catalogue ?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-foreground/80 leading-relaxed">
                Le catalogue est un espace public où vous pouvez consulter des ressources (articles, vidéos, activités) classées par catégories pour vous aider à cultiver vos relations. La consultation est libre et gratuite pour tous les citoyens.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="mb-2 flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-bold">Pourquoi créer un compte ?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-foreground/80 leading-relaxed">
                Créer un compte vous permet dapos;aller plus loin : vous pourrez sauvegarder vos ressources favorites, suivre votre progression, interagir avec la communauté via les commentaires et même proposer vos propres ressources.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="mb-2 flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-bold">Comment sont modérées les ressources ?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-foreground/80 leading-relaxed">
                Chaque ressource proposée par un citoyen passe par une étape de validation par notre équipe de modérateurs. Cela garantit un espace dapos;échange sain, bienveillant et pertinent pour tous.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="mb-2 flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-bold">Japos;ai un problème technique, que faire ?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-foreground/80 leading-relaxed">
                Si vous rencontrez un bug ou une difficulté dapos;accès, vérifiez dapos;bord que votre navigateur est à jour. Si le problème persiste, vous pouvez contacter le support technique.
              </CardDescription>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Section Contact */}
      <section className="container mx-auto px-4 mt-8 md:px-8 max-w-3xl text-center">
        <div className="rounded-2xl bg-secondary/20 p-8 md:p-12 border border-secondary/30">
          <Mail className="mx-auto h-10 w-10 text-secondary-foreground mb-4" />
          <h2 className="mb-4 text-2xl font-bold text-foreground">Vous ne trouvez pas votre réponse ?</h2>
          <p className="mb-8 text-lg text-muted-foreground font-medium">
            Notre équipe dapos;administration est à votre disposition pour toute question supplémentaire concernant la plateforme.
          </p>
          <Link href="/">
            <Button size="lg" className="rounded-full shadow-md">
              Retourner à lapos;accueil
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}