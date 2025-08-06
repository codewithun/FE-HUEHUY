import { validationRules } from '../../../../helpers';

export type inputRadioOptionProps = {
  value: any;
  label: any;
};

export type inputRadioProps = {
  name: string;
  label?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => any;
  checked?: boolean;
  color?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  options?: inputRadioOptionProps[];
  placeholder?: string;
  vertical?: boolean;
  validations?: validationRules;
  register?: (name: string, validations?: validationRules) => void;
};
