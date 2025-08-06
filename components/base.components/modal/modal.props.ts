import { buttonProps } from '../button';

export type modalProps = {
  title: string;
  show: boolean;
  onClose: () => void;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  children?: any;
  tip?: string;
  footer?: any;
};

export type modalConfirmProps = {
  title: string;
  show: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  paint?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  icon?: any;
  children?: any;
  tip?: string;
  submitButton?: buttonProps;
};

export type floatingPageProps = {
  title: string;
  show: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children?: any;
  tip?: string;
  mobileScreen?: {
    size: 'sm' | 'md' | 'lg' | 'xl';
  };
  className?: string;
};
