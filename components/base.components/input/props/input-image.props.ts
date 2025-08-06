import { validationRules } from '../../../../helpers';

export type inputImageProps = {
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => any;
  onFocus?: any;
  onBlur?: any;
  error?: string;
  icon?: any;
  validations?: validationRules;
  tip?: string;
  multiple?: boolean;
  uploadUrl?: string;
  uploadFolder?: string;
  crop?: boolean;
  cropSize?: string;
  aspect?: string;
  register?: (name: string, validations?: validationRules) => void;
};
