// @ts-check
// Rule tests for EN 1992-1-1 6.2.2 (1). Only what follows directly from
// the equations; reference values come from tests/reference/cases.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { k_size, rho_l, nu_min, sigma_cp, v_rd_c, B_W } from '../app/shear/en1992.js';
import { en_resistance } from '../app/check.js';

const close = (/** @type {number} */ a, /** @type {number} */ b) =>
    assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), `${a} != ${b}`);

test('k = 1 + sqrt(200 / d) <= 2.0 with d in mm', () => {
    close(k_size(200), 2.0);
    close(k_size(800), 1.5);
    close(k_size(100), 2.0);   // limit
});

test('d in mm: the section in m gives k from d = (h - c) * 1000 (F12)', () => {
    /** @type {import('../app/check.js').EnSection} */
    const s = { h: 0.85, f_ck: 30, f_cd: 20, c_rd_c: 0.12, k_1: 0.15,
                sides: { '+': { a_s: 10, c: 0.05, d_v: 0 },
                         '-': { a_s: 10, c: 0.05, d_v: 0 } } };
    // d = 0.80 m = 800 mm -> k = 1 + sqrt(200 / 800) = 1.5
    close(en_resistance(s, 0, '+').en.k, 1.5);
});

test('rho_l is limited to 0.02', () => {
    close(rho_l(1000, 1000, 200), 0.005);
    close(rho_l(100000, 1000, 200), 0.02);
});

test('nu_min after (6.3N)', () => {
    close(nu_min(2.0, 25), 0.035 * 2 ** 1.5 * 5);
});

test('sigma_cp: compression limited to 0.2 f_cd, tension not limited', () => {
    assert.deepEqual(sigma_cp(1e6, 1e6, 20), { sigma_cp: 1, limited: false });
    assert.deepEqual(sigma_cp(1e7, 1e6, 20), { sigma_cp: 4, limited: true });
    assert.deepEqual(sigma_cp(-1e7, 1e6, 20), { sigma_cp: -10, limited: false });
});

const base = { d_mm: 250, a_sl_mm2: 565, f_ck: 30, c_rd_c: 0.12, k_1: 0.15 };

test('the term k_1 sigma_cp adds k_1 * delta_sigma * b_w * d', () => {
    const a = v_rd_c({ ...base, sigma_cp: 0 });
    const b = v_rd_c({ ...base, sigma_cp: 1 });
    close(b.v_rd_c - a.v_rd_c, 0.15 * 1 * B_W * 250);
});

test('small A_sl: (6.2.b) governs, V_Rd,c = nu_min b_w d', () => {
    // A_sl = 50 mm2/m: (6.2.a) gives a smaller value than (6.2.b)
    const r = v_rd_c({ ...base, a_sl_mm2: 50, sigma_cp: 0 });
    assert.equal(r.governing, '6.2.b');
    close(r.v_rd_c, r.nu_min * B_W * 250);
});

test('tension: sigma_cp negative in both equations, V_Rd,c not below 0 (F1)', () => {
    const small = v_rd_c({ ...base, sigma_cp: -0.5 });
    const zero = v_rd_c({ ...base, sigma_cp: 0 });
    assert.ok(small.v_rd_c < zero.v_rd_c);
    assert.equal(small.at_zero, false);
    const large = v_rd_c({ ...base, sigma_cp: -100 });
    assert.equal(large.v_rd_c, 0);
    assert.equal(large.at_zero, true);
});
