"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Plus, User, LayoutDashboard, Settings, LogOut, BookOpen, Activity, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client"; // Vérifie que ce chemin est le bon pour ton projet

// Mise à jour des liens publics
const navigationLinks = [
  { name: "Catalogue", href: "/catalogue", icon: BookOpen },
  { name: "Aide", href: "/aide", icon: HelpCircle },
];

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { data: session, isPending } = authClient.useSession();

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        
        {/* MENU MOBILE */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-background">
              <SheetHeader>
                <SheetTitle className="text-left font-bold text-primary">
                  (RE)SOURCES
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-lg font-medium text-foreground hover:text-primary"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.name}
                  </Link>
                ))}
                
                <div className="my-4 h-px w-full bg-border" />
                
                {/* Condition basée sur la VRAIE session */}
                {session ? (
                  <>
                    <Link
                      href="/tableau-de-bord"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 text-lg font-medium text-foreground hover:text-primary"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Ma Progression
                    </Link>
                    <Link
                      href="/mes-ressources/creer"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 text-lg font-bold text-primary"
                    >
                      <Plus className="h-5 w-5" />
                      Créer une ressource
                    </Link>
                    
                    {session.user.role_id === "ADMIN" && (
                       <Link
                       href="/admin"
                       onClick={() => setIsOpen(false)}
                       className="flex items-center gap-2 text-lg font-bold text-destructive"
                     >
                       <Settings className="h-5 w-5" />
                       Administration
                     </Link>
                    )}
                  </>
                ) : (
                  <Link href="/connexion" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">Se connecter</Button>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-primary md:text-2xl">
            (RE)<span className="text-foreground">SOURCES</span>
          </span>
        </Link>

        {/* NAVIGATION DESKTOP */}
        <nav className="hidden items-center gap-8 md:flex">
          {navigationLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* BOUTONS ACTIONS / PROFIL DESKTOP */}
        <div className="flex items-center gap-4">
          {isPending ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          ) : session ? (
            <>
              {/* Bouton Créer mis à jour */}
              <Link href="/mes-ressources/creer" className="hidden md:block">
                <Button className="rounded-full shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-transparent hover:border-primary transition-all">
                      <AvatarImage src={session.user.image ?? ""} alt={session.user.name} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                        {getInitials(session.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background/80" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.role_id === "ADMIN" ? "Administrateur" : "Citoyen"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Liens du Dropdown mis à jour */}
                  <DropdownMenuItem asChild>
                    <Link href="/tableau-de-bord" className="cursor-pointer flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Ma Progression</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  {session.user.role_id === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer flex items-center font-bold text-primary">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Back-Office Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={async () => {
                      await authClient.signOut();
                      window.location.reload(); 
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/connexion" className="hidden md:block">
              <Button variant="outline" className="rounded-full">
                Se connecter
              </Button>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}