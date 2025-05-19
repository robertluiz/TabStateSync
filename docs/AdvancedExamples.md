# Advanced Examples

## React: Shared Counter

```tsx
import { useTabStateSync } from 'tabstatesync';

export function SharedCounter() {
  const [count, setCount] = useTabStateSync('counter', 0);
  return (
    <div>
      <button onClick={() => setCount(count - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

## React: Shared List

```tsx
import { useTabStateSync } from 'tabstatesync';

export function SharedList() {
  const [list, setList] = useTabStateSync('shared-list', []);
  const addItem = () => setList([...list, `Item ${list.length + 1}`]);
  return (
    <div>
      <button onClick={addItem}>Add Item</button>
      <ul>
        {list.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}
```

## Vanilla JS: Shared Counter

```js
import { createTabStateSync } from 'tabstatesync';

const counterSync = createTabStateSync('counter');
const btnInc = document.getElementById('inc');
const btnDec = document.getElementById('dec');
const display = document.getElementById('count');

let count = 0;

btnInc.onclick = () => counterSync.set(++count);
btnDec.onclick = () => counterSync.set(--count);
counterSync.subscribe((v) => {
  count = v;
  display.textContent = v;
});
```

## Vanilla JS: Shared List

```js
import { createTabStateSync } from 'tabstatesync';

const listSync = createTabStateSync('shared-list');
const btnAdd = document.getElementById('add');
const ul = document.getElementById('list');

let list = [];

btnAdd.onclick = () => {
  list.push(`Item ${list.length + 1}`);
  listSync.set([...list]);
};
listSync.subscribe((v) => {
  list = v;
  ul.innerHTML = '';
  list.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });
});
``` 