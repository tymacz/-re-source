"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/server/better-auth/client";
import Link from "next/link";
import { api } from "@/trpc/react";

export default function SignInPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    await authClient.signIn.email({
      email: email,
      password: password,
    },
    {
        onRequest: () => {
          setIsPending(true);
        },
        onSuccess: async () => {
          toast.success("Connexion réussie !");
                    await utils.invalidate();
          await authClient.getSession();
          router.push("/tableau-de-bord");
          
          router.refresh();
        },
        onError: (ctx) => {
          setIsPending(false);
          toast.error(ctx.error.message ?? "Identifiants incorrects.");
        },
      });
  };

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full max-w-sm p-6 border rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-4">Se connecter</h1>

        <div className="flex flex-col gap-2">
          <label htmlFor="email">E-mail</label>
          <input 
            id="email" 
            type="text" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="border p-2 rounded"
            required 
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password">Mot de passe</label>
          <input 
            id="password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="border p-2 rounded"
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="bg-primary text-white p-2 rounded mt-2 disabled:bg-gray-400"
        >
          {isPending ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link href="/inscription" className="text-sm text-primary hover:underline">
          Vous ne possédez pas de compte ?
        </Link>
      </div>
    </div>
  );
}