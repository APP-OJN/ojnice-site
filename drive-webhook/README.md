# Copie des inscriptions dans Google Drive

Chaque inscription envoyée depuis le site (formulaire du stage CJS, et tout formulaire de type « stage ») est déjà :

1. enregistrée dans l'espace admin du site (onglet **Messages**) ;
2. envoyée par e-mail à `infos.ojnice@gmail.com`.

Ce dossier ajoute une **troisième copie, dans Google Drive** : une feuille de calcul récapitulative et un document par personne inscrite. Le site ne parle jamais directement à Google : la fonction `netlify/functions/cms-message.mjs` transmet l'inscription à un petit script Google Apps Script (`Code.gs`) qui écrit dans le Drive du club.

Tant que les deux variables ci-dessous ne sont pas renseignées dans Netlify, cette copie est simplement ignorée — rien ne casse.

## Mise en place (une seule fois, ~5 minutes)

Faire ces étapes **avec le compte Google du club** (c'est ce compte qui sera propriétaire des fichiers).

1. Ouvrir <https://script.google.com> → **Nouveau projet**.
2. Supprimer le contenu proposé, coller l'intégralité de `Code.gs`.
3. Remplacer `CHANGE-MOI` (ligne `var TOKEN = …`) par une phrase longue et secrète, par exemple générée avec :
   ```bash
   openssl rand -hex 24
   ```
4. **Déployer → Nouveau déploiement** → type **Application web** :
   - *Exécuter en tant que* : **Moi**
   - *Qui a accès* : **Tout le monde**
   → **Déployer**, autoriser l'accès au Drive quand Google le demande, puis **copier l'URL** qui se termine par `/exec`.
5. Dans Netlify → projet `ojnice-site` → **Environment variables**, ajouter :
   - `DRIVE_WEBHOOK_URL` = l'URL copiée à l'étape 4
   - `DRIVE_WEBHOOK_TOKEN` = la même phrase secrète qu'à l'étape 3
6. **Deploys → Trigger deploy → Deploy site** (les fonctions ne voient les nouvelles variables qu'après un déploiement).

## Vérifier

- Ouvrir l'URL `/exec` dans un navigateur : elle doit répondre `{"ok":true,"service":"ojnice-drive-webhook"}`.
- Envoyer une inscription de test depuis <https://ojnice.com/#stage-cjs>. Dans le Drive, un dossier **OJNice — Inscriptions stages** apparaît, avec la feuille récapitulative et un sous-dossier par stage contenant un document par personne.

## Modifier le script plus tard

Après toute modification de `Code.gs` dans l'éditeur Google : **Déployer → Gérer les déploiements → ✎ → Version : Nouvelle version → Déployer**. L'URL ne change pas.
