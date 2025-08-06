import { filterColumnProps } from './filter.props';
import { paginateProps } from './paginate.props';
export type tableColumnProps = {
  selector: string;
  label: string;
  width?: string;
  sortable?: boolean;
  filter?: filterColumnProps;
};

export type tableProps = {
  columns: tableColumnProps[];
  data: object[];
  pagination?: paginateProps;
  sortBy?: { column: string; direction: 'asc' | 'desc' };
  onChangeSortBy?: (column: string, direction: 'asc' | 'desc') => void;
  search?: string;
  excludeSearch?: boolean;
  onChangeSearch?: (search: string) => void;
  searchableColumn?: string[];
  searchColumn?: string;
  onChangeSearchColumn?: (column: string) => void;
  filter?: object;
  onChangeFilter?: (value: object[]) => void;
  loading?: boolean;
  topBar?: any;
  onRowClick?: (data: object, key: number) => void;
  onRefresh?: () => void;
  headBar?: any;
  noControlBar?: boolean;
  searchable?: boolean;
};
