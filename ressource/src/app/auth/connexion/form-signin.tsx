"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/server/better-auth/client";
import Link from "next/link";
import { db } from "@/server/db";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    const { error } = await authClient.signIn.email({
      email : email,
      password : password,
    });

    setIsPending(false);

    if (error) {
      toast.error("Email ou mot de passe incorrect !",{position:"bottom-right"})
      return;
    }else{
      toast.success("Connexion Réussie !",{position:"bottom-right"})
    }

    router.push("/");
    router.refresh();
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
      <Link href="/auth/inscription">vous ne posséder pas de compte ?</Link>
    </div>
  );
}