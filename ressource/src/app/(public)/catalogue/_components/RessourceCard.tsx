import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, LockKeyhole } from "lucide-react"; 

interface RessourceCardProps {
  id: string;
  titre: string;
  nomAuteur: string;
  libelleCategorie: string;
  dateCreation: Date;
  visibilite?: "PUBLIQUE" | "PARTAGEE" | "PRIVEE"; 
}

export function RessourceCard({ id, titre, nomAuteur, libelleCategorie, dateCreation, visibilite = "PUBLIQUE" }: RessourceCardProps) {
  return (
    <Link href={`/ressources/${id}`} className="block h-full group">
      <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-md hover:border-primary/50">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start gap-4 mb-2">
            <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
              {libelleCategorie}
            </Badge>
            
            {visibilite === "PARTAGEE" && (
              <Badge variant="outline" className="text-muted-foreground border-border/50 flex items-center gap-1">
                <LockKeyhole className="h-3 w-3" />
                Partagée
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
            {titre}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="grow">
        </CardContent>
        
        <CardFooter className="pt-4 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span className="truncate max-w-[120px]">{nomAuteur}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{format(dateCreation, "d MMM yyyy", { locale: fr })}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}