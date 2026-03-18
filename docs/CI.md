# Portage de la CI GitHub Actions vers GitLab CI

## Analyse du pipeline actuel

La CI GitHub Actions de Partaj (`partaj-ci.yml`) est bien structurée et relativement simple :

| Job | Type | Durée typique |
|---|---|---|
| `lint-back-black/flake8/pylint/isort` | 4 jobs parallèles, Python 3.11, pas de services | ~2 min chacun |
| `test-back` | Python 3.11 + services PostgreSQL + Elasticsearch | ~5-10 min |
| `build-front` | Node 22, yarn cache | ~3-5 min |
| `lint-front-prettier` | Node 22, yarn cache | ~2 min |
| `test-front` | Node 22, yarn cache | ~3-5 min |
| `deploy` | Node 14 + Python 3.11, git push vers Scalingo | Dépend de Scalingo |

Le job `deploy` est spécifique à Scalingo : il construit un artefact, le copie sur une branche `deployment-staging` ou `deployment-production`, et pousse vers le remote Scalingo. **Ce mécanisme est de toute façon à jeter lors du passage à OpenStack.**

---

## Difficulté du portage vers GitLab CI

### Ce qui est immédiat à traduire (faible friction)

La mécanique de base de GitHub Actions se traduit quasiment ligne pour ligne en GitLab CI :

| GitHub Actions | Équivalent GitLab CI |
|---|---|
| `container: python:3.11` | `image: python:3.11` |
| `container: node:22.4.0` | `image: node:22.4.0` |
| `services: postgres:` | `services: - postgres:12` |
| `services: elasticsearch:` | `services: - docker.elastic.co/elasticsearch/...` |
| `actions/cache@v4` (yarn) | `cache: key: paths:` avec `$CI_COMMIT_REF_SLUG` |
| `needs: [job-a, job-b]` | `needs: [job-a, job-b]` (identique) |
| `defaults.run.working-directory` | `default: before_script: cd src/backend` ou `extends:` |
| `if: github.ref == 'refs/heads/main'` | `rules: - if: $CI_COMMIT_BRANCH == "main"` |

Les jobs de lint et de test sont donc une traduction mécanique, réalisable en une demi-journée par quelqu'un qui connaît les deux syntaxes.

### Ce qui demande une attention particulière

**1. Les services Elasticsearch avec health checks**

GitHub Actions permet des `options` détaillées sur les services (health-cmd, intervals). GitLab CI supporte les services mais sans health checks natifs aussi granulaires. La solution courante est d'ajouter un `before_script` avec un `until curl ...` pour attendre qu'Elasticsearch soit prêt.

**2. Le cache yarn**

GitHub Actions utilise `actions/cache@v4` avec une clé basée sur `hashFiles('**/yarn.lock')`. GitLab CI a son propre système de cache avec `cache: key: files: [src/frontend/yarn.lock]`. Fonctionnellement équivalent, la syntaxe est différente.

**3. Le job `deploy`**

C'est le seul job véritablement complexe à porter, mais pour une mauvaise raison : il est **entièrement Scalingo-specific**. Il fait :
- un build de l'artefact final (front + back assemblés)
- un git push vers une branche `deployment-staging/production` que Scalingo surveille

Ce mécanisme n'existera plus sur OpenStack. Il faudra le remplacer par une logique de déploiement sur des instances OpenStack (SSH + docker compose pull/up, ou registry d'images + webhook). La question n'est donc pas "comment traduire ce job en GitLab CI" mais "quel est le nouveau mécanisme de déploiement sur OpenStack".

**4. Les secrets**

GitHub Actions utilise des `secrets` configurés dans l'interface GitHub. GitLab CI a des `CI/CD Variables` équivalentes (Settings > CI/CD > Variables). La migration des secrets est manuelle mais triviale.

---

## Faut-il faire la migration CI avant ou après la séparation back/front ?

### Arguments pour faire la migration CI **avant**

**C'est la bonne option, et de loin.**

1. **Rapidité.** Hors job `deploy` (qui change de toute façon), le portage des jobs de lint/test prend 1 à 2 jours. C'est du travail mécanique à faible risque.

2. **Vous aurez besoin d'une CI GitLab pendant la séparation.** Les sprints de séparation (DISENTANGLEMENT.md) représentent plusieurs semaines de travail avec des changements structurels profonds (auth, build, routing). Vous voulez une CI qui valide chaque PR dès le début de ce travail, pas à la fin.

3. **Un pipeline monorepo GitLab est plus simple à écrire maintenant.** Aujourd'hui le repo est un monorepo avec deux dossiers bien délimités (`src/frontend/`, `src/backend/`). GitLab CI supporte nativement les `changes:` path-based triggers pour n'exécuter que la partie concernée. C'est le bon moment pour le configurer, avant que les repos soient séparés.

4. **Cela découple la migration CI de la migration d'hébergement.** Si vous faites la CI après la séparation, vous devrez simultanément gérer deux nouvelles structures de repos ET un nouveau pipeline AND un nouveau mécanisme de déploiement. C'est beaucoup de variables inconnues en même temps.

5. **Le job `deploy` peut être un stub.** Pendant la phase de transition (encore sur Scalingo), le job `deploy` GitLab peut simplement appeler la même logique git push vers Scalingo. Il sera remplacé par la logique OpenStack au moment du basculement d'hébergement.

### Arguments pour faire la migration CI **après** (et pourquoi ils ne tiennent pas)

- *"On aura de toute façon deux pipelines séparés après."* — Vrai, mais écrire un pipeline monorepo maintenant n'est pas un travail perdu : les jobs back et front se retrouveront tels quels dans les deux futurs pipelines.
- *"Scalingo disparaît donc le deploy change anyway."* — Précisément pourquoi il ne faut pas attendre : autant concevoir le nouveau deploy GitLab directement pour OpenStack, plutôt que de maintenir le mécanisme Scalingo.

---

## Plan recommandé

### Étape 1 : Migration CI monorepo (avant toute séparation)

**Durée : 1-2 jours**

Créer `.gitlab-ci.yml` équivalent au `partaj-ci.yml` actuel :

```yaml
stages:
  - lint
  - test
  - build
  - deploy

# Jobs de lint backend (x4) → image: python:3.11
# Job de test backend → image: python:3.11, services: postgres + elasticsearch
# Job de build frontend → image: node:22, cache yarn
# Job de lint frontend → image: node:22, cache yarn
# Job de test frontend → image: node:22, cache yarn
# Job de deploy → stub Scalingo ou vide jusqu'au basculement OpenStack
```

Optimisation optionnelle mais recommandée : utiliser `changes:` pour ne déclencher que les jobs concernés :

```yaml
lint-back-black:
  rules:
    - changes:
        - src/backend/**/*
```

### Étape 2 : Sprints de séparation back/front (avec CI GitLab active)

Cf. DISENTANGLEMENT.md. La CI valide chaque sprint.

### Étape 3 : Séparation des pipelines

Quand les repos sont séparés, chaque repo hérite de la partie concernée du pipeline monorepo. Le job `deploy` devient un `docker build + push registry + ssh deploy` sur OpenStack.

---

## Exemple de `.gitlab-ci.yml` pour le job de test backend

Pour illustrer la traduction concrète du job le plus complexe :

```yaml
test-back:
  stage: test
  image: python:3.11
  services:
    - name: postgres:12
      alias: postgres
    - name: docker.elastic.co/elasticsearch/elasticsearch:7.17.27
      alias: elasticsearch
      variables:
        discovery.type: single-node
  variables:
    POSTGRES_DB: partaj
    POSTGRES_USER: admin
    POSTGRES_PASSWORD: admin
    POSTGRES_HOST: postgres
    DJANGO_CONFIGURATION: "Test"
    DJANGO_PARTAJ_PRIMARY_LOCATION: "https://partaj"
    DJANGO_SECRET_KEY: "TestSecretKey"
    DJANGO_SETTINGS_MODULE: "partaj.settings"
    DJANGO_ENV_VERSION: "MTES"
  before_script:
    - cd src/backend
    - apt-get update && apt-get install -y gettext
    - pip install .[dev]
    - |
      until curl -s http://elasticsearch:9200/_cluster/health; do
        echo "Waiting for Elasticsearch..."; sleep 5
      done
  script:
    - python manage.py compilemessages
    - pytest
```

La traduction du reste des jobs suit le même pattern.
