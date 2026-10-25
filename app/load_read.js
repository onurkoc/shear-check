// @ts-check
/*
Read the load values N, M, V from a table: .xlsx / .xls (SheetJS),
.csv, or text pasted from a spreadsheet.

The table holds design values; no load factor is applied.
Columns in any order, extra columns are ignored. The row with the
column heads is searched in the first HEADER_ROWS rows.

Column heads are normalised (lower case, units in [] or () removed,
blanks and _ removed) and then compared with exact tokens. No
"starts with": "material" must not be taken for M.
*/

import { TextError } from './errors.js';

/**
 * The part of the SheetJS library (vendor/xlsx-0.20.3.mjs) that is used here.
 * The library is passed as an argument, so this file can be type
 * checked without the library.
 * @typedef {Object} XlsxLibrary
 * @property {(data: ArrayBuffer | Uint8Array, opts?: Object) =>
 *     {SheetNames: string[], Sheets: Object<string, Object>}} read
 * @property {{sheet_to_json: (sheet: Object, opts?: Object) => any[][]}} utils
 */

/** @typedef {'n' | 'm' | 'v'} Column */

/** Exact tokens of the normalised column heads. */
export const TOKENS = /** @type {Object<Column, string[]>} */ ({
    n: ['n', 'nx', 'nx2d', 'ned', 'nd', 'normalforce'],
    m: ['m', 'm2d', 'med', 'md', 'moment'],
    v: ['v', 'q', 'q2d', 'ved', 'vd', 'shearforce'],
});

const COLUMNS = /** @type {Column[]} */ (['n', 'm', 'v']);

// the row with the column heads is one of the first rows
export const HEADER_ROWS = 20;

/**
 * Raw table as read.
 * @typedef {Object} Table
 * @property {number[]} n  as in the file, sign not changed [kN/m]
 * @property {number[]} m  [kNm/m]
 * @property {number[]} v  [kN/m]
 * @property {number[]} rows  row of each point (1 = first row of the table)
 * @property {{n: string, m: string, v: string}} heads  the heads as found
 */

/**
 * Normalised column head.
 * @param {any} head
 * @returns {string}
 */
export function normalize_head(head) {
    if (head === null || head === undefined) {
        return '';
    }
    return String(head)
        .toLowerCase()
        .replace(/\[[^\]]*\]/g, '')     // units in square brackets
        .replace(/\([^)]*\)/g, '')      // units in round brackets
        .replace(/[\s_]/g, '');
}

/**
 * Which column is it?
 * @param {any} head
 * @returns {Column | null}
 */
export function column_of(head) {
    const name = normalize_head(head);
    for (const column of COLUMNS) {
        if (TOKENS[column].includes(name)) {
            return column;
        }
    }
    return null;
}

/**
 * A cell as a number: a number cell, or text with a decimal point or a
 * decimal comma (and an optional exponent).
 * @param {any} cell
 * @returns {number} NaN: not a number
 */
export function cell_number(cell) {
    if (typeof cell === 'number') {
        return cell;
    }
    if (typeof cell !== 'string') {
        return NaN;
    }
    const text = cell.trim();
    if (!/^[+-]?(\d+([.,]\d*)?|[.,]\d+)([eE][+-]?\d+)?$/.test(text)) {
        return NaN;
    }
    return Number(text.replace(',', '.'));
}

/**
 * @param {any} cell
 * @returns {boolean}
 */
function is_empty(cell) {
    return cell === null || cell === undefined ||
        (typeof cell === 'string' && cell.trim() === '');
}

/**
 * The texts of the non-empty cells of a row, for messages.
 * @param {any[]} row
 * @returns {string}
 */
function heads_text(row) {
    return row.filter(cell => !is_empty(cell)).map(cell => String(cell).trim()).join(', ');
}

/**
 * Find the row with the column heads and the column of N, M and V.
 * @param {any[][]} rows
 * @returns {{index: number, columns: {n: number, m: number, v: number}}}
 */
export function find_header(rows) {
    // the row with the most recognised heads, for the message
    let best = -1;
    let best_count = 0;
    for (let i = 0; i < Math.min(rows.length, HEADER_ROWS); i++) {
        const row = rows[i] || [];
        /** @type {Object<string, number[]>} */
        const found = { n: [], m: [], v: [] };
        row.forEach((cell, j) => {
            const column = column_of(cell);
            if (column !== null) {
                found[column].push(j);
            }
        });
        const count = COLUMNS.filter(c => found[c].length > 0).length;
        if (count > best_count) {
            best = i;
            best_count = count;
        }
        if (count < 3) {
            continue;
        }
        for (const column of COLUMNS) {
            if (found[column].length > 1) {
                throw new TextError('read.ambiguous', {
                    column: column.toUpperCase(),
                    heads: found[column].map(j => String(row[j]).trim()).join(', '),
                    row: i + 1 });
            }
        }
        return { index: i, columns: { n: found.n[0], m: found.m[0], v: found.v[0] } };
    }
    if (best === -1) {
        throw new TextError('read.no_header', { rows: HEADER_ROWS });
    }
    const row = rows[best];
    const present = new Set(row.map(column_of));
    const missing = COLUMNS.filter(c => !present.has(c)).map(c => c.toUpperCase());
    throw new TextError('read.missing', { missing: missing.join(', '),
                                          heads: heads_text(row), row: best + 1 });
}

/**
 * Read the values below the row of the column heads.
 * Rows where N, M and V are all empty are skipped.
 * @param {any[][]} rows  the table, rows as arrays
 * @returns {Table}
 */
export function read_rows(rows) {
    const { index, columns } = find_header(rows);
    const head_row = rows[index];
    /** @type {Table} */
    const table = {
        n: [], m: [], v: [], rows: [],
        heads: { n: String(head_row[columns.n]).trim(),
                 m: String(head_row[columns.m]).trim(),
                 v: String(head_row[columns.v]).trim() },
    };
    for (let i = index + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const cells = COLUMNS.map(c => row[columns[c]]);
        if (cells.every(is_empty)) {
            continue;
        }
        const values = cells.map(cell_number);
        values.forEach((value, k) => {
            if (Number.isNaN(value)) {
                throw new TextError('read.not_a_number', {
                    row: i + 1, column: table.heads[COLUMNS[k]],
                    text: is_empty(cells[k]) ? '' : String(cells[k]).trim() });
            }
        });
        table.n.push(values[0]);
        table.m.push(values[1]);
        table.v.push(values[2]);
        table.rows.push(i + 1);
    }
    if (table.n.length === 0) {
        throw new TextError('read.no_values');
    }
    return table;
}

/**
 * Delimiter of a text table: tab (pasted from a spreadsheet), else ';',
 * else ','. With ',' a decimal comma is possible only in quotes.
 * @param {string} text
 * @returns {string}
 */
export function delimiter(text) {
    if (text.includes('\t')) {
        return '\t';
    }
    if (text.includes(';')) {
        return ';';
    }
    return ',';
}

/**
 * Split a text table into rows of cells. Cells in double quotes may hold
 * the delimiter; "" in quotes is one quote.
 * @param {string} text
 * @returns {string[][]}
 */
export function split_text(text) {
    const sep = delimiter(text);
    /** @type {string[][]} */
    const rows = [];
    /** @type {string[]} */
    let row = [];
    let cell = '';
    let quoted = false;
    // without a byte order mark
    const body = text.replace(/^﻿/, '');
    for (let i = 0; i < body.length; i++) {
        const ch = body[i];
        if (quoted) {
            if (ch === '"' && body[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (ch === '"') {
                quoted = false;
            } else {
                cell += ch;
            }
        } else if (ch === '"') {
            quoted = true;
        } else if (ch === sep) {
            row.push(cell);
            cell = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && body[i + 1] === '\n') {
                i++;
            }
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
        } else {
            cell += ch;
        }
    }
    if (cell !== '' || row.length > 0) {
        row.push(cell);
        rows.push(row);
    }
    return rows;
}

/**
 * Read a .csv file or pasted text.
 * @param {string} text
 * @returns {Table}
 */
export function read_text(text) {
    return read_rows(split_text(text));
}

/**
 * Open a workbook (.xlsx, .xls).
 * @param {ArrayBuffer | Uint8Array} data
 * @param {XlsxLibrary} XLSX
 * @returns {{SheetNames: string[], Sheets: Object<string, Object>}}
 */
export function open_workbook(data, XLSX) {
    return XLSX.read(data, { type: 'array' });
}

/**
 * Read one sheet of a workbook.
 * @param {{SheetNames: string[], Sheets: Object<string, Object>}} workbook
 * @param {string} name  name of the sheet
 * @param {XlsxLibrary} XLSX
 * @returns {Table}
 */
export function read_sheet(workbook, name, XLSX) {
    const sheet = workbook.Sheets[name];
    if (sheet === undefined) {
        throw new TextError('read.no_sheet', { name: name });
    }
    // rows as arrays, empty rows kept so that the row numbers are right
    const rows = XLSX.utils.sheet_to_json(
        sheet, { header: 1, raw: true, defval: null, blankrows: true });
    return read_rows(rows);
}
