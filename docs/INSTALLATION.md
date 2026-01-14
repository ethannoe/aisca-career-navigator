# Guide d'Installation AISCA

## Prérequis

- Node.js 18+ (recommandé: Node.js 20 LTS)
- npm ou yarn ou pnpm
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)

## Installation Locale

### 1. Cloner le repository

```bash
git clone <repository-url>
cd aisca
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Lancer en mode développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:8080`

### 4. Build de production

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`

### 5. Prévisualiser le build

```bash
npm run preview
```

## Configuration (Optionnelle)

### Variables d'environnement

Créer un fichier `.env` à la racine du projet:

```env
# URL de l'API GenAI (optionnel, pour la génération IA)
VITE_GENAI_API_URL=https://ai.gateway.lovable.dev/v1/chat/completions

# Clé API (sera configurée via Lovable Cloud)
# Ne pas exposer cette clé dans le code source
```

### Personnalisation du référentiel

Le référentiel est configurable via `src/data/referentiel.json`:

- Ajouter/modifier des blocs de compétences
- Ajouter/modifier des compétences
- Ajouter/modifier des métiers
- Personnaliser les questions

## Dépannage

### Erreur "Module not found"

```bash
rm -rf node_modules
npm install
```

### Port 8080 déjà utilisé

Modifier le fichier `vite.config.ts`:

```typescript
server: {
  port: 3000,  // Changer le port
}
```

### Build échoue

Vérifier les erreurs TypeScript:

```bash
npm run typecheck
```

## Structure du Projet

```
aisca/
├── public/
│   └── docs/           # Documentation
├── src/
│   ├── components/     # Composants React
│   ├── data/           # Référentiel et données
│   ├── lib/            # Utilitaires et logique métier
│   ├── types/          # Types TypeScript
│   └── pages/          # Pages de l'application
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Déploiement

### Lovable

Le projet est automatiquement déployé via Lovable. Cliquez sur "Share" → "Publish".

### Vercel

```bash
npm run build
vercel deploy
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

## Support

Pour toute question, consultez la documentation ou ouvrez une issue sur le repository GitHub.

---

© 2024 AISCA - EFREI Data Engineering & AI
