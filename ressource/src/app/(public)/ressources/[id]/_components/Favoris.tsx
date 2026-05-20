"use client";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function BoutonFavori() {
  const utils = api.useUtils();
  const params = useParams();
  
  const ressourceId = params?.id as string;

  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  const { data: dashboardData, isLoading: isDashboardLoading } = 
    api.progression.getMonTableauDeBord.useQuery(undefined, {
      enabled: !!session && !!ressourceId,
    });

  const toggleFavoriMutation = api.progression.toggleFavori.useMutation({
    onSuccess: async () => {
      await utils.progression.getMonTableauDeBord.invalidate();
    },
  });

  if (isSessionLoading || (session && isDashboardLoading)) {
    return <div className="h-9 w-9" />; 
  }

  if (!session || !ressourceId) {
    return null;
  }

  const estDejaFavori = dashboardData?.favoris.some(
    (p) => p.ressource_id === ressourceId
  ) ?? false;

  const handleToggle = () => {
    toggleFavoriMutation.mutate({
      ressourceId: ressourceId,
      favori: !estDejaFavori,
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={toggleFavoriMutation.isPending}
    >
      <Heart className={`h-5 w-5 ${estDejaFavori ? "fill-current text-red-500" : ""}`} />
    </Button>
  );
}