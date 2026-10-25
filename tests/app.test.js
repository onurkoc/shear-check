// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { check_inputs, loads_from_table, calculate, table, point_mark,
         summary_text, hints, TEXT_FIELDS } from '../app/app.js';
import { sia262 } from '../app/norms/sia262.js';
import { en1992 } from '../app/norms/en1992.js';
import { translator, TEXTS } from '../app/i18n.js';
import { parse_choice, resolve_theme } from '../app/theme.js';
import { to_csv } from '../app/export.js';

/** @typedef {import('../app/app.js').RawInputs} RawInputs */

/**
 * @param {Partial<RawInputs>} values
 * @returns {RawInputs}
 */
function raw(values) {
    /** @type {Object<string, any>} */
    const empty = { eta_t: '', level: '', curtailed: false, plaxis: true };
    for (const field of TEXT_FIELDS) {
        empty[field] = '';
    }
    return /** @type {RawInputs} */ ({ ...empty, ...values });
}

const SIA_RAW = raw({ h_: '0,30', a_sp: '5.65', c_p: '0.05', a_sn: '5.65', c_n: '0.05',
                      f_ck: '30', gamma_c: '1.5', f_yk: '500', gamma_s: '1.15',
                      d_max: '32', eta_t: '1.0', level: 'level2' });
const EN_RAW = raw({ h_: '0.30', a_sp: '5.65', c_p: '0.05', a_sn: '2', c_n: '0.06',
                     f_ck: '30', gamma_c: '1.5', alpha_cc: '1.0',
                     c_rd_c_gamma: '0.18', k_1: '0.15' });

test('SIA: complete input, d_v empty means d (F7)', () => {
    const { params, messages } = check_inputs(SIA_RAW, sia262);
    assert.deepEqual(messages, []);
    assert.ok(Math.abs(params.sides['+'].d_v - 0.25) < 1e-12);
    assert.equal(params.level, 'level2');
});

test('SIA: eta_t and the level have no preset', () => {
    const { messages } = check_inputs({ ...SIA_RAW, eta_t: '', level: '' }, sia262);
    const keys = messages.map(m => m.key);
    assert.ok(keys.includes('check.eta_t_missing'));
    assert.ok(keys.includes('check.level_missing'));
});

test('c = 0 is rejected (d = h - c, c is the distance to the reinforcement)', () => {
    const { messages } = check_inputs({ ...EN_RAW, c_p: '0' }, en1992);
    assert.ok(messages.some(m => m.field === 'c_p' && m.key === 'check.positive'));
});

test('EN without reinforcement on the tension side: no check, marked red (A2)', () => {
    const { params, messages } = check_inputs({ ...EN_RAW, a_sp: '0' }, en1992);
    assert.deepEqual(messages, []);
    const loads = { n: [300, 300], m: [10, -10], v: [50, 50], rows: [2, 3] };
    const result = calculate(params, en1992, loads);
    const [p, q] = result.points;
    assert.equal(p.state, 'no_reinforcement');
    assert.equal(p.utilization, null);
    assert.equal(p.v_rd, null);
    assert.equal(q.state === 'ok' || q.state === 'exceeded', true);
    const t = translator('de');
    const shown = table(result.points, en1992, t, null);
    // all rows have the same number of cells as the head
    assert.ok(shown.rows.every(row => row.length === shown.head.length));
    assert.equal(shown.marks[0], 'outside');
    assert.ok(shown.rows[0][shown.rows[0].length - 1].includes(t('note.unreinforced')));
});

test('A2: c > 0 is required everywhere, also without reinforcement', () => {
    let { messages } = check_inputs({ ...EN_RAW, c_p: '' }, en1992);
    assert.ok(messages.some(m => m.field === 'c_p' && m.key === 'check.missing'));
    ({ messages } = check_inputs({ ...EN_RAW, a_sp: '0', c_p: '' }, en1992));
    assert.ok(messages.some(m => m.field === 'c_p' && m.key === 'check.missing'));
    ({ messages } = check_inputs({ ...SIA_RAW, a_sp: '0', c_p: '' }, sia262));
    assert.ok(messages.some(m => m.field === 'c_p' && m.key === 'check.missing'));
    ({ messages } = check_inputs({ ...EN_RAW, a_sp: '0', c_p: '0' }, en1992));
    assert.ok(messages.some(m => m.field === 'c_p' && m.key === 'check.positive'));
});

test('the table shows the d that was used', () => {
    const { params } = check_inputs(EN_RAW, en1992);
    const loads = { n: [300, 300], m: [10, -10], v: [50, 50], rows: [2, 3] };
    const result = calculate(params, en1992, loads);
    assert.deepEqual(result.points.map(p => p.d), [0.30 - 0.05, 0.30 - 0.06]);
});

test('d_v larger than d is rejected', () => {
    const { messages } = check_inputs({ ...SIA_RAW, d_vp: '0.26' }, sia262);
    assert.ok(messages.some(m => m.field === 'd_vp' && m.key === 'check.d_v_above_d'));
});

test('f_ck above 50 is rejected (F10)', () => {
    const { messages } = check_inputs({ ...EN_RAW, f_ck: '55' }, en1992);
    assert.ok(messages.some(m => m.key === 'check.norm'));
});

test('EN needs no f_yk', () => {
    const { messages } = check_inputs(EN_RAW, en1992);
    assert.deepEqual(messages, []);
});

test('Plaxis: the sign of N is turned, not taken as an absolute value', () => {
    const t = { n: [-100, 50, 0], m: [1, 2, 3], v: [4, 5, 6], rows: [2, 3, 4],
                heads: { n: 'N', m: 'M', v: 'V' } };
    assert.deepEqual(loads_from_table(t, true).n, [100, -50, 0]);
    assert.deepEqual(loads_from_table(t, false).n, [-100, 50, 0]);
});

test('EN: points in tension are marked in the table (F1)', () => {
    const { params } = check_inputs(EN_RAW, en1992);
    const loads = { n: [500, -200], m: [10, 10], v: [50, 20], rows: [2, 3] };
    const result = calculate(params, en1992, loads);
    const t = translator('de');
    const shown = table(result.points, en1992, t, null);
    assert.equal(point_mark(result.points[1]), result.points[1].state === 'ok' ?
        'tension' : 'outside');
    assert.ok(shown.rows[1][shown.rows[1].length - 1].includes(t('note.tension')));
    assert.ok(summary_text(result.points, t).includes('Unter Zug: 1.'));
    assert.ok(hints(en1992, result, null, t).length > 0);
});

test('SIA: the whole calculation runs and gives a curve', () => {
    const { params } = check_inputs(SIA_RAW, sia262);
    const loads = { n: [800, 300], m: [20, -30], v: [80, 60], rows: [2, 3] };
    const result = calculate(params, sia262, loads);
    assert.equal(result.points.length, 2);
    assert.equal(result.curves.length, 1);
    assert.ok(result.points.every(p => p.sia !== null && p.sia.m_rd !== null));
    const t = translator('en');
    assert.equal(table(result.points, sia262, t, 'level2').rows.length, 2);
});

test('SIA: eta_t changes m_Rd, not tau_cd (F5)', () => {
    const loads = { n: [500], m: [20], v: [50], rows: [2] };
    const level1 = { ...SIA_RAW, level: 'level1' };
    const a = calculate(check_inputs({ ...level1, eta_t: '0.85' }, sia262).params, sia262, loads);
    const b = calculate(check_inputs({ ...level1, eta_t: '1.0' }, sia262).params, sia262, loads);
    assert.equal(a.points[0].v_rd, b.points[0].v_rd);
    assert.notEqual(a.points[0].sia?.m_rd, b.points[0].sia?.m_rd);
});

test('both languages have the same keys', () => {
    assert.deepEqual(Object.keys(TEXTS.de).sort(), Object.keys(TEXTS.en).sort());
});

test('every data-i18n key of index.html has a text', () => {
    const html = readFileSync(new URL('../app/index.html', import.meta.url), 'utf-8');
    for (const match of html.matchAll(/data-i18n="([^"]+)"/g)) {
        assert.ok(match[1] in TEXTS.de, match[1]);
    }
});

test('theme: stored choice and the system setting', () => {
    assert.equal(parse_choice(null), 'system');
    assert.equal(parse_choice('dark'), 'dark');
    assert.equal(parse_choice('blue'), 'system');
    assert.equal(resolve_theme('system', true), 'dark');
    assert.equal(resolve_theme('system', false), 'light');
    assert.equal(resolve_theme('light', true), 'light');
});

test('CSV: ; as delimiter, quotes where needed', () => {
    assert.equal(to_csv(['a', 'b'], [['1,5', 'x; y']]), 'a;b\r\n1,5;"x; y"\r\n');
});
