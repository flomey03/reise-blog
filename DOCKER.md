# Docker

Der Blog läuft als einzelner Container. Alles, was er speichert, liegt in zwei
benannten Volumes — mehr braucht ein Backup nicht.

```text
reise-blog_data      /data      SQLite-Datenbank + Sessions
reise-blog_uploads   /uploads   Medien (Bilder aus dem Editor)
```

## Starten

```bash
cp .env.example .env        # einmalig, Key eintragen
docker compose up -d --build
```

Danach: <http://localhost:4321> und <http://localhost:4321/_emdash/admin>.
Beim ersten Start läuft das Setup-Wizard, weil die Datenbank leer ist.

`EMDASH_ENCRYPTION_KEY` in `.env` verschlüsselt Plugin-Secrets und das
SMTP-Passwort in der Datenbank. **Den Key zusammen mit den Backups aufbewahren** —
ohne ihn sind gespeicherte Secrets nicht mehr lesbar.

## Alltag

```bash
docker compose logs -f app     # Logs
docker compose restart app     # Neustart
docker compose down            # stoppen (Volumes bleiben)
docker compose up -d --build   # nach git pull: neu bauen und starten
```

## Bestehende lokale Daten übernehmen

```bash
docker compose up -d --build   # einmal, damit der Container existiert
scripts/import-local.sh        # kopiert ./data.db und ./uploads in die Volumes
```

## Backup

```bash
scripts/backup.sh
```

Stoppt die App kurz (damit SQLite-Dateien und WAL konsistent sind), schreibt
zwei Archive nach `./backups/` und startet sie wieder:

```text
backups/data-20261115-190803.tar.gz
backups/uploads-20261115-190803.tar.gz
```

Ohne Stopp ginge es auch, wäre aber nicht garantiert konsistent — bei einem
Blog ist ein Neustart von zwei Sekunden der bessere Deal.

## Wiederherstellen

```bash
scripts/restore.sh backups/data-20261115-190803.tar.gz \
                   backups/uploads-20261115-190803.tar.gz
```

Das Uploads-Archiv ist optional. Das Skript stoppt die App, ersetzt den Inhalt
des Volumes und startet sie wieder. Ein Restore auf einem anderen Rechner:

```bash
git clone <repo> && cd reise-blog
cp .env.example .env            # denselben EMDASH_ENCRYPTION_KEY eintragen
docker compose up -d --build
scripts/restore.sh pfad/zu/data-….tar.gz pfad/zu/uploads-….tar.gz
```

## Warum die Pfade im Dockerfile stehen

Die Astro-Config wird beim **Build** ausgewertet. Datenbankpfad, Upload-Verzeichnis
und Session-Treiber sind deshalb schon im Build-Stage auf `/data` und `/uploads`
gesetzt; Runtime-Env-Variablen kämen dafür zu spät. Lokal (`pnpm dev`) bleiben die
Standardpfade `./data.db` und `./uploads` unverändert.

## Netzwerk / Domain

Der Container hört auf `0.0.0.0:4321`. Für eine öffentliche Domain einen
Reverse Proxy (Caddy, nginx, Traefik) davor setzen und in EmDash unter
Einstellungen die Site-URL auf die echte Adresse stellen — sonst zeigen
Anmelde-Links und RSS auf `localhost`.

## Was nicht im Image landet

`.dockerignore` schließt `data.db`, `uploads/`, `node_modules`, `dist`, `.git`
und `.env` aus. Das Image enthält nur Code + gebaute Server-Ausgabe; alle
veränderlichen Daten kommen aus den Volumes.
