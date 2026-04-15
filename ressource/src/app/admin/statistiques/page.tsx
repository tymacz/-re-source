"use client";

import { api } from "@/trpc/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Search, PenTool, Share2, Hammer, Activity } from "lucide-react";

export default function StatistiquesPage() {
  const { data: stats, isLoading } = api.admin.getStatistiques.useQuery();

  const handleExportCSV = () => {
    if (!stats || stats.derniersLogs.length === 0) return;

    const headers = "Date,Type Action,Utilisateur,Ressource concernée\n";

    const rows = stats.derniersLogs.map(log => {
      const date = format(new Date(log.date_action), "dd/MM/yyyy HH:mm");
      const type = log.type_action;
      const user = log.user?.name ?? "Anonyme";
      const ressource = log.ressource?.titre?.replace(/,/g, " ") ?? "N/A"; 
      
      return `${date},${type},${user},${ressource}`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `statistiques_ressources_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-100 w-full" />
      </div>
    );
  }

  if (!stats) return null;


  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground">Statistiques</h1>
          <p className="text-muted-foreground">Analysez l&apos;engagement des citoyens sur votre plateforme.</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" /> Exporter en CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Vues</p>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.compteParType.CONSULTATION}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Recherches</p>
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.compteParType.RECHERCHE}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Créations</p>
              <PenTool className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.compteParType.CREATION}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Exploitations</p>
              <Hammer className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.compteParType.EXPLOITATION}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Partages</p>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.compteParType.PARTAGE}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" /> Activités récentes ({stats.derniersLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stats.derniersLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Aucune donnée statistique enregistrée pour le moment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Utilisateur</th>
                    <th className="px-6 py-3 font-medium">Ressource</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {stats.derniersLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(log.date_action), "dd/MM/yyyy à HH:mm", { locale: fr })}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{log.type_action}</Badge>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {log.user?.name ?? <span className="text-muted-foreground italic">Anonyme</span>}
                      </td>
                      <td className="px-6 py-4">
                        {log.ressource?.titre ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}