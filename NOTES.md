# NOTES – shear-check

Annahmen, Entscheide und offene Punkte. Ziffern beziehen sich auf
SIA 262:2025 bzw. EN 1992-1-1:2004 + AC:2010 + A1:2014. Keine Normtexte,
nur Ziffern.

## 1. Herkunft

- Vorlage war ein Jupyter-Notebook (lokal, nicht im Repo). Es diente nur
  als Idee; die Logik ist neu aufgebaut.
- Aus `onurkoc/interaction-diagram` (Commit `eca638d`) **unverändert
  kopiert**: `app/core.js`, `app/strain_planes.js`, `app/errors.js`,
  `app/norms/en1992.js`, `app/norms/sia262.js`, `app/vendor/*`,
  `jsconfig.json`. Die Tests des Kerns liegen im Quell-Repo. Damit gelten
  hier auch die Entscheide von dort, soweit sie m_Rd betreffen: D3
  (Stahl ideal plastisch, Grenze 12 ‰), D4 (f_ck ≤ 50), D5 (Drehpunkt C
  auch bei SIA), D7 (unbewehrter Querschnitt mit reduziertem f_cd),
  k_σ = 2 (Parabel).
- Übernommen und angepasst: Aufbau und Stil der Oberfläche, Muster für
  i18n, Zahlen-Parser, Tabelle mit Sortierung, `_headers`.

## 2. Fehler des Notebooks und wie sie hier vermieden sind

| Nr. | Fehler im Notebook | Hier |
| --- | --- | --- |
| 1 | N_Ek aus der Spalte «Shear Force» | Spalten nach Header-Token (`load_read.js`), Test `load_read.test.js` |
| 2 | γ_f doppelt auf N | keine Lastfaktoren, Datei = Bemessungswerte |
| 3 | `magnifier = 100000` | entfällt |
| 4 | σ_cp = abs(N/A_c) | Vorzeichen umgekehrt (Plaxis-Schalter), Zug bleibt negativ (F1) |
| 5 | c = 0, d = h | c > 0 verlangt, d = h − c (A2) |

## 3. Entscheide (Onur, 2026-10-24)

- **F1** EC2, Zug: σ_cp negativ in (6.2.a) und (6.2.b), V_Rd,c ≥ 0.
  Punkte unter Zug in Grafik und Tabelle gekennzeichnet.
- **F2** Zwei Seiten A_s+/c+ und A_s−/c−, Wahl nach Vorzeichen von M_Ed.
- **F3** Bezeichnung «Zugseite bei M > 0» / «Zugseite bei M < 0».
- **F4** Umschalter Hell/Dunkel/System, Standard System, localStorage,
  Plotly-Farben je Theme. interaction-diagram später separat.
- **F5** η_t-Auswahl 0.85/1.0/1.2 ohne Vorgabe; η_t nur in f_cd (Gl. 2)
  bzw. m_Rd, nicht in τ_cd (Gl. 3).
- **F6** SIA Stufe 2: m_d/m_Rd > 1 oder m_Rd undefiniert/≤ 0 → Punkt rot,
  «Biegewiderstand überschritten», keine Querkraft-Ausnutzung, nichts
  begrenzt. Stufe 1/plastisch: nur Hinweis.
- **F7** Zwei Kurven, wenn die Seiten verschieden sind, sonst eine.
  d_v je Seite editierbar, Standard d.
- **F8** M = 0: beide Seiten, ungünstigere zählt.
- **F9** SIA: A_s > 0 auf der Zugseite für alle Stufen, sonst Fehler.
  EC2: ursprünglich A_sl = 0 zulässig; ersetzt durch A2 (Fassung
  2026-10-24), jetzt wie SIA.
- **F10** f_ck ≤ 50.
- **F11** b = 1000 mm fest, keine Skalierung der Lasten.
- **F12** Einheiten m, cm²/m, kN/m, kNm/m. d in mm für k (eigener Test).
- **F13** DE/EN.
- **F14** `tests/reference/cases.json` mit leeren Sollwerten (todo),
  Header-Parser-Tests.

## 4. Festlegungen

Von Onur bestätigt (2026-10-24): alle, A1 bis A14. A2 von Onur geändert
(2026-10-24).

- **A1** C_Rd,c wird als Zähler eingegeben: Feld «C_Rd,c · γ_c»,
  Vorgabe 0.18, C_Rd,c = Wert / γ_c. So bleibt die Form 0.18/γ_c erhalten,
  wenn γ_c geändert wird. ν_min nach (6.3N), nicht editierbar.
- **A2** (Fassung 2026-10-24) c > 0 ist überall Pflicht (c ist Abstand
  Rand–Schwerpunkt Bewehrung); die frühere Regel «c leer → d = h» ist
  entfallen. Ohne Längsbewehrung auf der Zugseite (A_sl = 0) ist der
  Querschnitt unbewehrt, der Nachweis ohne Querkraftbewehrung
  (EN 1992-1-1:2004 6.2.2, :2023 8.2.2) gilt nicht: kein Nachweis, Punkt
  rot, Meldung «Keine Längsbewehrung auf der Zugseite – unbewehrter Beton,
  Nachweis nicht Teil dieser App»; für diese Seite keine
  Widerstandslinie. SIA war schon so (F9). Die Tabelle zeigt das
  verwendete d (Spalte d [m], beide Normen). Referenzfall EN-3: Eingabe
  von A_sl = 0 auf 0.5 cm²/m geändert (ν_min massgebend), Sollwerte
  weiterhin leer.
- **A3** d_v ≤ d verlangt (Eingabe grösser als d wird abgelehnt).
- **A4** Näherungsstufe für ε_v ohne Vorgabe (wie η_t).
- **A5** V_Rd,c = 0: η = ∞; zusätzlich V_Ed = 0: η = 0.
- **A6** SIA Stufe 2 mit m_d = 0: ε_v = 0, k_d = 1.
- **A7** SIA M = 0 und eine Seite mit A_s = 0: Fehler des Punkts (F8 + F9
  streng ausgelegt).
- **A8** m_Rd ≤ 0 auf der Seite des Moments wird wie «nicht definiert»
  behandelt (F6).
- **A9** CSV: Trennzeichen Tab, sonst `;`, sonst `,`. Dezimalkomma bei
  `,` nur in Anführungszeichen. Export mit `;` und dem Dezimalzeichen der
  Sprache, UTF-8 mit BOM.
- **A10** Zeilennummern bei .xlsx/.xls beziehen sich auf den benutzten
  Bereich des Blatts (SheetJS); beginnt das Blatt nicht in Zeile 1,
  weichen sie von Excel ab.
- **A11** Kennzeichnung «Zug» nur im EC2-Modus (F1). Im SIA-Modus wirkt
  Zug über m_Rd(n_d).
- **A12** EC2: f_cd = α_cc f_ck/γ_c (3.1.6 (1)) nur für die Grenze
  0.2 f_cd. α_cc-Grenzen 0.8–1.0 aus `norms/en1992.js`.
- **A13** SIA-Grafik: auch Stufe 1/plastisch mit x = |m_d|/m_Rd. Punkte
  ohne m_Rd sind nicht in der Grafik (Hinweis), nur in der Tabelle.
- **A14** E_s = 200 GPa nach SIA 262:2025 3.2.2.4, aus `norms/sia262.js`,
  in Gl. (38), (39), (41); Quelle im Code vermerkt (`app/app.js`).

## 5. Offene Punkte

- **O1** Gl. (37): Beide OCR-Dateien der Norm zeigen «k_g = 48/(16 +
  D_max · min{1; (60/f_ck)²}) ≥ 1,2». Umgesetzt mit Untergrenze 1.2,
  **am Original zu bestätigen** (Onur prüft am PDF und meldet sich, falls
  es anders ist; bis dahin so belassen).
- **O2** Sollwerte für `tests/reference/cases.json` liefert Onur; keine
  App-Werte als Sollwerte eintragen. Stand 2026-10-25: alle
  Referenzfälle SIA-1..6 und EN-1..6 mit Sollwerten, keine todo.
- **O4** (geschlossen 2026-10-25) EN 1992-1-1:2004 6.2.2 (1): EN-1..5
  mit Onurs Excel-Sheet bestätigt, dort ist (6.2.b) massgebend. EN-6
  (grosse A_sl) deckt (6.2.a) ab, Eingabe und Sollwert von Onur.
- **O3** Nicht umgesetzt (Vorgabe): SIA Stufe 3 (Gl. 40),
  Dekompressionsmoment (4.3.3.2.6), A_s,min. Ebenfalls nicht umgesetzt
  (Entscheid Onur: so lassen, im README unter «Anwendungsgrenzen»):
  SIA 4.3.3.2.5 (abweichende Hauptrichtung), 4.3.3.2.8 (Einzellasten nahe
  Auflager); EC2 6.2.2 (6) mit Gl. (6.5) (obere Grenze V_Ed). Ausserdem
  nicht abgedeckt: EC2 6.2.2 (2) (Spannbeton, ungerissen), 12.6.3.

## 6. Geplant: EN 1992-1-1:2023 (noch nicht umgesetzt)

Plan von Onur freigegeben am 2026-10-24. Umsetzung erst, wenn 2004 und
SIA mit Onurs Sollwerten validiert sind. Ziffern nach
EN 1992-1-1:2023 (OCR-Datei
`C:\Pini\Converted References\Norms\EC\EN-1992-1-1-2023_OCR\`).

Umfang: 8.2.1 und 8.2.2, Formeln (8.19), (8.20), (8.27) bis (8.31);
d_dg nach 8.2.1(4) (16 + D_lower ≤ 40 mm); γ_V = 1.40 und γ_S = 1.15
nach Tabelle 4.3 (NDP, editierbar); Vorzeichen nach 3.10(1) (Zug
positiv). Neue Dateien `app/shear/en1992_2023.js`,
`app/norms/en1992_2023.js`; Adresse `#en1992-2023`, 2004 bleibt `#en1992`.
Seitenwahl ±M, M = 0, A2, A5 wie bei 2004.

Entscheide (Onur, 2026-10-24):

- **G1** k_vp und a_v wirken nur im Term d_dg/d von (8.27). ρ_l (8.28),
  z (8.19), τ_Rdc,min (8.20) und k_vp (8.31) mit unverändertem d.
- **G2** Option a_v (8.29, «may»): Standard aus, nach Formel. Hinweis in
  der Tabelle, wenn a_cs = d massgebend ist (M ≈ 0), da dort a_v und
  k_vp am stärksten wirken.
- **G3** f_ck ≤ 50 wie in den anderen Modi.
- **G4** γ_C im 2023-Modus ausgeblendet. Eingaben f_yk, γ_S (f_yd für
  8.20), γ_V, D_lower (ohne Vorgabe, Hinweis «D_max zulässig
  (8.2.1(4) Anm. 2)»).
- **G5** Anzeige mit Zug positiv (3.10(1)): Spaltenkopf «N_Ed [kN/m]
  (Zug +)», ebenso die Achse. Plaxis-Schalter unverändert (Vorzeichen in
  der Datei); interne Umrechnung je Norm, Tests für beide Richtungen.
- **G6** ρ_l ohne Grenze.
- **G7** Grafik: x = τ_Rd,c, y = τ_Ed, 45°-Linie (η = 1), Punkte
  grün/rot.
- **G8** Zug-Kennzeichnung (wie F1) auch im 2023-Modus.
- V_Ed = 0: kein Nachweis, η = 0 (wie A5).

Tabelle (geplant): N_Ed (Zug +), M_Ed, V_Ed, Seite, d, a_cs, a_v, k_vp,
τ_Ed, τ_Rdc,min, τ_Rd,c, η, Hinweis (τ_Rdc,min massgebend, a_v verwendet,
k_vp = 0,1, a_cs = d massgebend, Zug).

Referenzfälle (leere Sollwerte): a_cs < 4d mit und ohne a_v,
a_cs ≥ 4d, Druck, Zug, τ_Rdc,min massgebend, M = 0, M < 0 unsymmetrisch.

Anwendungsgrenzen (README): 8.32–8.35 (k_1·σ_cp) und Vorspannung;
zweiachsige Querkraft 8.2.1(5) mit (8.21)–(8.26); auflagernahe Bereiche
8.2.1(11), 8.2.2(1); d_d und reduzierte Teilsicherheitsbeiwerte nach
Anhang A (A.3); Mindestquerkraftbewehrung für Balken mit d > 500 mm
(8.2.1(2)).

## 7. Vergleich SIA 262 mit kommerziellem Programm (2026-10-24)

Ergebnisse eines kommerziellen Bemessungsprogramms (im Folgenden
«Programm»), gerechnet von Onur, abgelegt in
`tests/reference/commercial.json` (Test `tests/commercial.test.js`) und
als m_Rd-Sollwerte in `tests/reference/cases.json` (SIA-1..6). Die
Projekt-, Lock-Dateien und Drucklisten liegen nur lokal, nicht im Repo.
Querschnitt: h = 0,30 m, c = 0,05 m, A_s = 5,65 cm²/m beidseitig,
C30/37, B500B (bilinear ohne Verfestigung, ε_su 12 ‰), γ_c 1,5, γ_s 1,15,
η_t 1,0, ε_cu 3,5 ‰, D_max 32 mm, Stufe 2.

### Abweichungen Programm zu App / SIA 262:2025

Die App wird dafür **nicht** geändert.

- **a)** k_g ohne Untergrenze 1,2 (Programm = SIA 262:2013, Gl. 37).
- **b)** η_fc = (30/f_ck)^(1/3) statt (40/f_ck)^(1/3) (Gl. 26). Für SIA-5
  über den Abminderungsbeiwert 0,895 ausgeglichen (f_cd 19,8 =
  η_fc(2025) · η_t · f_ck/γ_c).
- **c)** d ≠ h − c im Querkraftnachweis (Fall 1/2 d ≈ 0,18 m, Fall 3
  d = 0,30 m = h).
- **d)** m_Rd im Querkraftnachweis bei proportional gesteigertem N
  (N_Grenz), nicht bei konstantem N.
- **e)** Betongesetz: Programm-Standard «SC» (Typ 4, SIA-Kurve Gl. 27,
  4.2.1.6) gibt +1,4 bis +1,6 % m_Rd gegenüber der Parabel der App
  (k_σ = 2, Parabel-Rechteck). Vergleich daher mit Programm Typ 2 (Parabel
  bis 2 ‰, dann horizontal bis 3,5 ‰) = Modell der App. Die
  vereinfachte Spannungsverteilung ist nach 4.2.1.5 zulässig. Der Stahl
  war nicht die Ursache (Programm wie App bilinear, 12 ‰).
- **f)** Das Programm zieht die verdrängte Betonfläche ab (Netto), App rechnet
  brutto; Unterschied wächst mit der Druckkraft, bei N bis −800 ≤ 0,24 %,
  bei N = −4600 rund 0,7 %. Bestätigt mit einer Diagnose nur im Test
  (`tests/net_section.js`: Kraft −σ_c(ε)·A_s an jeder Lage in der
  Druckzone; mit «brutto» gibt sie den Kern exakt wieder). QS-1: brutto
  189,36, netto 187,52, Programm Typ 2 188,0 bei N = −4600; bei N = 0,
  −500 und −800 liegt die Drucklage ausserhalb der Druckzone, netto =
  brutto.

### Ergebnisse

| Teil | App | Programm | Ergebnis |
| --- | --- | --- | --- |
| A m_Rd(N = 0), Seiten p und n, Typ 2 | ±63,33 | ±63,5 | −0,26 % → bestanden (0,5 %) |
| A m_Rd(N = −4600 konstant), Seiten p und n, Typ 2, Netto-Diagnose | ±187,52 (App brutto ±189,36, +0,72 %) | ±188,0 | −0,26 % → bestanden (0,5 %) |
| B Gl. (39) mit m_Rd der App | 0,686 / 1,030 ‰ | 0,7 / 1,0 ‰ | bestanden |
| C Gl. (35), (36) mit Programm-Eingaben (k_g = 1,0, d zurückgerechnet) | – | – | bestanden (−0,16 bis −0,40 %) |
| cases.json m_Rd SIA-1..4 (N 500) | 121,98 | 122,0 | −0,01 % → bestanden |
| cases.json m_Rd SIA-5 (QS-2, M < 0) | −164,73 | −164,8 | −0,04 % → bestanden |
| cases.json m_Rd SIA-6 (Zug −100) | 50,78 | 50,9 | −0,24 % → bestanden |

Zu A, Fall 3: Der Grenzzustandspunkt des Querkraftlaufs (−4635,6 /
185,3) liegt auf dem steilen Ast nahe der zentrischen Druckkraft und
bleibt nur Information. Getestet wird m_Rd bei konstantem N = −4600
(Programm Typ 2: ±188,0) mit der Netto-Diagnose (Abweichung f); das
App-Verhalten (brutto) ist unverändert, der Bruttowert steht im Testlog.

Die SC-Werte (64,2; 187,0 bei −4677) stehen in `commercial.json` als
«kommerzielles Programm Typ 4 (SC, Gl. 27) – Modellunterschied, kein Test»; ihre
Querkraftwerte sind die Eingaben der Teile B und C.

### D – App neben Programm (nur Dokumentation)

App: SIA 262:2025, d = h − c, m_Rd bei konstantem N.

| Fall | m_Rd App / Programm Typ 2 / SC | v_Rd App / Programm | Ursache |
| --- | --- | --- | --- |
| 1 (N 0, M 20) | 63,33 / 63,5 / 64,2 | 227,1 / 174,9 (SC) | d 0,25 vs 0,18; k_g 1,2 vs 1,0 |
| 2 (N 0, M −30) | 63,33 / 63,5 / 64,2 | 209,2 / 166,1 (SC) | d 0,25 vs 0,18; k_g 1,2 vs 1,0 |
| 3 (N −500, M 20) | 121,98 / 185,3 / 187,0 | 247,4 / 308,8 (Typ 2) | m_Rd bei konst. N vs N_Grenz; d 0,25 vs 0,30 (= h); k_g |

- Fall 3: Das v_Rd des Programms (308,8) liegt gegenüber der App (247,4) auf
  der unsicheren Seite (d = h statt h − c, m_Rd bei N_Grenz).
- `cases.json` SIA-1..6 vollständig (2026-10-24): m_Rd aus dem Programm
  (Typ 2, N konstant); ε_v, k_d, v_Rd, η aus Onurs Handrechnung (Excel
  SIA262_Querkraft_Kontrolle, mit m_Rd aus dem Programm, also auch für N ≠ 0
  mit m_Rd bei konstantem N). Toleranz 0,5 % relativ, alle bestanden.
  EN-1..6 gegen Excel-Sheet Onur validiert (2026-10-25), (6.2.a) und
  (6.2.b) abgedeckt (O4 geschlossen).
- Validierungstext in der App unter der Tabelle, SIA-Modus: «SIA 262:
  m_Rd mit kommerziellem Programm verglichen (Abweichungen dokumentiert), ε_v, k_d, v_Rd
  mit Handrechnung geprüft.» EC2-Modus (2026-10-25): «EN 1992-1-1:
  V_Rd,c nach 6.2.2 (1) in 6 Referenzfällen mit unabhängiger
  Handrechnung geprüft (Gl. 6.2.a und 6.2.b; Druck, Zug, kleine A_sl,
  Begrenzung σ_cp ≤ 0,2 f_cd, M < 0 mit unsymmetrischer Bewehrung).»
  Startseite: allgemeiner Stand der Validierung beider Normen.
