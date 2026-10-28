// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { screen, within } from '@testing-library/dom';
import { beforeAll, expect, test } from 'vitest';
import { contrast, declared, loadPage, setViewport, toPx, trackCount } from '../support/css.js';

let page;
beforeAll(() => {
	page = loadPage(import.meta.dirname, 'index.html');
});

const css = () => readFileSync(join(import.meta.dirname, 'styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const text = (element) => element.textContent.replace(/\s+/g, ' ').trim();
const $ = (selector) => document.querySelector(selector);

test('the file starts with a doctype, and declares English, UTF-8, a viewport, and styles.css', () => {
	expect(page.doctype?.name, 'start the file with <!doctype html>').toBe('html');
	expect(page.documentElement.lang).toBe('en');
	expect(page.querySelector('meta[charset]')?.getAttribute('charset')).toMatch(/^utf-8$/i);
	expect(page.querySelector('meta[name="viewport"]')?.getAttribute('content')).toMatch(/width=device-width/);
	expect(page.querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toBe('styles.css');
});

test('the title names the person and no TODO is left in the page', () => {
	expect(page.title.trim().length, 'a <title>').toBeGreaterThan(3);
	expect(page.body.innerHTML + page.head.innerHTML).not.toMatch(/todo|your name|lorem ipsum/i);
});

test('the page has banner, navigation, main, and contentinfo landmarks, and one h1', () => {
	expect(screen.getByRole('banner')).toBeTruthy();
	expect(screen.getByRole('navigation')).toBeTruthy();
	expect(screen.getByRole('main')).toBeTruthy();
	expect(screen.getByRole('contentinfo')).toBeTruthy();
	expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
});

test('the headings never skip a level', () => {
	const levels = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((heading) => Number(heading.tagName[1]));
	expect(levels[0]).toBe(1);
	levels.forEach((level, i) => {
		if (i > 0) expect(level, `heading ${i + 1} (h${level}) comes after h${levels[i - 1]}`).toBeLessThanOrEqual(levels[i - 1] + 1);
	});
});

test('the main landmark has about, projects, and contact sections, each with an h2', () => {
	for (const id of ['about', 'projects', 'contact']) {
		const section = $(`main section#${id}`);
		expect(section, `a <section id="${id}"> inside <main>`).not.toBeNull();
		expect(section.querySelector('h2'), `an <h2> inside #${id}`).not.toBeNull();
	}
});

test('the nav has at least three links, and each points at a section on the page', () => {
	const links = within(screen.getByRole('navigation')).getAllByRole('link');
	expect(links.length).toBeGreaterThanOrEqual(3);
	for (const link of links) {
		const href = link.getAttribute('href');
		expect(href, `"${text(link)}" links to a #section`).toMatch(/^#.+/);
		expect(document.getElementById(href.slice(1)), `an element with id="${href.slice(1)}"`).not.toBeNull();
	}
});

test('the about section has a paragraph that is at least 20 words', () => {
	const words = [...document.querySelectorAll('#about p')].map((p) => text(p).split(' ').length);
	expect(Math.max(0, ...words), 'words in your longest about paragraph').toBeGreaterThanOrEqual(20);
});

test('the projects section has at least three project articles, each with an h3, a description, and a link', () => {
	const articles = document.querySelectorAll('#projects article');
	expect(articles.length, 'articles inside #projects').toBeGreaterThanOrEqual(3);
	for (const article of articles) {
		expect(article.querySelector('h3'), 'an <h3> in each project').not.toBeNull();
		expect(article.querySelector('p'), 'a <p> in each project').not.toBeNull();
		expect(article.querySelector('a[href]'), 'a link in each project').not.toBeNull();
	}
});

test('the page has at least one image, and every image has alt text', () => {
	expect(document.querySelectorAll('img').length, 'images on the page').toBeGreaterThanOrEqual(1);
	for (const img of document.querySelectorAll('img')) expect(img.getAttribute('alt'), `alt on ${img.getAttribute('src')}`).not.toBeNull();
});

test('the contact form has a labeled name, a labeled email, a labeled message, and a submit button', () => {
	const form = $('#contact form');
	expect(form, 'a <form> inside #contact').not.toBeNull();
	const inside = within(form);
	expect(inside.getByLabelText(/name/i).tagName).toBe('INPUT');
	const email = inside.getByLabelText(/email/i);
	expect(email.getAttribute('type')).toBe('email');
	expect(email.hasAttribute('required'), 'the email field is required').toBe(true);
	expect(inside.getByLabelText(/message/i).tagName).toBe('TEXTAREA');
	expect(inside.getByRole('button', { name: /send|submit/i })).toBeTruthy();
});

test('the stylesheet defines at least four custom properties on :root and uses var() at least five times', () => {
	expect(css().match(/:root\s*{[^}]*}/)?.[0].match(/--[\w-]+\s*:/g)?.length ?? 0, 'custom properties on :root').toBeGreaterThanOrEqual(4);
	expect(css().match(/var\(--/g)?.length ?? 0, 'uses of var(--...)').toBeGreaterThanOrEqual(5);
});

test('the body text has at least 4.5:1 contrast against the page background', () => {
	setViewport(1280);
	const ratio = contrast(declared(document.body, 'color'), declared(document.body, 'background-color'));
	expect(ratio, 'write colors as hex codes on body, or through custom properties that hold hex codes').toBeGreaterThanOrEqual(4.5);
});

test('the stylesheet uses flexbox, grid, and at least one min-width media query', () => {
	expect(css()).toMatch(/display\s*:\s*flex/);
	expect(css()).toMatch(/display\s*:\s*grid/);
	expect(css()).toMatch(/@media\s*\(\s*min-width\s*:/);
});

test('the stylesheet has no fixed widths wider than 400px', () => {
	expect(css().trim().length, 'write your styles in styles.css').toBeGreaterThan(200);
	for (const [, width] of css().matchAll(/(?<![-\w])width\s*:\s*(\d+)px/g)) expect(Number(width), `width: ${width}px`).toBeLessThanOrEqual(400);
});

test('images never grow wider than their container', () => {
	expect(declared($('img'), 'max-width'), 'max-width on img').toBe('100%');
});

test('the projects sit in a grid: one column on a phone, at least two on a wide window', () => {
	const container = $('#projects article')?.parentElement;
	expect(container, 'articles inside #projects').toBeTruthy();
	setViewport(320);
	expect(declared(container, 'display'), 'display on the element that holds the project articles').toBe('grid');
	expect(trackCount(declared(container, 'grid-template-columns')), 'columns at 320px').toBeLessThanOrEqual(1);
	setViewport(1280);
	expect(trackCount(declared(container, 'grid-template-columns')), 'columns at 1280px').toBeGreaterThanOrEqual(2);
	expect(toPx((declared(container, 'column-gap') ?? declared(container, 'gap'))?.split(/\s+/).at(-1)), 'gap between projects').toBeGreaterThan(0);
});
