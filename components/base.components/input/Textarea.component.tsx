import React, { useEffect, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
import { textaeraProps } from './props/textarea.props';

export function TextareaComponent({
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
  leftIcon,
  rightIcon,
  validations,
  tip,
  onlyAlphabet,
  autoUppercase,
  register,
  autoFocus,
  rows,
}: textaeraProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocus, setIsFocus] = useState(false);
  const [isInvalid, setIsInvalid] = useState('');
  const [isFirst, setIsFirst] = useState(true);

  useEffect(() => {
    register?.(name, validations);
  }, [register, name, validations]);

  const [errorMessage] = useValidationHelper(
    {
      value: inputValue,
      rules: validations,
    },
    isFirst
  );

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

  useEffect(() => {
    if (inputValue && typeof inputValue === 'string') {
      let val = inputValue.split('');
      let newVal = '';

      if (onlyAlphabet) {
        val.map((data) => {
          if (data == ' ') {
            newVal += ' ';
          } else if (/[A-Za-z]/.test(data)) {
            newVal += data;
          }
        });
      } else {
        newVal = inputValue;
      }

      if (autoUppercase) newVal = newVal.toUpperCase();

      if (validations?.max) newVal = newVal.slice(0, validations?.max);

      setInputValue(newVal);
    }
  }, [inputValue, onlyAlphabet, autoUppercase, validations]);

  // =========================>
  // ## suggestions handler
  // =========================>

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
          <textarea
            className={`
              ${styles.input}
              ${isInvalid && styles.input__error}
              ${inputField[size || 'md']}
              ${leftIcon && inputPadding['left'][size || 'md']}
              ${rightIcon && inputPadding['right'][size || 'md']}
              scroll_control
            `}
            placeholder={placeholder}
            id={`input_${name}`}
            name={name}
            disabled={disabled}
            value={inputValue}
            onFocus={() => {
              setIsFocus(true);
              onFocus?.();
            }}
            onBlur={() => {
              setTimeout(() => setIsFocus(false), 100);
              onBlur?.();
            }}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsFirst(false);
              !errorMessage && setIsInvalid('');
              onChange?.(e.target.value);
            }}
            autoFocus={autoFocus}
            rows={rows || 2}
          />

          {leftIcon && (
            <FontAwesomeIcon
              className={`
                ${styles.input__icon}
                ${inputIcon['left'][size || 'md']}
                ${
                  isFocus
                    ? 'text-secondary'
                    : isInvalid
                    ? 'text-danger'
                    : 'text-slate-400'
                }
                ${disabled && 'opacity-60'}
              `}
              icon={leftIcon}
            />
          )}

          {rightIcon && (
            <FontAwesomeIcon
              className={`
                ${styles.input__icon}
                ${inputIcon['right'][size || 'md']}
                ${
                  isFocus
                    ? 'text-secondary'
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
