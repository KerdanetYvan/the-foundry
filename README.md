# The Foundry

Portail d'administration pour serveur Minecraft Forge. Interface web permettant de gérer les joueurs, les mods, les annonces et de surveiller les métriques du serveur en temps réel.

## Fonctionnalités

- **Monitoring** — CPU, RAM, disque, TPS, uptime (Hetzner + Minecraft), graphes sur 1h
- **Modération** — whitelist, kick, ban des joueurs
- **Mods** — liste, upload et suppression de `.jar` avec redémarrage guidé du serveur
- **Invitations** — liens avec limite d'utilisation et expiration
- **Annonces** — éditeur Markdown avec prévisualisation
- **Terminal RCON** — console live avec commandes rapides et stream des logs

## Stack

- Next.js 16 (App Router) · TypeScript · Tailwind CSS 4
- PostgreSQL 16 · Drizzle ORM
- RCON (protocole Minecraft) pour les commandes serveur

## Variables d'environnement

Copier `.env.example` en `.env` et renseigner les valeurs :

| Variable | Description | Défaut |
| --- | --- | --- |
| `DATABASE_URL` | URL PostgreSQL | — |
| `SESSION_SECRET` | Secret HMAC pour les sessions | — |
| `APP_URL` | URL publique de l'app | — |
| `SERVER_ADDRESS` | Adresse de connexion Minecraft | — |
| `RCON_HOST` | Hôte RCON du serveur Minecraft | `localhost` |
| `RCON_PORT` | Port RCON | `25575` |
| `RCON_PASSWORD` | Mot de passe RCON | — |
| `MC_LOG_PATH` | Chemin du fichier `latest.log` | `/host/root/opt/minecraft/minecraft/data/logs/latest.log` |
| `MC_MODS_PATH` | Chemin du dossier `mods/` | `/host/root/opt/minecraft/minecraft/data/mods` |

## Déploiement (production)

```bash
docker compose up -d
```

Le `docker-compose.override.yml` (non versionné) doit monter le système de fichiers hôte pour les métriques, logs et mods :

```yaml
services:
  web:
    volumes:
      - /:/host/root:ro
      - /opt/minecraft/minecraft/data/mods:/host/root/opt/minecraft/minecraft/data/mods
```

Le premier mount en `:ro` couvre les métriques et les logs. Le second, sans `:ro`, permet à l'app d'écrire dans le dossier mods (upload / suppression).

## Développement local

**Prérequis** : Node.js 20+, Docker Desktop

```bash
npm install
```

Copier `.env.example` en `.env` et configurer :

```env
DATABASE_URL=postgresql://foundry:foundry@localhost:5433/foundry
RCON_HOST=localhost
RCON_PASSWORD=devrcon
MC_MODS_HOST_PATH="C:/chemin/vers/ton/dossier/mods"
MC_MODS_PATH="C:\\chemin\\vers\\ton\\dossier\\mods"
MC_LOG_PATH="C:/chemin/vers/le/projet/dev-logs/latest.log"
```

Lancer la base de données et le serveur Minecraft de dev :

```bash
# Base de données uniquement
docker compose up db -d

# Serveur Minecraft Forge 1.20.1 (premier démarrage ~3 min)
docker compose -f docker-compose.dev.yml up
```

Lancer l'app :

```bash
npm run dev
```

> **Note** : `MC_MODS_HOST_PATH` (forward slashes) est lu par Docker Compose pour le bind-mount.  
> `MC_MODS_PATH` (backslashes sur Windows) est lu par Next.js pour accéder aux fichiers.  
> Les deux doivent pointer vers le même dossier.
