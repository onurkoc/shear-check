// @ts-check
/*
Diagnostic only (tests, not the app): M-N curve with the net concrete
section, i.e. the concrete displaced by the reinforcement is deducted.

It repeats one_side() of app/core.js for the curve with reinforcement
(same strain planes, same concrete force) and adds at each reinforcement
layer in the compression zone the force -sigma_c(eps) * A_s. With
net = false it must give exactly the curve of core.js (checked in the
test). app/core.js itself is not changed.
*/
import { concrete_force } from '../app/core.js';
import { strain_planes } from '../app/strain_planes.js';

/** @typedef {import('../app/norms/en1992.js').Norm} Norm */
/** @typedef {import('../app/core.js').Values} Values */

/**
 * Like math.copysign(1, x).
 * @param {number} x
 * @returns {number}
 */
function sign(x) {
    return (x < 0 || Object.is(x, -0)) ? -1 : 1;
}

/**
 * Concrete stress of the parabola-rectangle of core.js [N/mm2],
 * compression negative, no tensile strength.
 * @param {number} eps  strain, compression negative
 * @param {number} f_cd
 * @param {number} eps_c1
 * @returns {number}
 */
export function concrete_stress(eps, f_cd, eps_c1) {
    if (eps >= 0) {
        return 0;
    }
    if (eps <= -eps_c1) {
        return -f_cd;
    }
    const k1 = 2 / eps_c1;
    const k2 = 1 / eps_c1 ** 2;
    return f_cd * (k1 * eps + k2 * eps ** 2);
}

/**
 * One side of the curve with reinforcement (a_s1 in tension).
 * @param {number[]} epsilon_c
 * @param {number[]} epsilon_s1
 * @param {{h_: number, b_: number, d_1: number, d_2: number, a_s1: number,
 *          a_s2: number, f_cd: number, f_yd: number, e_steel: number,
 *          eps_c1: number}} s
 * @param {boolean} net  deduct the concrete displaced by the reinforcement
 * @returns {{moment: number[], n_force: number[]}}
 */
function one_side(epsilon_c, epsilon_s1, s, net) {
    const { h_, b_, d_1, d_2, a_s1, a_s2, f_cd, f_yd, e_steel, eps_c1 } = s;
    const d = h_ - d_1;
    /** @type {number[]} */
    const moment = [];
    /** @type {number[]} */
    const n_force = [];
    for (let i = 0; i < epsilon_c.length; i++) {
        const x = epsilon_s1[i];
        const y = epsilon_c[i];
        const [f_c, m_c] = concrete_force(y, x, d, h_, b_, f_cd, eps_c1);
        const e_ausm = (m_c === 0 || f_c === 0) ? h_ / 2 : h_ / 2 - m_c / f_c;
        const eps_s2 = y - (y - x) / d * d_2;
        const f_s2 = sign(eps_s2) * Math.min(e_steel * Math.abs(eps_s2), f_yd) * a_s2 / 10000;
        const f_s1 = sign(x) * Math.min(e_steel * Math.abs(x), f_yd) * a_s1 / 10000;
        let m = f_s1 * (h_ / 2 - d_1) - f_s2 * (h_ / 2 - d_2) - f_c * e_ausm;
        let n = f_s2 + f_s1 + f_c;
        if (net) {
            // displaced concrete: -sigma_c * A_s at each layer [MN]
            const g_1 = -concrete_stress(x, f_cd, eps_c1) * a_s1 / 10000;
            const g_2 = -concrete_stress(eps_s2, f_cd, eps_c1) * a_s2 / 10000;
            m += g_1 * (h_ / 2 - d_1) - g_2 * (h_ / 2 - d_2);
            n += g_1 + g_2;
        }
        moment.push(m);
        n_force.push(n);
    }
    return { moment, n_force };
}

/**
 * Curve with reinforcement for both sides, as the 'Reinf' entries of
 * Values in core.js.
 * @param {{h_: number, b_: number, d_1: number, d_2: number, a_s1: number,
 *          a_s2: number, f_ck: number, f_yk: number, gamma_c: number,
 *          gamma_s: number, eta_t: number}} p
 * @param {Norm} norm
 * @param {boolean} net
 * @returns {Values}
 */
export function curve(p, norm, net) {
    const np = { f_ck: p.f_ck, f_yk: p.f_yk, gamma_c: p.gamma_c,
                 gamma_s: p.gamma_s, eta_t: p.eta_t };
    const f_cd = norm.f_cd(np);
    const f_yd = norm.f_yd(np);
    const common = { h_: p.h_, b_: p.b_, f_cd, f_yd, e_steel: norm.e_steel,
                     eps_c1: norm.eps_c1 };
    const [ec, es1] = strain_planes(norm, { h_: p.h_, d: p.h_ - p.d_1, d_2: p.d_2, f_yd });
    const pos = one_side(ec, es1, { ...common, d_1: p.d_1, d_2: p.d_2,
                                    a_s1: p.a_s1, a_s2: p.a_s2 }, net);
    const [ec_n, es2] = strain_planes(norm, { h_: p.h_, d: p.h_ - p.d_2, d_2: p.d_1, f_yd });
    const neg = one_side(ec_n, es2, { ...common, d_1: p.d_2, d_2: p.d_1,
                                      a_s1: p.a_s2, a_s2: p.a_s1 }, net);
    return {
        'Moment': [], 'Moment Neg': [], 'Normal Force': [], 'Normal Force Neg': [],
        'Moment Reinf': pos.moment,
        'Normal Force Reinf': pos.n_force,
        'Moment Reinf Neg': neg.moment.map(m => -m),
        'Normal Force Reinf Neg': neg.n_force,
    };
}
