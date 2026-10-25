# Deployment auf Cloudflare Pages

Stand 2026-10-25: GitHub erledigt (Schritt 1, Repo
`github.com/onurkoc/shear-check`, Branch `main`). Cloudflare offen
(Schritte 2–6).

Die App ist statisch: Der Ordner `app/` wird so ausgeliefert, wie er im
Repo liegt. Kein Build-Schritt, kein Server.

| | |
| --- | --- |
| Hosting | Cloudflare Pages, eigenes Projekt nur für diese App |
| Repo | `github.com/onurkoc/shear-check` |
| Produktions-Branch | `main` |
| Ausgabeordner | `app` |
| Build-Befehl | keiner |
| Adresse (Ziel) | `https://shear.onurkoc.net/` |

Die App liegt im Stamm der Subdomain. Alle Pfade in `app/` sind relativ,
die App läuft deshalb auch unter jeder Vorschau-Adresse.

## Ablauf

1. GitHub-Repo `onurkoc/shear-check` anlegen (öffentlich, MIT), lokalen
   Stand pushen. `Legacy/` (alte lokale Arbeitsdateien, nicht fürs Repo) ist in
   `.gitignore`.
2. Cloudflare: **Workers & Pages**, neues Pages-Projekt «mit Git
   verbinden», nur dieses Repo freigeben. Projektname `shear-check`,
   Framework keine, Build-Befehl leer, Ausgabeordner `app`.
3. `https://shear-check.pages.dev/` prüfen (Prüfliste unten).
4. **Custom domains**: `shear.onurkoc.net` eintragen; Cloudflare legt
   CNAME und Zertifikat selbst an.
5. Zone `onurkoc.net`: den Hostnamen in die bestehende Cache Rule
   aufnehmen (Browser TTL und Edge TTL: Respect origin). Sonst
   überschreibt die Zonen-Einstellung «Browser Cache TTL» die Datei
   `_headers` (so bei interaction-diagram gesehen).
6. Mit `curl -sI` prüfen: `/`, `/app.js`, `/style.css`,
   `/shear/en1992.js` → `no-cache`; `/vendor/...` →
   `public, max-age=31536000, immutable`.

## Cache-Regeln (`app/_headers`)

| Dateien | Cache-Control |
| --- | --- |
| `/`, `index.html`, `*.js`, `*.css`, `norms/*.js`, `shear/*.js` | `no-cache` |
| `vendor/*` | `public, max-age=31536000, immutable` |

Die Regeln dürfen sich nicht überlappen (Cloudflare hängt sonst Werte
aneinander); ein neuer Unterordner in `app/` braucht eine eigene Regel.
`tests/headers.test.js` prüft, dass jede Datei von genau einer Regel
getroffen wird. Eine neue Version einer Bibliothek braucht einen neuen
Dateinamen.

## Prüfliste

1. Startseite, beide Normen, Sprache DE/EN, Theme Hell/Dunkel/System.
2. Datei laden (.xlsx mit mehreren Blättern, .csv mit Dezimalkomma),
   Werte einfügen, CSV-Export.
3. Kopfzeilen mit `curl -sI` wie oben.
