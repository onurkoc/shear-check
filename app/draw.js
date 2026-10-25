// @ts-check
/*
Diagram of the shear check for Plotly.

EN 1992-1-1: x = N_Ed (compression positive), y = |V_Ed|, line V_Rd,c(N).
SIA 262: x = |m_d| / m_Rd, y = |v_d|, curve v_Rd(m_d / m_Rd) for level 2,
horizontal line for level 1 and plastic.

figure() only builds the data and the layout, so it can be tested
without a browser. draw() hands them to Plotly. All texts come from the
table of the chosen language (i18n.js).
*/

import { sia262 } from './norms/sia262.js';

/** @typedef {import('./app.js').Result} Result */
/** @typedef {import('./check.js').PointResult} PointResult */
/** @typedef {import('./check.js').SideKey} SideKey */
/** @typedef {import('./norms/en1992.js').Norm} Norm */
/** @typedef {import('./i18n.js').Translator} Translator */
/** @typedef {import('./theme.js').PlotColors} PlotColors */

/**
 * The part of the Plotly library (vendor/plotly-basic-4.1.2.min.js) that is
 * used here. The library is passed as an argument, so this file can be
 * type checked without the library.
 * @typedef {Object} PlotlyLibrary
 * @property {(element: HTMLElement, data: Object[], layout: Object,
 *     config?: Object) => Promise<any>} react
 * @property {(element: HTMLElement) => void} purge
 */

/**
 * @typedef {Object} Figure
 * @property {Object[]} data  traces
 * @property {any} layout
 */

/**
 * Name of the curve of one or both sides.
 * @param {SideKey[]} sides
 * @param {Translator} t
 * @returns {string}
 */
function sides_name(sides, t) {
    if (sides.length === 2) {
        return t('draw.both_sides');
    }
    return t((sides[0] === '+') ? 'side.short.plus' : 'side.short.minus');
}

/**
 * Hover text of a point.
 * @param {PointResult} p
 * @param {boolean} is_sia
 * @param {Translator} t
 * @returns {string}
 */
function hover_point(p, is_sia, t) {
    const u = (p.utilization === null) ? '–' :
        (p.utilization === Infinity) ? '∞' : t.fmt(p.utilization, 3);
    const side = t((p.side === '+') ? 'side.short.plus' : 'side.short.minus');
    const lines = [t('draw.hover.nr', { nr: p.nr, row: p.row })];
    if (is_sia) {
        lines.push(`n_d = ${t.fmt(p.n, 1)} kN/m`, `m_d = ${t.fmt(p.m, 2)} kNm/m`,
                   `v_d = ${t.fmt(p.v, 1)} kN/m`);
        if (p.sia !== null && p.sia.m_rd !== null) {
            lines.push(`m_Rd = ${t.fmt(p.sia.m_rd, 2)} kNm/m`);
        }
        if (p.v_rd !== null) {
            lines.push(`v_Rd = ${t.fmt(p.v_rd, 1)} kN/m`);
        }
    } else {
        lines.push(`N_Ed = ${t.fmt(p.n, 1)} kN/m`, `M_Ed = ${t.fmt(p.m, 2)} kNm/m`,
                   `V_Ed = ${t.fmt(p.v, 1)} kN/m`);
        if (p.v_rd !== null) {
            lines.push(`V_Rd,c = ${t.fmt(p.v_rd, 1)} kN/m`);
        }
    }
    lines.push(`η = ${u}`, side);
    return lines.join('<br>');
}

/**
 * @param {Result} result
 * @param {Norm} norm
 * @param {Translator} t
 * @param {PlotColors} colors
 * @param {{example?: boolean}} [options]
 * @returns {Figure}
 */
export function figure(result, norm, t, colors, { example = false } = {}) {
    const is_sia = norm === sia262;
    /** @type {Object[]} */
    const data = [];
    const curve_colors = [colors.curve, colors.curve2];

    result.curves.forEach((curve, i) => {
        data.push({
            type: 'scatter', mode: 'lines',
            x: curve.x, y: curve.y,
            name: t(is_sia ? 'draw.curve_sia' : 'draw.curve_en',
                    { sides: sides_name(curve.sides, t) }),
            line: { color: curve_colors[i % 2], width: 3,
                    dash: (i === 0) ? 'solid' : 'dash' },
            hovertemplate: is_sia ?
                '%{x:.3f}<br>v_Rd = %{y:.1f} kN/m<extra></extra>' :
                'N_Ed = %{x:.1f} kN/m<br>V_Rd,c = %{y:.1f} kN/m<extra></extra>',
        });
    });

    /**
     * x of a point; null: not drawn (SIA without m_Rd)
     * @param {PointResult} p
     * @returns {number | null}
     */
    const x_of = (p) => is_sia ? (p.sia === null ? null : p.sia.m_ratio) : p.n;

    /**
     * One trace for a group of points.
     * @param {string} name_key
     * @param {(p: PointResult) => boolean} test
     * @param {Object} marker
     */
    const group = (name_key, test, marker) => {
        const points = result.points.filter(p => test(p) && x_of(p) !== null);
        if (points.length === 0) {
            return;
        }
        data.push({
            type: 'scatter', mode: 'markers',
            x: points.map(x_of), y: points.map(p => Math.abs(p.v)),
            name: t(name_key, { count: points.length }),
            marker: marker,
            text: points.map(p => hover_point(p, is_sia, t)),
            hovertemplate: '%{text}<extra></extra>',
        });
    };
    const size = 7;
    if (is_sia) {
        group('draw.points_ok', p => p.state === 'ok',
              { color: colors.ok, size: size, symbol: 'circle' });
        group('draw.points_exceeded', p => p.state === 'exceeded',
              { color: colors.exceeded, size: size, symbol: 'circle' });
        group('draw.points_flexure', p => p.state === 'flexure',
              { color: colors.exceeded, size: size + 2, symbol: 'x' });
    } else {
        // decision F1: points with tension are marked
        group('draw.points_ok', p => p.state === 'ok' && !p.tension,
              { color: colors.ok, size: size, symbol: 'circle' });
        group('draw.points_ok_tension', p => p.state === 'ok' && p.tension,
              { color: colors.ok, size: size + 1, symbol: 'diamond-open',
                line: { width: 2 } });
        group('draw.points_exceeded', p => p.state === 'exceeded' && !p.tension,
              { color: colors.exceeded, size: size, symbol: 'circle' });
        group('draw.points_exceeded_tension', p => p.state === 'exceeded' && p.tension,
              { color: colors.exceeded, size: size + 1, symbol: 'diamond-open',
                line: { width: 2 } });
        // decision A2: plain concrete on the tension side, not checked
        group('draw.points_unreinforced', p => p.state === 'no_reinforcement',
              { color: colors.exceeded, size: size + 2, symbol: 'x' });
    }

    /** @type {Object[]} */
    const shapes = [];
    if (is_sia) {
        // m_d = m_Rd
        shapes.push({ type: 'line', xref: 'x', yref: 'paper', x0: 1, x1: 1,
                      y0: 0, y1: 1,
                      line: { color: colors.zeroline, width: 1, dash: 'dot' } });
    }

    const axis = {
        gridcolor: colors.grid, zerolinecolor: colors.zeroline,
        linecolor: colors.zeroline, automargin: true,
    };
    const title = is_sia ?
        t('draw.title_sia', { level: t('level.' + (result.sia ?
            result.sia.section.level : 'level1')) }) :
        t('draw.title_en');
    const layout = {
        title: { text: title, font: { size: 16 } },
        paper_bgcolor: colors.paper,
        plot_bgcolor: colors.plot,
        font: { color: colors.text, family: 'Arial, Helvetica, sans-serif' },
        margin: { l: 60, r: 20, b: 50, t: 50, pad: 4 },
        hovermode: 'closest',
        hoverlabel: { bgcolor: colors.hover, font: { color: colors.text,
                      family: 'consolas, monospace', size: 12 } },
        autosize: true,
        // decimal sign of the language, a blank for thousands
        separators: t.decimal + ' ',
        xaxis: { ...axis, title: { text: t(is_sia ? 'axis.m_ratio' : 'axis.n_en') },
                 rangemode: is_sia ? 'tozero' : 'normal' },
        yaxis: { ...axis, title: { text: t(is_sia ? 'axis.v_sia' : 'axis.v_en') },
                 rangemode: 'tozero' },
        shapes: shapes,
        legend: { orientation: 'h', x: 0, y: -0.15, yanchor: 'top',
                  bgcolor: colors.legend, font: { size: 12 } },
    };
    if (example) {
        // example values are named in the legend
        /** @type {any} */ (layout.legend).title = { text: t('example.note') };
    }
    return { data: data, layout: layout };
}

/**
 * Draw the figure into an element of the page.
 * @param {PlotlyLibrary} Plotly  the Plotly library
 * @param {HTMLElement} element
 * @param {Figure} fig
 * @returns {Promise<any>}
 */
export function draw(Plotly, element, fig) {
    return Plotly.react(element, fig.data, fig.layout,
                        { responsive: true, displaylogo: false });
}
