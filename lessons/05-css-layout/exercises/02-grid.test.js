// @vitest-environment jsdom
import { beforeAll, expect, test } from 'vitest';
import { declared, loadPage, setViewport, toPx, trackCount } from '../support/css.js';

beforeAll(() => {
	loadPage(import.meta.dirname, '02-grid.html');
});

const $ = (selector) => document.querySelector(selector);
const columnsAt = (width) => {
	setViewport(width);
	return trackCount(declared($('.gallery'), 'grid-template-columns'));
};
const spansTwo = (width) => {
	setViewport(width);
	return /^span\s+2$|^1\s*\/\s*(span\s+2|3)$/.test((declared($('.tile-wide'), 'grid-column') ?? '').trim());
};

test('the gallery is a grid with at least 1rem between tiles, no bullets, and no default margin or padding', () => {
	setViewport(1280);
	const gallery = $('.gallery');
	expect(declared(gallery, 'display'), 'display on .gallery').toBe('grid');
	expect(toPx((declared(gallery, 'column-gap') ?? declared(gallery, 'gap'))?.split(/\s+/).at(-1)), 'gap on .gallery').toBeGreaterThanOrEqual(16);
	expect(declared(gallery, 'list-style-type') ?? declared(gallery, 'list-style')).toBe('none');
	expect(toPx(declared(gallery, 'padding') ?? declared(gallery, 'padding-left')), 'padding on .gallery').toBe(0);
	expect(toPx(declared(gallery, 'margin') ?? declared(gallery, 'margin-left')), 'margin on .gallery').toBe(0);
});

test('a 320px window shows one column', () => {
	expect(columnsAt(320)).toBe(1);
});

test('a 639px window still shows one column, because the first breakpoint is 40rem', () => {
	expect(columnsAt(639)).toBe(1);
});

test('a 640px to 1023px window shows two columns', () => {
	expect(columnsAt(640)).toBe(2);
	expect(columnsAt(1023)).toBe(2);
});

test('a 1024px and wider window shows four columns', () => {
	expect(columnsAt(1024)).toBe(4);
	expect(columnsAt(1440)).toBe(4);
});

test('the wide tile spans two columns from 40rem up, and not in the one-column layout', () => {
	expect(spansTwo(320), 'the wide tile must not span two columns in a one-column grid').toBe(false);
	expect(spansTwo(700), 'grid-column: span 2 at 700px').toBe(true);
	expect(spansTwo(1200), 'grid-column: span 2 at 1200px').toBe(true);
});

test('each swatch fills the tile and keeps a 4:3 shape', () => {
	setViewport(1280);
	const swatch = $('.swatch');
	expect(declared(swatch, 'width'), 'width on .swatch').toBe('100%');
	const [a, b] = (declared(swatch, 'aspect-ratio') ?? '').split('/').map(Number);
	expect(a / (b ?? 1), 'aspect-ratio on .swatch').toBeCloseTo(4 / 3, 2);
});
