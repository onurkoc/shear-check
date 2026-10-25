// @ts-check
/*
Bending resistance m_Rd for a given normal force, from the M-N
interaction curve of core.js (copied from onurkoc/interaction-diagram).

core.js works in MN and MNm with compression negative. Positive moment:
tension on the side of a_s1. Here a_s1 is the tension side for M > 0
('+') and a_s2 the tension side for M < 0 ('-').
*/

/** @typedef {import('./core.js').Values} Values */

/**
 * Moments where a polyline crosses the horizontal line N = n.
 * @param {number[]} moments
 * @param {number[]} forces
 * @param {number} n
 * @returns {number[]}
 */
export function crossings(moments, forces, n) {
    /** @type {number[]} */
    const found = [];
    for (let i = 0; i < forces.length; i++) {
        if (forces[i] === n) {
            found.push(moments[i]);
        }
        if (i + 1 < forces.length) {
            const f0 = forces[i];
            const f1 = forces[i + 1];
            // strictly between the two points; the points themselves are
            // taken above
            if ((f0 < n && n < f1) || (f1 < n && n < f0)) {
                const t = (n - f0) / (f1 - f0);
                found.push(moments[i] + t * (moments[i + 1] - moments[i]));
            }
        }
    }
    return found;
}

/**
 * m_Rd at the normal force n, on the side of the curve with reinforcement
 * that belongs to the sign of the moment.
 * @param {Values} values  from int_diagram
 * @param {number} n  normal force [MN], compression negative (core.js)
 * @param {'+' | '-'} side  '+': M > 0, '-': M < 0
 * @returns {number | null} m_Rd [MNm] as a positive number;
 *     null: n is outside of the curve, or the curve gives no moment of
 *     this sign at n
 */
export function m_rd(values, n, side) {
    if (side === '+') {
        const found = crossings(values['Moment Reinf'], values['Normal Force Reinf'], n);
        const largest = found.length > 0 ? Math.max(...found) : null;
        return (largest !== null && largest > 0) ? largest : null;
    }
    const found = crossings(values['Moment Reinf Neg'], values['Normal Force Reinf Neg'], n);
    const smallest = found.length > 0 ? Math.min(...found) : null;
    return (smallest !== null && smallest < 0) ? -smallest : null;
}
