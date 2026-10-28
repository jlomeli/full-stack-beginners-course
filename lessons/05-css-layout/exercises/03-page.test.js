// @vitest-environment jsdom
import { beforeAll, expect, test } from 'vitest';
import { areaRows, declared, loadPage, setViewport, toPx, trackCount } from '../support/css.js';

beforeAll(() => {
	loadPage(import.meta.dirname, '03-page.html');
});

const $ = (selector) => document.querySelector(selector);
const regions = { header: '.page-header', sidebar: '.sidebar', content: '.content', footer: '.page-footer' };

function placement(width) {
	setViewport(width);
	const rows = areaRows(declared($('.page'), 'grid-template-areas'));
	const cell = (name) => {
		const hits = rows.flatMap((row, r) => row.map((n, c) => [n, r, c]).filter(([n]) => n === name));
		return { rows: hits.map(([, r]) => r), cols: hits.map(([, , c]) => c) };
	};
	return { rows, cell, area: (selector) => declared($(selector), 'grid-area')?.trim() };
}

test('the page is a grid with at least 1rem between regions, at most 75rem wide, and centered', () => {
	setViewport(1280);
	const page = $('.page');
	expect(declared(page, 'display'), 'display on .page').toBe('grid');
	expect(toPx((declared(page, 'row-gap') ?? declared(page, 'gap'))?.split(/\s+/)[0]), 'gap on .page').toBeGreaterThanOrEqual(16);
	expect(toPx(declared(page, 'max-width')), 'max-width on .page').toBeGreaterThan(0);
	expect(toPx(declared(page, 'max-width'))).toBeLessThanOrEqual(1200);
	const auto = (side) => declared(page, `margin-${side}`) === 'auto' || declared(page, 'margin-inline') === 'auto' || /^\S+\s+auto(\s+\S+)?(\s+auto)?$/.test(declared(page, 'margin') ?? '');
	expect(auto('left') && auto('right'), 'auto left and right margins on .page').toBe(true);
});

test('a window under 48rem shows one column', () => {
	for (const width of [320, 600, 767]) {
		setViewport(width);
		expect(declared($('.page'), 'display'), `display on .page at ${width}px`).toBe('grid');
		expect(trackCount(declared($('.page'), 'grid-template-columns')), `grid-template-columns at ${width}px`).toBeLessThanOrEqual(1);
		for (const row of areaRows(declared($('.page'), 'grid-template-areas'))) expect(row, `grid-template-areas at ${width}px`).toHaveLength(1);
	}
});

test('a window 48rem and wider shows a fixed sidebar track and a flexible content track', () => {
	for (const width of [768, 1100, 1440]) {
		setViewport(width);
		const columns = declared($('.page'), 'grid-template-columns') ?? '';
		expect(trackCount(columns), `grid-template-columns at ${width}px`).toBe(2);
		const [first, second] = columns.trim().split(/\s+/);
		expect(toPx(first), 'the sidebar track is a fixed length of about 14rem').toBeGreaterThanOrEqual(192);
		expect(toPx(first)).toBeLessThanOrEqual(272);
		expect(second, 'the content track is flexible').toMatch(/^(1fr|minmax\(.*\))$/);
	}
});

test('each region names its grid area after itself', () => {
	setViewport(1100);
	for (const [name, selector] of Object.entries(regions)) {
		expect(declared($(selector), 'grid-area')?.trim(), `grid-area on ${selector}`).toBe(name);
	}
});

test('at 48rem and wider the header and footer span both columns', () => {
	const { rows, cell } = placement(1100);
	expect(rows, 'grid-template-areas on .page at 1100px').toHaveLength(3);
	expect(cell('header').cols.sort()).toEqual([0, 1]);
	expect(cell('footer').cols.sort()).toEqual([0, 1]);
	expect(cell('header').rows[0], 'the header is on the first row').toBe(0);
	expect(cell('footer').rows[0], 'the footer is on the last row').toBe(2);
});

test('at 48rem and wider the sidebar sits to the left of the content, on the same row', () => {
	const { cell } = placement(1100);
	expect(cell('sidebar').rows).toEqual(cell('content').rows);
	expect(cell('sidebar').cols[0]).toBeLessThan(cell('content').cols[0]);
});

test('every region has a background or border, and padding', () => {
	setViewport(1100);
	for (const selector of Object.values(regions)) {
		const element = $(selector);
		const visible = declared(element, 'background-color') ?? declared(element, 'background') ?? declared(element, 'border') ?? declared(element, 'border-width');
		expect(visible, `a background-color or border on ${selector}`).not.toBeNull();
		expect(toPx((declared(element, 'padding') ?? declared(element, 'padding-top'))?.split(/\s+/)[0]), `padding on ${selector}`).toBeGreaterThan(0);
	}
});
