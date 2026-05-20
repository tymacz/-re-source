"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
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

    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: async () => {
          toast.success("Connexion reussie !");
          await utils.invalidate();
          router.replace("/tableau-de-bord");
          router.refresh();
        },
        onError: (ctx) => {
          setIsPending(false);
          toast.error(ctx.error.message ?? "Identifiants incorrects.");
        },
      },
    );
  };

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border p-6 shadow-sm"
      >
        <h1 className="mb-4 text-center text-2xl font-bold">Se connecter</h1>

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
          {isPending ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link
          href="/inscription"
          className="text-primary text-sm hover:underline"
        >
          Vous ne possedez pas de compte ?
        </Link>
      </div>
    </div>
  );
}
