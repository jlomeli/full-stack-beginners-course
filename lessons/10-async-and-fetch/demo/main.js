import { showWeather } from '../exercises/02-weather.js';

const form = document.querySelector('#search');
const root = document.querySelector('#weather');

form.addEventListener('submit', (event) => {
	event.preventDefault();
	showWeather(root, new FormData(form).get('city').trim());
});
