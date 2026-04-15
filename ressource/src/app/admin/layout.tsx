"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/connexion");
      } else if (session.user.role_id !== "ADMIN") {
        router.push("/tableau-de-bord");
      }
    }
  }, [session, isPending, router]);

    if (isPending || session?.user.role_id !== "ADMIN") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Vérification des accès sécurisés...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}