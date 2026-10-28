// A weather widget. It looks a city up, loads the current weather, and draws the result.
// The data comes from Open-Meteo (https://open-meteo.com), which needs no account or API key.
//
// Tests never call the real API. They replace fetch with a fake that returns the same shapes.

// Turn an Open-Meteo weather code into words. Already written for you.
const DESCRIPTIONS = {
	0: 'Clear sky',
	1: 'Mainly clear',
	2: 'Partly cloudy',
	3: 'Overcast',
	45: 'Fog',
	51: 'Light drizzle',
	61: 'Light rain',
	63: 'Rain',
	71: 'Light snow',
	80: 'Rain showers',
	95: 'Thunderstorm',
};

export function describeWeather(code) {
	return DESCRIPTIONS[code] ?? 'Unknown';
}

// Look up the current weather for a city name. Returns { city, temperature, description }.
//
// Step 1. Find the city. Fetch
//   https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1
// The city goes in the URL encoded (encodeURIComponent), so "São Paulo" survives.
// A found city comes back like this. A city that does not exist comes back as {} with no "results".
//   { "results": [{ "name": "Berlin", "latitude": 52.52, "longitude": 13.41 }] }
//
// Step 2. Fetch the weather at that spot:
//   https://api.open-meteo.com/v1/forecast?latitude=<latitude>&longitude=<longitude>&current=temperature_2m,weather_code
// It comes back like this:
//   { "current": { "temperature_2m": 18.5, "weather_code": 0 } }
//
// Return { city: <name from step 1>, temperature: <temperature_2m>, description: describeWeather(<weather_code>) }.
//
// Errors. Throw an Error with exactly these messages:
// - The city lookup response is not ok:         "Could not look up that city"
// - The lookup finds nothing:                   `No city named "Atlantis"` (the name the caller passed in)
// - The forecast response is not ok:            "Could not load the weather"
export async function getWeather(city) {
	// TODO
}

// Draw the weather for `city` inside the `root` element, and show what is happening.
//
// 1. Right away, before any fetch finishes, replace the content of `root` with a paragraph
//    that says "Loading..." and has role="status".
// 2. If getWeather succeeds, replace the content with:
//      <h2>Berlin</h2>
//      <p>18.5°C, Clear sky</p>
// 3. If getWeather fails, replace the content with a paragraph with role="alert" that holds the
//    error message. Do not let the error escape: showWeather never rejects.
//
// Use textContent, not innerHTML, for anything that came from the network or the user.
export async function showWeather(root, city) {
	// TODO
}
