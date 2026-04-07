# LinkUp - Guide d'Installation Supabase

## 🚀 Étapes d'installation

### 1. Créer un projet Supabase
1. Aller sur https://supabase.com
2. Créer un compte ou se connecter
3. Cliquer sur "New Project"
4. Choisir un nom (ex: "linkup")
5. Choisir la région (ex: "West Europe" pour la France)
6. Choisir le plan (Free tier suffisant pour commencer)
7. Attendre la création (2-3 minutes)

### 2. Configurer les variables d'environnement

Dans votre projet LinkUp, créer/modifier le fichier `.env` :

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-ici
```

**Où trouver ces valeurs :**
- Dans Supabase Dashboard > Settings > API
- `URL` = Project URL
- `anon public` = anon key

### 3. Exécuter le schéma SQL

1. Dans Supabase Dashboard, aller dans **SQL Editor**
2. Cliquer sur **New query**
3. Copier-coller tout le contenu de `supabase/schema_complete.sql`
4. Cliquer sur **Run** (bouton vert en haut à droite)

✅ Le schéma complet sera créé avec toutes les tables, index, triggers et policies RLS.

### 4. Créer les Storage Buckets

Aller dans **Storage** puis créer ces buckets :

| Bucket | Public | Description |
|--------|--------|-------------|
| `avatars` | ✅ | Photos de profil |
| `post-images` | ✅ | Images des publications |
| `story-images` | ✅ | Images des stories |
| `cover-images` | ✅ | Photos de couverture |
| `resources` | ❌ | Fichiers des groupes (privés) |

**Pour chaque bucket :**
1. Cliquer "New bucket"
2. Entrer le nom
3. Activer "Public bucket" si nécessaire
4. Créer

### 5. Configurer les politiques Storage

Dans chaque bucket, configurer les policies :

**Bucket `avatars` :**
- SELECT : `true` (public)
- INSERT : `auth.role() = 'authenticated'` (authentifié uniquement)

**Buckets `post-images`, `story-images`, `cover-images` :**
- SELECT : `true`
- INSERT : `auth.role() = 'authenticated'`

**Bucket `resources` :**
- SELECT : `(storage.foldername(name))[1] = auth.uid()` (propriétaire uniquement)

### 6. Activer l'authentification Email

Aller dans **Authentication > Providers > Email** :
- Activer "Enable Email provider"
- Configurer "Site URL" : `https://votre-projet.supabase.co` (pour le dev, utilisez l'URL de l'app)
- Sauvegarder

### 7. Tester la connexion

```bash
cd /home/niceman/projets/LinkUp
npx ts-node test-database.ts
```

Vous devriez voir :
```
✅ Auth connection OK
✅ Profiles table accessible
✅ Posts table accessible
✅ Messages table accessible
✅ Storage accessible
```

### 8. Lancer l'application

```bash
cd /home/niceman/projets/LinkUp
npx expo start
```

Puis scanner le QR code avec Expo Go sur votre téléphone.

## 🔧 Dépannage

### Erreur "Profiles table error"
- Vérifier que le schéma SQL a été exécuté sans erreur
- Vérifier que les triggers sont créés

### Erreur "Storage error"
- Vérifier que les buckets sont créés
- Vérifier que les policies sont configurées

### Erreur de connexion
- Vérifier que `.env` contient les bonnes valeurs
- Vérifier que le projet Supabase est actif

## 📚 Ressources utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Expo avec Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
