# Docker

Der Blog läuft als einzelner Container. Alles, was er speichert, liegt in
**einem** benannten Volume:

```text
reise-blog_data      /data
                     ├── data.db      SQLite-Datenbank
                     ├── sessions/    Astro-Sessions (Login)
                     └── uploads/     Medien aus dem Editor
```

Kein Bind-Mount, keine Host-Pfade: Backup und Restore streamen die Archivdatei
durch den Container (`docker compose run -T`), damit nichts gemountet werden
muss.

## Starten

```bash
cp .env.example .env        # einmalig, Key eintragen
docker compose up -d --build
```

Danach: <http://localhost:4321>. Beim ersten Start ist die Datenbank leer, das
Setup-Wizard unter `/_emdash/admin` legt Titel, Admin-Konto und Inhalt an.

`EMDASH_ENCRYPTION_KEY` in `.env` verschlüsselt Plugin-Secrets und das
SMTP-Passwort in der Datenbank. **Den Key zusammen mit den Backups aufbewahren** —
ohne ihn sind gespeicherte Secrets nicht mehr lesbar.

## Alltag

```bash
docker compose logs -f app     # Logs
docker compose restart app     # Neustart
docker compose down            # stoppen (Volume bleibt)
docker compose up -d --build   # nach git pull: neu bauen und starten
```

## Backup (extern)

Das Volume heißt `reise-blog_data`. Sichern ist ein Host-Job, kein Repo-Job:

```bash
docker compose stop app
docker run --rm -v reise-blog_data:/data:ro -v "$PWD":/backup alpine \
  tar -czf "/backup/reiseblog-$(date +%F).tar.gz" -C /data .
docker compose start app
```

Die App kurz zu stoppen sorgt dafür, dass SQLite-Datei und WAL konsistent sind.
Zurück geht es genauso:

```bash
docker compose stop app
docker run --rm -i -v reise-blog_data:/data alpine \
  sh -c 'rm -rf /data/* && tar -xzf - -C /data' < reiseblog-2026-11-15.tar.gz
docker compose start app
```

## Warum die Pfade im Dockerfile stehen

Die Astro-Config wird beim **Build** ausgewertet. Datenbankpfad, Upload-Verzeichnis
und Session-Treiber sind deshalb schon im Build-Stage auf `/data` gesetzt;
Runtime-Env-Variablen kämen dafür zu spät. Lokal (`pnpm dev`) bleiben die
Standardpfade `./data.db` und `./uploads` unverändert.

## Netzwerk / Domain

Der Container hört auf `0.0.0.0:4321`. Für eine öffentliche Domain einen
Reverse Proxy (Caddy, nginx, Traefik) davor setzen und in EmDash unter
Einstellungen die Site-URL auf die echte Adresse stellen — sonst zeigen
Anmelde-Links auf `localhost`.

## Was nicht im Image landet

`.dockerignore` schließt `data.db`, `uploads/`, `node_modules`, `dist`, `.git`
und `.env` aus. Das Image enthält nur Code und die gebaute Server-Ausgabe; alle
veränderlichen Daten kommen aus dem Volume.
