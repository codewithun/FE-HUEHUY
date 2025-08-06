export type paginateProps = {
  totalRow: number;
  paginate: number;
  page: number;
  onChange?: (totalRow: number, paginate: number, page: number) => void;
};
