export type buttonProps = {
  type?: 'submit' | 'button';
  label: string;
  variant?: 'solid' | 'outline' | 'light' | 'simple';
  paint?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  customPaint?: {
    bg?: string;
    color?: string;
    border?: string;
  };
  rounded?: boolean | string;
  block?: boolean;
  className?: string;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | '2xl';
  onClick?: any;
  icon?: any;
  loading?: boolean;
  hover?: boolean;
};

export type iconButtonProps = {
  icon: any;
  type?: 'submit' | 'button';
  variant?: 'solid' | 'outline' | 'light' | 'simple';
  paint?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  customPaint?: {
    bg?: string;
    color?: string;
    border?: string;
  };
  rounded?: boolean | string;
  className?: string;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: any;
  loading?: boolean;
  hover?: boolean;
  tips?: string | undefined;
};
