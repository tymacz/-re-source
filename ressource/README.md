# Re-Source - Documentation de demarrage Synaps

Bienvenue dans la documentation technique du projet **Re-Source**, maintenu par l'equipe **Synaps**.

Cette documentation explique comment installer, configurer, lancer et tester le projet en local.

## Sommaire

- [Presentation du projet](#presentation-du-projet)
- [Stack technique](#stack-technique)
- [Prerequis](#prerequis)
- [Installation locale](#installation-locale)
- [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
- [Base de donnees](#base-de-donnees)
- [Lancer le projet](#lancer-le-projet)
- [Commandes utiles](#commandes-utiles)
- [Tests unitaires](#tests-unitaires)
- [Structure du projet](#structure-du-projet)
- [Workflow Git recommande](#workflow-git-recommande)
- [Depannage](#depannage)

## Presentation du projet

**Re-Source** est une application web de catalogue et de partage de ressources.

Elle permet notamment de :

- consulter un catalogue public de ressources ;
- filtrer les ressources par categorie, type de relation et type de ressource ;
- creer des ressources privees ou publiques ;
- soumettre des ressources publiques a moderation ;
- commenter et repondre aux commentaires ;
- ajouter des ressources aux favoris ;
- suivre une progression utilisateur ;
- demarrer des sessions d'activite ;
- administrer le referentiel, la moderation, les utilisateurs et les statistiques.

## Stack technique

Le projet repose sur les technologies suivantes :

- **Next.js 15** pour l'application web ;
- **React 19** pour l'interface utilisateur ;
- **TypeScript** pour le typage ;
- **tRPC** pour les routes applicatives typees ;
- **Prisma** pour l'acces a la base de donnees ;
- **PostgreSQL** pour la base de donnees ;
- **Better Auth** pour l'authentification ;
- **Tailwind CSS** et composants UI pour le design ;
- **Vitest** pour les tests unitaires ;
- **Docker** pour lancer PostgreSQL localement.

## Prerequis

Avant de lancer le projet, installer :

- **Git**
- **Node.js 20+**
- **pnpm 10+**
- **Docker Desktop** ou une instance PostgreSQL locale

Verifier les versions :

```bash
node -v
pnpm -v
git --version
docker --version
```

Le projet indique actuellement :

```json
"packageManager": "pnpm@10.29.2"
```

## Installation locale

Depuis le dossier parent du projet :

```bash
git clone <url-du-repository>
cd -re-source
git switch dev
cd ressource
pnpm install
```

Si le repository est deja clone :

```bash
cd -re-source
git fetch origin
git switch dev
git pull
cd ressource
pnpm install
```

## Configuration des variables d'environnement

Creer le fichier `.env` a partir du modele fourni.

Sous PowerShell :

```powershell
Copy-Item .env.example .env
```

Sous macOS/Linux :

```bash
cp .env.example .env
```

Variables attendues :

```env
BETTER_AUTH_SECRET=""
BETTER_AUTH_GITHUB_CLIENT_ID=""
BETTER_AUTH_GITHUB_CLIENT_SECRET=""
DATABASE_URL="postgresql://admin:password123@localhost:5432/ressource_db"
```

### Details des variables

| Variable                           | Description                                                |
| ---------------------------------- | ---------------------------------------------------------- |
| `BETTER_AUTH_SECRET`               | Secret utilise par Better Auth. Obligatoire en production. |
| `BETTER_AUTH_GITHUB_CLIENT_ID`     | Identifiant OAuth GitHub.                                  |
| `BETTER_AUTH_GITHUB_CLIENT_SECRET` | Secret OAuth GitHub.                                       |
| `DATABASE_URL`                     | URL de connexion PostgreSQL utilisee par Prisma.           |

Pour un lancement local simple, conserver la valeur PostgreSQL de `.env.example` si Docker est utilise.

## Base de donnees

### Option recommandee : Docker Compose

Le projet contient un fichier `docker-compose.yml` qui lance PostgreSQL 16.

Demarrer la base :

```bash
docker compose up -d
```

Verifier que le conteneur tourne :

```bash
docker ps
```

Arreter la base :

```bash
docker compose down
```

Supprimer aussi les donnees locales :

```bash
docker compose down -v
```

### Synchroniser le schema Prisma

Une fois la base lancee :

```bash
pnpm db:push
```

Generer le client Prisma :

```bash
pnpm prisma generate
```

Ouvrir Prisma Studio :

```bash
pnpm db:studio
```

## Lancer le projet

Demarrer l'application en mode developpement :

```bash
pnpm dev
```

L'application est ensuite disponible sur :

```text
http://localhost:3000
```

## Commandes utiles

| Commande            | Description                                |
| ------------------- | ------------------------------------------ |
| `pnpm dev`          | Lance le serveur Next.js en developpement. |
| `pnpm build`        | Compile l'application pour la production.  |
| `pnpm start`        | Lance l'application compilee.              |
| `pnpm preview`      | Build puis lance l'application.            |
| `pnpm test`         | Lance les tests unitaires Vitest.          |
| `pnpm test:watch`   | Lance Vitest en mode watch.                |
| `pnpm typecheck`    | Lance la verification TypeScript.          |
| `pnpm format:check` | Verifie le formatage Prettier.             |
| `pnpm format:write` | Formate les fichiers avec Prettier.        |
| `pnpm db:push`      | Applique le schema Prisma sur la base.     |
| `pnpm db:studio`    | Ouvre Prisma Studio.                       |

## Tests unitaires

La suite de tests unitaires couvre actuellement **38 cas** :

- **36 tests OK**
- **2 tests en cours**
- **0 test KO**

Lancer les tests :

```bash
pnpm test
```

Mode watch :

```bash
pnpm test:watch
```

Les tests couvrent les domaines suivants :

- authentification et comptes ;
- catalogue et ressources front-office ;
- commentaires et echanges ;
- sessions d'activite ;
- back-office ;
- securite et conformite.

Les cas en cours sont :

- `TC-B07` - Exporter les statistiques en CSV ;
- `TC-SEC05` - Verification des contrastes sur la page catalogue.

Un rapport detaille est disponible dans :

```text
RAPPORT_TESTS_UNITAIRES.md
```

## Structure du projet

```text
ressource/
├─ prisma/
│  └─ schema.prisma
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  ├─ (citoyen)/
│  │  ├─ (public)/
│  │  └─ admin/
│  ├─ components/
│  ├─ hooks/
│  ├─ lib/
│  ├─ server/
│  │  ├─ api/
│  │  │  └─ routers/
│  │  ├─ better-auth/
│  │  ├─ activity/
│  │  ├─ auth/
│  │  ├─ back-office/
│  │  ├─ comments/
│  │  ├─ resources/
│  │  └─ security/
│  ├─ styles/
│  └─ trpc/
├─ docker-compose.yml
├─ package.json
└─ README.md
```

### Dossiers importants

| Dossier                  | Role                       |
| ------------------------ | -------------------------- |
| `src/app`                | Pages et layouts Next.js.  |
| `src/components`         | Composants reutilisables.  |
| `src/server/api/routers` | Routers tRPC applicatifs.  |
| `src/server/better-auth` | Configuration Better Auth. |
| `src/server/*/*.test.ts` | Tests unitaires Vitest.    |
| `prisma/schema.prisma`   | Schema de base de donnees. |

## Workflow Git recommande

La branche active de developpement est :

```bash
dev
```

Avant de travailler :

```bash
git switch dev
git pull
```

Verifier les modifications locales :

```bash
git status
```

Apres modification :

```bash
pnpm test
git status
git add .
git commit -m "Description claire du changement"
```

## Depannage

### Le port 3000 est deja utilise

Arreter l'autre serveur ou lancer Next sur un autre port :

```bash
pnpm dev -- --port 3001
```

### La base PostgreSQL ne repond pas

Verifier Docker :

```bash
docker ps
```

Relancer la base :

```bash
docker compose up -d
```

Verifier que `DATABASE_URL` dans `.env` correspond au fichier `docker-compose.yml`.

### Prisma ne trouve pas la base

Verifier `.env`, puis relancer :

```bash
pnpm db:push
pnpm prisma generate
```

### Les tests ne se lancent pas

Verifier l'installation :

```bash
pnpm install
pnpm test
```

### Le typecheck echoue

Lancer :

```bash
pnpm typecheck
```

Puis corriger les erreurs TypeScript affichees. Les tests unitaires peuvent etre lances independamment avec :

```bash
pnpm test
```

## Notes Synaps

- Ne jamais commiter le fichier `.env`.
- Garder les tests unitaires a jour avec les evolutions metier.
- Mettre a jour ce README lorsque les commandes, variables d'environnement ou procedures changent.
- Verifier la branche active avant de commencer une tache :

```bash
git branch --show-current
```
