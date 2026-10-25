// @ts-check
/*
Shear resistance of members without shear reinforcement
EN 1992-1-1 6.2.2 (1), Gl. (6.2.a), (6.2.b), (6.3N)
Clause numbers refer to EN 1992-1-1:2004 + AC:2010 + A1:2014.

Units inside this file are the units of the clause: N, mm, N/mm2.
Values per metre: b_w = 1000 mm (decision F11).
*/

// width of the section [mm], values per metre (F11)
export const B_W = 1000;

// Nationally determined parameters, recommended values (6.2.2 (1), Anmerkung).
// C_Rd,c = c_rd_c_gamma / gamma_c, so the user edits the numerator 0.18.
export const EN_SHEAR_DEFAULTS = { c_rd_c_gamma: 0.18, k_1: 0.15 };

/**
 * k = 1 + sqrt(200 / d) <= 2.0, d in mm (6.2.2 (1))
 * @param {number} d_mm  effective depth [mm]
 * @returns {number}
 */
export function k_size(d_mm) {
    return Math.min(1 + Math.sqrt(200 / d_mm), 2.0);
}

/**
 * rho_l = A_sl / (b_w d) <= 0.02 (6.2.2 (1))
 * @param {number} a_sl_mm2  tension reinforcement [mm2]
 * @param {number} b_w_mm  [mm]
 * @param {number} d_mm  [mm]
 * @returns {number}
 */
export function rho_l(a_sl_mm2, b_w_mm, d_mm) {
    return Math.min(a_sl_mm2 / (b_w_mm * d_mm), 0.02);
}

/**
 * nu_min = 0.035 k^(3/2) f_ck^(1/2), Gl. (6.3N)
 * @param {number} k
 * @param {number} f_ck  [N/mm2]
 * @returns {number} [N/mm2]
 */
export function nu_min(k, f_ck) {
    return 0.035 * k ** 1.5 * Math.sqrt(f_ck);
}

/**
 * sigma_cp = N_Ed / A_c < 0.2 f_cd (6.2.2 (1)), N_Ed > 0 for compression.
 * Compression is limited to 0.2 f_cd. Tension stays negative and is not
 * limited (decision F1).
 * @param {number} n_ed  [N], compression positive
 * @param {number} a_c  [mm2]
 * @param {number} f_cd  [N/mm2]
 * @returns {{sigma_cp: number, limited: boolean}}
 */
export function sigma_cp(n_ed, a_c, f_cd) {
    const sigma = n_ed / a_c;
    const limit = 0.2 * f_cd;
    if (sigma > limit) {
        return { sigma_cp: limit, limited: true };
    }
    return { sigma_cp: sigma, limited: false };
}

/**
 * @typedef {Object} EnShearInput
 * @property {number} d_mm  effective depth of the tension side [mm]
 * @property {number} a_sl_mm2  tension reinforcement [mm2]
 * @property {number} f_ck  [N/mm2]
 * @property {number} sigma_cp  [N/mm2], compression positive, already limited
 * @property {number} c_rd_c
 * @property {number} k_1
 */

/**
 * @typedef {Object} EnShearResult
 * @property {number} v_rd_c  [N], >= 0
 * @property {number} k
 * @property {number} rho_l
 * @property {number} nu_min  [N/mm2]
 * @property {'6.2.a' | '6.2.b'} governing  the equation that gives v_rd_c
 * @property {boolean} at_zero  both equations are negative (tension),
 *     v_rd_c is set to 0 (decision F1)
 */

/**
 * V_Rd,c = [C_Rd,c k (100 rho_l f_ck)^(1/3) + k_1 sigma_cp] b_w d   (6.2.a)
 * at least (nu_min + k_1 sigma_cp) b_w d                           (6.2.b)
 * With tension sigma_cp is negative in both equations, the result is
 * not less than 0 (decision F1).
 * @param {EnShearInput} input
 * @returns {EnShearResult}
 */
export function v_rd_c({ d_mm, a_sl_mm2, f_ck, sigma_cp, c_rd_c, k_1 }) {
    const k = k_size(d_mm);
    const rho = rho_l(a_sl_mm2, B_W, d_mm);
    const v_min = nu_min(k, f_ck);
    const v_a = (c_rd_c * k * (100 * rho * f_ck) ** (1 / 3) + k_1 * sigma_cp) * B_W * d_mm;
    const v_b = (v_min + k_1 * sigma_cp) * B_W * d_mm;
    const governing = (v_a >= v_b) ? '6.2.a' : '6.2.b';
    const v = Math.max(v_a, v_b);
    return { v_rd_c: Math.max(v, 0), k: k, rho_l: rho, nu_min: v_min,
             governing: governing, at_zero: v < 0 };
}
