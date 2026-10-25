// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sides_for, governing, utilization, check_en1992, check_sia262,
         en_curves, sia_curves, en_resistance, sia_resistance } from '../app/check.js';
import { int_diagram } from '../app/core.js';
import { sia262 } from '../app/norms/sia262.js';

/** @typedef {import('../app/check.js').EnSection} EnSection */
/** @typedef {import('../app/check.js').SiaSection} SiaSection */

/**
 * @param {number[][]} points  [n, m, v]
 * @returns {import('../app/check.js').Loads}
 */
function loads(points) {
    return { n: points.map(p => p[0]), m: points.map(p => p[1]),
             v: points.map(p => p[2]), rows: points.map((_, i) => i + 2) };
}

/** @type {EnSection} */
const EN = {
    h: 0.3, f_ck: 30, f_cd: 20, c_rd_c: 0.12, k_1: 0.15,
    sides: { '+': { a_s: 5.65, c: 0.05, d_v: 0 }, '-': { a_s: 2.0, c: 0.07, d_v: 0 } },
};

test('the tension side follows the sign of M, both sides for M = 0', () => {
    assert.deepEqual(sides_for(5), ['+']);
    assert.deepEqual(sides_for(-5), ['-']);
    assert.deepEqual(sides_for(0), ['+', '-']);
});

test('utilization: resistance 0 gives Infinity, or 0 without load', () => {
    assert.equal(utilization(-50, 100), 0.5);
    assert.equal(utilization(10, 0), Infinity);
    assert.equal(utilization(0, 0), 0);
});

test('EN: the side of the sign of M is used', () => {
    const [p, q] = check_en1992(EN, loads([[100, 20, 50], [100, -20, 50]]));
    assert.equal(p.side, '+');
    assert.equal(q.side, '-');
    assert.equal(p.v_rd, en_resistance(EN, 100, '+').v_rd);
    assert.equal(q.v_rd, en_resistance(EN, 100, '-').v_rd);
    assert.equal(p.row, 2);
});

test('EN: M = 0 checks both sides, the less favourable one governs (F8)', () => {
    const [p] = check_en1992(EN, loads([[100, 0, 50]]));
    const plus = en_resistance(EN, 100, '+').v_rd;
    const minus = en_resistance(EN, 100, '-').v_rd;
    assert.equal(p.v_rd, Math.min(plus, minus));
});

test('EN: tension is marked, V_Rd,c is not below 0 (F1)', () => {
    const [p, q] = check_en1992(EN, loads([[-200, 10, 20], [-1e6, 10, 20]]));
    assert.equal(p.tension, true);
    assert.ok(p.v_rd !== null && p.v_rd > 0);
    assert.equal(q.v_rd, 0);
    assert.equal(q.utilization, Infinity);
    assert.equal(q.state, 'exceeded');
});

test('EN: no reinforcement on the tension side is not checked, no curve (A2)', () => {
    const s = { ...EN, sides: { '+': EN.sides['+'], '-': { a_s: 0, c: 0.05, d_v: 0 } } };
    const [p, q, r] = check_en1992(s, loads([[100, -10, 20], [100, 10, 20], [100, 0, 20]]));
    assert.equal(p.state, 'no_reinforcement');
    assert.equal(p.utilization, null);
    assert.notEqual(q.state, 'no_reinforcement');
    // M = 0: the side without reinforcement governs (F8, A7)
    assert.equal(r.state, 'no_reinforcement');
    const curves = en_curves(s, -500, 1500);
    assert.equal(curves.length, 1);
    assert.deepEqual(curves[0].sides, ['+']);
    const none = { ...EN, sides: { '+': { a_s: 0, c: 0.05, d_v: 0 },
                                   '-': { a_s: 0, c: 0.05, d_v: 0 } } };
    assert.equal(en_curves(none, -500, 1500).length, 0);
});

test('governing keeps the worse result, a missing utilization is the worst', () => {
    const a = /** @type {any} */ ({ utilization: 0.5 });
    const b = /** @type {any} */ ({ utilization: 0.8 });
    const c = /** @type {any} */ ({ utilization: null });
    assert.equal(governing([a, b]), b);
    assert.equal(governing([b, c]), c);
});

test('EN curves: one curve for equal sides, two for different sides', () => {
    assert.equal(en_curves(EN, -500, 1500).length, 2);
    const same = { ...EN, sides: { '+': EN.sides['+'], '-': EN.sides['+'] } };
    const curves = en_curves(same, -500, 1500);
    assert.equal(curves.length, 1);
    assert.deepEqual(curves[0].sides, ['+', '-']);
    // the curve has the values of the check
    curves[0].x.forEach((n, i) => {
        assert.equal(curves[0].y[i], en_resistance(same, n, '+').v_rd);
    });
});

/**
 * @param {import('../app/shear/sia262.js').EpsVLevel} level
 * @param {number} a_s_minus
 * @returns {SiaSection}
 */
function sia_section(level, a_s_minus = 5.65) {
    return {
        h: 0.3, f_ck: 30, gamma_c: 1.5, f_yd: 500 / 1.15, e_s: 200000,
        d_max: 32, level: level, curtailed: false,
        sides: { '+': { a_s: 5.65, c: 0.05, d_v: 0.25 },
                 '-': { a_s: a_s_minus, c: 0.05, d_v: 0.25 } },
    };
}

/**
 * @param {SiaSection} s
 * @returns {import('../app/core.js').Values}
 */
function values_of(s) {
    const result = int_diagram({
        h_: s.h, b_: 1.0, d_1: s.sides['+'].c, d_2: s.sides['-'].c,
        a_s1: s.sides['+'].a_s, a_s2: s.sides['-'].a_s, f_ck: s.f_ck, f_yk: 500,
        gamma_c: 1.5, gamma_s: 1.15, eta_t: 1.0 }, sia262);
    assert.ok(result !== null);
    return result[1];
}

test('SIA: no reinforcement on the tension side is an error of the point (F9)', () => {
    const s = sia_section('level1', 0);
    const [p, q] = check_sia262(s, values_of(s), loads([[100, -10, 20], [100, 10, 20]]));
    assert.equal(p.state, 'no_reinforcement');
    assert.equal(p.utilization, null);
    assert.notEqual(q.state, 'no_reinforcement');
});

test('SIA level 2: m_d > m_Rd gives no shear utilization (F6)', () => {
    const s = sia_section('level2');
    const [p] = check_sia262(s, values_of(s), loads([[0, 1000, 20]]));
    assert.equal(p.state, 'flexure');
    assert.equal(p.utilization, null);
    assert.ok(p.sia !== null && p.sia.m_ratio !== null && p.sia.m_ratio > 1);
});

test('SIA level 1: m_d > m_Rd is a note only (F6)', () => {
    const s = sia_section('level1');
    const [p] = check_sia262(s, values_of(s), loads([[0, 1000, 20]]));
    assert.ok(p.state === 'ok' || p.state === 'exceeded');
    assert.ok(p.sia !== null && p.sia.flexure);
    assert.equal(p.v_rd, sia_resistance(s, '+', null).v_rd);
});

test('SIA level 2: v_Rd uses m_d / m_Rd of the point', () => {
    const s = sia_section('level2');
    const [p] = check_sia262(s, values_of(s), loads([[300, 20, 50]]));
    assert.ok(p.sia !== null && p.sia.m_ratio !== null);
    assert.equal(p.v_rd, sia_resistance(s, '+', p.sia.m_ratio).v_rd);
});

test('SIA curves: level 2 from 0 to 1, level 1 a horizontal line', () => {
    const level2 = sia_curves(sia_section('level2'), 1.2);
    assert.equal(level2.length, 1);
    assert.equal(level2[0].x[0], 0);
    assert.equal(level2[0].x[level2[0].x.length - 1], 1);
    const level1 = sia_curves(sia_section('level1'), 1.2);
    assert.deepEqual(level1[0].x, [0, 1.2]);
    assert.equal(level1[0].y[0], level1[0].y[1]);
    const different = sia_section('level2');
    different.sides['-'] = { ...different.sides['-'], d_v: 0.2 };
    assert.equal(sia_curves(different, 1).length, 2);
});
