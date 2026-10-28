// @vitest-environment jsdom
// Write these two tests yourself. Each one renders <BookForm>, acts like a user, and checks what the user sees.
// Delete the expect.fail line in each test and write the test in its place.
// Use 02-book-form.test.jsx as a model.
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookForm } from './02-book-form.jsx';

afterEach(cleanup);

test('shows "Year cannot be in the future" for next year and does not call onSubmit', async () => {
	expect.fail('TODO: write this test');
});

test('calls onSubmit once the user fixes every message and submits again', async () => {
	expect.fail('TODO: write this test');
});
