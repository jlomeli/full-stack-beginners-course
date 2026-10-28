# The event loop: predict the output

For each snippet, write what it prints, in order, before you run it. Then run it with `node` to check. Under "Why", explain in your own words what the event loop did. If your prediction was wrong, keep the wrong guess and write what you learned.

## Snippet 1

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
console.log('C');
```

My prediction: 

Why: 

## Snippet 2

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
```

My prediction: 

Why: 

## Snippet 3

```js
async function load() {
	console.log('a');
	await null;
	console.log('b');
}

console.log('c');
load();
console.log('d');
Promise.resolve().then(() => console.log('e'));
setTimeout(() => console.log('f'), 0);
```

My prediction: 

Why:
