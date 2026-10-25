// @ts-check
/*
CSV export of the table of the load points.

Delimiter ';', numbers as shown (decimal sign of the language), so the
file opens in a spreadsheet with a German or an English setting.
*/

/**
 * One cell, in double quotes if it holds ';', '"' or a line break.
 * @param {string} text
 * @returns {string}
 */
export function csv_cell(text) {
    if (/[;"\r\n]/.test(text)) {
        return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
}

/**
 * @param {string[]} head
 * @param {string[][]} rows
 * @returns {string}  lines end with \r\n
 */
export function to_csv(head, rows) {
    return [head].concat(rows)
        .map(row => row.map(csv_cell).join(';'))
        .join('\r\n') + '\r\n';
}
