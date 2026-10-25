// @ts-check
// Reference cases (tests/reference/cases.json). The expected values come
// from a recognised program; as long as one is null the case is a todo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculate } from '../app/app.js';
import { en1992 } from '../app/norms/en1992.js';
import { sia262 } from '../app/norms/sia262.js';

const cases = JSON.parse(readFileSync(
    new URL('./reference/cases.json', import.meta.url), 'utf-8'));

/**
 * @param {any} input
 * @returns {import('../app/app.js').Params}
 */
function params_of(input) {
    /**
     * @param {number} a_s
     * @param {number} c
     * @param {number | null | undefined} d_v
     */
    const side = (a_s, c, d_v) => ({ a_s: a_s, c: c, d_v: d_v ?? input.h - c });
    return {
        h_: input.h,
        sides: { '+': side(input.a_sp, input.c_p, input.d_vp),
                 '-': side(input.a_sn, input.c_n, input.d_vn) },
        f_ck: input.f_ck, gamma_c: input.gamma_c,
        f_yk: input.f_yk, gamma_s: input.gamma_s, d_max: input.d_max,
        eta_t: input.eta_t, level: input.level, curtailed: input.curtailed,
        alpha_cc: input.alpha_cc, c_rd_c_gamma: input.c_rd_c_gamma, k_1: input.k_1,
    };
}

/**
 * @param {string} label
 * @param {number | null} actual
 * @param {number} expected
 * @param {number} tolerance
 */
function assert_close(label, actual, expected, tolerance) {
    assert.ok(actual !== null, `${label}: no value`);
    assert.ok(Math.abs(actual - expected) <= tolerance * Math.abs(expected),
              `${label}: ${actual} != ${expected}`);
}

const NORMS = /** @type {const} */ ([['en1992', en1992], ['sia262', sia262]]);

for (const [key, norm] of NORMS) {
    for (const c of cases[key]) {
        const name = `${c.id}: ${c.description}`;
        const given = Object.entries(c.expected).filter(([, v]) => v !== null);
        const missing = Object.keys(c.expected).filter(k => c.expected[k] === null);
        if (missing.length > 0) {
            // nothing is calculated for these, so no value of the app is printed
            test(`${name} – ${missing.join(', ')}`, { todo: 'expected values missing' });
        }
        if (given.length === 0) {
            continue;
        }
        test(`${name} – ${given.map(([k]) => k).join(', ')}`, () => {
            const loads = { n: [c.input.n], m: [c.input.m], v: [c.input.v], rows: [1] };
            const [p] = calculate(params_of(c.input), norm, loads).points;
            // m_rd signed like the reference: negative for side n (m < 0)
            const m_rd = (p.sia?.m_rd == null) ? null :
                (p.side === '-' ? -1 : 1) * p.sia.m_rd;
            /** @type {Object<string, number | null>} */
            const actual = {
                v_rd: p.v_rd, utilization: p.utilization,
                // eps_v in per mille, as in cases.json
                m_rd: m_rd, eps_v: (p.sia?.eps_v == null) ? null : p.sia.eps_v * 1000,
                k_d: p.sia?.k_d ?? null,
            };
            for (const [name, expected] of given) {
                assert_close(`${c.id} ${name}`, actual[name], expected, c.tolerance);
            }
        });
    }
}
