import { validationRules } from '../../../../helpers';

export type inputTimeProps = {
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => any;
  onFocus?: any;
  onBlur?: any;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: any;
  validations?: validationRules;
  tip?: string;
  min?: string;
  max?: string;
  withSecond?: boolean;
  register?: (name: string, validations?: validationRules) => void;
  autoFocus?: boolean;
  setNow?: boolean;
};
