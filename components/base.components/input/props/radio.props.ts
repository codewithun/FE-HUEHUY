export type radioProps = {
  name: string;
  label?: string;
  disabled?: boolean;
  value?: string;
  onChange?: () => any;
  onClick?: () => any;
  checked?: boolean;
  color?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
};
