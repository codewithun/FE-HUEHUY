export type filterOptionsProps = {
  label: string;
  value: string | number;
};

export type filterColumnProps = {
  columnLabel?: string;
  type: 'checkbox' | 'select' | 'multiple-select' | 'date' | 'range-date';
  options: filterOptionsProps[];
  value?: string[] | string | number | number[];
  onChange?: (value: string[] | string | number | number[]) => void;
};
