// @vitest-environment jsdom
import { beforeAll, expect, test } from 'vitest';
import { declared, loadPage, toPx } from '../support/css.js';

beforeAll(() => {
	loadPage(import.meta.dirname, '01-flex.html');
});

const $ = (selector) => document.querySelector(selector);

test('the header is a flex container with the logo and nav at opposite ends', () => {
	expect(declared($('.site-header'), 'display'), 'display on .site-header').toBe('flex');
	expect(declared($('.site-header'), 'justify-content'), 'justify-content on .site-header').toBe('space-between');
});

test('the header centers its contents vertically and has padding', () => {
	expect(declared($('.site-header'), 'align-items')).toBe('center');
	const padding = declared($('.site-header'), 'padding') ?? declared($('.site-header'), 'padding-top');
	expect(toPx(padding?.split(/\s+/)[0]), 'padding on .site-header').toBeGreaterThan(0);
});

test('the nav links sit in a row with at least 1rem between them and no bullets', () => {
	const list = $('.site-nav ul');
	expect(declared(list, 'display'), 'display on .site-nav ul').toBe('flex');
	expect(toPx((declared(list, 'column-gap') ?? declared(list, 'gap'))?.split(/\s+/).at(-1)), 'gap on .site-nav ul').toBeGreaterThanOrEqual(16);
	expect(declared(list, 'list-style-type') ?? declared(list, 'list-style'), 'list-style on .site-nav ul').toMatch(/^none$/);
});

test('the plans are a flex container with a gap that wraps onto new rows', () => {
	const plans = $('.plans');
	expect(declared(plans, 'display'), 'display on .plans').toBe('flex');
	expect(declared(plans, 'flex-wrap'), 'flex-wrap on .plans').toBe('wrap');
	expect(toPx((declared(plans, 'column-gap') ?? declared(plans, 'gap'))?.split(/\s+/).at(-1)), 'gap on .plans').toBeGreaterThanOrEqual(16);
});

test('each plan grows to share the row and starts between 12rem and 20rem wide', () => {
	for (const plan of document.querySelectorAll('.plan')) {
		expect(Number(declared(plan, 'flex-grow')), 'flex-grow on .plan').toBeGreaterThanOrEqual(1);
		const basis = toPx(declared(plan, 'flex-basis'));
		expect(basis, 'flex-basis on .plan, in rem or px').toBeGreaterThanOrEqual(192);
		expect(basis).toBeLessThanOrEqual(320);
	}
});

test('each plan has padding and a border', () => {
	const plan = $('.plan');
	expect(toPx((declared(plan, 'padding') ?? declared(plan, 'padding-top'))?.split(/\s+/)[0]), 'padding on .plan').toBeGreaterThan(0);
	expect(declared(plan, 'border') ?? declared(plan, 'border-top-width'), 'a border on .plan').not.toBeNull();
});

test('each plan is a column so its button can sit at the bottom', () => {
	for (const plan of document.querySelectorAll('.plan')) {
		expect(declared(plan, 'display'), 'display on .plan').toBe('flex');
		expect(declared(plan, 'flex-direction'), 'flex-direction on .plan').toBe('column');
		expect(declared(plan.querySelector('.button'), 'margin-top'), 'margin-top on .plan .button').toBe('auto');
	}
});
