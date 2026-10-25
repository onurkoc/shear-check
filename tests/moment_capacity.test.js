// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crossings, m_rd } from '../app/moment_capacity.js';
import { int_diagram } from '../app/core.js';
import { sia262 } from '../app/norms/sia262.js';

test('crossings: interpolated moments where the polyline passes N = n', () => {
    assert.deepEqual(crossings([0, 10, 0], [-2, 0, 2], 1), [5]);
    assert.deepEqual(crossings([0, 10, 0], [-2, 0, 2], 0), [10]);
    assert.deepEqual(crossings([0, 10, 0], [-2, 0, 2], 3), []);
});

/**
 * @param {number} a_s1
 * @param {number} a_s2
 * @returns {import('../app/core.js').Values}
 */
function curve(a_s1, a_s2) {
    const result = int_diagram({ h_: 0.3, b_: 1.0, d_1: 0.05, d_2: 0.05,
                                 a_s1: a_s1, a_s2: a_s2, f_ck: 30, f_yk: 500,
                                 gamma_c: 1.5, gamma_s: 1.15, eta_t: 1.0 }, sia262);
    assert.ok(result !== null);
    return result[1];
}

test('symmetric reinforcement: m_Rd is the same for both signs', () => {
    const values = curve(5.65, 5.65);
    for (const n of [-1.0, -0.3, 0, 0.1]) {
        const plus = m_rd(values, n, '+');
        const minus = m_rd(values, n, '-');
        assert.ok(plus !== null && minus !== null);
        assert.ok(Math.abs(plus - minus) < 1e-9, `n = ${n}`);
    }
});

test('more reinforcement on the tension side gives a larger m_Rd', () => {
    const values = curve(10, 5);
    const plus = m_rd(values, 0, '+');
    const minus = m_rd(values, 0, '-');
    assert.ok(plus !== null && minus !== null && plus > minus);
});

test('normal force outside of the curve: no m_Rd', () => {
    const values = curve(5.65, 5.65);
    // tension larger than (a_s1 + a_s2) f_yd (core.js: tension positive)
    assert.equal(m_rd(values, 1.0, '+'), null);
    // compression larger than the section can carry
    assert.equal(m_rd(values, -100, '-'), null);
});
