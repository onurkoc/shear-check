// @ts-check
/*
Texts of the interface, one table for each language.

A further language is one more table in TEXTS with the same keys;
nothing else has to be changed. {name} in a text is replaced by a
parameter. Numbers are written with the decimal sign of the language; a
parameter [number, digits] is written with a fixed number of decimals.

Clause numbers are the same in all languages; a non-breaking space
( ) keeps "6.2.2 (1)" on one line.
*/

/** @type {Object<string, Object<string, string>>} */
export const TEXTS = {
    de: {
        'decimal': ',',
        'language.name': 'Deutsch',

        // page
        'title': 'Querkraftnachweis ohne Querkraftbewehrung',
        'landing.intro': 'Querkraftwiderstand von Platten und Schalen ohne Querkraftbewehrung, Werte pro Laufmeter (b = 1000 mm). Die Datei enthält Bemessungswerte N, M, V; die App wendet keine Lastfaktoren an.',
        'landing.choose': 'Norm wählen',
        'landing.sia': '4.3.3.2, Gl. (35) bis (41): Näherungsstufe 1, 2 oder plastisch, m_Rd aus dem M-N-Interaktionsdiagramm',
        'landing.en': '6.2.2 (1), Gl. (6.2.a) und (6.2.b), empfohlene Werte als Vorgabe, C_Rd,c und k_1 editierbar',
        'norm.sia262.label': 'SIA 262:2025',
        'norm.en1992.label': 'EN 1992-1-1 (empfohlene Werte als Vorgabe)',
        'header.change_norm': 'Norm wechseln',
        'footer.source': 'Quellcode',
        'validation.note': 'Stand der Validierung: SIA 262:2025 und EN 1992-1-1:2004 in Referenzfällen mit Handrechnungen und einem gängigen kommerziellen Bemessungsprogramm verglichen. Einzelheiten unter den Ergebnissen der jeweiligen Norm.',
        'validation.note.sia262': 'SIA 262: m_Rd mit kommerziellem Programm verglichen (Abweichungen dokumentiert), ε_v, k_d, v_Rd mit Handrechnung geprüft.',
        'validation.note.en1992': 'EN 1992-1-1: V_Rd,c nach 6.2.2 (1) in 6 Referenzfällen mit unabhängiger Handrechnung geprüft (Gl. 6.2.a und 6.2.b; Druck, Zug, kleine A_sl, Begrenzung σ_cp ≤ 0,2 f_cd, M < 0 mit unsymmetrischer Bewehrung).',
        'theme.light': 'Hell',
        'theme.dark': 'Dunkel',
        'theme.system': 'System',

        // file
        'file.label': 'Datei mit N, M, V hierher ziehen oder auswählen (.xlsx, .xls, .csv):',
        'file.choose': 'Datei auswählen',
        'file.remove': 'Lastpunkte entfernen',
        'file.sheet': 'Blatt:',
        'file.sheet_choose': '– Blatt wählen –',
        'file.help': 'Spalten in beliebiger Reihenfolge, Gross-/Kleinschreibung egal, weitere Spalten werden nicht gelesen. Erkannt werden N: N, Nx, Nx2D, N_Ed, N_d, Normal Force; M: M, M2D, M_Ed, M_d, Moment; V: V, Q, Q2D, V_Ed, V_d, Shear Force. Einheiten kN/m und kNm/m. Dezimalpunkt oder Dezimalkomma.',
        'file.read': '«{name}» gelesen: {count} Lastpunkte (Spalten «{n}», «{m}», «{v}»).',
        'file.choose_sheet': '«{name}» hat {count} Blätter: bitte ein Blatt wählen.',
        'file.type': '«{name}»: nur .xlsx, .xls oder .csv.',
        'paste.summary': 'Werte einfügen',
        'paste.help': 'Tabelle mit Kopfzeile einfügen, z. B. aus Excel kopiert (Tabulator), oder mit ; getrennt.',
        'paste.apply': 'Übernehmen',
        'paste.name': 'Eingefügte Werte',

        // inputs
        'section.legend': 'Querschnitt',
        'section.width': 'b = 1000 mm, Werte pro Laufmeter.',
        'section.c_help': 'c: Abstand vom Rand bis zum Schwerpunkt der Bewehrung, d = h − c.',
        'example.load': 'Beispiel laden',
        'example.loaded': 'Beispielwerte geladen –',
        'example.undo': 'Rückgängig',
        'example.note': 'Beispielwerte, nicht projektbezogen',
        'label.h_': 'Höhe h [m]',
        'side.plus': 'Zugseite bei M > 0 (z. B. unten)',
        'side.minus': 'Zugseite bei M < 0 (z. B. oben)',
        'label.a_sp': 'Bewehrung A_s [cm²/m]',
        'label.c_p': 'Achsabstand c [m]',
        'label.d_vp': 'Wirksame statische Höhe d_v [m]',
        'label.a_sn': 'Bewehrung A_s [cm²/m]',
        'label.c_n': 'Achsabstand c [m]',
        'label.d_vn': 'Wirksame statische Höhe d_v [m]',
        'materials.legend': 'Baustoffe',
        'label.f_ck': 'Beton f_ck [N/mm²] (bis 50)',
        'label.gamma_c': 'γ_c',
        'label.f_yk': 'Betonstahl f_sk [N/mm²]',
        'label.gamma_s': 'γ_s',
        'label.d_max': 'Grösstkorn D_max [mm]',
        'eta_t.label': 'η_t (4.2.1.3) für f_cd und m_Rd, bitte wählen:',
        'eta_t.help': 'Vorschlag {suggestion}: Spritzbeton wird meist früh belastet. {impact} nur bei stossartiger Belastung. τ_cd (Gl. 3) enthält kein η_t.',
        'label.alpha_cc': 'α_cc',
        'label.c_rd_c_gamma': 'C_Rd,c · γ_c',
        'label.k_1': 'k_1',
        'ndp.help': 'National festzulegende Parameter (6.2.2 (1), Anmerkung). Empfohlen: C_Rd,c = {c}/γ_c, k_1 = {k_1}.',
        'eps_v.legend': 'Dehnung ε_v',
        'level.label': 'Näherungsstufe, bitte wählen:',
        'level.level1': 'Stufe 1, Gl. (38)',
        'level.level2': 'Stufe 2, Gl. (39), mit m_d/m_Rd',
        'level.plastic': 'plastisch, Gl. (41) (4.3.3.2.3)',
        'label.curtailed': 'Längsbewehrung abgestuft: ε_v × 1,5 (4.3.3.2.4)',
        'loads.legend': 'Lastpunkte',
        'label.plaxis': 'Druck negativ (Plaxis)',
        'loads.help': 'Ein: N in der Datei ist bei Druck negativ, das Vorzeichen wird umgekehrt. Aus: Druck positiv in der Datei.',
        'export.csv': 'CSV exportieren',
        'export.file_name': 'querkraftnachweis.csv',
        'placeholder': 'z. B. {value}',
        'placeholder.d_v': 'leer = d',

        // names of the inputs in messages
        'name.h_': 'Höhe h',
        'name.a_sp': 'A_s (Zugseite bei M > 0)',
        'name.c_p': 'c (Zugseite bei M > 0)',
        'name.d_vp': 'd_v (Zugseite bei M > 0)',
        'name.a_sn': 'A_s (Zugseite bei M < 0)',
        'name.c_n': 'c (Zugseite bei M < 0)',
        'name.d_vn': 'd_v (Zugseite bei M < 0)',
        'name.f_ck': 'f_ck',
        'name.gamma_c': 'γ_c',
        'name.f_yk': 'f_sk',
        'name.gamma_s': 'γ_s',
        'name.d_max': 'D_max',
        'name.alpha_cc': 'α_cc',
        'name.c_rd_c_gamma': 'C_Rd,c · γ_c',
        'name.k_1': 'k_1',

        // messages
        'messages.enter_values': 'Querschnitt und Baustoffe eingeben, dann erscheint das Diagramm.',
        'messages.unreinforced': 'Keine Längsbewehrung auf der Zugseite – unbewehrter Beton, Nachweis nicht Teil dieser App (betrifft mindestens einen Lastpunkt).',
        'messages.no_reinforcement': 'SIA 262: Für mindestens einen Lastpunkt fehlt die Bewehrung auf der Zugseite (A_s = 0). Diese Punkte werden nicht nachgewiesen.',
        'check.missing': '{name} fehlt.',
        'check.not_a_number': '{name}: «{text}» ist keine Zahl.',
        'check.positive': '{name} = {value}: muss grösser als 0 sein.',
        'check.not_negative': '{name} = {value}: darf nicht negativ sein.',
        'check.below_height': '{name} = {value} m: muss kleiner als die Höhe h = {h} m sein.',
        'check.d_v_above_d': '{name} = {value} m: darf nicht grösser als d = {d} m sein.',
        'check.eta_t_missing': 'η_t fehlt: bitte {a} / {b} / {c} wählen (SIA 262 4.2.1.3).',
        'check.level_missing': 'Näherungsstufe für ε_v fehlt: bitte wählen.',
        'check.norm': '{norm}: {text}',
        'norm.f_ck_max': 'f_ck = {f_ck} N/mm²: nur bis {f_ck_max} N/mm² (C50/60) zulässig.',
        'norm.alpha_cc': 'alpha_cc = {alpha_cc}: zulässig ist {low} bis {high}.',
        'norm.eta_t': 'eta_t = {eta_t}: zulässig ist {a} / {b} / {c}.',
        'norm.eta_t_missing': 'SIA 262: eta_t fehlt (4.2.1.3), bitte {a} / {b} / {c} wählen.',
        'core.no_min_eccentricity': '{norm}: keine Mindestausmitte, die Option ist in diesem Modus nicht zulässig.',
        'app.inputs_invalid': 'Die Eingaben sind unzulässig.',

        // reading
        'read.ambiguous': 'Spalte {column} ist mehrdeutig (Zeile {row}): {heads}. Bitte nur eine dieser Spalten behalten.',
        'read.no_header': 'Keine Kopfzeile mit N, M und V in den ersten {rows} Zeilen gefunden.',
        'read.missing': 'Spalte {missing} fehlt. Gefundene Kopfzeile (Zeile {row}): {heads}.',
        'read.not_a_number': 'Zeile {row}, Spalte «{column}»: «{text}» ist keine Zahl.',
        'read.no_values': 'Unter der Kopfzeile stehen keine Werte.',
        'read.no_sheet': 'Blatt «{name}» nicht gefunden.',

        // table
        'side.short.plus': 'Zug bei M > 0',
        'side.short.minus': 'Zug bei M < 0',
        'table.nr': 'Nr.',
        'table.row': 'Zeile',
        'table.n_en': 'N_Ed [kN/m]',
        'table.m_en': 'M_Ed [kNm/m]',
        'table.v_en': 'V_Ed [kN/m]',
        'table.sigma_cp': 'σ_cp [N/mm²]',
        'table.v_rd_en': 'V_Rd,c [kN/m]',
        'table.n_sia': 'n_d [kN/m] (Druck +)',
        'table.m_sia': 'm_d [kNm/m]',
        'table.v_sia': 'v_d [kN/m]',
        'table.m_rd': 'm_Rd [kNm/m]',
        'table.m_ratio': '|m_d|/m_Rd',
        'table.eps_v': 'ε_v [‰]',
        'table.k_d': 'k_d',
        'table.v_rd_sia': 'v_Rd [kN/m]',
        'table.side': 'Seite',
        'table.d': 'd [m]',
        'table.utilization': 'Ausnutzung η',
        'table.hint': 'Hinweis',
        'table.sort': 'Sortieren',
        'note.exceeded': 'Querkraftwiderstand überschritten',
        'note.unreinforced': 'Keine Längsbewehrung auf der Zugseite – unbewehrter Beton, Nachweis nicht Teil dieser App',
        'note.no_reinforcement': 'keine Bewehrung auf der Zugseite (A_s = 0)',
        'note.flexure': 'Biegewiderstand überschritten',
        'note.flexure_info': 'Hinweis: Biegewiderstand überschritten (m_d > m_Rd oder m_Rd nicht definiert)',
        'note.tension': 'Zug (σ_cp < 0)',
        'note.sigma_limited': 'σ_cp auf 0,2 f_cd begrenzt',
        'note.at_zero': 'V_Rd,c = 0 (Zug)',
        'note.m_zero': 'M = 0: beide Seiten gerechnet, ungünstigere',
        'summary.points': '{total} Lastpunkte.',
        'summary.max': 'Grösste Ausnutzung η = {value} (Nr. {nr}).',
        'summary.exceeded': 'Überschritten: {count}.',
        'summary.flexure': 'Biegewiderstand überschritten: {count}.',
        'summary.no_reinforcement': 'Ohne Bewehrung auf der Zugseite: {count}.',
        'summary.tension': 'Unter Zug: {count}.',

        // hints
        'hint.sia.tau_cd': 'τ_cd = 0,3 · √f_ck / γ_c = 0,3 · √{f_ck} / {gamma_c} = {tau_cd} N/mm² (Gl. 3, ohne η_t).',
        'hint.sia.k_g': 'k_g = 48 / (16 + D_max · min{1; (60/f_ck)²}) ≥ 1,2 mit D_max = {d_max} mm, f_ck = {f_ck}: k_g = {k_g} (Gl. 37).',
        'hint.sia.eps_y': 'f_yd / E_s = {f_yd} / {e_s} = {eps} ‰.',
        'hint.sia.level.level1': 'ε_v nach Näherungsstufe 1: ε_v = f_yd / E_s (Gl. 38).',
        'hint.sia.level.level2': 'ε_v nach Näherungsstufe 2: ε_v = f_yd / E_s · m_d / m_Rd (Gl. 39). Bei m_d > m_Rd oder ohne m_Rd keine Querkraft-Ausnutzung.',
        'hint.sia.level.plastic': 'ε_v = 1,5 · f_yd / E_s (Gl. 41, plastische Verformungen der Biegebewehrung, 4.3.3.2.3).',
        'hint.sia.curtailed': 'Längsbewehrung abgestuft: ε_v um 50 % vergrössert (4.3.3.2.4).',
        'hint.sia.side': '{side}: A_s = {a_s} cm²/m, d = {d} m, d_v = {d_v} m.',
        'hint.sia.m_rd': 'm_Rd(n_d) aus dem M-N-Interaktionsdiagramm (Kern aus interaction-diagram), f_cd = η_fc · η_t · f_ck / γ_c = {f_cd} N/mm² mit η_fc = {eta_fc}.',
        'hint.sia.not_implemented': 'Nicht berücksichtigt: Näherungsstufe 3 (Gl. 40), Dekompressionsmoment (4.3.3.2.6), Mindestbewehrung.',
        'hint.sia.not_drawn': '{count} Lastpunkte ohne m_Rd sind nicht im Diagramm (siehe Tabelle).',
        'hint.sia.flexure_info': 'Bei mindestens einem Lastpunkt ist der Biegewiderstand überschritten (Hinweis, Ausnutzung trotzdem gerechnet).',
        'hint.en.f_cd': 'f_cd = α_cc · f_ck / γ_c = {alpha} · {f_ck} / {gamma_c} = {f_cd} N/mm².',
        'hint.en.c_rd_c': 'C_Rd,c = {c} / {gamma_c} = {c_rd_c}, k_1 = {k_1}, ν_min nach Gl. (6.3N).',
        'hint.en.side': '{side}: A_sl = {a_s} cm²/m, d = {d} m, b_w = 1000 mm.',
        'hint.en.sigma_limit': 'σ_cp = N_Ed / A_c, Druck begrenzt auf 0,2 f_cd = {limit} N/mm² (ab N_Ed = {n} kN/m).',
        'hint.en.tension': 'Zug: σ_cp negativ in Gl. (6.2.a) und (6.2.b) eingesetzt, V_Rd,c nicht kleiner als 0.',
        'hint.en.a_sl': 'A_sl ist die Zugbewehrung, die mindestens l_bd + d über den betrachteten Querschnitt hinausgeführt wird (6.2.2 (1), Bild 6.3).',
        'hint.loads': '{count} Lastpunkte aus «{name}»: Bemessungswerte, keine Lastfaktoren angewendet.',
        'hint.sign_plaxis': 'Vorzeichen: N in der Datei bei Druck negativ (Plaxis), für den Nachweis umgekehrt (Druck positiv).',
        'hint.sign_positive': 'Vorzeichen: N in der Datei bei Druck positiv, unverändert übernommen.',
        'hint.m_zero': 'Zugseite nach dem Vorzeichen von M; bei M = 0 werden beide Seiten gerechnet, die ungünstigere zählt.',

        // diagram
        'draw.both_sides': 'beide Seiten',
        'draw.curve_sia': 'v_Rd ({sides})',
        'draw.curve_en': 'V_Rd,c ({sides})',
        'draw.hover.nr': 'Nr. {nr} (Zeile {row})',
        'draw.points_ok': 'η ≤ 1 ({count})',
        'draw.points_ok_tension': 'η ≤ 1, Zug ({count})',
        'draw.points_exceeded': 'η > 1 ({count})',
        'draw.points_exceeded_tension': 'η > 1, Zug ({count})',
        'draw.points_unreinforced': 'unbewehrt, kein Nachweis ({count})',
        'draw.points_flexure': 'Biegewiderstand überschritten ({count})',
        'draw.title_sia': 'SIA 262:2025, 4.3.3.2 – {level}',
        'draw.title_en': 'EN 1992-1-1, 6.2.2 (1)',
        'axis.n_en': 'N_Ed [kN/m] (Druck positiv)',
        'axis.v_en': '|V_Ed| [kN/m]',
        'axis.m_ratio': '|m_d| / m_Rd [-]',
        'axis.v_sia': '|v_d| [kN/m]',
    },
    en: {
        'decimal': '.',
        'language.name': 'English',

        // page
        'title': 'Shear check without shear reinforcement',
        'landing.intro': 'Shear resistance of slabs and shells without shear reinforcement, values per metre (b = 1000 mm). The file holds design values N, M, V; the app does not apply load factors.',
        'landing.choose': 'Choose the code',
        'landing.sia': '4.3.3.2, Eq. (35) to (41): approximation level 1, 2 or plastic, m_Rd from the M-N interaction diagram',
        'landing.en': '6.2.2 (1), Eq. (6.2.a) and (6.2.b), recommended values as presets, C_Rd,c and k_1 editable',
        'norm.sia262.label': 'SIA 262:2025',
        'norm.en1992.label': 'EN 1992-1-1 (recommended values as presets)',
        'header.change_norm': 'Change code',
        'footer.source': 'Source code',
        'validation.note': 'Validation status: SIA 262:2025 and EN 1992-1-1:2004 compared in reference cases with hand calculations and a common commercial design program. Details below the results for each code.',
        'validation.note.sia262': 'SIA 262: m_Rd compared with a commercial program (differences documented), ε_v, k_d, v_Rd checked by a hand calculation.',
        'validation.note.en1992': 'EN 1992-1-1: V_Rd,c according to 6.2.2 (1) checked by an independent hand calculation in 6 reference cases (Eq. 6.2.a and 6.2.b; compression, tension, small A_sl, limit σ_cp ≤ 0.2 f_cd, M < 0 with asymmetric reinforcement).',
        'theme.light': 'Light',
        'theme.dark': 'Dark',
        'theme.system': 'System',

        // file
        'file.label': 'Drop a file with N, M, V here or choose one (.xlsx, .xls, .csv):',
        'file.choose': 'Choose file',
        'file.remove': 'Remove load points',
        'file.sheet': 'Sheet:',
        'file.sheet_choose': '– choose a sheet –',
        'file.help': 'Columns in any order, upper or lower case, further columns are not read. Recognised are N: N, Nx, Nx2D, N_Ed, N_d, Normal Force; M: M, M2D, M_Ed, M_d, Moment; V: V, Q, Q2D, V_Ed, V_d, Shear Force. Units kN/m and kNm/m. Decimal point or decimal comma.',
        'file.read': '«{name}» read: {count} load points (columns «{n}», «{m}», «{v}»).',
        'file.choose_sheet': '«{name}» has {count} sheets: please choose one.',
        'file.type': '«{name}»: only .xlsx, .xls or .csv.',
        'paste.summary': 'Paste values',
        'paste.help': 'Paste a table with a head row, e.g. copied from Excel (tab), or separated by ;.',
        'paste.apply': 'Apply',
        'paste.name': 'Pasted values',

        // inputs
        'section.legend': 'Cross-section',
        'section.width': 'b = 1000 mm, values per metre.',
        'section.c_help': 'c: distance from the edge to the centroid of the reinforcement, d = h − c.',
        'example.load': 'Load example',
        'example.loaded': 'Example values loaded –',
        'example.undo': 'Undo',
        'example.note': 'Example values, not from a project',
        'label.h_': 'Height h [m]',
        'side.plus': 'Tension side for M > 0 (e.g. bottom)',
        'side.minus': 'Tension side for M < 0 (e.g. top)',
        'label.a_sp': 'Reinforcement A_s [cm²/m]',
        'label.c_p': 'Axis distance c [m]',
        'label.d_vp': 'Effective depth for shear d_v [m]',
        'label.a_sn': 'Reinforcement A_s [cm²/m]',
        'label.c_n': 'Axis distance c [m]',
        'label.d_vn': 'Effective depth for shear d_v [m]',
        'materials.legend': 'Materials',
        'label.f_ck': 'Concrete f_ck [N/mm²] (up to 50)',
        'label.gamma_c': 'γ_c',
        'label.f_yk': 'Reinforcing steel f_sk [N/mm²]',
        'label.gamma_s': 'γ_s',
        'label.d_max': 'Largest aggregate D_max [mm]',
        'eta_t.label': 'η_t (4.2.1.3) for f_cd and m_Rd, please choose:',
        'eta_t.help': 'Suggestion {suggestion}: shotcrete is usually loaded early. {impact} for impact loading only. τ_cd (Eq. 3) has no η_t.',
        'label.alpha_cc': 'α_cc',
        'label.c_rd_c_gamma': 'C_Rd,c · γ_c',
        'label.k_1': 'k_1',
        'ndp.help': 'Nationally determined parameters (6.2.2 (1), Note). Recommended: C_Rd,c = {c}/γ_c, k_1 = {k_1}.',
        'eps_v.legend': 'Strain ε_v',
        'level.label': 'Approximation level, please choose:',
        'level.level1': 'Level 1, Eq. (38)',
        'level.level2': 'Level 2, Eq. (39), with m_d/m_Rd',
        'level.plastic': 'plastic, Eq. (41) (4.3.3.2.3)',
        'label.curtailed': 'Longitudinal reinforcement curtailed: ε_v × 1.5 (4.3.3.2.4)',
        'loads.legend': 'Load points',
        'label.plaxis': 'Compression negative (Plaxis)',
        'loads.help': 'On: N in the file is negative for compression, the sign is turned. Off: compression positive in the file.',
        'export.csv': 'Export CSV',
        'export.file_name': 'shear-check.csv',
        'placeholder': 'e.g. {value}',
        'placeholder.d_v': 'empty = d',

        // names of the inputs in messages
        'name.h_': 'Height h',
        'name.a_sp': 'A_s (tension side for M > 0)',
        'name.c_p': 'c (tension side for M > 0)',
        'name.d_vp': 'd_v (tension side for M > 0)',
        'name.a_sn': 'A_s (tension side for M < 0)',
        'name.c_n': 'c (tension side for M < 0)',
        'name.d_vn': 'd_v (tension side for M < 0)',
        'name.f_ck': 'f_ck',
        'name.gamma_c': 'γ_c',
        'name.f_yk': 'f_sk',
        'name.gamma_s': 'γ_s',
        'name.d_max': 'D_max',
        'name.alpha_cc': 'α_cc',
        'name.c_rd_c_gamma': 'C_Rd,c · γ_c',
        'name.k_1': 'k_1',

        // messages
        'messages.enter_values': 'Enter the cross-section and the materials, then the diagram appears.',
        'messages.unreinforced': 'No longitudinal reinforcement on the tension side – plain concrete, the check is not part of this app (at least one load point).',
        'messages.no_reinforcement': 'SIA 262: for at least one load point there is no reinforcement on the tension side (A_s = 0). These points are not checked.',
        'check.missing': '{name} is missing.',
        'check.not_a_number': '{name}: «{text}» is not a number.',
        'check.positive': '{name} = {value}: has to be greater than 0.',
        'check.not_negative': '{name} = {value}: must not be negative.',
        'check.below_height': '{name} = {value} m: has to be smaller than the height h = {h} m.',
        'check.d_v_above_d': '{name} = {value} m: must not be greater than d = {d} m.',
        'check.eta_t_missing': 'η_t is missing: please choose {a} / {b} / {c} (SIA 262 4.2.1.3).',
        'check.level_missing': 'Approximation level for ε_v is missing: please choose.',
        'check.norm': '{norm}: {text}',
        'norm.f_ck_max': 'f_ck = {f_ck} N/mm²: only up to {f_ck_max} N/mm² (C50/60) is permitted.',
        'norm.alpha_cc': 'alpha_cc = {alpha_cc}: {low} to {high} is permitted.',
        'norm.eta_t': 'eta_t = {eta_t}: {a} / {b} / {c} is permitted.',
        'norm.eta_t_missing': 'SIA 262: eta_t is missing (4.2.1.3), please choose {a} / {b} / {c}.',
        'core.no_min_eccentricity': '{norm}: no minimum eccentricity, the option is not permitted in this mode.',
        'app.inputs_invalid': 'The input is not permitted.',

        // reading
        'read.ambiguous': 'Column {column} is ambiguous (row {row}): {heads}. Please keep only one of these columns.',
        'read.no_header': 'No head row with N, M and V found in the first {rows} rows.',
        'read.missing': 'Column {missing} is missing. Head row found (row {row}): {heads}.',
        'read.not_a_number': 'Row {row}, column «{column}»: «{text}» is not a number.',
        'read.no_values': 'There are no values below the head row.',
        'read.no_sheet': 'Sheet «{name}» not found.',

        // table
        'side.short.plus': 'tension for M > 0',
        'side.short.minus': 'tension for M < 0',
        'table.nr': 'No.',
        'table.row': 'Row',
        'table.n_en': 'N_Ed [kN/m]',
        'table.m_en': 'M_Ed [kNm/m]',
        'table.v_en': 'V_Ed [kN/m]',
        'table.sigma_cp': 'σ_cp [N/mm²]',
        'table.v_rd_en': 'V_Rd,c [kN/m]',
        'table.n_sia': 'n_d [kN/m] (compression +)',
        'table.m_sia': 'm_d [kNm/m]',
        'table.v_sia': 'v_d [kN/m]',
        'table.m_rd': 'm_Rd [kNm/m]',
        'table.m_ratio': '|m_d|/m_Rd',
        'table.eps_v': 'ε_v [‰]',
        'table.k_d': 'k_d',
        'table.v_rd_sia': 'v_Rd [kN/m]',
        'table.side': 'Side',
        'table.d': 'd [m]',
        'table.utilization': 'Utilization η',
        'table.hint': 'Note',
        'table.sort': 'Sort',
        'note.exceeded': 'shear resistance exceeded',
        'note.unreinforced': 'No longitudinal reinforcement on the tension side – plain concrete, the check is not part of this app',
        'note.no_reinforcement': 'no reinforcement on the tension side (A_s = 0)',
        'note.flexure': 'bending resistance exceeded',
        'note.flexure_info': 'note: bending resistance exceeded (m_d > m_Rd or m_Rd not defined)',
        'note.tension': 'tension (σ_cp < 0)',
        'note.sigma_limited': 'σ_cp limited to 0.2 f_cd',
        'note.at_zero': 'V_Rd,c = 0 (tension)',
        'note.m_zero': 'M = 0: both sides checked, less favourable one',
        'summary.points': '{total} load points.',
        'summary.max': 'Largest utilization η = {value} (no. {nr}).',
        'summary.exceeded': 'Exceeded: {count}.',
        'summary.flexure': 'Bending resistance exceeded: {count}.',
        'summary.no_reinforcement': 'Without reinforcement on the tension side: {count}.',
        'summary.tension': 'In tension: {count}.',

        // hints
        'hint.sia.tau_cd': 'τ_cd = 0.3 · √f_ck / γ_c = 0.3 · √{f_ck} / {gamma_c} = {tau_cd} N/mm² (Eq. 3, without η_t).',
        'hint.sia.k_g': 'k_g = 48 / (16 + D_max · min{1; (60/f_ck)²}) ≥ 1.2 with D_max = {d_max} mm, f_ck = {f_ck}: k_g = {k_g} (Eq. 37).',
        'hint.sia.eps_y': 'f_yd / E_s = {f_yd} / {e_s} = {eps} ‰.',
        'hint.sia.level.level1': 'ε_v after approximation level 1: ε_v = f_yd / E_s (Eq. 38).',
        'hint.sia.level.level2': 'ε_v after approximation level 2: ε_v = f_yd / E_s · m_d / m_Rd (Eq. 39). For m_d > m_Rd or without m_Rd there is no shear utilization.',
        'hint.sia.level.plastic': 'ε_v = 1.5 · f_yd / E_s (Eq. 41, plastic deformation of the flexural reinforcement, 4.3.3.2.3).',
        'hint.sia.curtailed': 'Longitudinal reinforcement curtailed: ε_v increased by 50 % (4.3.3.2.4).',
        'hint.sia.side': '{side}: A_s = {a_s} cm²/m, d = {d} m, d_v = {d_v} m.',
        'hint.sia.m_rd': 'm_Rd(n_d) from the M-N interaction diagram (core of interaction-diagram), f_cd = η_fc · η_t · f_ck / γ_c = {f_cd} N/mm² with η_fc = {eta_fc}.',
        'hint.sia.not_implemented': 'Not taken into account: approximation level 3 (Eq. 40), decompression moment (4.3.3.2.6), minimum reinforcement.',
        'hint.sia.not_drawn': '{count} load points without m_Rd are not in the diagram (see the table).',
        'hint.sia.flexure_info': 'For at least one load point the bending resistance is exceeded (a note, the utilization is calculated nevertheless).',
        'hint.en.f_cd': 'f_cd = α_cc · f_ck / γ_c = {alpha} · {f_ck} / {gamma_c} = {f_cd} N/mm².',
        'hint.en.c_rd_c': 'C_Rd,c = {c} / {gamma_c} = {c_rd_c}, k_1 = {k_1}, ν_min after Eq. (6.3N).',
        'hint.en.side': '{side}: A_sl = {a_s} cm²/m, d = {d} m, b_w = 1000 mm.',
        'hint.en.sigma_limit': 'σ_cp = N_Ed / A_c, compression limited to 0.2 f_cd = {limit} N/mm² (from N_Ed = {n} kN/m).',
        'hint.en.tension': 'Tension: σ_cp negative in Eq. (6.2.a) and (6.2.b), V_Rd,c not less than 0.',
        'hint.en.a_sl': 'A_sl is the tensile reinforcement which extends at least l_bd + d beyond the section considered (6.2.2 (1), Figure 6.3).',
        'hint.loads': '{count} load points from «{name}»: design values, no load factors applied.',
        'hint.sign_plaxis': 'Sign: N in the file negative for compression (Plaxis), turned for the check (compression positive).',
        'hint.sign_positive': 'Sign: N in the file positive for compression, taken as it is.',
        'hint.m_zero': 'Tension side after the sign of M; for M = 0 both sides are checked, the less favourable one governs.',

        // diagram
        'draw.both_sides': 'both sides',
        'draw.curve_sia': 'v_Rd ({sides})',
        'draw.curve_en': 'V_Rd,c ({sides})',
        'draw.hover.nr': 'No. {nr} (row {row})',
        'draw.points_ok': 'η ≤ 1 ({count})',
        'draw.points_ok_tension': 'η ≤ 1, tension ({count})',
        'draw.points_exceeded': 'η > 1 ({count})',
        'draw.points_exceeded_tension': 'η > 1, tension ({count})',
        'draw.points_unreinforced': 'plain, not checked ({count})',
        'draw.points_flexure': 'bending resistance exceeded ({count})',
        'draw.title_sia': 'SIA 262:2025, 4.3.3.2 – {level}',
        'draw.title_en': 'EN 1992-1-1, 6.2.2 (1)',
        'axis.n_en': 'N_Ed [kN/m] (compression positive)',
        'axis.v_en': '|V_Ed| [kN/m]',
        'axis.m_ratio': '|m_d| / m_Rd [-]',
        'axis.v_sia': '|v_d| [kN/m]',
    },
};

/** The languages of the interface, in the order of the switch. */
export const LANGUAGES = Object.keys(TEXTS);

/**
 * Language for a new visitor, from the language of the browser:
 * German for de, de-CH, ..., English for everything else.
 * @param {string | undefined | null} browser_language  navigator.language
 * @returns {string}
 */
export function default_language(browser_language) {
    return /^de\b/i.test(browser_language || '') ? 'de' : 'en';
}

/**
 * Function that gives the text of a key in one language, with helpers
 * for numbers.
 * @typedef {((key: string, params?: Object<string, any>) => string) & {
 *     lang: string,
 *     decimal: string,
 *     num: (x: number | undefined) => string,
 *     fmt: (x: number, digits: number) => string,
 * }} Translator
 */

/**
 * @param {string} lang  a key of TEXTS
 * @returns {Translator}
 */
export function translator(lang) {
    const table = TEXTS[lang];
    if (table === undefined) {
        throw new Error(`i18n: no table for the language «${lang}»`);
    }
    const decimal = table['decimal'];
    /**
     * Number as it was entered, with the decimal sign of the language.
     * @param {number | undefined} x
     * @returns {string}
     */
    const num = (x) => String(x).replace('.', decimal);
    /**
     * Number with a fixed number of decimals.
     * @param {number} x
     * @param {number} digits
     * @returns {string}
     */
    const fmt = (x, digits) => x.toFixed(digits).replace('.', decimal);
    /**
     * @param {string} key
     * @param {Object<string, any>} [params]
     * @returns {string}
     */
    const text = (key, params = {}) => {
        const template = table[key];
        if (template === undefined) {
            throw new Error(`i18n: no text for «${key}» (${lang})`);
        }
        return template.replace(/\{(\w+)\}/g, (match, name) => {
            const value = params[name];
            if (value === undefined) {
                // not a parameter, e.g. min{1; ...} in a formula
                return match;
            }
            if (Array.isArray(value)) {
                // [number, digits]: with a fixed number of decimals
                return fmt(value[0], value[1]);
            }
            return (typeof value === 'number') ? num(value) : String(value);
        });
    };
    return Object.assign(text, { lang: lang, decimal: decimal, num: num, fmt: fmt });
}
