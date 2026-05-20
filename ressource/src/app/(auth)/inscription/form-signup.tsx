"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
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
      name: `${prenom} ${nom}`,
      email,
      password,
    });

    setIsPending(false);

    if (error) {
      toast.error("Inscription echouee !", { position: "bottom-right" });
      return;
    }

    toast.success("Inscription reussie !", { position: "bottom-right" });
    router.replace("/tableau-de-bord");
    router.refresh();
  };

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border p-6 shadow-sm"
      >
        <h1 className="mb-4 text-center text-2xl font-bold">S&apos;inscrire</h1>

        <div className="flex flex-col gap-2">
          <label htmlFor="prenom">Prenom</label>
          <input
            id="prenom"
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="rounded border p-2"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="nom">Nom</label>
          <input
            id="nom"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="rounded border p-2"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border p-2"
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
            className="rounded border p-2"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-primary mt-2 rounded p-2 text-white disabled:bg-gray-400"
        >
          {isPending ? "Inscription..." : "S'inscrire"}
        </button>
      </form>
      <Link href="/connexion">Deja un compte ?</Link>
    </div>
  );
}
