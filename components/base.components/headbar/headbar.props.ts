export type HeadbarProps = {
  children: any;
  onMenuClick?: () => void;
  onSummaryChange?: (summary: object | null, loading: boolean) => void;
  onHasAccessChange?: (access: number[]) => void;
  onChangeRole?: (role: object | undefined) => void;
};
