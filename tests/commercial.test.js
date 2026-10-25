// @ts-check
/*
Comparison with a commercial program (tests/reference/commercial.json), SIA 262.

The commercial program differs from the app (see NOTES.md section 7); the app is not
changed for that. Compared are:
A) the M-N core: m_Rd at a given N, against the commercial program with concrete
   diagram type 2 (parabola-rectangle = the model of the app); at high
   compression with the net concrete section (diagnostic), because the commercial program
   deducts the concrete displaced by the reinforcement and the app not;
B) Gl. (39) with m_Rd of the app;
C) Gl. (35), (36) with the inputs of the commercial program (k_g = 1.0, d back-calculated);
D) the results of the app next to the commercial program, as a diagnostic (no pass/fail).
B and C use the shear values of the commercial run with type 4 (SC, Gl. 27).
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { int_diagram } from '../app/core.js';
import { sia262 } from '../app/norms/sia262.js';
import { m_rd } from '../app/moment_capacity.js';
import { tau_cd, eps_v, k_d, v_rd } from '../app/shear/sia262.js';
import { calculate } from '../app/app.js';
import { curve as net_curve } from './net_section.js';

const ref = JSON.parse(readFileSync(
    new URL('./reference/commercial.json', import.meta.url), 'utf-8'));
const s = ref.section;
const [fall_1, fall_2, fall_3] = ref.cases;

const curve = int_diagram({ h_: s.h, b_: 1.0, d_1: s.c_p, d_2: s.c_n,
                            a_s1: s.a_sp, a_s2: s.a_sn, f_ck: s.f_ck, f_yk: s.f_yk,
                            gamma_c: s.gamma_c, gamma_s: s.gamma_s, eta_t: s.eta_t },
                          sia262);
assert.ok(curve !== null);
const values = curve[1];
const f_yd = s.f_yk / s.gamma_s;
const E_S = sia262.e_steel;

/**
 * m_Rd of the app [kNm/m], signed like the commercial program (negative for side n), at a
 * normal force in kN/m with the sign of the commercial program (compression negative, as
 * core.js).
 * @param {number} n
 * @param {'+' | '-'} side
 * @returns {number}
 */
function app_m_rd(n, side) {
    const m = m_rd(values, n / 1000, side);
    assert.ok(m !== null, `no m_Rd at N = ${n}`);
    return (side === '+' ? 1 : -1) * m * 1000;
}

/**
 * @param {number} actual
 * @param {number} expected
 * @param {number} tolerance  relative
 * @param {string} label
 */
function within_relative(actual, expected, tolerance, label) {
    assert.ok(Math.abs(actual - expected) <= tolerance * Math.abs(expected),
              `${label}: app ${actual.toFixed(3)}, commercial ${expected} ` +
              `(${((actual / expected - 1) * 100).toFixed(2)} %, ±${tolerance * 100} %)`);
}

/**
 * @param {number} actual
 * @param {number} expected
 * @param {number} tolerance  absolute
 * @param {string} label
 */
function within(actual, expected, tolerance, label) {
    assert.ok(Math.abs(actual - expected) <= tolerance,
              `${label}: app ${actual.toFixed(3)}, commercial ${expected} (±${tolerance})`);
}

test('A: m_Rd at N = 0, both sides (commercial type 2: ±63.5)', () => {
    within_relative(app_m_rd(0, '+'), fall_1.commercial_type2.m_rd, ref.tolerance_m_rd, 'm_Rd(0) side p');
    within_relative(app_m_rd(0, '-'), fall_2.commercial_type2.m_rd, ref.tolerance_m_rd, 'm_Rd(0) side n');
});

// Net concrete section (diagnostic, tests/net_section.js): The commercial program deducts
// the concrete displaced by the reinforcement, the app (core.js) does
// not. Below, the diagnostic must first reproduce core.js exactly.
const section_params = { h_: s.h, b_: 1.0, d_1: s.c_p, d_2: s.c_n,
                         a_s1: s.a_sp, a_s2: s.a_sn, f_ck: s.f_ck, f_yk: s.f_yk,
                         gamma_c: s.gamma_c, gamma_s: s.gamma_s, eta_t: s.eta_t };

test('A: diagnostic net section with net = false is the curve of core.js', () => {
    const gross = net_curve(section_params, sia262, false);
    for (const key of /** @type {const} */ (['Moment Reinf', 'Normal Force Reinf',
                                              'Moment Reinf Neg', 'Normal Force Reinf Neg'])) {
        assert.deepEqual(gross[key], values[key], key);
    }
});

// The limit state point of the shear run (-4635.6 / 185.3) lies on the
// steep branch near centric compression; it is kept as information only.
test('A: m_Rd at N = -4600 constant, net section (commercial type 2: ±188.0)', (t) => {
    const point = fall_3.commercial_type2_constant_n;
    const net = net_curve(section_params, sia262, true);
    for (const side of /** @type {const} */ (['+', '-'])) {
        const sign = (side === '+') ? 1 : -1;
        const m_net = m_rd(net, point.n / 1000, side);
        assert.ok(m_net !== null);
        t.diagnostic(`side ${side}: app (gross) ${app_m_rd(point.n, side).toFixed(2)}, ` +
                     `net ${(sign * m_net * 1000).toFixed(2)}, commercial ${sign * point.m_rd}`);
        within_relative(sign * m_net * 1000, sign * point.m_rd, ref.tolerance_m_rd,
                        `m_Rd(-4600) net, side ${side}`);
    }
});

test('B: Gl. (39) with m_Rd of the app: eps_v of Fall 1 and 2 (±0.05 per mille)', () => {
    for (const c of [fall_1, fall_2]) {
        const side = (c.m > 0) ? '+' : '-';
        const eps = eps_v('level2', f_yd, E_S, Math.abs(c.m / app_m_rd(c.n, side)), false);
        within(eps * 1000, c.commercial_sc.eps_v, 0.05, `${c.id} eps_v [per mille]`);
    }
});

test('C: Gl. (35), (36) with the inputs of the commercial program reproduce k_d and v_Rd (±0.5 %)', () => {
    const tau = tau_cd(s.f_ck, s.gamma_c);
    // SIA 262:2013 with D_max = 32: k_g = 48 / (16 + 32) = 1.0, given
    // directly, not through k_g() of SIA 262:2025
    const KG_2013 = 1.0;
    for (const c of ref.cases) {
        const f = c.commercial_sc;
        // d of the commercial program is printed rounded; back-calculated from v_Rd
        const d_mm = f.v_rd / (f.k_d * tau);
        // eps_v with m_Rd of the commercial program (Fall 3: m_Rd at N_Grenz)
        const eps = eps_v('level2', f_yd, E_S, Math.abs(c.m / f.m_rd), false);
        const kd = k_d(eps, d_mm, KG_2013);
        const v = v_rd(kd, tau, d_mm);
        assert.ok(Math.abs(kd / f.k_d - 1) <= 0.005,
                  `${c.id} k_d: app ${kd.toFixed(4)}, commercial ${f.k_d}`);
        assert.ok(Math.abs(v / f.v_rd - 1) <= 0.005,
                  `${c.id} v_Rd: app ${v.toFixed(2)}, commercial ${f.v_rd}`);
    }
});

test('D: results of the app (SIA 262:2025) next to the commercial program, no pass/fail', (t) => {
    const params = {
        h_: s.h,
        sides: { '+': { a_s: s.a_sp, c: s.c_p, d_v: s.h - s.c_p },
                 '-': { a_s: s.a_sn, c: s.c_n, d_v: s.h - s.c_n } },
        f_ck: s.f_ck, gamma_c: s.gamma_c, f_yk: s.f_yk, gamma_s: s.gamma_s,
        d_max: s.d_max, eta_t: s.eta_t, level: /** @type {const} */ ('level2'),
        curtailed: false,
    };
    // the app works with compression positive, the commercial program with compression negative
    const loads = { n: ref.cases.map((/** @type {any} */ c) => -c.n),
                    m: ref.cases.map((/** @type {any} */ c) => c.m),
                    v: ref.cases.map((/** @type {any} */ c) => c.v),
                    rows: [1, 2, 3] };
    const points = calculate(params, sia262, loads).points;
    t.diagnostic('case | m_Rd app (N const.) / commercial type 2 (N_Grenz) / SC | ' +
                 'v_Rd app / commercial (type 2 if given, else SC)');
    ref.cases.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
        const p = points[i];
        const sia = /** @type {any} */ (p.sia);
        const v_commercial = c.commercial_type2.v_rd ?? c.commercial_sc.v_rd;
        const m_commercial = c.commercial_type2.m_rd ?? c.commercial_type2.m_rd_limit;
        t.diagnostic(`${c.id} | ${sia.m_rd.toFixed(2)} / ${m_commercial} / ` +
                     `${c.commercial_sc.m_rd} | ${/** @type {number} */ (p.v_rd).toFixed(1)} / ${v_commercial}`);
    });
    t.diagnostic('causes: k_g 1.2 (2025) vs 1.0 (2013); d 0.25 (h - c) vs 0.18 / 0.30; ' +
                 'Fall 3: m_Rd at constant N vs at N_Grenz');
});
