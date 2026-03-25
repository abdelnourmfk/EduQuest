<div align="center">
<img width="1200" height="475" alt="EduQuest" src="https://github.com/abdelnourmfk/EduQuest/raw/master/metadata.json" />
</div>

# EduQuest - Système de Gestion Pédagogique

EduQuest est une application web de gestion pédagogique (architecture full-stack) reposant sur :

- React 19 + TypeScript
- Vite 6
- Supabase (PostgreSQL + realtime)
- Framer Motion
- Gestion multi-rôles : `ADMIN`, `AGENT`, `TEACHER`, `STUDENT`

---

## 🚀 Fonctionnalités clés

- Système de connexion par identifiants (login/password) via Supabase
- Dashboard adapté par rôle
- Gestion des entités pédagogiques : universités, facultés, spécialités, sous-spécialités
- Emplois du temps (planning), modules, affectations enseignants, salles
- Gestion des notes, bulletins, contestations et validations
- Gestion des ressources pédagogiques par enseignants
- Notifications temps réel par utilisateur
- Historique académique et flux de données en temps réel Supabase
- Mode “lite” et “réduire mouvement” pour accessibilité

---

## 🧩 Architecture du projet

- `App.tsx` : logique principale (connexion, rôle, navigation, notifications, état global)
- `src/store/db.ts` : modèle `DB`, fonctions de chargement et utilitaires
- `src/store/DBContext.tsx` : contexte React pour état global (fetch, refresh, sync realtime)
- `src/services/supabaseService.ts` : abstraction des opérations CRUD sur Supabase
- `src/lib/supabase.ts` : configuration API Supabase client (auto généré via env vars)
- Composants UI:
  - `components/Layout.tsx`
  - `components/AdminViews.tsx`
  - `components/AgentViews.tsx`
  - `components/TeacherViews.tsx`
  - `components/StudentViews.tsx`

---

## 📦 Prérequis

- Node.js 20+ (recommandé)
- npm 10+
- Conta Supabase (base de données PostgreSQL)

---

## 🔧 Mise en place locale

1. Clone le dépôt (si pas fait):
   ```bash
   git clone https://github.com/abdelnourmfk/EduQuest.git
   cd EduQuest
   ```
2. Installe les dépendances :
   ```bash
   npm install
   ```
3. Crée `.env` (copie de `.env.example`) :
   ```bash
   cp .env.example .env
   ```
4. Configure les variables Supabase dans `.env` :
   ```env
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
5. Crée la base de données Supabase (PostgreSQL) et initialise le schéma :
   - Utilise `schema.sql` dans l'onglet SQL de Supabase
   - Ou via `psql` :
     ```bash
     psql <connection-string> -f schema.sql
     ```
6. Démarre le serveur de dev :
   ```bash
   npm run dev
   ```

---

## 🧪 Build et déploiement

- Build production : `npm run build`
- Preview build : `npm run preview`

---

## 🗂️ Schéma de la base de données

`schema.sql` contient les tables :
- `rooms`, `universities`, `faculties`, `specialties`, `sub_specialties`
- `users`, `academic_histories`, `modules`, `assignments`, `timetable_entries`
- `grades`, `grade_disputes`, `notifications`, `resources`, `resource_modules`

✅ Les dépendances de clés étrangères sont gérées avec `ON DELETE CASCADE` ou `SET NULL`.

---

## 🛠️ Scripts disponibles

- `npm run dev` : serveur de développement
- `npm run build` : build production
- `npm run preview` : tester la build localement
- `npm run lint` : vérification de TypeScript

---

## 🔐 Sécurité et confidentialité

- Ne jamais committer les clés Supabase réelles.
- `.env` commité? Assure-toi que `.gitignore` contient `.env` (déjà présent dans le projet).
- Pour production, utilise des variables d’environnement sécurisées (CI/CD / secret manager).

---

## 🤝 Contribution

1. Fork & clone le repo
2. Branche feature : `git checkout -b feat/<ton-feature>`
3. Code & tests
4. PR avec description + screenshots

---

## 📌 Notes de déploiement Supabase

- Active `onconflict: false` si besoin pour `upsert` côté Supabase
- Surveillance realtime via `supabaseService.subscribeToChanges()` pour mise à jour auto

---

## ✅ Accessibilité & UX

- Vue de type `reduced motion` (préférences utilisateurs)
- Mode `lite` dans l’application
- Confirmations explicites pour déconnexion et reset cache

---

## 💬 Points d’amélioration possibles

- Hashing des mots de passe côté serveur (actuellement en clair)
- Authentification OAuth (Supabase Auth)
- Role-based permissions plus strictes au backend
- Tests unitaires / intégration (Jest + React Testing Library)
- Pagination/filtrage serveur
- Internationalisation (FR/EN)

---

## 📎 Liens utiles

- [Dépôt GitHub](https://github.com/abdelnourmfk/EduQuest)
- [Documentation Supabase](https://supabase.com/docs)
- [Vite](https://vitejs.dev)
- [React](https://reactjs.org)

