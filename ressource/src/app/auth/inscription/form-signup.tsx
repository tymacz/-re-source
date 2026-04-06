"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/server/better-auth/client";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [prenom, setPrenom] = useState("");
    const [nom, setNom] = useState("");
  const [isPending, setIsPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

      const { error } = await authClient.signUp.email({
    name: `${ prenom } ${nom}`,
      email : email,
      password : password,
    });

    setIsPending(false);

    if (error) {
      toast.error("Inscription échoué !",{position:"bottom-right"})
      return;
    }else{
      toast.success("Inscription Réussie !",{position:"bottom-right"})
    }

    router.push("/");
    router.refresh();
  };


  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full max-w-sm p-6 border rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-4">S&apos;inscrire</h1>

              <div className="flex flex-col gap-2">
          <label htmlFor="prenom">Prénom</label>
          <input 
            id="prenom" 
            type="text" 
            value={prenom} 
            onChange={(e) => setPrenom(e.target.value)} 
            className="border p-2 rounded"
            required 
          />
        </div><div className="flex flex-col gap-2">
          <label htmlFor="nom">Nom</label>
          <input 
            id="nom" 
            type="text" 
            value={nom} 
            onChange={(e) => setNom(e.target.value)} 
            className="border p-2 rounded"
            required 
          />
        </div>
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
          className="bg-black text-white p-2 rounded mt-2 disabled:bg-gray-400"
        >
          {isPending ? "Inscription..." : "S'inscrire"}
        </button>
          </form>
          <Link href="/auth/connexion">Déjà un compte ?</Link>

    </div>
  );
}