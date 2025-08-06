import { useEffect, useState } from 'react';
import { validationLangs } from './../langs';

export type validationRules = {
  required?: boolean;
  min?: number;
  max?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numeric?: boolean;
  email?: boolean;
  url?: boolean;
};

export type validationHelperProps = {
  value:
    | string
    | string[]
    | number
    | number[]
    | Date
    | Date[]
    | File
    | File[]
    | null;
  rules?: validationRules;
};

export type validationHelperResults = {
  valid: boolean;
  message: string;
};

// =========================>
// ## validation function
// =========================>
export const validationHelper = ({
  value,
  rules,
}: validationHelperProps): validationHelperResults => {
  let errorMessage = '';

  // =========================>
  // ? check required
  // =========================>
  if (rules?.required && !value) {
    errorMessage = validationLangs.required;
  }

  if (value) {
    // =========================>
    // ? check max length
    // =========================>
    if (
      rules?.max &&
      !rules?.min &&
      typeof value === 'string' &&
      value?.length > rules?.max
    ) {
      errorMessage = validationLangs.max.replace(
        /@max/g,
        rules?.max?.toString()
      );
    }

    // =========================>
    // ? check min length
    // =========================>
    if (
      rules?.min &&
      !rules?.max &&
      typeof value === 'string' &&
      value?.length < rules?.min
    ) {
      errorMessage = validationLangs.min.replace(
        /@min/g,
        rules?.min?.toString()
      );
    }

    // =========================>
    // ? check min & max length
    // =========================>
    if (
      rules?.min &&
      rules?.max &&
      typeof value === 'string' &&
      (value?.length < rules?.min || value?.length > rules?.max)
    ) {
      errorMessage = validationLangs.min_max
        .replace(/@min/g, rules?.min?.toString())
        .replace(/@max/g, rules?.max?.toString());
    }

    // =========================>
    // ? check uppercase
    // =========================>
    if (rules?.uppercase && typeof value === 'string' && !/[A-Z]/.test(value)) {
      errorMessage = validationLangs.uppercase;
    }

    // =========================>
    // ? check lowercase
    // =========================>
    if (rules?.lowercase && typeof value === 'string' && !/[a-z]/.test(value)) {
      errorMessage = validationLangs.lowercase;
    }

    // =========================>
    // ? check numeric
    // =========================>
    if (rules?.numeric && typeof value === 'string' && !/[0-9]/.test(value)) {
      errorMessage = validationLangs.numeric;
    }

    // =========================>
    // ? check valid email
    // =========================>
    if (
      rules?.email &&
      typeof value === 'string' &&
      !/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(
        value
      )
    ) {
      errorMessage = validationLangs.email;
    }
  }

  return { valid: !errorMessage, message: errorMessage };
};

// =========================>
// ## validation hook function
// =========================>
export const useValidationHelper = (
  { value, rules }: validationHelperProps,
  sleep?: boolean
): [string] => {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (rules && !sleep) {
      const { valid, message } = validationHelper({ value, rules });
      setMessage(!valid ? message : '');
    }
  }, [value, rules, sleep]);

  return [message];
};
