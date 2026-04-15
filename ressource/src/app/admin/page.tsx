"use client";

import { authClient } from "@/lib/auth-client"; 
import { ShieldCheck, Users, BookOpen, Settings, ArrowRight, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: session } = authClient.useSession();

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground">Espace Administration</h1>
          <p className="text-muted-foreground">
            Bienvenue, {session?.user.name}. Vous avez les droits d&apos;administration.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        <Card className="shadow-sm border-border/50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ressources</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="grow flex flex-col justify-end pt-4 mt-auto">
            <Button asChild className="w-full">
              <Link href="/admin/ressources">
                Modérer <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="grow flex flex-col justify-end pt-4 mt-auto">
            <Button asChild className="w-full">
              <Link href="/admin/utilisateurs">
                Gérer <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Référentiel</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="grow flex flex-col justify-end pt-4 mt-auto">
            <Button asChild className="w-full">
              <Link href="/admin/referentiel"> 
                Modifier <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 flex flex-col bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Statistiques</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="grow flex flex-col justify-end pt-4 mt-auto">
            <Button asChild className="w-full" variant="default">
              <Link href="/admin/statistiques">
                Analyser <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}