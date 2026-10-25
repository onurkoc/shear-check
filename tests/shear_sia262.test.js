// @ts-check
// Rule tests for SIA 262:2025 4.3.3.2. Only what follows directly from
// the equations; reference values come from tests/reference/cases.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tau_cd, k_g, eps_v, k_d, v_rd } from '../app/shear/sia262.js';

const close = (/** @type {number} */ a, /** @type {number} */ b) =>
    assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), `${a} != ${b}`);

test('tau_cd = 0.3 sqrt(f_ck) / gamma_c (Gl. 3)', () => {
    close(tau_cd(25, 1.5), 0.3 * 5 / 1.5);
});

test('k_g after Gl. (37) with the lower limit 1.2', () => {
    close(k_g(0, 30), 3.0);                     // 48 / 16
    close(k_g(16, 30), 1.5);                    // 48 / 32
    close(k_g(32, 30), 1.2);                    // 48 / 48 = 1.0 -> 1.2
    close(k_g(32, 120), 48 / (16 + 32 * 0.25)); // min{1; (60/120)^2}
});

const f_yd = 500 / 1.15;
const e_s = 200000;

test('eps_v: level 2 with m_d / m_Rd = 1 is level 1', () => {
    close(eps_v('level2', f_yd, e_s, 1, false), eps_v('level1', f_yd, e_s, null, false));
    close(eps_v('level1', f_yd, e_s, null, false), f_yd / e_s);
});

test('eps_v: level 2 is proportional to m_d / m_Rd', () => {
    close(eps_v('level2', f_yd, e_s, 0.4, false), 0.4 * f_yd / e_s);
    assert.equal(eps_v('level2', f_yd, e_s, 0, false), 0);
});

test('eps_v: plastic is 1.5 f_yd / E_s (Gl. 41)', () => {
    close(eps_v('plastic', f_yd, e_s, null, false), 1.5 * f_yd / e_s);
});

test('eps_v: curtailed reinforcement increases eps_v by 50 % (4.3.3.2.4)', () => {
    for (const level of /** @type {const} */ (['level1', 'level2', 'plastic'])) {
        close(eps_v(level, f_yd, e_s, 0.7, true), 1.5 * eps_v(level, f_yd, e_s, 0.7, false));
    }
});

test('eps_v: level 2 without m_d / m_Rd is an error', () => {
    assert.throws(() => eps_v('level2', f_yd, e_s, null, false), RangeError);
});

test('k_d = 1 / (1 + eps_v d k_g), v_Rd = k_d tau_cd d_v', () => {
    close(k_d(0, 250, 1.2), 1);
    close(k_d(0.002, 250, 1.2), 1 / (1 + 0.002 * 250 * 1.2));
    close(v_rd(0.5, 1.0, 250), 125);
});
