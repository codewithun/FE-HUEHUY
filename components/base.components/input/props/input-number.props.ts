import { validationRules } from '../../../../helpers';

export type inputNumberProps = {
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: number;
  onChange?: (value: number) => any;
  onFocus?: any;
  onBlur?: any;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  autocomplete?: boolean;
  leftIcon?: any;
  validations?: validationRules;
  tip?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  precision?: number;
  negative?: boolean;
  autoFocus?: boolean;
  register?: (name: string, validations?: validationRules) => void;
};
