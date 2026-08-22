# OJNice — Site vitrine (maquette)

Maquette d'amélioration du site du club **Olympic Judo Nice** (ojnice.com).

## Lancer le site

Le site est **entièrement autonome** : un seul fichier `index.html`, sans dépendance
ni ressource externe. Deux façons de l'ouvrir :

1. Double-cliquer sur `index.html` (s'ouvre dans le navigateur) ;
2. ou, pour un contexte identique à la production :
   ```bash
   python3 -m http.server 8000
   # puis http://localhost:8000
   ```

Aucune installation, aucun build, aucune variable d'environnement.

## Structure

- `index.html` — la totalité du site : HTML, CSS, JavaScript, polices (Tilt Warp,
  Roboto) et images (photos du club, logos partenaires) intégrés en base64.

## Fonctionnement

Site en page unique avec routeur par ancre (`#accueil`, `#inscription`, `#actus`,
`#stages`, `#partenaires`, `#contact`, `#admin`) — 7 pages.

Points notables :
- carte de Nice vectorielle (contour réel) avec les 32 dojos géolocalisés,
  zoom/déplacement et recherche du dojo le plus proche ;
- filtres par catégorie d'âge et par secteur, synchronisés entre la liste des
  professeurs et les fiches dojos ;
- inscription redirigée vers HelloAsso selon la zone tarifaire (A ou B) ;
- espace d'administration de démonstration (actualités, événements, stages,
  partenaires, messages reçus).

## Persistance des données

Les contenus modifiés dans l'espace admin sont stockés dans le **localStorage du
navigateur** (clé `ojnice_db13`). Rien n'est envoyé à un serveur : c'est une
maquette de démonstration, pas une application en production.

## Espace d'administration — comptes de DÉMONSTRATION

Accessible via le lien « Espace admin » en pied de page, ou `#admin`.

| Rôle                | Identifiant                | Mot de passe |
|---------------------|----------------------------|--------------|
| Super administrateur| `superadmin@ojnice.test`   | `demo2026`   |
| Administrateur      | `admin@ojnice.test`        | `demo2026`   |

> Les identifiants réels ont été retirés de cette copie et remplacés par ces
> comptes fictifs. L'authentification est purement côté navigateur : elle sert à
> illustrer le parcours, elle n'offre aucune sécurité réelle. En production, cette
> partie doit être assurée par un back-end (WordPress/wp-admin ou équivalent).

## Points à valider avec le club

- Rattachement de 12 dojos sur 32 à une adresse précise (les autres sont
  positionnés au numéro de rue exact).
- Horaires transcrits depuis des fiches manuscrites.
- Photos et logos partenaires : vérifier les droits de diffusion.
