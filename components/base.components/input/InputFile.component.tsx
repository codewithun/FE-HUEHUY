import React, { useEffect, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { inputFileProps } from './props/input-file.props';
import {
  inputContainer,
  inputField,
  inputIcon,
  inputLabel,
  inputPadding,
  inputTip,
} from './input.decorate';
import styles from './input.module.css';
import { useValidationHelper } from '../../../helpers';

export function InputFileComponent({
  name,
  label,
  placeholder,
  disabled,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  size,
  rightIcon,
  validations,
  tip,
  multiple,
  register,
}: inputFileProps) {
  const [inputValue, setInputValue] = useState<string | File>('');
  const [isFocus, setIsFocus] = useState(false);
  const [isInvalid, setIsInvalid] = useState('');
  const [isFirst, setIsFirst] = useState(true);

  const [errorMessage] = useValidationHelper(
    {
      value: inputValue,
      rules: validations,
    },
    isFirst
  );

  useEffect(() => {
    register?.(name, validations);
  }, [register, name, validations]);

  // =========================>
  // ## invalid handler
  // =========================>
  useEffect(() => {
    setIsInvalid(errorMessage || error || '');
  }, [error, errorMessage]);

  // =========================>
  // ## change value handler
  // =========================>
  useEffect(() => {
    setInputValue(value || '');
    value && setIsFirst(false);
  }, [value]);

  return (
    <>
      <div
        className={`
          ${inputContainer[size || 'md']}
        `}
      >
        <label
          htmlFor={`input_${name}`}
          className={`
            select-none
            ${inputLabel[size || 'md']}
            ${
              isFocus
                ? 'text-primary'
                : isInvalid
                ? 'text-danger'
                : 'text-slate-500'
            }
            ${disabled && 'opacity-60'}
          `}
        >
          {label}
        </label>

        {tip && (
          <small
            className={`
              ${inputTip[size || 'md']}
              ${styles.input__tip}
            `}
          >
            {tip}
          </small>
        )}

        <div className="relative overflow-hidden">
          <input
            type="file"
            className={`
              ${styles.input__file}
              ${styles.input}
              ${isInvalid && styles.input__error}
              ${inputField[size || 'md']}
              ${rightIcon && inputPadding['left'][size || 'md']}
            `}
            placeholder={placeholder}
            id={`input_${name}`}
            name={name}
            disabled={disabled}
            value={''}
            onFocus={(e) => {
              setIsFocus(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              onBlur?.(e);
            }}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsFirst(false);
              !errorMessage && setIsInvalid('');
              onChange?.(e.target.value);
              setIsFocus(false);
            }}
            multiple={multiple}
          />

          {rightIcon && (
            <FontAwesomeIcon
              className={`
                ${styles.input__icon}
                ${inputIcon['right'][size || 'md']}
                ${
                  isFocus
                    ? 'text-primary'
                    : isInvalid
                    ? 'text-danger'
                    : 'text-slate-400'
                }
                ${disabled && 'opacity-60'}
              `}
              icon={rightIcon}
            />
          )}
        </div>

        {isInvalid && (
          <small
            className={`
              overflow-x-hidden
              ${styles.input__error__message}
              ${
                size == 'lg'
                  ? 'text-sm'
                  : size == 'sm'
                  ? 'text-[9px]'
                  : 'text-xs'
              }
            `}
          >
            {isInvalid}
          </small>
        )}
      </div>
    </>
  );
}
