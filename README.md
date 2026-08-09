# Application US Anizy-Pinon

Site-application du club : calendrier, équipes, effectifs, actualités et organigramme,
avec connexion Google et espace de gestion pour les dirigeants.

Les **convocations**, le **suivi des présences** et le **score en direct** ne sont pas
refaits ici : ils sont gérés par **SportCorico**, vers lequel l'application redirige.

**Stack** : Next.js 14 · TypeScript · Tailwind · Prisma · Supabase (PostgreSQL) · NextAuth · Vercel

---

## 1. Qui peut faire quoi

| Rôle | Droits |
|---|---|
| **Visiteur** (sans compte) | Consulter calendrier, équipes, effectifs, actus, organigramme |
| **Licencié** | + son espace personnel et l'accès direct à SportCorico |
| **Dirigeant** | + ajouter/supprimer des matchs, saisir les scores, gérer les effectifs, publier les actualités |
| **Administrateur** | + changer le rôle des autres comptes |

Les emails inscrits dans `ADMIN_EMAILS` deviennent **administrateurs automatiquement**
à leur première connexion Google. Ensuite, tu passes toi-même les autres en dirigeant
depuis **Admin → Effectifs → Comptes et rôles**.

---

## 2. Installer les outils (une seule fois)

Dans **PowerShell** :

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Microsoft.VisualStudioCode
```

Ferme puis rouvre PowerShell, et vérifie :

```powershell
node -v
git --version
```

Extensions VS Code conseillées : **Prisma**, **Tailwind CSS IntelliSense**, **ESLint**.

---

## 3. Créer la base sur Supabase

1. Va sur [supabase.com](https://supabase.com) → **New project**.
2. Nom : `usap`, région **Europe**, choisis un mot de passe et **garde-le**.
3. Une fois le projet créé : bouton **Connect** → onglet **ORMs** → **Prisma**.
4. Récupère les deux adresses :
   - **Transaction pooler** (port `6543`) → `DATABASE_URL`
   - **Direct connection** (port `5432`) → `DIRECT_URL`

> Les deux sont nécessaires : Vercel passe par le pooler, les commandes Prisma par la connexion directe.

---

## 4. Créer la connexion Google

1. [console.cloud.google.com](https://console.cloud.google.com) → nouveau projet « USAP ».
2. **APIs & Services → OAuth consent screen** : type **External**, nom « US Anizy-Pinon », ton email en contact. **Publie** l'application (sinon seuls les comptes test peuvent se connecter).
3. **Credentials → Create credentials → OAuth client ID** → **Web application**.
4. Renseigne exactement :

   **Authorized JavaScript origins**
   ```
   http://localhost:3000
   https://ton-app.vercel.app
   ```

   **Authorized redirect URIs**
   ```
   http://localhost:3000/api/auth/callback/google
   https://ton-app.vercel.app/api/auth/callback/google
   ```

5. Copie le **Client ID** et le **Client secret**.

> L'erreur `redirect_uri_mismatch` vient toujours d'une URL de redirection mal recopiée.

---

## 5. Lancer le projet en local (PowerShell)

```powershell
# 1. Ouvre le dossier dans VS Code
cd C:\Users\TonNom\Documents\usap-app
code .

# 2. Installe les dépendances
npm install

# 3. Crée ton fichier d'environnement
Copy-Item .env.example .env

# 4. Génère le secret NextAuth (colle le résultat dans .env)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Ouvre `.env` dans VS Code et remplis les valeurs (Supabase ×2, secret, Google ×2, SportCorico).

```powershell
# 5. Crée les tables dans Supabase
npx prisma db push

# 6. Remplis les données de départ (équipes, bureau, joueurs)
npm run db:seed

# 7. Démarre
npm run dev
```

Ouvre <http://localhost:3000>, connecte-toi avec le compte Google déclaré dans
`ADMIN_EMAILS` : le menu **Admin** apparaît.

---

## 6. Envoyer sur GitHub

```powershell
git init
git add .
git commit -m "Application USAP"
git branch -M main
git remote add origin https://github.com/clementmahu7-a11y/usap-app.git
git push -u origin main
```

> `.env` est déjà ignoré par `.gitignore` : tes mots de passe ne partent jamais sur GitHub.

---

## 7. Déployer sur Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importe le dépôt `usap-app`.
2. Avant de déployer, ajoute les variables d'environnement (**Settings → Environment Variables**) :

   `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS`,
   `NEXT_PUBLIC_SPORTCORICO_URL`

3. **Deploy**.
4. Une fois l'URL connue (`https://usap-app.vercel.app`) :
   - remplace `NEXTAUTH_URL` par cette URL, puis **Redeploy** ;
   - ajoute cette URL dans Google Cloud (origines **et** redirections).

Le build lance `prisma generate` tout seul.

Pour mettre à jour ensuite :

```powershell
git add .
git commit -m "Mise à jour"
git push
```

Vercel redéploie automatiquement.

---

## 8. Installer l'app sur un téléphone

C'est une **PWA**, pas besoin de store :

- **Android / Chrome** : menu ⋮ → « Ajouter à l'écran d'accueil »
- **iPhone / Safari** : Partager → « Sur l'écran d'accueil »

L'écusson du club sert d'icône et l'app s'ouvre en plein écran.

---

## 9. Organisation des fichiers

```
usap-app/
├── prisma/
│   ├── schema.prisma        # structure de la base (Supabase)
│   └── seed.ts              # équipes, bureau, joueurs de départ
├── public/                  # manifest PWA + icônes
└── src/
    ├── app/
    │   ├── layout.tsx       # en-tête, pied de page, polices
    │   ├── page.tsx         # accueil
    │   ├── matchs/          # calendrier public
    │   ├── equipes/         # liste + fiche par catégorie
    │   ├── actus/  club/    # actualités, organigramme
    │   ├── connexion/       # bouton Google
    │   ├── mon-espace/      # espace licencié + accès SportCorico
    │   ├── admin/           # espace dirigeant (protégé)
    │   │   ├── actions.ts   # toutes les écritures en base
    │   │   ├── matchs/      # calendrier + scores
    │   │   ├── effectif/    # joueurs + rôles des comptes
    │   │   └── actus/       # publication des actualités
    │   └── api/auth/[...nextauth]/route.ts
    ├── components/          # Header, MatchCard, SportCoricoCard…
    └── lib/                 # prisma.ts, auth.ts, format.ts, links.ts
```

---

## 10. Commandes utiles (PowerShell)

```powershell
npm run dev        # développement local
npm run build      # build de production
npm run db:push    # applique le schéma à Supabase
npm run db:seed    # (re)crée les données de départ
npm run db:studio  # explorer la base visuellement
```

---

## 11. Si ça coince

| Problème | Cause la plus fréquente |
|---|---|
| `redirect_uri_mismatch` | L'URL de redirection Google ne correspond pas au caractère près |
| Connexion qui boucle | `NEXTAUTH_URL` ou `NEXTAUTH_SECRET` absent sur Vercel |
| `Can't reach database server` | Mauvais mot de passe Supabase, ou pooler/direct inversés |
| Menu Admin absent | Ton email n'est pas dans `ADMIN_EMAILS` (déconnecte-toi puis reconnecte-toi après l'avoir ajouté) |
| `prisma db push` échoue | Utilise bien la **Direct connection** (port 5432) dans `DIRECT_URL` |
