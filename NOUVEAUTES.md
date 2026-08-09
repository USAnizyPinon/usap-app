# Mise à jour de l'application USAP

Quatre nouveautés : espace compte enrichi, notifications par catégorie,
photos prises depuis la galerie avec recadrage automatique, et modification
de tout ce qui est déjà publié.

---

## 1. Ce qu'il faut faire pour installer cette mise à jour

### a) Remplacer les fichiers

Décompresse l'archive par-dessus ton dossier `C:\Users\rapha\usap-app`
(remplace quand Windows le demande). Ton fichier `.env` n'est pas touché.

### b) Installer les nouvelles dépendances

```powershell
npm install
```

### c) Mettre à jour la base

```powershell
npx prisma db push
```

Cela ajoute les favoris, les préférences de notification et les abonnements.
**Aucune donnée existante n'est perdue.**

### d) Créer le dossier de photos dans Supabase

1. Supabase → menu de gauche → **Storage**
2. **New bucket** → nom exactement `photos`
3. Coche **Public bucket** → **Create**

Sans ça, l'envoi de photos renverra une erreur.

### e) Générer les clés de notification

```powershell
npx web-push generate-vapid-keys
```

Copie les deux clés affichées dans ton `.env` (voir ci-dessous).

### f) Compléter le `.env`

```
NEXT_PUBLIC_SUPABASE_URL="https://movqisiftiltsawwdnrc.supabase.co"
SUPABASE_SECRET_KEY="sb_secret_..."

NEXT_PUBLIC_VAPID_PUBLIC_KEY="BN..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:ton.email@gmail.com"
```

La clé secrète Supabase se trouve dans **Settings → API Keys → Secret key**.

### g) Tester en local

```powershell
npm run dev
```

### h) Mettre en ligne

Ajoute les **5 nouvelles variables** sur Vercel
(Settings → Environment Variables), puis :

```powershell
git add .
git commit -m "Compte, notifications, photos, modifications"
git push
```

Vercel redéploie tout seul.

---

## 2. Espace « Mon compte »

- Photo, nom, email et rôle du licencié
- **Mes prochains matchs** : uniquement les catégories suivies
- Activation des notifications sur l'appareil
- Choix des catégories suivies (cases à cocher)
- Deux réglages : recevoir les matchs, recevoir les actualités
- Accès direct à SportCorico et à l'espace dirigeant

---

## 3. Notifications

Le licencié coche ses catégories dans **Mon compte**, puis appuie sur
**Activer les notifications**.

Ensuite :

- quand un dirigeant **ajoute un match**, seules les personnes qui suivent
  cette catégorie reçoivent l'alerte ;
- quand un dirigeant **publie une actualité**, toutes les personnes qui
  acceptent les actualités la reçoivent.

Dans les deux cas, une case permet au dirigeant de ne pas notifier
(utile pour une correction).

**Sur iPhone** : Apple n'autorise les notifications que si l'application a été
ajoutée à l'écran d'accueil. L'application affiche le message correspondant.
Sur Android, ça fonctionne directement dans Chrome.

---

## 4. Photos depuis la galerie

Partout où il y a une photo (joueur, actualité) :

- bouton **Choisir une photo** → galerie ou appareil photo du téléphone
- **recadrage automatique** : portrait 3/4 pour les joueurs, paysage 16/9 pour
  les actualités ; le cadrage est centré et remonté pour les portraits, ce qui
  place le visage correctement
- compression automatique : une photo de 5 Mo devient environ 100 Ko
- envoi vers Supabase Storage, aperçu immédiat

Plus besoin de coller une adresse d'image à la main.

---

## 5. Modifier ce qui est déjà publié

Un lien **Modifier** apparaît à côté de chaque élément dans l'espace admin :

- **Matchs** : équipe, adversaire, date, lieu, compétition, stade, score
- **Actualités** : titre, catégorie, résumé, texte, photo, et une case
  « Visible sur le site » pour dépublier sans supprimer
- **Joueurs** : prénom, nom, équipe, poste, numéro, photo

Supprimer un joueur ou une actualité supprime aussi sa photo du stockage.
