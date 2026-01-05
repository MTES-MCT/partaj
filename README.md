# Partaj

## Introduction

Partaj est l'outil de gestion, pilotage et valorization de l'activité de conseil des affaires juridiques.

Concrètement, Partaj permet de créer des saisines, de les orienter vers le bureau responsable qui correspond au contexte de la demande, et de fournir des interfaces d'échange et de suivi pendant le cycle de vie de la saisine.

Partaj permet de répondre aux difficultés suivantes, qui se posent pour tout service qui aurait besoin de saisir la direction des affaires juridiques:

- Comment identifier le bureau compétent ?
- Ma demande a-t-elle bien été réceptionnée ? Est-elle prise en charge ?
- Quel est le délai prévisible de traitement de ma demande ?
- Comment assurer le suivi de mes différentes demandes ?
- Ma demande est urgente : comment m’assurer que l’avis de la DAJ sera rendu dans un délai utile ?

Pour les services juridiques, plusieurs difficultés existent également :

- Comment gérer le flux de demandes reçues via des formats et vecteurs variés ?
- Comment assurer le suivi, en temps réel, du nombre de demandes réceptionnées et des échéances prévisibles ?
- Comment contrôler la complétude des demandes et le bien-fondé des délais de réponse attendus ?
- Par quel vecteur informer les demandeurs de l’état d’avancement de la prise en charge de leur demande ? Avec quelle régularité ?
- Comment quantifier précisément l’activité de conseil, les délais moyens de réponse, l’efficience de cette activité ?

## Architecture

Partaj est composé de 2 éléments principaux: un backend en Django/Django-rest-framework adossé à PostgreSQL qui fournit quelques vues ainsi que des API JSON, et une frontend construit en React.

Pour fournir toutes ses fonctionnalités, Partaj a également besoin d'un service de stockage de fichier (pour les pièces-jointes mises en ligne par les utilisateurs) et d'un service d'envoi d'emails.

Le stockage de fichiers est abstrait par la couche `StorageBackend` de Django qui permet de facilement utiliser tout backend `s3`-compatible ou même un système de fichiers ou un volume monté.

La connexion avec le service d'envois d'email se fait à ce stade par l'API propriétaire de `Sendinblue`, ce qui nous permet de bénéficier de leur éditeur de template en "WYSIWYG.

## Démarrage

### Prérequis

En développement, seule l'utilisation du backend à travers `Docker` et `Docker Compose` est supportée. Ces deux logiciels doivent être installés sur la machine hôte.

```
$ docker -v
  Docker version 19.03.8, build afacb8b

$ docker-compose --version
  docker-compose version 1.25.5, build 8a1c60f6
```

### Backend

Avant de pouvoir démarrer le backend, il faut créer un fichier contenant les variables d'environnement nécessaires. Pour cela, il existe un template de fichier d'environnement. Le copier suffit pour démarrer le serveur.

```bash
cp env.d/development.dist env.d/development
```

Le démarrage du backend se fait en lançant tous les services, puis en exécutant 2 commandes de `Django`:

```bash
# Lancer tous les services (incl. le téléchargement des images nécessaires)
$ docker-compose up -d

# Effectuer les migrations pour mettre à jour la base de données
$ docker-compose exec app python manage.py migrate

# Compiler les traductions du backend (pour avoir l'interface en français)
$ docker-compose exec app python manage.py compilemessages

# Initialisation d'elasticsearch
$ docker-compose exec app python manage.py bootstrap_elasticsearch
```

Par défaut, l'application devrait ensuite être en ligne sur localhost: `127.0.0.1:8080`.

### Frontend

Partaj inclut un frontend bâti en `React`/`Typescript` qui prend en charge les parties intéractives de l'application.

#### Builds de développement

Contrairement au backend, il n'utilise pas `Docker Compose`. Les commandes suivantes supposent la disponibilité d'une version récente de `Node` (`12` ou `14`) sur la machine hôte ou dans un container.

```bash
# Installation des dépendances
$ cd src/frontend
$ yarn install --frozen-lockfile

# Génération du bundle JS
$ yarn build

# Génération de la feuille de style CSS
$ yarn build-css
```

Les fichiers générés par les builds du frontend (JS & CSS) sont déposés dans les statics du backend `Django`, qui peut les servir en développement et les collecter pour les services sur les environnements déployés.

#### Builds de déploiement

Les builds frontend sont différents en développement et en environnements déployés (staging et production):

- le build JS de production lance `webpack` en mode production pour construire un bundle plus léger, sans outil de développement;
- le build CSS de production utilise `PurgeCSS` (à travers `tailwindcss`) pour retirer toutes les classes non utilisées.

Ils peuvent être lancés de la façon suivante:

```bash
# Build JS de production
$ yarn build-production

# Build CSS de production
$ yarn build-css --production
```

## Développement

Partaj inclut des workflows de CI sur `Github Actions` qui se déclenchent automatiquent lors de push sur `main` ou de Pull Request vers `main`.

### Tests

Partaj comprend des suites de tests unitaires et d'intégration côté frontend et côté backend. Ils peuvent être lancés par les commandes suivantes:

```bash
# Tests backend, depuis la racine du repo
$ bin/pytest

# Tests frontend, depuis `src/frontend`
$ yarn test
```

Les fichiers `Javascript`, `Typescript` et `CSS` sont formattés avec `prettier`. Les fichiers `Python`sont formattés avec `black`.

### Localisation

Tout le contenu textuel de Partaj est localisable, et développé initialement en anglais.

#### Workflow de localisation du backend

Lors de l'ajout/modification/suppression de contenu textuel dans le backend, ces contenus peuvent être extraits automatiquement vers les `.po` par `Django`:

```bash
$ docker-compose exec app python manage.py makemessages -l en
$ docker-compose exec app python manage.py makemessages -l fr
```

Les traductions peuvent ensuite être mises à jour dans les fichiers `.po` situés dans `src/backend/partaj/locale` et committés dans le repo. Elles seront disponibles dans tout déploiement qui inclut ces nouvelles versions des fichiers.

Pour les utiliser localement, il faut mettre à jour les binaires de traduction Django (non committés):

```bash
$ docker-compose exec app python manage.py compilemessages
```

#### Workflow de localisation du frontend

Les contenus textuels du frontend sont automatiquement extraits à chaque exécution du build (`yarn build`) dans des fichiers JSON situés dans `src/frontend/js/translations/sources`.

Pour les traduire, il faut extraire ces contenus vers un fichier `.pot` "template de traduction" (généré à `src/frontend/js/translations/sources/frontend.pot`):

```bash
$ yarn generate-l10n-template
```

En utilisant un logiciel de traduction de type `PoEdit`, il est alors possible d'étendre les `.po` existants avec le contenu du "template de traduction" et de mettre à jour les traductions.

Les traductions à jour sont ensuite extraites vers des fichiers `.json` qui seront importés par `webpack`:

```bash
$ yarn generate-translations
```

Dans le cas du frontend, les `.po` comme les `.json` sont committés par commodité pour que le projet puisse builder plus facilement pour une nouvelle persone qui contribue.




## Fixtures

Pour faciliter le développement, une commande Django permet de peupler la base de données avec des données de démonstration.

Cette commande crée automatiquement :
- 5 unités et 3 thématiques
- 3 membres par unité (avec les rôles : propriétaire, administrateur, membre)
- 5 utilisateurs demandeurs
- 200 saisines réparties entre les demandeurs, avec différents états (brouillon, reçue, assignée, en traitement, en validation, répondue, clôturée)

```bash
$ docker-compose exec app python manage.py add_fixtures
```

Par défaut, cette commande vide la base de données avant d'insérer les données. Pour ajouter des fixtures sans vider la base, utilisez l'option `--no-flush` :

```bash
$ docker-compose exec app python manage.py add_fixtures --no-flush
```

**Note** : Cette commande est uniquement disponible en environnement de développement pour des raisons de sécurité.

#### Feature Flag

Partaj dispose de deux versions pour le projet de réponse qui cohabitent. Pour utiliser les deux versions en local, vous devez ajouter le feature flag ```referral_version => {date_de_publication}``` dans le backoffice Django. Toute saisine créée après cette date affichera la version la plus récente du projet de réponse.
Description des différents Feature flags (ajoutés par la commande de fixtures pour la plupart)

  | Feature Flag          | Description                                                                                   |
  |-----------------------|-----------------------------------------------------------------------------------------------|
  | working_day_urgency   | Active le calcul des délais d'urgence en jours ouvrés pour les urgences < 7 jours             |
  | referral_version      | Active la nouvelle version du projet de réponse pour les saisines créées après la date limite |
  | new_form              | Active le nouveau formulaire de saisine pour les saisines créées après la date limite         |
  | new_dashboard         | Active la nouvelle version du tableau de bord                                                 |
  | validation_start_date | Active la fonctionnalité de validation                                                        |
  | split_referral        | Active la possibilité de subdiviser une saisine en plusieurs parties                          |
  | reopen_referral       | Active la possibilité de rouvrir une saisine une fois rendue ou fermée                        |

#### Indexation des dashboards

```bash
$ docker-compose exec app python manage.py bootstrap_elasticsearch
```

### Base de connaissance

Afin de pouvoir populer la base de connaissance, vous devez avoir finalisé plusieurs saisines (i.e. statut Envoyé)
Ensuite, initialisez une première fois l'index notes d'ElasticSearch : 

```bash
$ docker-compose exec app python manage.py es_init_notes
```

Puis indexez les notes vers ElasticSearch 
```bash
$ docker-compose exec app python manage.py update_notes
```