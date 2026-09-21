# Calendrier OJNice 2026–2027

Recherche et recoupement réalisés le 21 septembre 2026. Le calendrier est éditorial et statique, pas une synchronisation des fédérations. Il ne représente pas les inscriptions ou sélections du club.

## Sources

- France Judo : https://www.ffjudo.com/evenements et pages suivantes de l'agenda (`/evenements/agenda/2`, `/3`, `/4`). 23 tournois Judo des cinq catégories repris avec leur fiche officielle. Le calendrier fédéral annuel complet 2026–2027 n'a pas été retrouvé : les finales nationales 2027 publiées par la Ligue sont donc créditées à la Ligue, pas présentées comme une vérification indépendante France Judo.
- Ligue Sud : https://ligue-sud-judo.ffjudo.com/cirulaire ; PDF « Calendrier Ligue 2026-27 — version au 16-09 », trois pages, lien complet dans le fichier de données.
- CD06 : https://alpes-maritimes-judo.ffjudo.com/evenement et https://alpes-maritimes-judo.ffjudo.com/calendriers-2. La page PDF présente encore 2024–2025. L'agenda agrège aussi des événements d'autres comités : ne pas assimiler tout son contenu à des événements CD06. Deux fiches locales retrouvées pour les regroupements benjamins/minimes des 7 octobre et 4 novembre 2026. Les horaires 14h–16h viennent du document transmis.
- Deux PDF fournis par le club, conservés dans `calendrier-documents/`. Le calendrier général comporte 140 pages dont la majorité est vide ; original conservé sans transformation.

## Arbitrages et limites

- 95 rendez-vous : 76 retrouvés dans une publication officielle ; 19 uniquement dans les documents transmis, marqués « À confirmer ».
- Les dates de la Ligue du 16 septembre priment sur les documents transmis lorsqu'elles concernent la même épreuve : ranking juniors 21 février ; France seniors équipes mixtes 2D 4 avril ; France juniors équipes 22 mai ; France seniors 3D 23 mai ; France seniors 2D 5–6 juin.
- Circuit minimes du 3 avril : année 2027, et non 2026 comme dans le document minimes.
- Minimes équipes de départements : 17–18 avril à Villebon selon Ligue (les documents transmis citent aussi Ceyrat).
- Orléans minimes du 20 février : conservé prévisionnel. Le document général indique « dimanche 20 », mais le 20 février 2027 est un samedi. Aucune confirmation officielle suffisamment fiable retrouvée pour corriger cette date.
- Le 16 mai, le tournoi régional benjamins à Châteauneuf-les-Martigues et le critérium bidépartemental à Draguignan sont deux événements distincts. Le second reste prévisionnel.
- Niveaux définis par le circuit de l'épreuve, pas uniquement par sa ville. Un tournoi Label A/Excellence est national ; le circuit régional à Nice reste régional.
- Jujitsu/JJB, passages de grade, compétitions internationales hors des trois niveaux et événements sans catégorie attribuable exclus. Les compétitions, stages/regroupements, arbitrage jeunes et échéances de classement ont un filtre de type distinct.
- Cette première édition n'est pas exhaustive : ajouts et modifications possibles des organisateurs, notamment le département. Toujours consulter la fiche source avant déplacement et vérifier les conditions de qualification.

## Maintenance

Modifier `calendrier-2026-data.js`, conserver les identifiants stables (UID de l'export .ics), mettre à jour `checkedAt`, la date visible dans `index.html` et les versions des assets. Ne passer un événement à `published` qu'après recoupement d'une publication officielle. L'export .ics est un import ponctuel et ne reçoit pas les mises à jour automatiquement.
