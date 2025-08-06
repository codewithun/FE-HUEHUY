import { validationRules } from '../../../../helpers';

export type inputMapProps = {
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  value: valueMapProps;
  onChange?: ({}: valueMapProps) => any;
  onFocus?: any;
  onBlur?: any;
  error?: string;
  validations?: validationRules;
  tip?: string;
  register?: (name: string, validations?: validationRules) => void;
};

export type valueMapProps = {
  lat?: number | null;
  lng?: number | null;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  subDistrict?: string;
  postalCode?: string;
};
