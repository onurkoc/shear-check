# shear-check

Shear check of slabs and shells **without shear reinforcement**, values
per metre (b = 1000 mm), after

- **SIA 262:2025**, 4.3.3.2.1 to 4.3.3.2.4, Eq. (35) to (39) and (41),
  τ_cd after Eq. (3), m_Rd(N) from the M-N interaction diagram;
- **EN 1992-1-1**, 6.2.2 (1), Eq. (6.2.a), (6.2.b), (6.3N), recommended
  values as presets, C_Rd,c and k_1 editable.

A static web app: plain JavaScript (ES modules), no framework, no build
step, no server. Planned address: <https://shear.onurkoc.net>.

**Validation:** checked by automatic tests. Reference cases are
collected in `tests/reference/cases.json`:

- **SIA 262:** m_Rd compared with a commercial program (differences
  documented), ε_v, k_d, v_Rd and the utilization checked by a hand
  calculation (Excel, with m_Rd from the commercial program), cases
  SIA-1..6, tolerance 0.5 %.
- **EN 1992-1-1:** V_Rd,c and the utilization checked by an independent
  hand calculation (Excel), cases EN-1..6, Eq. (6.2.a) and (6.2.b),
  tolerance 0.5 %.

SIA 262, partial comparison with a commercial program
(`tests/commercial.test.js`, details in [NOTES.md](NOTES.md) section 7).
The commercial program differs from the app:
SIA 262:2013 (k_g without the lower limit 1.2, η_fc with 30/f_ck),
d ≠ h − c in the shear check, m_Rd with a proportionally increased N,
and by default the concrete curve of Eq. (27). Therefore only the M-N
core (with the concrete diagram type 2 of the commercial program = parabola-rectangle as in
the app), Eq. (39) and the building blocks Eq. (35), (36) are compared:

- m_Rd: agrees within 0.5 % (N = 0 and the cases SIA-1..6). At high
  compression (N = −4600 kN/m) the commercial program deducts the concrete displaced by
  the reinforcement (net section) and the app does not (gross): +0.72 %;
  with the net section (diagnostic in the tests only) −0.26 %.
- Eq. (39) and Eq. (35), (36) with the inputs of the commercial program: agree (≤ 0.5 %).
- Case 3 (d = h): v_Rd of the commercial program is on the unsafe side compared with the
  app.
- v_Rd of the app, also for N ≠ 0, is checked by the hand calculation
  above (m_Rd at constant N).

## Use

1. Choose the code on the first page.
2. Enter the cross-section and the materials.

   | Input | Unit | Note |
   | --- | --- | --- |
   | h | m | height; b = 1000 mm is fixed |
   | A_s, c (tension side for M > 0) | cm²/m, m | c: edge to centroid of the reinforcement, d = h − c |
   | A_s, c (tension side for M < 0) | cm²/m, m | |
   | d_v (SIA) | m | per side, empty = d |
   | f_ck | N/mm² | up to 50 |
   | γ_c | – | preset with the value of the code |
   | f_sk, γ_s, D_max (SIA) | N/mm², –, mm | |
   | η_t (SIA) | – | 0.85 / 1.0 / 1.2 has to be chosen; used for f_cd of m_Rd only, not for τ_cd |
   | approximation level (SIA) | – | level 1 (Eq. 38), level 2 (Eq. 39), plastic (Eq. 41); option «curtailed» (×1.5, 4.3.3.2.4) |
   | α_cc, C_Rd,c · γ_c, k_1 (EN) | – | presets 1.0, 0.18, 0.15 |

3. Load the file (.xlsx, .xls, .csv) or paste the values.
4. Diagram, table with the utilization of every point, largest
   utilization, CSV export.

### File

- The file holds **design values** N [kN/m], M [kNm/m], V [kN/m]. The app
  applies **no load factors**.
- Columns in any order, upper or lower case; further columns (X, Y,
  Element, Node, …) are ignored. The head row is searched in the first
  20 rows. A workbook with several sheets asks for the sheet.
- Column heads are compared after removing units in [] or (), blanks and
  `_`, with exact names only:
  N: `n`, `nx`, `nx2d`, `ned`, `nd`, `normalforce`;
  M: `m`, `m2d`, `med`, `md`, `moment`;
  V: `v`, `q`, `q2d`, `ved`, `vd`, `shearforce`.
- Decimal point or decimal comma.
- Switch «Compression negative (Plaxis)», on by default: the sign of N is
  turned (compression positive for the check), it is not taken as an
  absolute value.

### What the app does

- The tension side follows the sign of M; for M = 0 both sides are
  checked and the less favourable one governs.
- EN: σ_cp = N_Ed/A_c, compression limited to 0.2 f_cd; tension enters
  (6.2.a) and (6.2.b) with its sign, V_Rd,c is not less than 0. Points in
  tension are marked.
- SIA level 2: for m_d > m_Rd, or without m_Rd at this normal force,
  there is no shear utilization («bending resistance exceeded»).
- Without longitudinal reinforcement on the tension side (A_s = 0) the
  section is plain concrete: no check, the point is marked red (all
  codes). c > 0 is always required; the table shows the d that was used.

## Anwendungsgrenzen / Limits of application

Not implemented, the user has to check these separately:

- SIA 262: approximation level 3 (Eq. 40); decompression moment
  (4.3.3.2.6); minimum reinforcement; principal shear direction deviating
  from the reinforcement (4.3.3.2.5); concentrated loads near supports
  (4.3.3.2.8).
- EN 1992-1-1: loads near supports and the upper limit of V_Ed,
  6.2.2 (6) with Eq. (6.5); prestressed members uncracked in bending,
  6.2.2 (2); members uncracked in bending, 6.2.2 (4) / 12.6.3.
- Unbewehrter Beton (EN 1992-1-1:2004 Kap. 12, :2023 Kap. 14) nicht
  enthalten – vorgesehen als eigene App. / Plain concrete (EN 1992-1-1:2004
  Section 12, :2023 Section 14) is not included – planned as a separate
  app.
- Values per metre only (b = 1000 mm); f_ck up to 50 N/mm².
- SIA 262, m_Rd: concrete as parabola-rectangle (parabola with
  k_σ = 2 up to 2 ‰, constant up to 3.5 ‰), permitted as a simplified
  stress distribution (4.2.1.5); the curve of Eq. (27) (4.2.1.6) gives
  about 1.4–1.6 % more m_Rd (compared with the commercial program). Reinforcing steel
  ideally plastic up to 12 ‰. Gross concrete section: the concrete
  displaced by the reinforcement is not deducted; the difference grows
  with the compression (about 0.7 % of m_Rd at N = −4600 kN/m for
  h = 0.30 m, A_s = 5.65 cm²/m on each side).

Details, decisions and open points: [NOTES.md](NOTES.md).

## Running it locally

The folder `app/` is the complete app. It has to be opened through a web
server. On Windows, double-click `start.cmd` (runs `serve.py`, Python 3
standard library only, <http://localhost:8000/>). With Node.js:

```sh
npx http-server app -c-1
```

## Tests

```sh
node --test
npx -p typescript tsc --noEmit -p jsconfig.json
```

## Origin

The cross-section core for m_Rd (`app/core.js`, `app/strain_planes.js`,
`app/norms/`) is a copy of
[onurkoc/interaction-diagram](https://github.com/onurkoc/interaction-diagram),
commit `eca638d`, unchanged.

Libraries in `app/vendor/` (stored locally, no CDN): plotly.js basic
4.1.2 (MIT), SheetJS Community Edition 0.20.3 (Apache-2.0).

## License

MIT, see [LICENSE](LICENSE).
