# Formation « Identité visuelle & Marketing digital »

B-Lossom Center, 24/11/2026. Animateur : Hugues Hamba.

Un seul site Vercel contient :

| Adresse | Contenu |
| --- | --- |
| `/` | La présentation interactive (36 slides, mode présentateur avec la touche P) |
| `/ateliers` | Le menu des ateliers en ligne B, C et D, pour les participants |
| `/ateliers?atelier=B` | L'atelier B directement (idem avec C et D) |
| `/ateliers?atelier=B&projection=1` | À projeter : QR code géant + mur des réponses en direct |
| `/ateliers?atelier=B&mur=1` | Le mur seul, en grand (affiché aussi dans la présentation, après chaque atelier) |
| `/quiz` | Le quiz final pour les participants (5 questions, score immédiat) |
| `/quiz?projection=1` | À projeter : QR code du quiz + participants qui ont répondu |
| `/quiz?resultats=1` | Résultats du quiz : réponses par question et classement |

Les participants n'ont besoin d'aucun compte : ils scannent le QR code, écrivent leur nom, répondent, et voient aussitôt le mur du groupe.

## Contenu du dossier

- `index.html` : la présentation (fichier compilé, à ne pas modifier à la main).
- `ateliers/index.html` : la page des ateliers (formulaires + mur).
- `ateliers/qrcode.js` : générateur de QR code (licence MIT, Kazuhiko Arase).
- `api/reponses.js` : enregistre et renvoie les réponses.
- `api/admin.js` : export et remise à zéro, protégés par une clé.
- `quiz/index.html` et `api/quiz.js` : le quiz final en ligne (questions dans `api/_quiz-data.js`).
- `package.json`, `vercel.json` : configuration.

## Mise en ligne (une seule fois, environ 10 minutes)

1. **GitHub** : créez un dépôt vide (par exemple `formation-blossom`) et déposez-y tout le contenu de ce dossier (bouton « uploading an existing file », glissez les fichiers et dossiers).
2. **Vercel** : connectez-vous sur vercel.com avec votre compte GitHub, puis « Add New » > « Project » > importez le dépôt > « Deploy ». Aucun réglage à changer.
3. **Base de données** : dans le projet Vercel, onglet « Storage », créez une base **Upstash for Redis** (offre gratuite) et connectez-la au projet. Vercel ajoute seul les variables `KV_REST_API_URL` et `KV_REST_API_TOKEN`.
4. **Clé administrateur** : « Settings » > « Environment Variables », ajoutez `ADMIN_KEY` avec un mot de passe d'au moins 8 caractères.
5. **Redéployez** : « Deployments » > les trois points du dernier déploiement > « Redeploy », pour que les variables soient prises en compte.
6. **Testez** depuis votre téléphone : `https://votre-site.vercel.app/ateliers`.

## Le jour de la formation

- Ouvrez `https://votre-site.vercel.app/` et appuyez sur F (plein écran) puis P (mode présentateur).
- Aux slides 17, 24 et 32 (ateliers), ouvrez dans un autre onglet `/ateliers?atelier=B&projection=1` (puis C, puis D) pour projeter le QR code. La slide suivante affiche le mur en direct.
- Slide 38 : QR code du quiz. Slide 39 : les questions, avec les votes en ligne qui s'affichent tout seuls. Slide 40 : résultats et classement.
- Prévoyez une connexion internet pour la salle et pour les participants (Wi-Fi ou données mobiles).

## Outils de l'animateur

- Exporter toutes les réponses : `/api/admin?cle=VOTRE_CLE&action=exporter`
- Vider un atelier après les essais : `/api/admin?cle=VOTRE_CLE&action=vider&atelier=B` (ou `C`, `D`, `QUIZ`)
