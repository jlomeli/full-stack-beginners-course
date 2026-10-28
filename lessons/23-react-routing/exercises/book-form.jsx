import { useState } from 'react';
import { validateBook } from './validate-book.js';

// Finished code from lesson 22, with two additions for editing. You don't change this file.
//
//   <BookForm onSubmit={save} />                       an empty form that reads "Add book"
//   <BookForm initialValues={book} submitLabel="Save changes" onSubmit={save} />
//                                                      a form filled in with a book's values
//
// onSubmit receives { title, author, year } and may return a promise. If it rejects,
// the form shows the error's message and keeps what the user typed.
export function BookForm({ initialValues, submitLabel = 'Add book', onSubmit }) {
	const startValues = initialValues
		? { title: initialValues.title, author: initialValues.author, year: String(initialValues.year) }
		: { title: '', author: '', year: '' };
	const [values, setValues] = useState(startValues);
	const [submitted, setSubmitted] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState('');

	const errors = submitted ? validateBook(values) : {};

	function handleChange(event) {
		setValues({ ...values, [event.target.name]: event.target.value });
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setSubmitted(true);
		if (Object.keys(validateBook(values)).length > 0) return;

		setSaving(true);
		setSaveError('');
		try {
			await onSubmit({ title: values.title.trim(), author: values.author.trim(), year: Number(values.year) });
		} catch (error) {
			setSaveError(error.message);
		} finally {
			setSaving(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} noValidate>
			<Field label="Title" name="title" value={values.title} error={errors.title} onChange={handleChange} />
			<Field label="Author" name="author" value={values.author} error={errors.author} onChange={handleChange} />
			<Field label="Year" name="year" value={values.year} error={errors.year} onChange={handleChange} />
			{saveError && <p role="alert">{saveError}</p>}
			<button type="submit" disabled={saving}>
				{saving ? 'Saving...' : submitLabel}
			</button>
		</form>
	);
}

function Field({ label, name, value, error, onChange }) {
	return (
		<p>
			<label>
				{label} <input name={name} value={value} onChange={onChange} aria-invalid={error ? true : undefined} />
			</label>
			{error && <span> {error}</span>}
		</p>
	);
}
