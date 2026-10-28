// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { screen, within } from '@testing-library/dom';
import { beforeAll, expect, test } from 'vitest';

const page = new DOMParser().parseFromString(readFileSync(join(import.meta.dirname, '02-signup.html'), 'utf8'), 'text/html');

beforeAll(() => {
	document.documentElement.lang = page.documentElement.lang;
	document.head.innerHTML = page.head.innerHTML;
	document.body.innerHTML = page.body.innerHTML;
});

const text = (element) => element.textContent.replace(/\s+/g, ' ').trim();
const form = () => screen.getByRole('form', { name: /create your account/i });

test('the file starts with a doctype, and declares English, UTF-8, and a viewport', () => {
	expect(page.doctype?.name, 'start the file with <!doctype html>').toBe('html');
	expect(page.documentElement.lang).toBe('en');
	expect(page.querySelector('meta[charset]')?.getAttribute('charset')).toMatch(/^utf-8$/i);
	expect(page.querySelector('meta[name="viewport"]')?.getAttribute('content')).toMatch(/width=device-width/);
});

test('the browser tab title says sign up', () => {
	expect(page.title).toMatch(/sign up/i);
});

test('the page has a main landmark with one h1 that says "Create your account"', () => {
	const headings = screen.getAllByRole('heading', { level: 1 });
	expect(headings).toHaveLength(1);
	expect(text(headings[0])).toMatch(/create your account/i);
	expect(screen.getByRole('main').contains(headings[0])).toBe(true);
});

test('the form is named by the h1 through aria-labelledby', () => {
	expect(form().getAttribute('aria-labelledby')).toBe(screen.getByRole('heading', { level: 1 }).id);
});

test('the form posts to /signup', () => {
	expect(form().getAttribute('method')?.toLowerCase()).toBe('post');
	expect(form().getAttribute('action')).toBe('/signup');
});

test('every field has a visible label tied to it with for and id', () => {
	const controls = [...form().querySelectorAll('input, select, textarea')].filter((control) => control.type !== 'submit' && control.type !== 'hidden');
	expect(controls.length, 'the form has nine controls: four inputs, three radios, a select, and a checkbox').toBeGreaterThanOrEqual(9);
	for (const control of controls) {
		const label = control.labels?.[0];
		expect(label && text(label), `the ${control.type} field "${control.name || control.id}" has a <label for="...">`).toBeTruthy();
		expect(label.htmlFor, 'the label points at the field by id').toBe(control.id);
	}
});

test('every field has an id, and no id is used twice', () => {
	const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
	expect(ids.length, 'give every field an id').toBeGreaterThanOrEqual(9);
	expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
});

test('full name is a required text field that autocompletes as name', () => {
	const input = within(form()).getByLabelText(/full name/i);
	expect(input.getAttribute('type') ?? 'text').toBe('text');
	expect(input.required).toBe(true);
	expect(input.getAttribute('autocomplete')).toBe('name');
});

test('email is a required email field that autocompletes as email', () => {
	const input = within(form()).getByLabelText(/^email/i);
	expect(input.getAttribute('type')).toBe('email');
	expect(input.required).toBe(true);
	expect(input.getAttribute('autocomplete')).toBe('email');
});

test('password is a required password field of at least 8 characters', () => {
	const input = within(form()).getByLabelText(/^password/i);
	expect(input.getAttribute('type')).toBe('password');
	expect(input.required).toBe(true);
	expect(Number(input.getAttribute('minlength'))).toBeGreaterThanOrEqual(8);
	expect(input.getAttribute('autocomplete')).toBe('new-password');
});

test('the password hint is connected to the field with aria-describedby', () => {
	const input = within(form()).getByLabelText(/^password/i);
	const hint = document.getElementById(input.getAttribute('aria-describedby') ?? '');
	expect(hint && text(hint), 'aria-describedby holds the id of the hint paragraph').toMatch(/at least 8 characters/i);
});

test('phone number is an optional telephone field', () => {
	const input = within(form()).getByLabelText(/phone/i);
	expect(input.getAttribute('type')).toBe('tel');
	expect(input.required, 'phone is optional, so do not mark it required').toBe(false);
	expect(input.getAttribute('autocomplete')).toBe('tel');
});

test('experience is a fieldset with a legend and three radios that share one name', () => {
	const group = within(form()).getByRole('group', { name: /experience/i });
	expect(group.tagName).toBe('FIELDSET');
	const radios = within(group).getAllByRole('radio');
	expect(radios).toHaveLength(3);
	expect(new Set(radios.map((radio) => radio.name)).size, 'all three radios use the same name').toBe(1);
	expect(radios[0].name).not.toBe('');
	expect(new Set(radios.map((radio) => radio.value)).size, 'each radio has its own value').toBe(3);
	expect(radios.map((radio) => radio.labels[0]?.textContent.trim())).toEqual(['None', 'Some', 'Experienced']);
	expect(radios.some((radio) => radio.required), 'the choice is required').toBe(true);
});

test('"how did you hear about us" is a select that starts with a blank option', () => {
	const select = within(form()).getByLabelText(/hear about us/i);
	expect(select.tagName).toBe('SELECT');
	expect(select.options[0].value, 'the first option has value=""').toBe('');
	expect(text(select.options[0])).toMatch(/choose one/i);
	expect(select.options.length - 1, 'at least three real options').toBeGreaterThanOrEqual(3);
	expect(select.required).toBe(false);
});

test('the code of conduct checkbox is required', () => {
	const box = within(form()).getByRole('checkbox', { name: /code of conduct/i });
	expect(box.required).toBe(true);
});

test('the form ends with a submit button that says "Create account"', () => {
	const button = within(form()).getByRole('button', { name: /create account/i });
	expect(button.tagName).toBe('BUTTON');
	expect(button.getAttribute('type')).toBe('submit');
});
