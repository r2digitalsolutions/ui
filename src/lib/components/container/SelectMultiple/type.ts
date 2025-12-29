import type { Snippet } from 'svelte';
import type { ClassValue } from 'svelte/elements';

export interface Option {
	label: string;
	value: string;
	description?: string;
	children?: Option[];
	[key: string]: any;
}

export interface Props {
	parentClass?: ClassValue;
	class?: ClassValue;
	required?: boolean;
	multiple?: boolean;
	debug?: boolean;

	onConfirm?: (selected: Option[]) => void;
	onCancel?: () => void;

	/**
	 * Snippet opcional para personalizar el contenido visual del item.
	 * Importante: el componente seguirá controlando el click / navegación / selección,
	 * pero tú controlas “qué se pinta” dentro.
	 */
	item?: Snippet<[option: Option]>;

	options: Option[];
	value?: Option[];
	label: string;
	name: string;
	placeholder: string;
	errors?: string[];

	/** Activa navegación tipo árbol si los items traen children (o la key indicada). */
	tree?: boolean;

	/** Si tu backend usa otra propiedad distinta a "children", cámbiala aquí. */
	childrenKey?: string;

	/** Si true, permite seleccionar padres además de navegar. */
	selectParents?: boolean;

	/** En modo búsqueda (plano), muestra la ruta padre › hijo debajo del item. */
	showPathInSearch?: boolean;
}
