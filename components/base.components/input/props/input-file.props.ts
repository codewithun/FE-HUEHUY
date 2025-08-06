import { validationRules } from '../../../../helpers';

export type inputFileProps = {
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string | File;
  onChange?: (value: string) => any;
  onFocus?: any;
  onBlur?: any;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  rightIcon?: any;
  validations?: validationRules;
  tip?: string;
  multiple?: boolean;
  register?: (name: string, validations?: validationRules) => void;
};
