// @ts-check
/*
Light / dark / system colour theme (decision F4).

The choice is kept in localStorage; 'system' follows the setting of the
operating system. The page sets data-theme="light" or "dark" on <html>;
style.css has the colours for both, draw.js takes the Plotly colours
from plot_colors().
*/

/** @typedef {'light' | 'dark' | 'system'} ThemeChoice */
/** @typedef {'light' | 'dark'} Theme */

/** The choices, in the order of the switch. */
export const THEME_CHOICES = /** @type {ThemeChoice[]} */ (['light', 'dark', 'system']);

export const THEME_STORAGE_KEY = 'shear-check.theme';

/**
 * The stored choice, 'system' if there is none or it is unknown.
 * @param {string | null} stored
 * @returns {ThemeChoice}
 */
export function parse_choice(stored) {
    return THEME_CHOICES.includes(/** @type {ThemeChoice} */ (stored)) ?
        /** @type {ThemeChoice} */ (stored) : 'system';
}

/**
 * The theme that is shown.
 * @param {ThemeChoice} choice
 * @param {boolean} system_dark  the operating system asks for dark
 * @returns {Theme}
 */
export function resolve_theme(choice, system_dark) {
    if (choice === 'system') {
        return system_dark ? 'dark' : 'light';
    }
    return choice;
}

/**
 * Colours of the diagram.
 * @typedef {Object} PlotColors
 * @property {string} paper  background around the plot
 * @property {string} plot  background of the plot area
 * @property {string} text
 * @property {string} grid
 * @property {string} zeroline
 * @property {string} legend  background of the legend
 * @property {string} curve  resistance curve, first side
 * @property {string} curve2  resistance curve, second side
 * @property {string} ok  points with utilization <= 1
 * @property {string} exceeded  points with utilization > 1
 * @property {string} hover  background of the hover label
 */

/**
 * @param {Theme} theme
 * @returns {PlotColors}
 */
export function plot_colors(theme) {
    if (theme === 'dark') {
        return {
            paper: '#1b1d21', plot: '#23262b', text: '#e4e6ea',
            grid: '#3a3e45', zeroline: '#80858e', legend: '#2c3036',
            curve: '#7fb2e5', curve2: '#e0a458',
            ok: '#5cc08a', exceeded: '#ff6b6b', hover: '#2c3036',
        };
    }
    return {
        paper: '#ffffff', plot: '#f9f7f7', text: '#222222',
        grid: '#e2e2e2', zeroline: '#888888', legend: '#e2e2e2',
        curve: '#1f4e79', curve2: '#b5651d',
        ok: '#2e7d32', exceeded: '#c62828', hover: '#e2e2e2',
    };
}
