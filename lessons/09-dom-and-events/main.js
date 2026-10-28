// Connects the page to your code. You do not need to change this file.
import { setupTodoApp } from './exercises/01-todo-app.js';
import { setupProductList } from './exercises/02-product-list.js';
import { products } from './products.js';

setupTodoApp(document.querySelector('#todo-app'));
setupProductList(document.querySelector('#product-app'), products);
