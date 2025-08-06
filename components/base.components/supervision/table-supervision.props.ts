import { filterColumnProps } from './../table/filter.props';
import { getFilterParams, getProps } from '../../../helpers';
import { formProps } from './form-supervision.props';
import { floatingPageProps } from '../modal';

export type tableSupervisionColumnProps = {
  selector: string;
  label?: string;
  width?: string;
  sortable?: boolean;
  filter?: filterColumnProps;
  item?: any;
  permissionCode?: string;
};

export type tableSupervisionColumnGroupProps = {
  custom: tableSupervisionColumnProps[];
  change: (tableSupervisionColumnProps & { custom: (data: any) => any })[];
  include: (tableSupervisionColumnProps & { before: string })[];
  except: string[];
  searchable: string[];
  exceptSorts: string[];
};

export type tableSupervisionFormGroupProps = {
  size: floatingPageProps['size'];
  custom: formProps[];
  change: formProps[];
  include: formProps[];
  except: string[];
  customDefaultValue: object;
  contentType: 'application/json' | 'multipart/form-data';
};

export type tableSupervisionFormUpdateGroupProps = {
  size: floatingPageProps['size'];
  custom: formProps[];
  change: formProps[];
  include: formProps[];
  except: string[];
  customDefaultValue: (data: object) => object;
};

export type tableSupervisionActionProps = {
  custom: (
    data: object,
    handler: object,
    hasPermission: number[],
    length: number
  ) => any;
  except: ('detail' | 'edit' | 'delete')[];
  include: (data: object, handler: object, hasPermissions: number[]) => any;
};

export type tableSupervisionProps = {
  title?: string;
  fetchControl: getProps;
  setToRefresh?: boolean;
  refreshOnClose?: boolean;
  setToLoading?: boolean;
  customTopBar?: any;
  customTopBarWithForm?: any;
  headBar?: any;
  columnControl?: tableSupervisionColumnGroupProps;
  formControl?: tableSupervisionFormGroupProps;
  formUpdateControl?: tableSupervisionFormUpdateGroupProps;
  actionControl?: tableSupervisionActionProps;
  includeFilters?: getFilterParams[];
  customDetail?: (data: object) => any;
  unUrlPage?: boolean;
  noControlBar?: boolean;
  permissionCode?: number;
  searchable?: boolean;
  updateEndpoint?: string;
  onDetail?: (data: object) => any;
};
