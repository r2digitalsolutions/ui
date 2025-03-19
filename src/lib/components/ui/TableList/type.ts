export interface TableListItem {
  name: string;
  href?: string;
  right?: string;
}

export interface Props {
  title?: string;
  items: TableListItem[];
  selected_table: string | null;
  is_loading_tables: boolean;
  search_term: string;
  onSelectTable: (tableName: string) => void;
  onRefreshTables: () => void;
  onSearchChange: (value: string) => void;
}