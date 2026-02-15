<script lang="ts">
	import { DataTableController, DataTableShell } from '$lib/index.js';

	interface Person {
		id: number;
		name: string;
		age: number;
		email: string;
	}

	const columns: ColumnDef<Person>[] = [
		{
			id: 'id',
			label: 'ID',
			accessor: (row) => row.id,
			sortable: true
		},
		{
			id: 'name',
			label: 'Name',
			accessor: (row) => row.name,
			sortable: true
		},
		{
			id: 'age',
			label: 'Age',
			accessor: (row) => row.age,
			sortable: true
		},
		{
			id: 'email',
			label: 'Email',
			accessor: (row) => row.email,
			sortable: true
		}
	];

	const actions: RowAction<Person>[] = [
		{
			label: 'Edit',
			onClick: (row) => {
				console.log('Editing row', row);
			}
		},
		{
			label: 'Delete',
			danger: true,
			onClick: (row) => {
				console.log('Deleting row', row);
			}
		},
		{
			label: 'Duplicate',
			onClick: (row) => {
				console.log('Duplicating row', row);
			}
		},
		{
			label: 'Export',
			onClick: (row) => {
				console.log('Exporting row', row);
			}
		},
		{
			label: 'Import',
			onClick: (row) => {
				console.log('Importing row', row);
			}
		},
		{
			label: 'Print',
			onClick: (row) => {
				console.log('Printing row', row);
			}
		}
	];

	const controller = new DataTableController<Person>({
		columns,
		pageSize: 50,
		mode: 'pagination'
	});

	$effect.pre(() => {
		controller.setRows(
			[...Array(20000).keys()].map((i) => ({
				id: i,
				name: `Name ${i}`,
				age: i,
				email: `email${i}@example.com`
			}))
		);
	});
</script>

<div class="my-200"><DataTableShell {controller} {actions} /></div>
