// @vitest-environment jsdom
import { within } from '@testing-library/dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getWeather, showWeather } from './02-weather.js';

const berlin = { results: [{ name: 'Berlin', latitude: 52.52, longitude: 13.41 }] };
const clearSky = { current: { temperature_2m: 18.5, weather_code: 0 } };

function stubWeatherApi({ geocoding = () => Response.json(berlin), forecast = () => Response.json(clearSky) } = {}) {
	const fetchMock = vi.fn(async (url) => (String(url).includes('geocoding-api') ? geocoding() : forecast()));
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

const urlsCalled = (fetchMock) => fetchMock.mock.calls.map(([url]) => new URL(String(url)));

afterEach(() => {
	vi.unstubAllGlobals();
});

test('getWeather returns the city name, temperature, and a description', async () => {
	stubWeatherApi();
	await expect(getWeather('berlin')).resolves.toEqual({ city: 'Berlin', temperature: 18.5, description: 'Clear sky' });
});

test('getWeather puts the city name in the lookup URL, encoded so an & survives', async () => {
	const fetchMock = stubWeatherApi();
	await getWeather('Winston & Salem');
	const lookup = urlsCalled(fetchMock).find((url) => url.hostname === 'geocoding-api.open-meteo.com');
	expect(lookup.searchParams.get('name')).toBe('Winston & Salem');
});

test('getWeather asks the forecast for the latitude and longitude it found', async () => {
	const fetchMock = stubWeatherApi();
	await getWeather('Berlin');
	const forecast = urlsCalled(fetchMock).find((url) => url.hostname === 'api.open-meteo.com');
	expect(forecast.searchParams.get('latitude')).toBe('52.52');
	expect(forecast.searchParams.get('longitude')).toBe('13.41');
	expect(forecast.searchParams.get('current')).toBe('temperature_2m,weather_code');
});

test('getWeather reports a city that does not exist', async () => {
	stubWeatherApi({ geocoding: () => Response.json({}) });
	await expect(getWeather('Atlantis')).rejects.toThrow('No city named "Atlantis"');
});

test('getWeather reports a failed city lookup', async () => {
	stubWeatherApi({ geocoding: () => Response.json({}, { status: 500 }) });
	await expect(getWeather('Berlin')).rejects.toThrow('Could not look up that city');
});

test('getWeather reports a failed forecast', async () => {
	stubWeatherApi({ forecast: () => Response.json({}, { status: 503 }) });
	await expect(getWeather('Berlin')).rejects.toThrow('Could not load the weather');
});

test('getWeather does not ask for the forecast when the city is missing', async () => {
	const fetchMock = stubWeatherApi({ geocoding: () => Response.json({}) });
	await getWeather('Atlantis').catch(() => {});
	expect(fetchMock).toHaveBeenCalledTimes(1);
});

let root;

beforeEach(() => {
	document.body.innerHTML = '<section id="weather"></section>';
	root = within(document.querySelector('#weather'));
});

test('showWeather says "Loading..." before the data arrives', async () => {
	let finish;
	stubWeatherApi({ geocoding: () => new Promise((resolve) => (finish = resolve)) });

	const done = showWeather(document.querySelector('#weather'), 'Berlin');
	expect(root.getByRole('status').textContent).toBe('Loading...');

	finish(Response.json(berlin));
	await done;
});

test('showWeather shows the city and the weather when the data arrives', async () => {
	stubWeatherApi();
	await showWeather(document.querySelector('#weather'), 'Berlin');
	expect(root.getByRole('heading', { name: 'Berlin' })).toBeTruthy();
	expect(root.getByText('18.5°C, Clear sky')).toBeTruthy();
	expect(root.queryByText('Loading...')).toBeNull();
});

test('showWeather shows the error message in an alert when something fails', async () => {
	stubWeatherApi({ geocoding: () => Response.json({}) });
	await showWeather(document.querySelector('#weather'), 'Atlantis');
	expect(root.getByRole('alert').textContent).toBe('No city named "Atlantis"');
	expect(root.queryByText('Loading...')).toBeNull();
});

test('showWeather never rejects, even when fetch itself fails', async () => {
	vi.stubGlobal('fetch', async () => {
		throw new TypeError('Failed to fetch');
	});
	await expect(showWeather(document.querySelector('#weather'), 'Berlin')).resolves.toBeUndefined();
	expect(root.getByRole('alert').textContent).toBe('Failed to fetch');
});

test('a second search replaces the first result', async () => {
	stubWeatherApi();
	await showWeather(document.querySelector('#weather'), 'Berlin');
	stubWeatherApi({ geocoding: () => Response.json({}) });
	await showWeather(document.querySelector('#weather'), 'Atlantis');
	expect(root.queryByRole('heading')).toBeNull();
	expect(root.getByRole('alert')).toBeTruthy();
});

test('showWeather writes network text as text, not as HTML', async () => {
	stubWeatherApi({ geocoding: () => Response.json({ results: [{ name: '<img src=x>', latitude: 1, longitude: 2 }] }) });
	await showWeather(document.querySelector('#weather'), 'x');
	expect(document.querySelector('#weather img')).toBeNull();
	expect(root.getByRole('heading').textContent).toBe('<img src=x>');
});

test('showWeather writes an error message as text, not as HTML', async () => {
	stubWeatherApi({ geocoding: () => Response.json({}) });
	await showWeather(document.querySelector('#weather'), '<img src=x>');
	expect(document.querySelector('#weather img')).toBeNull();
	expect(root.getByRole('alert').textContent).toBe('No city named "<img src=x>"');
});
