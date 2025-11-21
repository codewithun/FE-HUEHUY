export type HeadbarProps = {
  children: any;
  onMenuClick?: () => void;
  panel?: 'admin' | 'corporate' | 'user';
  onSummaryChange?: (summary: object | null, loading: boolean) => void;
  onHasAccessChange?: (access: number[]) => void;
  onChangeRole?: (role: object | undefined) => void;
};
