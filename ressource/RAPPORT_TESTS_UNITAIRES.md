# Rapport des tests unitaires presents dans le code

## Synthese

Le projet contient actuellement 38 cas de test unitaires sous Vitest.

Resultat de la derniere execution :

```bash
pnpm test
```

- Fichiers de test : 6 passes
- Tests OK : 36
- Tests en cours : 2
- Tests KO : 0
- Total : 38 cas

Les deux cas en cours sont declares avec `it.todo` :

- TC-B07 - Exporter les statistiques en CSV
- TC-SEC05 - Verification des contrastes sur la page catalogue

## Fichiers de test

- `src/server/auth/account-service.test.ts`
- `src/server/resources/resource-service.test.ts`
- `src/server/comments/comment-service.test.ts`
- `src/server/activity/activity-session-service.test.ts`
- `src/server/back-office/back-office-service.test.ts`
- `src/server/security/security-service.test.ts`

## Authentification et comptes

Fichier : `src/server/auth/account-service.test.ts`

| ID     | Cas de test                                          | Statut |
| ------ | ---------------------------------------------------- | ------ |
| TC-A01 | Creation d'un compte citoyen                         | OK     |
| TC-A02 | Connexion avec identifiants valides                  | OK     |
| TC-A03 | Connexion avec mot de passe incorrect                | OK     |
| TC-A04 | Desactivation d'un compte citoyen par le super-admin | OK     |
| TC-A05 | Creation d'un compte moderateur                      | OK     |
| TC-A06 | Tentative de connexion sur un compte desactive       | OK     |

## Catalogue et ressources front-office

Fichier : `src/server/resources/resource-service.test.ts`

| ID     | Cas de test                                                     | Statut |
| ------ | --------------------------------------------------------------- | ------ |
| TC-R01 | Consulter le catalogue sans etre connecte                       | OK     |
| TC-R02 | Filtrer par categorie                                           | OK     |
| TC-R03 | Filtrer par type de relation et type de ressource simultanement | OK     |
| TC-R04 | Creer une ressource privee                                      | OK     |
| TC-R05 | Creer une ressource publique et la soumettre a moderation       | OK     |
| TC-R06 | Partager une ressource publiee                                  | OK     |
| TC-R07 | Ajouter une ressource aux favoris                               | OK     |
| TC-R08 | Marquer une ressource comme exploitee                           | OK     |
| TC-R09 | Mettre une ressource de cote                                    | OK     |

## Commentaires et echanges

Fichier : `src/server/comments/comment-service.test.ts`

| ID     | Cas de test                                   | Statut |
| ------ | --------------------------------------------- | ------ |
| TC-C01 | Ajouter un commentaire sur une ressource      | OK     |
| TC-C02 | Valider un commentaire par moderateur         | OK     |
| TC-C03 | Refuser un commentaire inapproprie            | OK     |
| TC-C04 | Repondre a un commentaire en tant que citoyen | OK     |
| TC-C05 | Repondre en tant que moderateur               | OK     |

## Sessions d'activite

Fichier : `src/server/activity/activity-session-service.test.ts`

| ID     | Cas de test                                       | Statut |
| ------ | ------------------------------------------------- | ------ |
| TC-S01 | Demarrer une session activite                     | OK     |
| TC-S02 | Inviter un participant a une session              | OK     |
| TC-S03 | Envoyer un message dans une session               | OK     |
| TC-S04 | Tentative d'acces a une session sans y appartenir | OK     |

## Back-office

Fichier : `src/server/back-office/back-office-service.test.ts`

| ID     | Cas de test                                  | Statut   |
| ------ | -------------------------------------------- | -------- |
| TC-B01 | Ajouter une categorie de ressources          | OK       |
| TC-B02 | Suspendre une ressource publiee              | OK       |
| TC-B03 | Valider une ressource soumise par moderateur | OK       |
| TC-B04 | Refuser une ressource soumise                | OK       |
| TC-B05 | Consulter le tableau de bord statistiques    | OK       |
| TC-B06 | Filtrer les statistiques par periode         | OK       |
| TC-B07 | Exporter les statistiques en CSV             | En cours |
| TC-B08 | Acceder au back-office sans role staff       | OK       |

## Securite et conformite

Fichier : `src/server/security/security-service.test.ts`

| ID       | Cas de test                                                      | Statut   |
| -------- | ---------------------------------------------------------------- | -------- |
| TC-SEC01 | Verifier que les mots de passe ne sont pas stockes en clair      | OK       |
| TC-SEC02 | Appel direct a un router tRPC admin sans token valide            | OK       |
| TC-SEC03 | Desactivation d'un compte et anonymisation des logs              | OK       |
| TC-SEC04 | Navigation au clavier sur le formulaire de creation de ressource | OK       |
| TC-SEC05 | Verification des contrastes sur la page catalogue                | En cours |
| TC-SEC06 | Injection de contenu malveillant dans un commentaire             | OK       |

## Conclusion

Tous les cas listes sont presents dans le code.

Le recapitulatif actuel est :

- 38 cas au total
- 36 OK
- 0 KO
- 2 En cours : TC-B07 et TC-SEC05
