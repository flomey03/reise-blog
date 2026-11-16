# Docker

Der Blog läuft als einzelner Container. Alles, was er speichert, liegt in
**einem** benannten Volume, gemountet auf `/app/data`:

```text
reise-blog_data      /app/data
                     ├── data.db                  SQLite-Datenbank
                     ├── sessions/                Astro-Sessions (Login)
                     ├── uploads/                 Medien aus dem Editor
                     └── secrets/encryption.key   Schlüssel für Plugin-Secrets
```

Kein Bind-Mount, keine Host-Pfade: Backup und Restore streamen die Archivdatei
durch den Container (`docker compose run -T`), damit nichts gemountet werden
muss.

## Starten

```bash
docker compose up -d --build
```

Danach: <http://localhost:4321>. Beim ersten Start ist die Datenbank leer; das
Setup-Wizard unter `/_emdash/admin` fragt **Titel, Untertitel, Admin-Konto und
Beispielinhalte** ab. Im Seed ist bewusst nichts davon vorbelegt.

**Vor dem ersten Start die Site-URL setzen.** Im Production-Build verweigert
das Setup ohne kanonische Origin (Passkeys und E-Mail-Links brauchen sie):

```bash
EMDASH_SITE_URL=https://deine-domain.example docker compose up -d --build
```

Ohne Eintrag fällt Compose auf `http://localhost:4321` zurück — gut zum
Ausprobieren, aber Anmelde-Links zeigen dann auf localhost.

## Alltag

```bash
docker compose logs -f emdash    # Logs
docker compose restart emdash    # Neustart
docker compose down              # stoppen (Volume bleibt)
docker compose up -d --build     # nach git pull: neu bauen und starten
```

## Schlüssel (`EMDASH_ENCRYPTION_KEY`)

Der Schlüssel verschlüsselt Plugin-Secrets und das SMTP-Passwort **in der
Datenbank**. Er gehört nicht ins Image und nicht ins Repo.

**Der Container erzeugt ihn beim ersten Start selbst** und legt ihn im
Daten-Volume ab:

```text
/app/data/secrets/encryption.key
```

Dadurch ist ein Volume-Backup immer vollständig — Datenbank, Medien und der
Schlüssel, der die verschlüsselten Werte öffnet. Kein manueller Schritt auf dem
Server, kein Secret, das beim Restore verloren gehen kann.

Setzt man `EMDASH_ENCRYPTION_KEY` in der Umgebung, gewinnt dieser Wert und die
Datei im Volume bleibt unangetastet — etwa für einen Secret-Manager:

```bash
EMDASH_ENCRYPTION_KEY=emdash_enc_v1_… docker compose up -d
```

**Sicherheitshinweis:** Schlüssel und Chiffrat liegen im selben Volume. Wer das
Volume vollständig kopiert, hat beides. Der Schlüssel schützt also gegen einen
Datenbank-Dump ohne Volume (z. B. `data.db` allein weitergeben), nicht gegen
einen kompletten Volume-Diebstahl. Für einen Familienblog ist das der bewusste
Kompromiss für „Restore ohne Zusatzschritt".

**Rotation:** `EMDASH_ENCRYPTION_KEY` darf kommagetrennt sein — der erste
Schlüssel verschlüsselt Neues, alle gelisteten entschlüsseln weiter.

## Backup (extern)

Das Volume heißt `reise-blog_data`. Sichern ist ein Host-Job, kein Repo-Job:

```bash
docker compose stop emdash
docker run --rm -v reise-blog_data:/data:ro -v "$PWD":/backup alpine \
  tar -czf "/backup/reiseblog-$(date +%F).tar.gz" -C /data .
docker compose start emdash
```

Die App kurz zu stoppen sorgt dafür, dass SQLite-Datei und WAL konsistent sind.
Zurück geht es genauso:

```bash
docker compose stop emdash
docker run --rm -i -v reise-blog_data:/data alpine \
  sh -c 'rm -rf /data/* && tar -xzf - -C /data' < reiseblog-2026-11-15.tar.gz
docker compose start emdash
```

## Warum die Pfade in `astro.config.mjs` stehen

Die Astro-Config wird beim **Build** ausgewertet: Datenbankpfad, Upload-Ordner
und Session-Treiber werden fest in die Server-Ausgabe eingebacken. Zur Laufzeit
gesetzte Env-Vars kämen dafür zu spät. Deshalb stehen sie als relative Pfade
unter `./data` in `astro.config.mjs`; im Container (Arbeitsverzeichnis `/app`)
lösen sie sich zu `/app/data` auf. Lokal (`pnpm dev`) bleiben sie daneben im
Repo.

## Netzwerk / Domain

Der Container hört auf `0.0.0.0:4321`. Für eine öffentliche Domain einen
Reverse Proxy (Caddy, nginx, Traefik) davor setzen und in EmDash unter
Einstellungen die Site-URL auf die echte Adresse stellen — sonst zeigen
Anmelde-Links auf `localhost`.

## Was nicht im Image landet

`.dockerignore` schließt `data/`, `node_modules`, `dist`, `.git` und `.env` aus.
Das Image enthält nur Code und die gebaute Server-Ausgabe; alle veränderlichen
Daten kommen aus dem Volume.
