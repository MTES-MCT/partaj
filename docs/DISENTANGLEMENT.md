# Diagnostic : séparation du back et du front

## État des lieux

Partaj est une application monolithique déployée en une seule unité. Le backend Django et le frontend React sont imbriqués selon un modèle courant dans l'écosystème Django de la fin des années 2010 : le backend sert l'application React comme s'il s'agissait d'un site à templates classique. Cela fonctionne, mais cela crée une série de couplages forts qui complexifient toute évolution indépendante des deux parties.

---

## Points de couplage identifiés

### 1. Le build frontend écrit directement dans les sources backend

Webpack est configuré pour écrire ses artefacts (JS, CSS) directement dans `src/backend/partaj/static/`. Le frontend n'a donc pas d'existence indépendante : il doit être buildé **avant** que Django puisse servir quoi que ce soit.

```
webpack build → src/backend/partaj/static/js/index.js
             → src/backend/partaj/static/css/
→ python manage.py collectstatic → data/static/
→ WhiteNoise sert ces fichiers via Django
```

**Conséquence :** le repo est structuré en monorepo (`src/frontend/`, `src/backend/`) mais le build n'est pas indépendant. On ne peut pas développer le frontend sans avoir le backend, et vice-versa de facto.

### 2. Le token d'authentification est injecté côté serveur

La pièce la plus structurante du couplage est dans `core/context_processors.py`. À chaque requête sur `/app/*`, Django :
1. Vérifie que l'utilisateur est authentifié via CAS (Cerbère)
2. Crée ou récupère son DRF Token
3. Sérialise tout cela en JSON dans la page HTML :

```python
window.__partaj_frontend_context__ = JSON.parse('{{ FRONTEND_CONTEXT|safe }}');
# Contient : token DRF, csrftoken, url_logout (CAS), env, tracking...
```

Le frontend récupère ce token et l'attache à tous ses appels API (`Authorization: Token xxx`). **Il n'y a aucun flux OAuth/OIDC côté frontend** : c'est entièrement délégué à Django.

**Conséquence :** un frontend découplé (servi depuis une autre origine) ne peut pas recevoir ce token, et ne peut pas initier lui-même le flux CAS.

### 3. Les URL de l'API sont relatives (même origine)

Tous les appels `fetch` du frontend utilisent des URL relatives : `/api/referrals/`, `/api/users/whoami/`, etc. Le frontend suppose qu'il est servi depuis le même domaine que le backend.

**Conséquence :** impossible de déployer le frontend sur une origine différente sans modifier l'intégralité des appels API.

### 4. Le routage frontend est une trappe Django

Django attrape toutes les URL `/app/*` et les redirige vers une unique vue `AppView`, qui rend un template HTML contenant le point de montage React. C'est React Router qui prend ensuite la main côté client.

```python
re_path("app/.*", views.AppView.as_view(), name="app")
```

**Conséquence :** le frontend ne peut pas être servi par un serveur statique (Nginx, CDN) sans rejouer cette logique de redirection.

### 5. Les fichiers uploadés passent par Django

Les pièces jointes (`ReferralAttachment`, etc.) sont stockées sur S3 mais leur accès est contrôlé par une vue Django authentifiée (`AuthenticatedFilesView`). Le frontend demande `/attachment-file/<uuid>/`, Django vérifie les droits et redirige vers l'URL S3 signée.

**Conséquence :** ce mécanisme est sain (contrôle d'accès centralisé) et devra être **conservé** côté backend lors de la séparation, avec exposition d'un endpoint API dédié.

### 6. Le déploiement est un artefact compilé unique

Le job `deploy` de la CI :
1. Build le frontend (`yarn build`, `yarn build-css`)
2. Compile les messages Django (`compilemessages`)
3. Copie uniquement `src/backend/` (qui contient déjà les artefacts frontend) sur la branche de déploiement
4. Pousse vers Scalingo via git

C'est un artefact monolithique : un seul process Gunicorn sert API + fichiers statiques (via WhiteNoise) + media protégés.

---

## Ce qui est bien fait et doit être préservé

- **La séparation des sources** en `src/frontend/` et `src/backend/` est déjà là. Le découplage physique est donc à portée.
- **L'API REST** est déjà complète et documentée (DRF). Il n'y a pas de logique métier dans les templates.
- **Le stockage S3** est déjà externalisé : les fichiers ne sont pas dans le conteneur.
- **Les variables d'environnement** sont déjà la principale interface de configuration du backend.

---

## Proposition de sprints de refactorisation

L'objectif final est d'avoir **deux repos/projets indépendants**, chacun avec sa propre stack docker-compose pour OpenStack :
- `partaj-backend` : Django + Gunicorn + PostgreSQL + Elasticsearch + Nginx (reverse proxy)
- `partaj-frontend` : Nginx servant le build React statique

### Sprint 0 — Prérequis : CORS et URL d'API explicite

**Durée estimée : 3-5 jours**

C'est le préalable technique à tout le reste. Sans lui, rien ne fonctionne en multi-origines.

- Ajouter `django-cors-headers` au backend
- Configurer `CORS_ALLOWED_ORIGINS` (whitelist explicite des origines frontend autorisées)
- Modifier le frontend pour lire `REACT_APP_API_URL` (ou équivalent webpack) au lieu d'utiliser des URL relatives
- Ajouter une variable d'environnement `API_BASE_URL` injectée via Webpack `DefinePlugin`
- Vérifier que tous les appels `fetch` passent par une fonction utilitaire centrale (si ce n'est pas déjà le cas) pour faciliter la migration

**Critère de sortie :** le frontend peut appeler le backend depuis une origine différente dans un environnement de test local.

---

### Sprint 1 — Découplage de l'authentification

**Durée estimée : 5-10 jours · Criticité : haute**

C'est le couplage le plus profond. Le flux CAS actuel est 100% server-side (Django redirige vers Cerbère, valide le ticket, crée la session Django, génère le DRF token, l'injecte dans la page). Un frontend servi de façon indépendante ne peut pas bénéficier de ce flux tel quel.

**Option A (recommandée) : Backend-for-Frontend (BFF) léger**

Le frontend conserve un point d'entrée sur le backend pour l'auth uniquement :
1. L'utilisateur accède à `https://frontend.domaine/` → le frontend redirige vers `https://backend.domaine/auth/login/?next=<frontend_url>`
2. Django gère le flux CAS et redirige vers le frontend avec un token en query param ou via un cookie `SameSite=None; Secure`
3. Le frontend stocke le token (localStorage ou mémoire) et l'utilise pour toutes les requêtes API

Côté Django : créer un endpoint `/auth/login/` et `/auth/logout/` qui orchestre CAS et renvoie vers le frontend. Modifier `context_processors.py` pour que le token soit aussi disponible via `/api/auth/token/` (endpoint REST).

**Option B (plus lourde) : OIDC**

Remplacer django-cas-ng par une solution OIDC (ProConnect / AgentConnect, qui est la solution interministérielle recommandée pour les agents d'État). Cela sortirait l'auth de Django et permettrait au frontend de gérer lui-même le flux OAuth PKCE. À considérer si une migration d'IdP est de toute façon prévue.

**Critère de sortie :** le frontend peut s'authentifier et récupérer un token sans que Django rende du HTML.

---

### Sprint 2 — Découplage du build

**Durée estimée : 2-3 jours**

Une fois l'auth découplée, le build frontend peut être séparé.

- Modifier `webpack.config.js` pour que l'output soit `dist/` (dans `src/frontend/dist/`) et non plus dans `src/backend/partaj/static/`
- Supprimer la dépendance de `collectstatic` sur les artefacts frontend
- Ajouter un `Dockerfile` dédié au frontend : `node:22` pour le build, puis `nginx:alpine` pour servir `dist/`
- Créer un `nginx.conf` minimal : servir les fichiers statiques + `try_files $uri /index.html` pour le routing SPA
- Adapter la `docker-compose.yml` locale pour refléter la nouvelle architecture (deux services distincts)

**Critère de sortie :** `docker compose up` dans `src/frontend/` démarre un Nginx autonome qui sert l'app React.

---

### Sprint 3 — Séparation des repos et docker-compose de production

**Durée estimée : 3-5 jours**

- Extraire `src/frontend/` dans un repo `partaj-frontend` (avec son propre git, CI, versioning)
- Extraire `src/backend/` dans un repo `partaj-backend`
- Écrire les `docker-compose.yml` de production pour chaque repo :

**`partaj-backend` docker-compose :**
```yaml
services:
  db: # PostgreSQL
  elasticsearch:
  app: # Gunicorn
  nginx: # Reverse proxy → /api/, /admin/, /attachment-file/
```

**`partaj-frontend` docker-compose :**
```yaml
services:
  app: # Nginx servant dist/ avec try_files pour SPA
```

- Documenter les variables d'environnement requises par chaque projet
- Configurer les variables de l'environnement OpenStack (secrets, URLs, buckets S3 OVH si applicable)

**Critère de sortie :** deux projets déployables indépendamment sur des instances OpenStack, se parlant via HTTPS.

---

### Sprint 4 — Nettoyage et hardening

**Durée estimée : 3-5 jours**

- Supprimer WhiteNoise du backend (remplacé par Nginx)
- Supprimer les templates Django de rendu de l'app React (`app.html`, `AppView`)
- Supprimer `context_processors.py` devenu obsolète
- Revoir les headers de sécurité (CSP, HSTS, X-Frame-Options) côté Nginx
- Vérifier la configuration CORS en production (restreindre aux origines réelles)
- Mettre à jour la documentation

---

## Résumé des risques

| Risque | Mitigation |
|---|---|
| Flux CAS cassé lors du Sprint 1 | Garder l'ancienne auth en parallèle le temps de valider la nouvelle sur un env de staging |
| Régression sur les fichiers protégés (pièces jointes) | Couvrir `AuthenticatedFilesView` avec des tests d'intégration avant le Sprint 2 |
| CORS mal configuré en prod → API inaccessible | Tester depuis une origine différente dès le Sprint 0, scripter des smoke tests |
| Désynchronisation des versions back/front | Versionner l'API (au moins un préfixe `/api/v1/`) avant la séparation des repos |

---

## Ordre recommandé

```
Sprint 0 (CORS + URL explicite)
    ↓
Sprint 1 (Auth découplée)        ← bloquant pour tout le reste
    ↓
Sprint 2 (Build séparé)
    ↓
Sprint 3 (Repos + docker-compose prod OpenStack)
    ↓
Sprint 4 (Nettoyage)
```

Les Sprints 2, 3 et 4 peuvent partiellement se chevaucher une fois le Sprint 1 terminé. Le Sprint 1 est le seul bloquant dur.
