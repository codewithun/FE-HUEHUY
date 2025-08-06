import { postProps } from './../../../helpers/api.helpers';
import {
  inputCheckboxProps,
  inputDateProps,
  inputFileProps,
  inputImageProps,
  inputMapProps,
  inputNumberProps,
  inputProps,
  inputRadioProps,
  inputTimeProps,
  selectProps,
} from '../input';
import { validationRules } from '../../../helpers';

export type formProps = {
  construction?:
    | inputProps
    | selectProps
    | inputDateProps
    | inputTimeProps
    | inputNumberProps
    | inputRadioProps
    | inputCheckboxProps
    | inputFileProps
    | inputImageProps
    | inputMapProps;
  col?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  type?:
    | 'default'
    | 'select'
    | 'number'
    | 'currency'
    | 'date'
    | 'time'
    | 'radio'
    | 'check'
    | 'file'
    | 'image'
    | 'map'
    | 'textarea'
    | 'custom';
  custom?: ({
    formControl,
    values,
  }: {
    formControl: (name: string) => {
      onChange?: (value: any) => void;
      register?: (regName: string, reqValidation: validationRules) => void;
      value?: any;
      error?: string;
    };
    values?: { name: string; value?: any }[];
    setValues?: (values: { name: string; value?: any }[]) => void;
    errors?: { name: string; error?: any }[];
    setErrors?: (values: { name: string; error?: any }[]) => void;
    registers?: { name: string; validations?: validationRules | undefined }[];
    setRegisters?: (
      registers: { name: string; validations?: validationRules | undefined }[]
    ) => void;
  }) => any;
};

export type formSupervisionProps = {
  title?: string;
  forms: formProps[];
  submitControl: postProps;
  confirmation?: boolean;
  defaultValue?: object | null;
  onSuccess?: (data: any) => void;
  onError?: (code: number) => void;
  customActionBar?: any;
};
