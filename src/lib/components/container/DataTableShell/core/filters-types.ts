export type FilterOperator =
	| 'equals'
	| 'contains'
	| 'greater_than'
	| 'less_than'
	| 'startsWith'
	| 'endsWith'
	| 'not_equals'
	| 'is_empty'
	| 'is_not_empty'
	| 'not_contains'
	| 'in'
	| 'not_in';

export type Operator = 'AND' | 'OR';

export type Filter = [string, FilterOperator, string | number | boolean | string[]];

export type QueryGroup = {
	type: 'group';
	joinOperation: Operator;
	filters: TQueryFilter;
};

export type TQueryFilter = (Filter | QueryGroup)[];

export type QueryStructure = {
	useQuery: boolean;
	joinOperation: Operator;
	filters: TQueryFilter;
};
