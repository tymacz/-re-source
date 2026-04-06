import "@/styles/globals.css";
import { Zain } from "next/font/google";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";
import { Navbar } from "@/components/Navbar";

const zain = Zain({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-zain",
});

export const metadata: Metadata = {
  title: "(RE)Sources Relationnelles",
  description: "Plateforme de sources, ressources et d'échanges.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${zain.variable} antialiased`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-background text-foreground font-sans">
        <TRPCReactProvider>
          
          <Navbar />
          
          <main className="flex flex-1 flex-col">
            {children}
          </main>
          
          <Toaster richColors closeButton />
          
        </TRPCReactProvider>
      </body>
    </html>
  );
}