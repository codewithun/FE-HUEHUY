export type checkboxProps = {
  name: string;
  label: string;
  disabled?: boolean;
  value?: string;
  onChange?: () => any;
  checked?: boolean;
  color?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
};
