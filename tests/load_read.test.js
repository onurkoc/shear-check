// @ts-check
// Reading N, M, V from a table (F14).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize_head, column_of, cell_number, read_rows, read_text,
         split_text, delimiter } from '../app/load_read.js';
import { TextError } from '../app/errors.js';

test('heads are normalised: lower case, units, blanks and _ removed', () => {
    assert.equal(normalize_head('N [kN/m]'), 'n');
    assert.equal(normalize_head('M (kNm/m)'), 'm');
    assert.equal(normalize_head('Shear Force'), 'shearforce');
    assert.equal(normalize_head(' N_Ed '), 'ned');
    assert.equal(normalize_head('Nx2D [kN/m]'), 'nx2d');
});

test('exact tokens only: "material" is not M, "Nmin" is not N', () => {
    assert.equal(column_of('Material'), null);
    assert.equal(column_of('N_min [kN/m]'), null);
    assert.equal(column_of('Moment'), 'm');
    assert.equal(column_of('Q [kN/m]'), 'v');
    assert.equal(column_of('V_d'), 'v');
    assert.equal(column_of('Normal Force'), 'n');
});

test('columns in any order, upper or lower case, extra columns ignored', () => {
    const table = read_rows([
        ['X', 'y', 'v [kN/m]', 'Element', 'm [kNm/m]', 'NODE', 'n [kN/m]'],
        [1, 2, 30, 5, 40, 6, -500],
    ]);
    assert.deepEqual(table.n, [-500]);
    assert.deepEqual(table.m, [40]);
    assert.deepEqual(table.v, [30]);
    assert.deepEqual(table.heads, { n: 'n [kN/m]', m: 'm [kNm/m]', v: 'v [kN/m]' });
});

test('Plaxis heads: N, Q, M with units', () => {
    const table = read_rows([['X [m]', 'Y [m]', 'N [kN/m]', 'Q [kN/m]', 'M [kN m/m]'],
                             [0, 0, -1200.5, 12.3, 4.5]]);
    assert.deepEqual([table.n[0], table.v[0], table.m[0]], [-1200.5, 12.3, 4.5]);
});

test('the head row is searched in the first rows', () => {
    const table = read_rows([['Project'], [], ['N', 'M', 'V'], [1, 2, 3]]);
    assert.deepEqual(table.rows, [4]);
});

test('decimal comma and decimal point', () => {
    assert.equal(cell_number('-12,5'), -12.5);
    assert.equal(cell_number('12.5'), 12.5);
    assert.equal(cell_number('1,5e3'), 1500);
    assert.ok(Number.isNaN(cell_number('1.234,5')));
    const table = read_text('N;M;V\n-1200,5;3,25;10,0\n');
    assert.deepEqual([table.n[0], table.m[0], table.v[0]], [-1200.5, 3.25, 10]);
});

test('a missing column names the column and the heads found', () => {
    assert.throws(() => read_rows([['N [kN/m]', 'M [kNm/m]', 'Element'], [1, 2, 3]]),
        (/** @type {any} */ error) => error instanceof TextError &&
            error.key === 'read.missing' && error.params.missing === 'V' &&
            error.params.heads === 'N [kN/m], M [kNm/m], Element');
});

test('an ambiguous column is an error', () => {
    assert.throws(() => read_rows([['N', 'Nx', 'M', 'V'], [1, 2, 3, 4]]),
        (/** @type {any} */ error) => error.key === 'read.ambiguous' &&
            error.params.column === 'N');
});

test('no head row at all', () => {
    assert.throws(() => read_rows([['a', 'b'], [1, 2]]),
        (/** @type {any} */ error) => error.key === 'read.no_header');
});

test('a cell that is not a number names the row and the column', () => {
    assert.throws(() => read_rows([['N', 'M', 'V'], [1, 2, 3], [1, 'x', 3]]),
        (/** @type {any} */ error) => error.key === 'read.not_a_number' &&
            error.params.row === 3 && error.params.column === 'M');
});

test('empty rows are skipped, no values is an error', () => {
    const table = read_rows([['N', 'M', 'V'], [1, 2, 3], [null, null, null], [4, 5, 6]]);
    assert.deepEqual(table.rows, [2, 4]);
    assert.throws(() => read_rows([['N', 'M', 'V']]),
        (/** @type {any} */ error) => error.key === 'read.no_values');
});

test('text tables: tab, ; or , and quotes', () => {
    assert.equal(delimiter('a\tb;c'), '\t');
    assert.equal(delimiter('a;b,c'), ';');
    assert.equal(delimiter('a,b'), ',');
    assert.deepEqual(split_text('N,M,V\r\n"1,5",2,3\r\n'), [['N', 'M', 'V'], ['1,5', '2', '3']]);
    const pasted = read_text('N\tM\tV\n-100\t2,5\t3\n');
    assert.deepEqual([pasted.n[0], pasted.m[0], pasted.v[0]], [-100, 2.5, 3]);
});
