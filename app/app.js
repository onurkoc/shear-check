// @ts-check
/*
Interface of the shear check
Runs in the browser only, no server.

The functions in the first part do not touch the page, so they can be
tested with node. start() connects them to index.html.

All texts come from the table of the chosen language (i18n.js): the
functions get a translator t, messages are keys with parameters.
*/
import { int_diagram } from './core.js';
import { check_en1992, check_sia262, en_curves, sia_curves, max_utilization,
         depth } from './check.js';
import { tau_cd, k_g, EPS_V_LEVELS } from './shear/sia262.js';
import { B_W, EN_SHEAR_DEFAULTS } from './shear/en1992.js';
import { read_text, open_workbook, read_sheet } from './load_read.js';
import { figure, draw } from './draw.js';
import { to_csv } from './export.js';
import { en1992 } from './norms/en1992.js';
import { sia262, eta_fc, ETA_T_CHOICE } from './norms/sia262.js';
import { TextError } from './errors.js';
import { translator, default_language, LANGUAGES } from './i18n.js';
import { THEME_STORAGE_KEY, parse_choice, resolve_theme, plot_colors } from './theme.js';

/** @typedef {import('./check.js').Side} Side */
/** @typedef {import('./check.js').SideKey} SideKey */
/** @typedef {import('./check.js').Loads} Loads */
/** @typedef {import('./check.js').PointResult} PointResult */
/** @typedef {import('./check.js').Curve} Curve */
/** @typedef {import('./check.js').EnSection} EnSection */
/** @typedef {import('./check.js').SiaSection} SiaSection */
/** @typedef {import('./shear/sia262.js').EpsVLevel} EpsVLevel */
/** @typedef {import('./load_read.js').Table} Table */
/** @typedef {import('./load_read.js').XlsxLibrary} XlsxLibrary */
/** @typedef {import('./norms/en1992.js').Norm} Norm */
/** @typedef {import('./draw.js').PlotlyLibrary} PlotlyLibrary */
/** @typedef {import('./i18n.js').Translator} Translator */
/** @typedef {import('./errors.js').TextMessage} TextMessage */
/** @typedef {import('./theme.js').ThemeChoice} ThemeChoice */

/** The norms of the landing page, by the name in the address (#sia262). */
export const NORMS = /** @type {Object<string, Norm>} */ ({
    sia262: sia262,
    en1992: en1992,
});

/**
 * Input as typed by the user. Numbers are still text.
 * @typedef {Object} RawInputs
 * @property {string} h_
 * @property {string} a_sp  A_s, tension side for M > 0
 * @property {string} c_p
 * @property {string} d_vp  SIA only, '' = d
 * @property {string} a_sn  A_s, tension side for M < 0
 * @property {string} c_n
 * @property {string} d_vn  SIA only, '' = d
 * @property {string} f_ck
 * @property {string} gamma_c
 * @property {string} f_yk  SIA only
 * @property {string} gamma_s  SIA only
 * @property {string} d_max  SIA only
 * @property {string} eta_t  SIA only, '' as long as nothing is chosen
 * @property {string} level  SIA only, '' as long as nothing is chosen
 * @property {boolean} curtailed  SIA only
 * @property {string} alpha_cc  EN only
 * @property {string} c_rd_c_gamma  EN only, C_Rd,c = value / gamma_c
 * @property {string} k_1  EN only
 * @property {boolean} plaxis  compression negative in the file
 */

/**
 * Checked input.
 * @typedef {Object} Params
 * @property {number} h_  [m]
 * @property {{'+': Side, '-': Side}} sides
 * @property {number} f_ck
 * @property {number} gamma_c
 * @property {number} [f_yk]  SIA
 * @property {number} [gamma_s]  SIA
 * @property {number} [d_max]  SIA
 * @property {number} [eta_t]  SIA
 * @property {EpsVLevel} [level]  SIA
 * @property {boolean} [curtailed]  SIA
 * @property {number} [alpha_cc]  EN
 * @property {number} [c_rd_c_gamma]  EN
 * @property {number} [k_1]  EN
 */

/**
 * A message of the check of the inputs: a key of the texts in i18n.js
 * with its parameters, not a finished text.
 * @typedef {Object} Message
 * @property {string} field  name of the input, '' if it is not a single one
 * @property {string} key  key of the text
 * @property {Object<string, any>} [params]
 * @property {boolean} [missing]  true: the input is empty (not wrong)
 */

// all inputs that are typed as text
export const TEXT_FIELDS = ['h_', 'a_sp', 'c_p', 'd_vp', 'a_sn', 'c_n', 'd_vn',
                            'f_ck', 'gamma_c', 'f_yk', 'gamma_s', 'd_max',
                            'alpha_cc', 'c_rd_c_gamma', 'k_1'];
// inputs of both norms, then the inputs of one norm
const COMMON_FIELDS = ['h_', 'a_sp', 'c_p', 'a_sn', 'c_n', 'f_ck', 'gamma_c'];
const SIA_FIELDS = ['f_yk', 'gamma_s', 'd_max'];
const EN_FIELDS = ['alpha_cc', 'c_rd_c_gamma', 'k_1'];
// a change of one of these ends the example
export const SECTION_FIELDS = ['h_', 'a_sp', 'c_p', 'd_vp', 'a_sn', 'c_n', 'd_vn',
                               'f_ck', 'f_yk', 'd_max', 'eta_t'];

// presets besides the defaults of the norm (norms/*.js)
const PRESETS = /** @type {Object<string, Object<string, number>>} */ ({
    sia262: {},
    en1992: { c_rd_c_gamma: EN_SHEAR_DEFAULTS.c_rd_c_gamma, k_1: EN_SHEAR_DEFAULTS.k_1 },
});

// text below the table: what has been validated, per norm
const VALIDATION_KEYS = /** @type {Object<string, string>} */ ({
    en1992: 'validation.note.en1992',
    sia262: 'validation.note.sia262',
});

// numbers inside the fixed texts of the page: [number, digits]
const TEXT_PARAMS = /** @type {Object<string, Object<string, any>>} */ ({
    'eta_t.help': { suggestion: [0.85, 2], impact: [1.2, 1] },
    'ndp.help': { c: [0.18, 2], k_1: [0.15, 2] },
});

/**
 * Number from the text of an input. Decimal point or decimal comma,
 * in every language of the interface. Anything else is not a number.
 * @param {string} text
 * @returns {number} NaN if the text is not a number
 */
export function parse_number(text) {
    const trimmed = text.trim();
    if (!/^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/.test(trimmed)) {
        return NaN;
    }
    return Number(trimmed.replace(',', '.'));
}

/**
 * The text of an input written again with the decimal sign of the
 * interface, when the user leaves the field. Only the sign changes.
 * Text that is not a number is not touched.
 * @param {string} text
 * @param {string} decimal  ',' or '.'
 * @returns {string}
 */
export function rewrite_number(text, decimal) {
    if (Number.isNaN(parse_number(text))) {
        return text;
    }
    return text.trim().replace(/[.,]/, decimal);
}

/**
 * Values of the button «Beispiel laden» / «Load example», written into
 * the fields so the user sees what is calculated.
 */
export const EXAMPLE = /** @type {Object<string, string>} */ ({
    h_: '0.30', a_sp: '5.65', c_p: '0.05', a_sn: '5.65', c_n: '0.05',
    f_ck: '30', f_yk: '500', d_max: '32', eta_t: '0.85',
});

/**
 * Where the input comes from. The result is marked as an example only
 * if the button «Beispiel laden» wrote the values.
 * @typedef {Object} ExampleState
 * @property {boolean} marked  the values were written by the button
 * @property {RawInputs | null} before  the input before the button was
 *     used, null: nothing to undo
 */

/** State at the start: nothing loaded, nothing to undo. */
export const NO_EXAMPLE = /** @type {ExampleState} */ (
    Object.freeze({ marked: false, before: null }));

/**
 * The button «Beispiel laden» was used: the result is marked.
 * @param {ExampleState} state
 * @param {RawInputs} raw  the input before the example is written
 * @returns {ExampleState}
 */
export function example_loaded(state, raw) {
    if (state.marked) {
        // loaded a second time: undo still leads to the input of the user
        return { marked: true, before: state.before };
    }
    return { marked: true, before: has_inputs(raw) ? raw : null };
}

/**
 * The user changed an input. A change of the cross-section or of the
 * materials ends the mark; any change ends the offer to undo.
 * @param {ExampleState} state
 * @param {string} field  name of the input
 * @returns {ExampleState}
 */
export function example_edited(state, field) {
    return { marked: state.marked && !SECTION_FIELDS.includes(field),
             before: null };
}

/**
 * Was anything entered in the fields that the example overwrites?
 * @param {RawInputs} raw
 * @returns {boolean}
 */
export function has_inputs(raw) {
    const fields = /** @type {Object<string, any>} */ (raw);
    return Object.keys(EXAMPLE).some(field => fields[field].trim() !== '');
}

/**
 * The messages that are shown. An empty input is not an error as long as
 * the user has not been in the field: it is shown only after the field
 * was left, or when load points are loaded.
 * @param {Message[]} messages  from check_inputs
 * @param {Set<string>} touched  names of the inputs the user has left
 * @param {boolean} has_loads  load points are loaded
 * @returns {Message[]}
 */
export function shown_messages(messages, touched, has_loads) {
    return messages.filter(message =>
        !message.missing || has_loads || touched.has(message.field));
}

/**
 * Text of a message in the chosen language.
 * @param {Message | TextMessage} message
 * @param {Translator} t
 * @returns {string}
 */
export function message_text(message, t) {
    const params = { ...message.params };
    if ('field' in message && message.field !== '' &&
        message.field !== 'eta_t' && message.field !== 'level') {
        // name of the input, e.g. «Höhe h» / «Height h»
        params['name'] = t('name.' + message.field);
    }
    if (params['message'] !== undefined) {
        // a message of the norm inside the message
        params['text'] = message_text(params['message'], t);
    }
    return t(message.key, params);
}

/**
 * Text of an error in the chosen language.
 * @param {unknown} error
 * @param {Translator} t
 * @returns {string}
 */
export function error_text(error, t) {
    if (error instanceof TextError) {
        return t(error.key, error.params);
    }
    return (error instanceof Error) ? error.message : String(error);
}

/**
 * Check the input before every calculation.
 * Invalid input is rejected with a message, nothing is corrected.
 * @param {RawInputs} raw
 * @param {Norm} norm
 * @returns {{params: Params, messages: Message[]}}
 *     params is complete only if there are no messages
 */
export function check_inputs(raw, norm) {
    const is_sia = norm === sia262;
    /** @type {Message[]} */
    const messages = [];
    /** @type {Object<string, number>} */
    const numbers = {};
    const fields = /** @type {Object<string, any>} */ (raw);

    const required = COMMON_FIELDS.concat(is_sia ? SIA_FIELDS : EN_FIELDS);
    // d_v is optional: empty means d (decision F7)
    const optional = is_sia ? ['d_vp', 'd_vn'] : [];
    for (const field of required.concat(optional)) {
        const text = fields[field];
        if (text.trim() === '') {
            if (required.includes(field)) {
                messages.push({ field: field, missing: true, key: 'check.missing' });
            }
            continue;
        }
        const value = parse_number(text);
        if (Number.isNaN(value)) {
            messages.push({ field: field, key: 'check.not_a_number',
                            params: { text: text.trim() } });
            continue;
        }
        numbers[field] = value;
    }

    // limits that do not depend on the norm
    for (const field of ['h_', 'c_p', 'c_n', 'f_ck', 'gamma_c', 'f_yk', 'gamma_s',
                         'c_rd_c_gamma', 'd_vp', 'd_vn']) {
        if (field in numbers && numbers[field] <= 0) {
            messages.push({ field: field, key: 'check.positive',
                            params: { value: numbers[field] } });
        }
    }
    for (const field of ['a_sp', 'a_sn', 'd_max', 'k_1']) {
        if (field in numbers && numbers[field] < 0) {
            messages.push({ field: field, key: 'check.not_negative',
                            params: { value: numbers[field] } });
        }
    }
    for (const field of ['c_p', 'c_n']) {
        if (field in numbers && 'h_' in numbers && numbers[field] > 0 &&
            numbers[field] >= numbers['h_']) {
            messages.push({ field: field, key: 'check.below_height',
                            params: { value: numbers[field], h: numbers['h_'] } });
        }
    }
    for (const [field, c_field] of [['d_vp', 'c_p'], ['d_vn', 'c_n']]) {
        if (field in numbers && numbers[field] > 0 && 'h_' in numbers &&
            c_field in numbers) {
            const d = numbers['h_'] - numbers[c_field];
            if (d > 0 && numbers[field] > d + 1e-12) {
                messages.push({ field: field, key: 'check.d_v_above_d',
                                params: { value: numbers[field], d: [d, 3] } });
            }
        }
    }

    /** @type {number | undefined} */
    let eta_t = undefined;
    /** @type {EpsVLevel | undefined} */
    let level = undefined;
    let norm_inputs_complete = true;
    if (is_sia) {
        if (raw.eta_t === '') {
            // no silent preset (SIA 262 4.2.1.3)
            messages.push({ field: 'eta_t', missing: true,
                            key: 'check.eta_t_missing', params: ETA_T_CHOICE });
            norm_inputs_complete = false;
        } else {
            eta_t = parse_number(raw.eta_t);
        }
        if (EPS_V_LEVELS.includes(/** @type {EpsVLevel} */ (raw.level))) {
            level = /** @type {EpsVLevel} */ (raw.level);
        } else {
            // no silent preset
            messages.push({ field: 'level', missing: true, key: 'check.level_missing' });
        }
    } else if (!('alpha_cc' in numbers)) {
        norm_inputs_complete = false;
    }

    // limits of the norm (f_ck <= 50, decision F10; eta_t; alpha_cc)
    if (norm_inputs_complete && 'f_ck' in numbers && 'gamma_c' in numbers) {
        const norm_messages = norm.check({
            f_ck: numbers['f_ck'], f_yk: numbers['f_yk'] ?? 0,
            gamma_c: numbers['gamma_c'], gamma_s: numbers['gamma_s'] ?? 0,
            alpha_cc: numbers['alpha_cc'], eta_t: eta_t,
        });
        for (const message of norm_messages) {
            messages.push({ field: '', key: 'check.norm',
                            params: { norm: norm.name, message: message } });
        }
    }

    const h = numbers['h_'];
    /**
     * @param {string} a  field of A_s
     * @param {string} c  field of c
     * @param {string} d_v  field of d_v
     * @returns {Side}
     */
    const side = (a, c, d_v) => ({
        a_s: numbers[a], c: numbers[c],
        // empty d_v: d = h - c (decision F7)
        d_v: (d_v in numbers) ? numbers[d_v] : h - numbers[c],
    });
    /** @type {Params} */
    const params = {
        h_: h,
        sides: { '+': side('a_sp', 'c_p', 'd_vp'), '-': side('a_sn', 'c_n', 'd_vn') },
        f_ck: numbers['f_ck'],
        gamma_c: numbers['gamma_c'],
    };
    if (is_sia) {
        params.f_yk = numbers['f_yk'];
        params.gamma_s = numbers['gamma_s'];
        params.d_max = numbers['d_max'];
        params.eta_t = eta_t;
        params.level = level;
        params.curtailed = raw.curtailed;
    } else {
        params.alpha_cc = numbers['alpha_cc'];
        params.c_rd_c_gamma = numbers['c_rd_c_gamma'];
        params.k_1 = numbers['k_1'];
    }
    return { params: params, messages: messages };
}

/**
 * Load points from the table of the file. Plaxis gives compression
 * negative; the check needs compression positive (EN 1992-1-1 6.2.2 (1)).
 * The sign is turned, not taken as an absolute value.
 * @param {Table} table
 * @param {boolean} plaxis  compression negative in the file
 * @returns {Loads}
 */
export function loads_from_table(table, plaxis) {
    return {
        n: plaxis ? table.n.map(n => (n === 0) ? 0 : -n) : table.n.slice(),
        m: table.m.slice(),
        v: table.v.slice(),
        rows: table.rows.slice(),
    };
}

/**
 * @typedef {Object} EnInfo
 * @property {EnSection} section
 * @property {number} n_limit  N_Ed at sigma_cp = 0.2 f_cd [kN/m]
 * @property {number} alpha_cc
 * @property {number} gamma_c
 * @property {number} c_rd_c_gamma  numerator of C_Rd,c
 */

/**
 * @typedef {Object} SiaInfo
 * @property {SiaSection} section
 * @property {number} f_cd  of the M-N curve [N/mm2]
 * @property {number} tau_cd  [N/mm2]
 * @property {number} k_g
 */

/**
 * @typedef {Object} Result
 * @property {PointResult[]} points  empty without load points
 * @property {Curve[]} curves
 * @property {EnInfo | null} en
 * @property {SiaInfo | null} sia
 */

/**
 * The whole calculation for the checked input.
 * @param {Params} params
 * @param {Norm} norm
 * @param {Loads | null} loads  null: no load points
 * @returns {Result}
 */
export function calculate(params, norm, loads) {
    const sides = params.sides;
    if (norm === sia262) {
        const f_ck = params.f_ck;
        const f_yk = /** @type {number} */ (params.f_yk);
        const gamma_c = params.gamma_c;
        const gamma_s = /** @type {number} */ (params.gamma_s);
        const f_yd = sia262.f_yd({ f_ck, f_yk, gamma_c, gamma_s });
        // M-N curve for m_Rd (decision F5: eta_t only here, in f_cd)
        const curve = int_diagram({
            h_: params.h_, b_: B_W / 1000,
            d_1: sides['+'].c, d_2: sides['-'].c,
            a_s1: sides['+'].a_s, a_s2: sides['-'].a_s,
            f_ck: f_ck, f_yk: f_yk, gamma_c: gamma_c, gamma_s: gamma_s,
            eta_t: params.eta_t,
        }, sia262);
        if (curve === null) {
            // check_inputs rejects these cases before
            throw new TextError('app.inputs_invalid');
        }
        const [input_values, values] = curve;
        /** @type {SiaSection} */
        const section = {
            h: params.h_, f_ck: f_ck, gamma_c: gamma_c, f_yd: f_yd,
            // E_s = 200 GPa, SIA 262:2025 3.2.2.4 (decision A14),
            // used in Gl. (38), (39), (41)
            e_s: sia262.e_steel, d_max: /** @type {number} */ (params.d_max),
            level: /** @type {EpsVLevel} */ (params.level),
            curtailed: params.curtailed === true, sides: sides,
        };
        const points = (loads === null) ? [] : check_sia262(section, values, loads);
        const ratios = points.map(p => (p.sia === null) ? null : p.sia.m_ratio)
            .filter(r => r !== null);
        const x_max = 1.05 * Math.max(1, ...(/** @type {number[]} */ (ratios)));
        return {
            points: points, curves: sia_curves(section, x_max), en: null,
            sia: { section: section, f_cd: input_values.f_cd,
                   tau_cd: tau_cd(f_ck, gamma_c), k_g: k_g(section.d_max, f_ck) },
        };
    }

    const f_cd = en1992.f_cd({ f_ck: params.f_ck, f_yk: 0, gamma_c: params.gamma_c,
                               gamma_s: 1, alpha_cc: params.alpha_cc });
    /** @type {EnSection} */
    const section = {
        h: params.h_, f_ck: params.f_ck, f_cd: f_cd,
        // C_Rd,c = 0.18 / gamma_c (recommended), numerator editable
        c_rd_c: /** @type {number} */ (params.c_rd_c_gamma) / params.gamma_c,
        k_1: /** @type {number} */ (params.k_1),
        sides: sides,
    };
    const points = (loads === null) ? [] : check_en1992(section, loads);
    const n_limit = 0.2 * f_cd * B_W * params.h_ * 1000 / 1000;
    // range of the curve: the load points, 0 and the limit 0.2 f_cd
    const n_values = points.map(p => p.n);
    const low = Math.min(0, ...n_values, -0.25 * n_limit);
    const high = Math.max(...n_values, 1.1 * n_limit);
    const margin = 0.05 * (high - low);
    return {
        points: points, curves: en_curves(section, low - margin, high + margin),
        en: { section: section, n_limit: n_limit,
              alpha_cc: /** @type {number} */ (params.alpha_cc),
              gamma_c: params.gamma_c,
              c_rd_c_gamma: /** @type {number} */ (params.c_rd_c_gamma) },
        sia: null,
    };
}

/**
 * Text of a side.
 * @param {SideKey} side
 * @param {Translator} t
 * @returns {string}
 */
export function side_text(side, t) {
    return t((side === '+') ? 'side.short.plus' : 'side.short.minus');
}

/**
 * Utilization as text: ∞ for a resistance of 0, empty if not defined.
 * @param {number | null} u
 * @param {Translator} t
 * @returns {string}
 */
export function utilization_text(u, t) {
    if (u === null) {
        return '';
    }
    return (u === Infinity) ? '∞' : t.fmt(u, 3);
}

/**
 * The notes of a point, as keys of the texts.
 * @param {PointResult} p
 * @param {EpsVLevel | null} level  SIA level, null for EN
 * @returns {string[]}
 */
export function point_notes(p, level) {
    /** @type {string[]} */
    const notes = [];
    if (p.state === 'exceeded') {
        notes.push('note.exceeded');
    }
    if (p.state === 'no_reinforcement') {
        // EN: plain concrete is not part of this app (A2); SIA: F9
        notes.push((level === null) ? 'note.unreinforced' : 'note.no_reinforcement');
    }
    if (p.state === 'flexure') {
        notes.push('note.flexure');
    } else if (level !== null && p.sia !== null && p.sia.flexure &&
               p.state !== 'no_reinforcement') {
        // level 1 / plastic: only a hint (decision F6)
        notes.push('note.flexure_info');
    }
    if (p.en !== null) {
        if (p.tension) {
            notes.push('note.tension');
        }
        if (p.en.limited) {
            notes.push('note.sigma_limited');
        }
        if (p.en.at_zero) {
            notes.push('note.at_zero');
        }
    }
    if (p.m === 0) {
        notes.push('note.m_zero');
    }
    return notes;
}

/**
 * Mark of a row: 'outside' (red), 'above' (yellow, a hint), 'tension'.
 * @param {PointResult} p
 * @returns {string}
 */
export function point_mark(p) {
    if (p.state !== 'ok') {
        return 'outside';
    }
    if (p.sia !== null && p.sia.flexure) {
        return 'above';
    }
    if (p.en !== null && p.tension) {
        return 'tension';
    }
    return '';
}

/** @typedef {number | string | null} SortKey */

/**
 * Rows of the table of the load points. Numbers with the decimal sign of
 * the language.
 * @param {PointResult[]} points
 * @param {Norm} norm
 * @param {Translator} t
 * @param {EpsVLevel | null} level  SIA level, null for EN
 * @returns {{head: string[], head_keys: string[], rows: string[][],
 *            marks: string[], keys: SortKey[][]}}
 */
export function table(points, norm, t, level) {
    const is_sia = norm === sia262;
    const head_keys = is_sia ?
        ['table.nr', 'table.row', 'table.n_sia', 'table.m_sia', 'table.v_sia',
         'table.side', 'table.d', 'table.m_rd', 'table.m_ratio', 'table.eps_v',
         'table.k_d', 'table.v_rd_sia', 'table.utilization', 'table.hint'] :
        ['table.nr', 'table.row', 'table.n_en', 'table.m_en', 'table.v_en',
         'table.side', 'table.d', 'table.sigma_cp', 'table.v_rd_en',
         'table.utilization', 'table.hint'];
    /** @type {string[][]} */
    const rows = [];
    /** @type {SortKey[][]} */
    const keys = [];
    /** @type {string[]} */
    const marks = [];
    /**
     * @param {number | null} x
     * @param {number} digits
     * @returns {string}
     */
    const cell = (x, digits) => (x === null) ? '' : t.fmt(x, digits);
    for (const p of points) {
        const row = [String(p.nr), String(p.row), t.fmt(p.n, 1), t.fmt(p.m, 2),
                     t.fmt(p.v, 1), side_text(p.side, t), t.fmt(p.d, 3)];
        /** @type {SortKey[]} */
        const key = [p.nr, p.row, p.n, p.m, p.v, p.side, p.d];
        if (p.sia !== null) {
            const sia = p.sia;
            row.push(cell(sia.m_rd, 2), cell(sia.m_ratio, 3),
                     (sia.eps_v === null) ? '' : t.fmt(sia.eps_v * 1000, 3),
                     cell(sia.k_d, 3), cell(p.v_rd, 1));
            key.push(sia.m_rd, sia.m_ratio, sia.eps_v, sia.k_d, p.v_rd);
        } else if (p.en !== null) {
            row.push(t.fmt(p.en.sigma_cp, 3), cell(p.v_rd, 1));
            key.push(p.en.sigma_cp, p.v_rd);
        } else {
            // EN without reinforcement on the tension side: not checked (A2)
            row.push('', '');
            key.push(null, null);
        }
        row.push(utilization_text(p.utilization, t));
        key.push(p.utilization);
        const notes = point_notes(p, is_sia ? level : null).map(k => t(k));
        const hint = notes.join('; ');
        row.push(hint);
        key.push((hint === '') ? null : hint);
        rows.push(row);
        keys.push(key);
        marks.push(point_mark(p));
    }
    return { head: head_keys.map(head_key => t(head_key)), head_keys: head_keys,
             rows: rows, marks: marks, keys: keys };
}

/**
 * Order of the rows of the table when it is sorted by one column.
 * Numbers are compared as numbers, not as text. Empty cells (null) are
 * always at the end. Rows with the same value keep the order of the file.
 * @param {SortKey[][]} keys  from table()
 * @param {number} column
 * @param {boolean} descending
 * @returns {number[]} indices of the rows in the new order
 */
export function sort_order(keys, column, descending) {
    const order = keys.map((_, i) => i);
    order.sort((a, b) => {
        const key_a = keys[a][column];
        const key_b = keys[b][column];
        if (key_a === null || key_b === null) {
            if (key_a === null && key_b === null) {
                return a - b;
            }
            return (key_a === null) ? 1 : -1;
        }
        let difference;
        if (typeof key_a === 'number' && typeof key_b === 'number') {
            difference = (key_a === key_b) ? 0 : (key_a < key_b ? -1 : 1);
        } else {
            difference = String(key_a).localeCompare(String(key_b));
        }
        if (difference === 0) {
            return a - b;
        }
        return descending ? -difference : difference;
    });
    return order;
}

/**
 * One line above the table.
 * @param {PointResult[]} points
 * @param {Translator} t
 * @returns {string}
 */
export function summary_text(points, t) {
    if (points.length === 0) {
        return '';
    }
    const parts = [t('summary.points', { total: points.length })];
    const largest = max_utilization(points);
    if (largest !== null) {
        const p = points.find(q => q.utilization === largest);
        parts.push(t('summary.max', { value: utilization_text(largest, t),
                                      nr: p ? p.nr : '' }));
    }
    const exceeded = points.filter(p => p.state === 'exceeded').length;
    parts.push(t('summary.exceeded', { count: exceeded }));
    const flexure = points.filter(p => p.state === 'flexure').length;
    if (flexure > 0) {
        parts.push(t('summary.flexure', { count: flexure }));
    }
    const missing = points.filter(p => p.state === 'no_reinforcement').length;
    if (missing > 0) {
        parts.push(t('summary.no_reinforcement', { count: missing }));
    }
    const tension = points.filter(p => p.en !== null && p.tension).length;
    if (tension > 0) {
        parts.push(t('summary.tension', { count: tension }));
    }
    return parts.join(' ');
}

/**
 * What the loads are, for the hints.
 * @typedef {Object} LoadsInfo
 * @property {string} name  file name, or the text for pasted values
 * @property {number} count
 * @property {boolean} plaxis
 */

/**
 * Hints below the diagram: what was assumed and used.
 * @param {Norm} norm
 * @param {Result} result
 * @param {LoadsInfo | null} info
 * @param {Translator} t
 * @returns {string[]}
 */
export function hints(norm, result, info, t) {
    /** @type {string[]} */
    const list = [];
    /** @type {{key: SideKey, text: string}[]} */
    const side_list = [{ key: '+', text: t('side.short.plus') },
                       { key: '-', text: t('side.short.minus') }];
    if (result.sia !== null) {
        const s = result.sia.section;
        list.push(t('hint.sia.tau_cd', { f_ck: s.f_ck, gamma_c: s.gamma_c,
                                         tau_cd: t.fmt(result.sia.tau_cd, 3) }));
        list.push(t('hint.sia.k_g', { d_max: s.d_max, f_ck: s.f_ck,
                                      k_g: t.fmt(result.sia.k_g, 3) }));
        list.push(t('hint.sia.eps_y', { f_yd: t.fmt(s.f_yd, 1), e_s: s.e_s,
                                        eps: t.fmt(s.f_yd / s.e_s * 1000, 3) }));
        list.push(t('hint.sia.level.' + s.level));
        if (s.curtailed) {
            list.push(t('hint.sia.curtailed'));
        }
        for (const { key, text } of side_list) {
            const side = s.sides[key];
            list.push(t('hint.sia.side', { side: text, a_s: t.fmt(side.a_s, 2),
                                           d: t.fmt(depth(s.h, side), 3),
                                           d_v: t.fmt(side.d_v, 3) }));
        }
        list.push(t('hint.sia.m_rd', { f_cd: t.fmt(result.sia.f_cd, 2),
                                       eta_fc: t.fmt(eta_fc(s.f_ck), 3) }));
        list.push(t('hint.sia.not_implemented'));
        const not_drawn = result.points.filter(
            p => p.sia !== null && p.sia.m_ratio === null).length;
        if (not_drawn > 0) {
            list.push(t('hint.sia.not_drawn', { count: not_drawn }));
        }
        if (s.level !== 'level2' &&
            result.points.some(p => p.sia !== null && p.sia.flexure &&
                                    p.state !== 'no_reinforcement')) {
            list.push(t('hint.sia.flexure_info'));
        }
    }
    if (result.en !== null) {
        const s = result.en.section;
        list.push(t('hint.en.f_cd', { alpha: result.en.alpha_cc, f_ck: s.f_ck,
                                      gamma_c: result.en.gamma_c,
                                      f_cd: t.fmt(s.f_cd, 2) }));
        list.push(t('hint.en.c_rd_c', { c: result.en.c_rd_c_gamma,
                                        gamma_c: result.en.gamma_c,
                                        c_rd_c: t.fmt(s.c_rd_c, 4), k_1: s.k_1 }));
        for (const { key, text } of side_list) {
            const side = s.sides[key];
            list.push(t('hint.en.side', { side: text, a_s: t.fmt(side.a_s, 2),
                                          d: t.fmt(depth(s.h, side), 3) }));
        }
        list.push(t('hint.en.sigma_limit', { limit: t.fmt(0.2 * s.f_cd, 2),
                                             n: t.fmt(result.en.n_limit, 0) }));
        list.push(t('hint.en.tension'));
        list.push(t('hint.en.a_sl'));
    }
    if (info !== null) {
        list.push(t('hint.loads', { name: info.name, count: info.count }));
        list.push(t(info.plaxis ? 'hint.sign_plaxis' : 'hint.sign_positive'));
        list.push(t('hint.m_zero'));
    }
    return list;
}

/**
 * Connect the functions above to the page (index.html).
 * @param {Object} libraries
 * @param {XlsxLibrary} libraries.XLSX  the SheetJS library
 * @param {PlotlyLibrary} libraries.Plotly  the Plotly library
 */
export function start({ XLSX, Plotly }) {
    /**
     * @param {string} id
     * @returns {HTMLElement}
     */
    const element = (id) => {
        const found = document.getElementById(id);
        if (found === null) {
            throw new Error(`index.html: element #${id} is missing`);
        }
        return found;
    };
    /**
     * @param {string} id
     * @returns {HTMLInputElement}
     */
    const input = (id) => /** @type {HTMLInputElement} */ (element(id));

    const landing = element('landing');
    const calculator = element('calculator');
    const form = /** @type {HTMLFormElement} */ (element('inputs'));
    const drop_zone = element('drop-zone');
    const file_input = input('file');
    const file_message = element('file-message');
    const sheet_choice = element('sheet-choice');
    const sheet_select = /** @type {HTMLSelectElement} */ (element('sheet'));
    const paste = /** @type {HTMLTextAreaElement} */ (element('paste'));
    const messages_box = element('messages');
    const diagram = element('diagram');
    const hints_list = element('hints');
    const table_box = element('table');
    const summary = element('summary');
    const export_button = /** @type {HTMLButtonElement} */ (element('export'));
    const example_undo = element('example-undo');
    const example_note = element('example-note');

    // the language is kept for the next visit
    const STORAGE_KEY = 'shear-check.language';
    /**
     * @param {string} key
     * @returns {string | null}
     */
    function stored(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            // no storage (e.g. private mode)
            return null;
        }
    }
    /**
     * @param {string} key
     * @param {string} value
     */
    function store(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            // no storage: the choice holds for this visit only
        }
    }
    const first = stored(STORAGE_KEY);
    let t = translator((first !== null && LANGUAGES.includes(first)) ?
        first : default_language(window.navigator.language));

    // colour theme (decision F4)
    let theme_choice = parse_choice(stored(THEME_STORAGE_KEY));
    const system_dark = window.matchMedia('(prefers-color-scheme: dark)');

    /** @type {ExampleState} */
    let example_state = NO_EXAMPLE;
    /** @type {Set<string>} */
    const touched = new Set();
    let sort = { head_key: 'table.nr', descending: false };
    // the table as read, and where it comes from
    /** @type {{table: Table, name: string} | null} */
    let source = null;
    // a workbook with several sheets, as long as no sheet is chosen
    /** @type {{workbook: {SheetNames: string[], Sheets: Object<string, Object>},
     *          name: string} | null} */
    let workbook = null;
    /** @type {{message: TextMessage | null, error: unknown} | null} */
    let file_state = null;
    /** @type {Norm | null} */
    let norm = null;
    // what the table shows now, for the export
    /** @type {{head: string[], rows: string[][]} | null} */
    let shown_table = null;

    /**
     * @returns {RawInputs}
     */
    function raw_inputs() {
        /**
         * @param {string} name
         * @returns {string}
         */
        const radio = (name) => {
            const chosen = /** @type {HTMLInputElement | null} */ (
                form.querySelector(`input[name="${name}"]:checked`));
            return (chosen === null) ? '' : chosen.value;
        };
        /** @type {Object<string, any>} */
        const raw = {};
        for (const field of TEXT_FIELDS) {
            raw[field] = input(field).value;
        }
        raw['eta_t'] = radio('eta_t');
        raw['level'] = radio('level');
        raw['curtailed'] = input('curtailed').checked;
        raw['plaxis'] = input('plaxis').checked;
        return /** @type {RawInputs} */ (raw);
    }

    /**
     * Fill a list or a box with one line of text per entry.
     * @param {HTMLElement} box
     * @param {string[]} lines
     * @param {string} tag
     */
    function fill(box, lines, tag) {
        box.replaceChildren(...lines.map(line => {
            const item = document.createElement(tag);
            item.textContent = line;
            return item;
        }));
    }

    /** The line below the file input, in the chosen language. */
    function show_file_state() {
        if (file_state === null) {
            file_message.textContent = '';
            file_message.className = '';
        } else if (file_state.message !== null) {
            file_message.textContent = message_text(file_state.message, t);
            file_message.className = '';
        } else {
            file_message.textContent = error_text(file_state.error, t);
            file_message.className = 'error';
        }
    }

    /**
     * @param {PointResult[]} points
     * @param {EpsVLevel | null} level
     */
    function show_table(points, level) {
        summary.textContent = summary_text(points, t);
        if (points.length === 0 || norm === null) {
            table_box.replaceChildren();
            shown_table = null;
            export_button.hidden = true;
            return;
        }
        const { head, head_keys, rows, marks, keys } = table(points, norm, t, level);
        shown_table = { head: head, rows: rows };
        export_button.hidden = false;
        let column = head_keys.indexOf(sort.head_key);
        if (column === -1) {
            sort = { head_key: 'table.nr', descending: false };
            column = 0;
        }
        const table_element = document.createElement('table');
        const head_row = table_element.createTHead().insertRow();
        head.forEach((text, i) => {
            const cell = document.createElement('th');
            // a button, so that the head can be used with the keyboard
            const button = document.createElement('button');
            button.type = 'button';
            button.title = t('table.sort');
            let arrow = '';
            if (i === column) {
                arrow = sort.descending ? ' ▼' : ' ▲';
                cell.setAttribute('aria-sort',
                                  sort.descending ? 'descending' : 'ascending');
            }
            button.textContent = text + arrow;
            button.addEventListener('click', () => {
                // first click ascending, second click descending
                sort = { head_key: head_keys[i],
                         descending: sort.head_key === head_keys[i] &&
                                     !sort.descending };
                show_table(points, level);
            });
            cell.append(button);
            head_row.append(cell);
        });
        const body = table_element.createTBody();
        for (const i of sort_order(keys, column, sort.descending)) {
            const table_row = body.insertRow();
            if (marks[i] !== '') {
                table_row.className = marks[i];
            }
            for (const text of rows[i]) {
                table_row.insertCell().textContent = text;
            }
        }
        table_box.replaceChildren(table_element);
    }

    /** Check the input, calculate and show everything. */
    function update() {
        if (norm === null) {
            return;
        }
        const raw = raw_inputs();
        const { params, messages } = check_inputs(raw, norm);
        const shown = shown_messages(messages, touched, source !== null);
        for (const field of form.querySelectorAll('.invalid')) {
            field.classList.remove('invalid');
        }
        for (const message of shown) {
            if (message.field === '') {
                continue;
            }
            const marked = (message.field === 'eta_t' || message.field === 'level') ?
                element(message.field) : input(message.field);
            marked.classList.add('invalid');
        }

        let texts = shown.map(message => message_text(message, t));
        let is_error = true;
        /** @type {Result | null} */
        let result = null;
        const loads = (source === null) ? null :
            loads_from_table(source.table, raw.plaxis);
        if (messages.length === 0) {
            try {
                result = calculate(params, norm, loads);
            } catch (error) {
                texts = [error_text(error, t)];
            }
        } else if (shown.length === 0) {
            // values are still missing, nothing is wrong: a neutral hint
            texts = [t('messages.enter_values')];
            is_error = false;
        }
        if (result !== null &&
            result.points.some(p => p.state === 'no_reinforcement')) {
            // decisions F9 (SIA) and A2 (EN): an error, also shown above
            // the diagram
            texts.push(t((norm === sia262) ? 'messages.no_reinforcement' :
                                             'messages.unreinforced'));
        }
        fill(messages_box, texts, 'p');
        messages_box.className = is_error ? 'error' : 'info';
        messages_box.hidden = texts.length === 0;

        if (result === null) {
            example_note.hidden = true;
            Plotly.purge(diagram);
            diagram.replaceChildren();
            diagram.hidden = true;
            hints_list.replaceChildren();
            show_table([], null);
            return;
        }
        // the box has to have its size before Plotly draws
        diagram.hidden = false;
        const example = example_state.marked;
        example_note.hidden = !example;
        const level = (result.sia === null) ? null : result.sia.section.level;
        const theme = resolve_theme(theme_choice, system_dark.matches);
        const fig = figure(result, norm, t, plot_colors(theme), { example: example });
        draw(Plotly, diagram, fig);
        const info = (source === null) ? null :
            { name: source.name, count: source.table.n.length, plaxis: raw.plaxis };
        fill(hints_list, hints(norm, result, info, t), 'li');
        show_table(result.points, level);
    }

    /**
     * A table was read: keep it and say so.
     * @param {Table} read_table
     * @param {string} name
     */
    function loaded(read_table, name) {
        source = { table: read_table, name: name };
        file_state = { error: null, message: {
            key: 'file.read',
            params: { name: name, count: read_table.n.length,
                      n: read_table.heads.n, m: read_table.heads.m,
                      v: read_table.heads.v } } };
    }

    /**
     * Something could not be read: the old load points are removed,
     * otherwise the diagram would show points of another file.
     * @param {unknown} error
     */
    function failed(error) {
        source = null;
        file_state = { error: error, message: null };
    }

    /** Offer the sheets of the workbook. */
    function show_sheets() {
        sheet_choice.hidden = workbook === null;
        if (workbook === null) {
            sheet_select.replaceChildren();
            return;
        }
        const empty = document.createElement('option');
        empty.value = '';
        empty.textContent = t('file.sheet_choose');
        const options = workbook.workbook.SheetNames.map(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            return option;
        });
        const chosen = sheet_select.value;
        sheet_select.replaceChildren(empty, ...options);
        sheet_select.value = chosen;
    }

    /**
     * Read the file with the load values.
     * @param {File} file
     */
    async function read_file(file) {
        workbook = null;
        try {
            if (/\.csv$/i.test(file.name)) {
                loaded(read_text(await file.text()), file.name);
            } else if (/\.xlsx?$/i.test(file.name)) {
                const book = open_workbook(await file.arrayBuffer(), XLSX);
                if (book.SheetNames.length === 1) {
                    loaded(read_sheet(book, book.SheetNames[0], XLSX), file.name);
                } else {
                    // several sheets: the user chooses
                    workbook = { workbook: book, name: file.name };
                    source = null;
                    file_state = { error: null, message: {
                        key: 'file.choose_sheet',
                        params: { name: file.name, count: book.SheetNames.length } } };
                }
            } else {
                throw new TextError('file.type', { name: file.name });
            }
        } catch (error) {
            failed(error);
        }
        sheet_select.value = '';
        show_sheets();
        show_file_state();
        update();
    }

    /**
     * All texts of the page in the chosen language. The values of the
     * inputs stay; only their decimal sign follows the language.
     */
    function apply_language() {
        document.documentElement.lang = t.lang;
        document.title = t('title');
        for (const node of document.querySelectorAll('[data-i18n]')) {
            const key = /** @type {HTMLElement} */ (node).dataset.i18n || '';
            node.textContent = t(key, TEXT_PARAMS[key]);
        }
        for (const node of document.querySelectorAll('[data-example]')) {
            const field = /** @type {HTMLInputElement} */ (node);
            field.placeholder = t('placeholder', { value: rewrite_number(
                field.dataset.example || '', t.decimal) });
        }
        for (const id of ['d_vp', 'd_vn']) {
            // empty d_v means d (decision F7)
            input(id).placeholder = t('placeholder.d_v');
        }
        for (const node of document.querySelectorAll('[data-number]')) {
            node.textContent = rewrite_number(
                /** @type {HTMLElement} */ (node).dataset.number || '', t.decimal);
        }
        for (const node of document.querySelectorAll('[data-language]')) {
            const button = /** @type {HTMLButtonElement} */ (node);
            const active = button.dataset.language === t.lang;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        }
        for (const field of TEXT_FIELDS) {
            input(field).value = rewrite_number(input(field).value, t.decimal);
        }
        if (norm !== null) {
            element('norm-name').textContent = t(norm.label);
        }
        show_sheets();
        show_file_state();
        update();
    }

    /** The theme on the page and on the buttons; the diagram is drawn again. */
    function apply_theme() {
        document.documentElement.dataset.theme =
            resolve_theme(theme_choice, system_dark.matches);
        for (const node of document.querySelectorAll('[data-theme-choice]')) {
            const button = /** @type {HTMLButtonElement} */ (node);
            const active = button.dataset.themeChoice === theme_choice;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        }
        update();
    }

    /** Show the landing page or the calculator of the norm in the address. */
    function route() {
        const key = window.location.hash.replace('#', '');
        norm = (key in NORMS) ? NORMS[key] : null;
        landing.hidden = norm !== null;
        calculator.hidden = norm === null;
        if (norm === null) {
            return;
        }
        element('norm-name').textContent = t(norm.label);
        // state of the validation, per norm
        const validation = element('validation-footer');
        validation.dataset.i18n = VALIDATION_KEYS[key] ?? 'validation.note';
        validation.textContent = t(validation.dataset.i18n);
        // inputs of the other norm are hidden, their values are kept
        for (const group of document.querySelectorAll('[data-norm]')) {
            /** @type {HTMLElement} */ (group).hidden =
                /** @type {HTMLElement} */ (group).dataset.norm !== key;
        }
        // presets, only where nothing is entered yet
        const presets = { ...norm.defaults, ...PRESETS[key] };
        for (const [field, value] of Object.entries(presets)) {
            if (TEXT_FIELDS.includes(field) && input(field).value.trim() === '') {
                input(field).value = t.num(value);
            }
        }
        update();
    }

    for (const node of document.querySelectorAll('[data-language]')) {
        node.addEventListener('click', () => {
            const lang = /** @type {HTMLElement} */ (node).dataset.language || '';
            if (!LANGUAGES.includes(lang)) {
                return;
            }
            t = translator(lang);
            store(STORAGE_KEY, lang);
            apply_language();
        });
    }
    for (const node of document.querySelectorAll('[data-theme-choice]')) {
        node.addEventListener('click', () => {
            theme_choice = parse_choice(
                /** @type {HTMLElement} */ (node).dataset.themeChoice || null);
            store(THEME_STORAGE_KEY, theme_choice);
            apply_theme();
        });
    }
    system_dark.addEventListener('change', () => {
        if (theme_choice === 'system') {
            apply_theme();
        }
    });

    form.addEventListener('input', event => {
        const target = /** @type {HTMLInputElement} */ (event.target);
        example_state = example_edited(
            example_state, (target.type === 'radio') ? target.name : target.id);
        example_undo.hidden = true;
        update();
    });
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('focusout', event => {
        const target = /** @type {HTMLInputElement} */ (event.target);
        if (target.tagName !== 'INPUT') {
            return;
        }
        // from now on an empty field is an error
        touched.add((target.type === 'radio') ? target.name : target.id);
        if (target.type === 'text') {
            target.value = rewrite_number(target.value, t.decimal);
        }
        update();
    });
    element('undo').addEventListener('click', () => {
        if (example_state.before === null) {
            return;
        }
        const fields = /** @type {Object<string, any>} */ (example_state.before);
        for (const field of TEXT_FIELDS) {
            input(field).value = fields[field];
        }
        for (const radio of form.querySelectorAll('input[name="eta_t"]')) {
            /** @type {HTMLInputElement} */ (radio).checked =
                /** @type {HTMLInputElement} */ (radio).value === fields['eta_t'];
        }
        example_state = NO_EXAMPLE;
        example_undo.hidden = true;
        update();
    });
    element('example').addEventListener('click', () => {
        example_state = example_loaded(example_state, raw_inputs());
        example_undo.hidden = example_state.before === null;
        for (const [field, value] of Object.entries(EXAMPLE)) {
            if (field === 'eta_t') {
                const radio = /** @type {HTMLInputElement | null} */ (
                    form.querySelector(`input[name="eta_t"][value="${value}"]`));
                if (radio !== null) {
                    radio.checked = true;
                }
            } else {
                input(field).value = rewrite_number(value, t.decimal);
            }
        }
        update();
    });

    // the button stands for the hidden file input of the browser
    element('choose-file').addEventListener('click', () => file_input.click());
    file_input.addEventListener('change', () => {
        if (file_input.files !== null && file_input.files.length > 0) {
            read_file(file_input.files[0]);
        }
        // the same file can be chosen again after a correction
        file_input.value = '';
    });
    for (const type of ['dragenter', 'dragover']) {
        drop_zone.addEventListener(type, event => {
            event.preventDefault();
            drop_zone.classList.add('over');
        });
    }
    for (const type of ['dragleave', 'drop']) {
        drop_zone.addEventListener(type, event => {
            event.preventDefault();
            drop_zone.classList.remove('over');
        });
    }
    drop_zone.addEventListener('drop', event => {
        const files = event.dataTransfer ? event.dataTransfer.files : null;
        if (files !== null && files.length > 0) {
            read_file(files[0]);
        }
    });
    sheet_select.addEventListener('change', () => {
        if (workbook === null || sheet_select.value === '') {
            return;
        }
        const name = `${workbook.name} / ${sheet_select.value}`;
        try {
            loaded(read_sheet(workbook.workbook, sheet_select.value, XLSX), name);
        } catch (error) {
            failed(error);
        }
        show_file_state();
        update();
    });
    element('paste-apply').addEventListener('click', () => {
        workbook = null;
        show_sheets();
        try {
            loaded(read_text(paste.value), t('paste.name'));
        } catch (error) {
            failed(error);
        }
        show_file_state();
        update();
    });
    element('remove-file').addEventListener('click', () => {
        source = null;
        workbook = null;
        file_state = null;
        show_sheets();
        show_file_state();
        update();
    });
    export_button.addEventListener('click', () => {
        if (shown_table === null) {
            return;
        }
        const csv = to_csv(shown_table.head, shown_table.rows);
        // byte order mark: Excel reads the file as UTF-8
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = t('export.file_name');
        link.click();
        URL.revokeObjectURL(link.href);
    });

    window.addEventListener('hashchange', route);
    route();
    apply_language();
    apply_theme();
}
