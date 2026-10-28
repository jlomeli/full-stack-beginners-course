import { expect, test } from 'vitest';
import { createCounter } from './02-counter.js';

test('a new counter starts at 0', () => {
	expect(createCounter().value()).toBe(0);
});

test('increment adds 1 and returns the new count', () => {
	const counter = createCounter();
	expect(counter.increment()).toBe(1);
	expect(counter.increment()).toBe(2);
	expect(counter.value()).toBe(2);
});

test('decrement subtracts 1 and can go below 0', () => {
	const counter = createCounter();
	expect(counter.decrement()).toBe(-1);
	expect(counter.value()).toBe(-1);
});

test('reset goes back to 0 and returns it', () => {
	const counter = createCounter();
	counter.increment();
	counter.increment();
	expect(counter.reset()).toBe(0);
	expect(counter.value()).toBe(0);
});

test('the start option sets the first count', () => {
	expect(createCounter({ start: 10 }).value()).toBe(10);
});

test('the step option sets how much each call changes the count', () => {
	const counter = createCounter({ step: 5 });
	expect(counter.increment()).toBe(5);
	expect(counter.increment()).toBe(10);
	expect(counter.decrement()).toBe(5);
});

test('reset goes back to the start option, not 0', () => {
	const counter = createCounter({ start: 100, step: 10 });
	counter.decrement();
	expect(counter.reset()).toBe(100);
});

test('two counters keep separate counts', () => {
	const apples = createCounter();
	const pears = createCounter();
	apples.increment();
	apples.increment();
	pears.increment();
	expect(apples.value()).toBe(2);
	expect(pears.value()).toBe(1);
});

test('code outside the counter cannot change the count', () => {
	const counter = createCounter();
	counter.increment();
	counter.count = 100;
	counter.start = 50;
	counter.step = 7;
	expect(counter.value()).toBe(1);
	expect(counter.increment()).toBe(2);
	expect(counter.reset()).toBe(0);
});

test('the methods still work when you take them off the counter', () => {
	const { increment, value } = createCounter();
	increment();
	increment();
	expect(value()).toBe(2);
});
