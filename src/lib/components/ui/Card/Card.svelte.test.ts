// Card.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import Card from './Card.svelte';
import { describe, it, expect, vi } from 'vitest';
import { createRawSnippet } from 'svelte';

describe('Card', () => {
	const greet = createRawSnippet((name) => {
		return {
			render: () => `
			<h1>Hello!</h1>
		`,
			setup: (node) => {
				$effect(() => {
					node.textContent = `Hello!`;
				});
			}
		};
	});

	it('renders with default element (article)', () => {
		const { container } = render(Card, {
			props: {
				children: greet
			}
		});
		const el = container.querySelector('article');
		expect(el).toBeTruthy();
		expect(el?.getAttribute('role')).toBe('button');
		expect(el?.getAttribute('tabindex')).toBe('0');
		expect(el?.textContent).toContain('Hello!');
	});

	it('renders as button when onclick is provided', async () => {
		const mock = vi.fn();
		const { container } = render(Card, {
			props: {
				children: greet,
				onclick: mock
			}
		});
		const el = container.querySelector('button');
		expect(el).toBeTruthy();
		await fireEvent.click(el!);
		expect(mock).toHaveBeenCalled();
	});

	it('renders header and footer if provided', () => {
		const { getByText } = render(Card, {
			props: {
				header: createRawSnippet(() => ({
					render: () => `<h1>Este es el header</h1>`
				})),
				children: createRawSnippet(() => ({
					render: () => `<div>Cuerpo</div>`
				})),
				footer: createRawSnippet(() => ({
					render: () => `<div>Este es el footer</div>`
				}))
			}
		});

		expect(getByText('Este es el header')).toBeTruthy();
		expect(getByText('Cuerpo')).toBeTruthy();
		expect(getByText('Este es el footer')).toBeTruthy();
	});

	it('applies custom class and body_class', () => {
		const { container } = render(Card, {
			props: {
				class: 'mi-card',
				body_class: 'contenido-card',
				children: createRawSnippet(() => ({
					render: () => `<div>Contenido</div>`
				}))
			}
		});
		const el = container.querySelector('article');
		expect(el?.classList.contains('mi-card')).toBe(true);

		const section = container.querySelector('section');
		expect(section?.classList.contains('contenido-card')).toBe(true);
	});
});
