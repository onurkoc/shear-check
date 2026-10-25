// @ts-check
/*
Shear check of all load points, and the resistance curves of the diagram.

Load values are design values per metre (kN/m, kNm/m); no load factor
is applied. N is positive for compression here (EN 1992-1-1 6.2.2 (1));
the sign of a Plaxis file is turned in app.js.

The tension side follows the sign of M: '+' for M > 0, '-' for M < 0.
For M = 0 both sides are checked and the less favourable one governs
(decision F8).
*/

import { B_W, sigma_cp, v_rd_c } from './shear/en1992.js';
import { tau_cd, k_g, eps_v, k_d, v_rd } from './shear/sia262.js';
import { m_rd } from './moment_capacity.js';

/** @typedef {import('./core.js').Values} Values */
/** @typedef {import('./shear/sia262.js').EpsVLevel} EpsVLevel */

/** @typedef {'+' | '-'} SideKey */

/**
 * Reinforcement of one side, the tension side for one sign of M.
 * @typedef {Object} Side
 * @property {number} a_s  [cm2/m]
 * @property {number} c  axis distance of the reinforcement from the edge [m];
 *     0 only for EN without reinforcement and without input: d = h (A2)
 * @property {number} d_v  effective depth for shear [m], SIA only
 *     (default d, decision F7); not used for EN
 */

/**
 * @typedef {Object} EnSection
 * @property {number} h  [m]
 * @property {number} f_ck  [N/mm2]
 * @property {number} f_cd  [N/mm2]
 * @property {number} c_rd_c
 * @property {number} k_1
 * @property {{'+': Side, '-': Side}} sides
 */

/**
 * @typedef {Object} SiaSection
 * @property {number} h  [m]
 * @property {number} f_ck  [N/mm2]
 * @property {number} gamma_c
 * @property {number} f_yd  [N/mm2]
 * @property {number} e_s  [N/mm2]
 * @property {number} d_max  [mm]
 * @property {EpsVLevel} level
 * @property {boolean} curtailed  longitudinal reinforcement curtailed
 *     (4.3.3.2.4)
 * @property {{'+': Side, '-': Side}} sides
 */

/**
 * Load points, design values per metre.
 * @typedef {Object} Loads
 * @property {number[]} n  [kN/m], compression positive
 * @property {number[]} m  [kNm/m]
 * @property {number[]} v  [kN/m]
 * @property {number[]} rows  row of each point in the file (as in Excel)
 */

/**
 * @typedef {Object} EnDetails
 * @property {number} sigma_cp  [N/mm2], as used
 * @property {boolean} limited  sigma_cp limited to 0.2 f_cd
 * @property {'6.2.a' | '6.2.b'} governing
 * @property {boolean} at_zero  V_Rd,c set to 0 (tension, decision F1)
 * @property {number} k
 * @property {number} rho_l
 * @property {number} nu_min  [N/mm2]
 */

/**
 * @typedef {Object} SiaDetails
 * @property {number | null} m_rd  [kNm/m], null: not defined
 * @property {number | null} m_ratio  |m_d| / m_Rd, null: not defined
 * @property {boolean} flexure  m_d / m_Rd > 1 or m_Rd not defined
 * @property {number | null} eps_v
 * @property {number | null} k_d
 * @property {number} d_v  [m]
 */

/**
 * State of a point.
 * ok / exceeded: utilization <= 1 / > 1.
 * flexure: SIA level 2, bending resistance exceeded or not defined, no
 *     shear utilization (decision F6).
 * no_reinforcement: no reinforcement on the tension side, not checked
 *     (SIA: F9; EN: plain concrete, A2).
 * @typedef {'ok' | 'exceeded' | 'flexure' | 'no_reinforcement'} PointState
 */

/**
 * Result of one load point.
 * @typedef {Object} PointResult
 * @property {number} nr  number of the point, 1, 2, ...
 * @property {number} row  row in the file
 * @property {number} n  N_Ed [kN/m], compression positive
 * @property {number} m  M_Ed [kNm/m]
 * @property {number} v  V_Ed [kN/m]
 * @property {SideKey} side  the tension side that governs
 * @property {number} d  effective depth used, h - c [m]
 * @property {boolean} tension  N_Ed < 0
 * @property {number | null} v_rd  [kN/m]
 * @property {number | null} utilization  |V_Ed| / V_Rd, null: not defined
 * @property {PointState} state
 * @property {EnDetails | null} en
 * @property {SiaDetails | null} sia
 */

/**
 * |v| / v_rd. A resistance of 0 gives Infinity, or 0 if v = 0.
 * @param {number} v
 * @param {number} resistance
 * @returns {number}
 */
export function utilization(v, resistance) {
    if (resistance > 0) {
        return Math.abs(v) / resistance;
    }
    return (v === 0) ? 0 : Infinity;
}

/**
 * The sides to check for a moment.
 * @param {number} m
 * @returns {SideKey[]}
 */
export function sides_for(m) {
    if (m > 0) {
        return ['+'];
    }
    if (m < 0) {
        return ['-'];
    }
    return ['+', '-'];
}

/**
 * How unfavourable a result is: a point without utilization is the worst.
 * @param {PointResult} p
 * @returns {number}
 */
function severity(p) {
    return (p.utilization === null) ? Infinity : p.utilization;
}

/**
 * The less favourable of the results of the sides (decision F8).
 * With the same value the first side is kept.
 * @param {PointResult[]} results
 * @returns {PointResult}
 */
export function governing(results) {
    let worst = results[0];
    for (const result of results.slice(1)) {
        if (severity(result) > severity(worst)) {
            worst = result;
        }
    }
    return worst;
}

/**
 * Effective depth of a side [m].
 * @param {number} h
 * @param {Side} side
 * @returns {number}
 */
export function depth(h, side) {
    return h - side.c;
}

/**
 * EN 1992-1-1: one point, one side.
 * @param {EnSection} s
 * @param {number} n  [kN/m], compression positive
 * @param {SideKey} key
 * @returns {{v_rd: number, en: EnDetails}}
 */
export function en_resistance(s, n, key) {
    const side = s.sides[key];
    const d_mm = depth(s.h, side) * 1000;
    const a_c = B_W * s.h * 1000;                      // [mm2]
    // kN/m on a width of 1 m: kN, times 1000: N
    const sigma = sigma_cp(n * 1000, a_c, s.f_cd);
    const r = v_rd_c({ d_mm: d_mm, a_sl_mm2: side.a_s * 100, f_ck: s.f_ck,
                       sigma_cp: sigma.sigma_cp, c_rd_c: s.c_rd_c, k_1: s.k_1 });
    return {
        v_rd: r.v_rd_c / 1000,                         // N per metre -> kN/m
        en: { sigma_cp: sigma.sigma_cp, limited: sigma.limited,
              governing: r.governing, at_zero: r.at_zero,
              k: r.k, rho_l: r.rho_l, nu_min: r.nu_min },
    };
}

/**
 * EN 1992-1-1 6.2.2 (1) for all load points.
 * @param {EnSection} s
 * @param {Loads} loads
 * @returns {PointResult[]}
 */
export function check_en1992(s, loads) {
    return loads.n.map((n, i) => {
        const m = loads.m[i];
        const v = loads.v[i];
        const results = sides_for(m).map(key => {
            if (s.sides[key].a_s <= 0) {
                // no longitudinal reinforcement on the tension side: plain
                // concrete, 6.2.2 does not apply, no check (decision A2)
                return /** @type {PointResult} */ ({
                    nr: i + 1, row: loads.rows[i], n: n, m: m, v: v, side: key,
                    d: depth(s.h, s.sides[key]),
                    tension: n < 0, v_rd: null, utilization: null,
                    state: 'no_reinforcement', en: null, sia: null,
                });
            }
            const { v_rd, en } = en_resistance(s, n, key);
            const u = utilization(v, v_rd);
            return /** @type {PointResult} */ ({
                nr: i + 1, row: loads.rows[i], n: n, m: m, v: v, side: key,
                d: depth(s.h, s.sides[key]),
                tension: n < 0, v_rd: v_rd, utilization: u,
                state: (u > 1) ? 'exceeded' : 'ok', en: en, sia: null,
            });
        });
        return governing(results);
    });
}

/**
 * SIA 262: v_Rd of one side for a given m_d / m_Rd.
 * @param {SiaSection} s
 * @param {SideKey} key
 * @param {number | null} m_ratio  only used for level 2
 * @returns {{v_rd: number, eps_v: number, k_d: number}}
 */
export function sia_resistance(s, key, m_ratio) {
    const side = s.sides[key];
    const d_mm = depth(s.h, side) * 1000;
    const eps = eps_v(s.level, s.f_yd, s.e_s, m_ratio, s.curtailed);
    const kd = k_d(eps, d_mm, k_g(s.d_max, s.f_ck));
    return { v_rd: v_rd(kd, tau_cd(s.f_ck, s.gamma_c), side.d_v * 1000),
             eps_v: eps, k_d: kd };
}

/**
 * SIA 262:2025 4.3.3.2 for all load points.
 * @param {SiaSection} s
 * @param {Values} values  M-N curve of the section (core.js, int_diagram)
 * @param {Loads} loads
 * @returns {PointResult[]}
 */
export function check_sia262(s, values, loads) {
    return loads.n.map((n, i) => {
        const m = loads.m[i];
        const v = loads.v[i];
        const results = sides_for(m).map(key => {
            const side = s.sides[key];
            /** @type {PointResult} */
            const p = {
                nr: i + 1, row: loads.rows[i], n: n, m: m, v: v, side: key,
                d: depth(s.h, side),
                tension: n < 0, v_rd: null, utilization: null,
                state: 'no_reinforcement', en: null,
                sia: { m_rd: null, m_ratio: null, flexure: false,
                       eps_v: null, k_d: null, d_v: side.d_v },
            };
            const sia = /** @type {SiaDetails} */ (p.sia);
            if (side.a_s <= 0) {
                // decision F9: reinforcement on the tension side required
                return p;
            }
            // core.js: MN, compression negative
            const capacity = m_rd(values, -n / 1000, key);
            sia.m_rd = (capacity === null) ? null : capacity * 1000;
            sia.m_ratio = (sia.m_rd === null) ? null : Math.abs(m) / sia.m_rd;
            sia.flexure = sia.m_ratio === null || sia.m_ratio > 1;
            if (s.level === 'level2' && sia.flexure) {
                // decision F6: no shear utilization, nothing is capped
                p.state = 'flexure';
                return p;
            }
            const r = sia_resistance(s, key, sia.m_ratio);
            sia.eps_v = r.eps_v;
            sia.k_d = r.k_d;
            p.v_rd = r.v_rd;
            p.utilization = utilization(v, r.v_rd);
            p.state = (p.utilization > 1) ? 'exceeded' : 'ok';
            return p;
        });
        return governing(results);
    });
}

/**
 * Largest utilization of the points that have one.
 * @param {PointResult[]} points
 * @returns {number | null}
 */
export function max_utilization(points) {
    let largest = null;
    for (const p of points) {
        if (p.utilization !== null && (largest === null || p.utilization > largest)) {
            largest = p.utilization;
        }
    }
    return largest;
}

/**
 * A resistance curve of the diagram, for one or both sides.
 * @typedef {Object} Curve
 * @property {SideKey[]} sides  ['+', '-'] if both sides are the same
 * @property {number[]} x
 * @property {number[]} y
 */

/**
 * Are the two sides the same for the curve?
 * EN: same d and A_sl. SIA: same d and d_v (decision F7).
 * @param {{'+': Side, '-': Side}} sides
 * @param {boolean} with_a_s  compare A_s too (EN)
 * @returns {boolean}
 */
export function same_sides(sides, with_a_s) {
    const a = sides['+'];
    const b = sides['-'];
    if (with_a_s) {
        return a.c === b.c && a.a_s === b.a_s;
    }
    return a.c === b.c && a.d_v === b.d_v;
}

/**
 * EN 1992-1-1: V_Rd,c over N_Ed [kN/m]. The line is straight between the
 * limit 0.2 f_cd and the point where it reaches 0, so these points and
 * the ends are enough. Sides without reinforcement have no curve.
 * @param {EnSection} s
 * @param {number} n_low  [kN/m]
 * @param {number} n_high  [kN/m]
 * @returns {Curve[]}
 */
export function en_curves(s, n_low, n_high) {
    const all = same_sides(s.sides, true) ?
        [/** @type {SideKey[]} */ (['+', '-'])] :
        [/** @type {SideKey[]} */ (['+']), /** @type {SideKey[]} */ (['-'])];
    // no curve for a side without reinforcement (plain concrete, A2)
    const keys = all.filter(sides => s.sides[sides[0]].a_s > 0);
    const a_c = B_W * s.h * 1000;
    // N at sigma_cp = 0.2 f_cd [kN/m]
    const n_limit = 0.2 * s.f_cd * a_c / 1000;
    return keys.map(sides => {
        const key = sides[0];
        // V_Rd,c = (base + k_1 sigma_cp) b_w d: zero at sigma_cp = -base / k_1
        const at_0 = en_resistance(s, 0, key);
        const d_mm = depth(s.h, s.sides[key]) * 1000;
        const base = at_0.v_rd * 1000 / (B_W * d_mm);
        const n_zero = -base / s.k_1 * a_c / 1000;
        const x = [n_low, n_high, n_limit, n_zero, 0]
            .filter(n => n >= n_low && n <= n_high);
        const unique = [...new Set(x)].sort((a, b) => a - b);
        return { sides: sides, x: unique,
                 y: unique.map(n => en_resistance(s, n, key).v_rd) };
    });
}

/**
 * SIA 262: v_Rd over |m_d| / m_Rd. Level 2: a curve from 0 to 1;
 * level 1 and plastic: a horizontal line from 0 to x_max.
 * @param {SiaSection} s
 * @param {number} x_max
 * @returns {Curve[]}
 */
export function sia_curves(s, x_max) {
    const keys = same_sides(s.sides, false) ?
        [/** @type {SideKey[]} */ (['+', '-'])] :
        [/** @type {SideKey[]} */ (['+']), /** @type {SideKey[]} */ (['-'])];
    return keys.map(sides => {
        const key = sides[0];
        /** @type {number[]} */
        let x;
        if (s.level === 'level2') {
            x = Array.from({ length: 101 }, (_, i) => i / 100);
        } else {
            x = [0, x_max];
        }
        return { sides: sides, x: x,
                 y: x.map(ratio => sia_resistance(s, key, ratio).v_rd) };
    });
}
