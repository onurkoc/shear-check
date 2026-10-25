// @ts-check
/*
Shear resistance of slabs without shear reinforcement
SIA 262:2025 4.3.3.2.1 to 4.3.3.2.4, Gl. (35) to (39) and (41);
tau_cd after 2.4.2.4, Gl. (3).
Clause numbers refer to SIA 262:2025.

Not implemented (on purpose, see NOTES.md): Näherungsstufe 3 (Gl. 40),
decompression moment (4.3.3.2.6), A_s,min.

Units: mm and N/mm2 as in the equations; v_Rd = k_d tau_cd d_v in
N/mm = kN/m.
*/

/**
 * tau_cd = 0.3 sqrt(f_ck) / gamma_c, Gl. (3). Without eta_t (decision F5).
 * @param {number} f_ck  [N/mm2]
 * @param {number} gamma_c
 * @returns {number} [N/mm2]
 */
export function tau_cd(f_ck, gamma_c) {
    return 0.3 * Math.sqrt(f_ck) / gamma_c;
}

/**
 * k_g = 48 / (16 + D_max min{1; (60 / f_ck)^2}) >= 1.2, Gl. (37),
 * D_max in mm, f_ck in N/mm2. The lower limit 1.2 is read from the
 * OCR text of the norm, see NOTES.md (O1).
 * @param {number} d_max  largest aggregate size [mm]
 * @param {number} f_ck  [N/mm2]
 * @returns {number}
 */
export function k_g(d_max, f_ck) {
    return Math.max(48 / (16 + d_max * Math.min(1, (60 / f_ck) ** 2)), 1.2);
}

/**
 * Näherungsstufen of eps_v.
 * level1: Gl. (38), level2: Gl. (39), plastic: Gl. (41) (4.3.3.2.3)
 * @typedef {'level1' | 'level2' | 'plastic'} EpsVLevel
 */
export const EPS_V_LEVELS = /** @type {EpsVLevel[]} */ (['level1', 'level2', 'plastic']);

/**
 * eps_v after 4.3.3.2.2 / 4.3.3.2.3, increased by 50 % if the
 * longitudinal reinforcement is curtailed (4.3.3.2.4).
 * @param {EpsVLevel} level
 * @param {number} f_yd  [N/mm2]
 * @param {number} e_s  [N/mm2]
 * @param {number | null} m_ratio  m_d / m_Rd, only used for level2
 * @param {boolean} curtailed  longitudinal reinforcement curtailed
 * @returns {number}
 */
export function eps_v(level, f_yd, e_s, m_ratio, curtailed) {
    const eps_y = f_yd / e_s;
    let eps;
    if (level === 'level1') {
        eps = eps_y;                          // Gl. (38)
    } else if (level === 'level2') {
        if (m_ratio === null) {
            throw new RangeError('eps_v: m_d / m_Rd is needed for level 2');
        }
        eps = eps_y * m_ratio;                // Gl. (39)
    } else {
        eps = 1.5 * eps_y;                    // Gl. (41)
    }
    return curtailed ? 1.5 * eps : eps;       // 4.3.3.2.4
}

/**
 * k_d = 1 / (1 + eps_v d k_g), Gl. (36), d in mm
 * @param {number} eps
 * @param {number} d_mm  [mm]
 * @param {number} kg
 * @returns {number}
 */
export function k_d(eps, d_mm, kg) {
    return 1 / (1 + eps * d_mm * kg);
}

/**
 * v_Rd = k_d tau_cd d_v, Gl. (35)
 * @param {number} kd
 * @param {number} tau  tau_cd [N/mm2]
 * @param {number} d_v_mm  [mm]
 * @returns {number} [kN/m]
 */
export function v_rd(kd, tau, d_v_mm) {
    return kd * tau * d_v_mm;
}
