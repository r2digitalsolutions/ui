import { flushSync, mount, unmount } from 'svelte';
import { expect, test } from 'vitest';
import Component from './Alert.svelte';

test('Alert component', () => {
  // Instantiate the component using Svelte's `mount` API
  const component = mount(Component, {
    target: document.body, // `document` exists because of jsdom
    props: { message: 'Hello World!' }
  });

  expect(document.body.innerHTML).toBe('<button>0</button>');

  // Click the button, then flush the changes so you can synchronously write expectations

  flushSync();

  expect(document.body.innerHTML).toBe('<button>1</button>');

  unmount(component);
});