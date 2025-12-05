import { getContext, setContext } from 'svelte';
import type { DataTableController } from './DataTableController.svelte';

const TABLE_CTX = Symbol('datagrid');

export function provideTable<T>(controller: DataTableController<T>): void {
	setContext(TABLE_CTX, controller);
}

export function useTable<T>(): DataTableController<T> {
	const ctx = getContext<DataTableController<T>>(TABLE_CTX);
	if (!ctx) {
		throw new Error('DataTable context not found');
	}
	return ctx;
}
