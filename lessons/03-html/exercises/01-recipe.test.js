// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { screen, within } from '@testing-library/dom';
import { beforeAll, expect, test } from 'vitest';

const page = new DOMParser().parseFromString(readFileSync(join(import.meta.dirname, '01-recipe.html'), 'utf8'), 'text/html');

beforeAll(() => {
	document.documentElement.lang = page.documentElement.lang;
	document.head.innerHTML = page.head.innerHTML;
	document.body.innerHTML = page.body.innerHTML;
});

const listAfter = (heading) =>
	[...document.querySelectorAll('ul, ol')].find((list) => heading.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING);

const text = (element) => element.textContent.replace(/\s+/g, ' ').trim();

test('the file starts with a doctype', () => {
	expect(page.doctype?.name).toBe('html');
});

test('the page declares English as its language', () => {
	expect(page.documentElement.lang).toBe('en');
});

test('the head declares the UTF-8 character set and a viewport', () => {
	expect(page.querySelector('meta[charset]')?.getAttribute('charset')).toMatch(/^utf-8$/i);
	expect(page.querySelector('meta[name="viewport"]')?.getAttribute('content')).toMatch(/width=device-width/);
});

test('the browser tab title names the recipe', () => {
	expect(page.title).toMatch(/buttermilk pancakes/i);
});

test('the recipe name is the only h1, inside the header', () => {
	const headings = screen.getAllByRole('heading', { level: 1 });
	expect(headings).toHaveLength(1);
	expect(text(headings[0])).toMatch(/buttermilk pancakes/i);
	expect(screen.getByRole('banner').contains(headings[0])).toBe(true);
});

test('headings start at h1 and never skip a level', () => {
	const levels = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((heading) => Number(heading.tagName[1]));
	expect(levels[0], 'the first heading is an h1').toBe(1);
	for (let i = 1; i < levels.length; i++) {
		expect(levels[i], `an h${levels[i]} follows an h${levels[i - 1]}`).toBeLessThanOrEqual(levels[i - 1] + 1);
	}
});

test('the page has a header, a main, and a footer landmark', () => {
	expect(screen.getByRole('banner')).toBeTruthy();
	expect(screen.getByRole('main')).toBeTruthy();
	expect(screen.getByRole('contentinfo')).toBeTruthy();
});

test('the photo has alt text that describes it', () => {
	const image = screen.getByRole('img');
	expect(image.getAttribute('src')).toBe('pancakes.svg');
	const alt = image.getAttribute('alt') ?? '';
	expect(alt.split(/\s+/).filter(Boolean).length, 'describe the photo in at least three words').toBeGreaterThanOrEqual(3);
	expect(alt, 'screen readers already say "image", so leave that out').not.toMatch(/^(an? )?(image|picture|photo) of/i);
});

test('the photo is a figure with a caption', () => {
	const figure = screen.getByRole('figure');
	expect(within(figure).getByRole('img')).toBeTruthy();
	const caption = figure.querySelector('figcaption');
	expect(caption && text(caption)).toBeTruthy();
});

test('servings and times are a description list', () => {
	const terms = [...document.querySelectorAll('dl dt')].map((term) => text(term).replace(/:$/, ''));
	const details = [...document.querySelectorAll('dl dd')].map(text);
	expect(terms).toEqual(['Serves', 'Prep time', 'Cook time']);
	expect(details).toEqual(['4', '10 minutes', '20 minutes']);
});

test('the ingredients are a bulleted list under an Ingredients heading', () => {
	const list = listAfter(screen.getByRole('heading', { level: 2, name: /ingredients/i }));
	expect(list?.tagName, 'a <ul> follows the heading').toBe('UL');
	const items = within(list).getAllByRole('listitem').map(text);
	expect(items).toHaveLength(8);
	expect(items[0]).toMatch(/flour/);
	expect(items[7]).toMatch(/melted butter/);
	for (const item of items) expect(item, 'the list adds the bullets, so remove the "-"').not.toMatch(/^-/);
});

test('the steps are a numbered list, in order, under a Steps heading', () => {
	const list = listAfter(screen.getByRole('heading', { level: 2, name: /steps/i }));
	expect(list?.tagName, 'an <ol> follows the heading').toBe('OL');
	const items = within(list).getAllByRole('listitem').map(text);
	expect(items).toHaveLength(6);
	expect(items[0]).toMatch(/^whisk the flour/i);
	expect(items[5]).toMatch(/^serve warm/i);
	for (const item of items) expect(item, 'the list adds the numbers, so remove "1."').not.toMatch(/^\d+\./);
});

test('the tip is set aside from the main steps', () => {
	const aside = document.querySelector('aside');
	expect(aside && text(aside)).toMatch(/lemon juice/i);
});

test('the footer credits the recipe with a machine-readable date', () => {
	const footer = screen.getByRole('contentinfo');
	expect(text(footer)).toMatch(/course kitchen/i);
	expect(footer.querySelector('time')?.getAttribute('datetime')).toBe('2026-10-01');
});
