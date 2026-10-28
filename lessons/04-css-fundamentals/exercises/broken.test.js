// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, expect, test } from 'vitest';
import { contrast, declared, loadPage, sameColor, toPx } from './support/css.js';

beforeAll(() => {
	loadPage(import.meta.dirname, 'broken.html');
});

const $ = (selector) => document.querySelector(selector);
const firstToken = (value) => toPx(value?.split(/\s+/)[0]);

test('the page title is white on the dark header, not gray', () => {
	const title = $('#page-title');
	expect(sameColor(declared(title, 'color'), '#ffffff'), `h1 color is ${declared(title, 'color')}`).toBe(true);
	expect(contrast(declared(title, 'color'), declared($('.site-header'), 'background-color'))).toBeGreaterThanOrEqual(4.5);
});

test('the "Return it" button is red and the other buttons stay blue', () => {
	expect(sameColor(declared($('.button-danger'), 'background-color'), '#b91c1c'), `.button-danger background is ${declared($('.button-danger'), 'background-color')}`).toBe(true);
	for (const button of document.querySelectorAll('.button:not(.button-danger)')) {
		expect(sameColor(declared(button, 'background-color'), '#1d4ed8'), `${button.textContent} is blue`).toBe(true);
	}
});

test('the "Preview" button is smaller than the "Borrow" button', () => {
	const small = declared($('.button-small'), 'padding');
	const normal = declared($('.button:not(.button-small)'), 'padding');
	expect(firstToken(small), `"Preview" padding is ${small}`).toBe(toPx('0.25rem'));
	expect(firstToken(normal), `"Borrow" padding is ${normal}`).toBe(toPx('0.75rem'));
});

test('paragraphs in the featured card are 1.25rem and the other paragraphs are 1rem', () => {
	for (const paragraph of document.querySelectorAll('.featured p')) {
		expect(toPx(declared(paragraph, 'font-size')), `font-size of "${paragraph.textContent.slice(0, 20)}..."`).toBe(20);
	}
	expect(toPx(declared($('.card:not(.featured) p'), 'font-size'))).toBe(16);
	expect(toPx(declared($('.site-header p'), 'font-size'))).toBe(16);
});

test('the note is dark orange', () => {
	const note = $('.note');
	expect(sameColor(declared(note, 'color'), '#92400e'), `note color is ${declared(note, 'color')}`).toBe(true);
});

test('the stylesheet does not use !important', () => {
	const css = readFileSync(join(import.meta.dirname, 'broken.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
	expect(css).not.toMatch(/!\s*important/i);
});
