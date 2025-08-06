import { validationRules } from '../../../../helpers';

export type textaeraProps = {
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
  suggestions?: string[];
  autocomplete?: boolean;
  leftIcon?: any;
  rightIcon?: any;
  validations?: validationRules;
  tip?: string;
  onlyAlphabet?: boolean;
  autoUppercase?: boolean;
  autoFocus?: boolean;
  register?: (name: string, validations?: validationRules) => void;
  rows?: number;
};
