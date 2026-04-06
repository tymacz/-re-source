import "@/styles/globals.css";
import { Zain } from "next/font/google";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";

const zain = Zain({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-zain",
});

export const metadata: Metadata = {
  title: "(RE)Sources Relationnel",
  description: "Créateur de connexion et de ressources humaines",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${zain.variable} antialiased`}>
      <body className="bg-background text-foreground">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
      <Toaster richColors closeButton/>
    </html>
  );
}
