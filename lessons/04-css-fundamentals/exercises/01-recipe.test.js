// @vitest-environment jsdom
import { beforeAll, expect, test } from 'vitest';
import { contrast, declared, loadPage, sameColor, toPx } from './support/css.js';

beforeAll(() => {
	loadPage(import.meta.dirname, '01-recipe.html');
});

const $ = (selector) => document.querySelector(selector);
const root = () => document.documentElement;

test('the seven custom properties for colors and spacing are defined on :root', () => {
	for (const name of ['--color-text', '--color-background', '--color-accent', '--color-tip-background']) {
		expect(declared(root(), name), `${name} is a hex color on :root`).toMatch(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
	}
	for (const name of ['--space-small', '--space-medium', '--space-large']) {
		expect(toPx(declared(root(), name)), `${name} is a length in px, rem, or em`).toBeGreaterThan(0);
	}
});

test('the spacing scale grows from small to medium to large', () => {
	const [small, medium, large] = ['--space-small', '--space-medium', '--space-large'].map((name) => toPx(declared(root(), name)));
	expect(small).toBeGreaterThan(0);
	expect(small).toBeLessThan(medium);
	expect(medium).toBeLessThan(large);
});

test('every element uses border-box sizing', () => {
	for (const selector of ['body', 'main', 'header', 'figure', 'img', 'li', '.tip']) {
		expect(declared($(selector), 'box-sizing'), `${selector} has box-sizing: border-box`).toBe('border-box');
	}
});

test('the body text and page background come from the color custom properties', () => {
	expect(sameColor(declared($('body'), 'color'), declared(root(), '--color-text'))).toBe(true);
	expect(sameColor(declared($('body'), 'background-color'), declared(root(), '--color-background'))).toBe(true);
});

test('the body text has at least 4.5:1 contrast against the background', () => {
	const ratio = contrast(declared($('body'), 'color'), declared($('body'), 'background-color'));
	expect(ratio, 'text and background contrast ratio').toBeGreaterThanOrEqual(4.5);
});

test('the body uses a font stack that ends in a generic family, with a readable line height', () => {
	expect(declared($('body'), 'font-family')).toMatch(/(sans-serif|serif|system-ui|monospace)\s*$/);
	const lineHeight = Number(declared($('p'), 'line-height'));
	expect(lineHeight, 'a unitless line-height between 1.4 and 1.8').toBeGreaterThanOrEqual(1.4);
	expect(lineHeight).toBeLessThanOrEqual(1.8);
});

test('h1 and h2 use the accent color, and it has at least 4.5:1 contrast on the background', () => {
	for (const selector of ['h1', 'h2']) {
		expect(sameColor(declared($(selector), 'color'), declared(root(), '--color-accent')), `${selector} uses --color-accent`).toBe(true);
	}
	expect(contrast(declared(root(), '--color-accent'), declared($('body'), 'background-color'))).toBeGreaterThanOrEqual(4.5);
});

test('h1 is larger than h2, and h2 is larger than the body text', () => {
	const h1 = toPx(declared($('h1'), 'font-size'));
	const h2 = toPx(declared($('h2'), 'font-size'));
	const body = toPx(declared($('p'), 'font-size')) ?? 16;
	expect(h1, 'h1 has a font-size in rem or px').not.toBeNull();
	expect(h2, 'h2 has a font-size in rem or px').not.toBeNull();
	expect(h1).toBeGreaterThan(h2);
	expect(h2).toBeGreaterThan(body);
});

test('main is no wider than 50rem, centered, and padded with --space-medium', () => {
	const main = $('main');
	expect(toPx(declared(main, 'max-width')), 'max-width of 50rem (800px) or less').toBeLessThanOrEqual(800);
	expect(toPx(declared(main, 'max-width'))).toBeGreaterThan(0);
	const centered = (side) => declared(main, `margin-${side}`) === 'auto' || declared(main, 'margin-inline') === 'auto';
	expect(centered('left') && centered('right'), 'auto left and right margins').toBe(true);
	const padding = declared(main, 'padding-left') ?? declared(main, 'padding-inline') ?? declared(main, 'padding');
	expect(toPx(padding?.split(/\s+/).at(-1)), 'padding on main').toBe(toPx(declared(root(), '--space-medium')));
});

test('the image never grows wider than its container', () => {
	expect(declared($('img'), 'max-width')).toBe('100%');
	expect(declared($('img'), 'height')).toBe('auto');
});

test('the tip has its own background, an accent left border, and padding', () => {
	const tip = $('.tip');
	expect(sameColor(declared(tip, 'background-color'), declared(root(), '--color-tip-background')), 'background-color is --color-tip-background').toBe(true);
	expect(sameColor(declared(tip, 'background-color'), declared($('body'), 'background-color')), 'the tip stands out from the page').toBe(false);
	const border = declared(tip, 'border-left') ?? `${declared(tip, 'border-left-width')} ${declared(tip, 'border-left-style')} ${declared(tip, 'border-left-color')}`;
	expect(border).toMatch(/\b4px\b/);
	expect(border).toMatch(/\bsolid\b/);
	expect(border.toLowerCase()).toContain(declared(root(), '--color-accent').toLowerCase());
	const padding = declared(tip, 'padding-left') ?? declared(tip, 'padding-inline') ?? declared(tip, 'padding');
	expect(toPx(padding?.split(/\s+/).at(-1)), 'padding on .tip').toBe(toPx(declared(root(), '--space-medium')));
});

test('the terms in the meta list are bold', () => {
	const weight = declared($('.meta dt'), 'font-weight');
	expect(weight === 'bold' || Number(weight) >= 600, 'font-weight of 600 or more').toBe(true);
});

test('list items after the first have space above them, and the first does not', () => {
	const [first, second] = document.querySelectorAll('ul li');
	expect(toPx(declared(second, 'margin-top')), 'the second item has margin-top: var(--space-small)').toBe(toPx(declared(root(), '--space-small')));
	expect(toPx(declared(second, 'margin-top')), 'the second item has a margin-top').toBeGreaterThan(0);
	expect(declared(first, 'margin-top') ?? '0').toMatch(/^0(px|rem)?$/);
});
