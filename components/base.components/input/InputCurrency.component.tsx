import React, { useEffect, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { inputNumberProps } from './props/input-number.props';
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

export function InputCurrencyComponent({
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
  autocomplete,
  leftIcon,
  validations,
  tip,
  min,
  max,
  register,
}: inputNumberProps) {
  const [inputValue, setInputValue] = useState<string | number>('');
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
    setInputValue(formatCurrency(String(value) || ''));
    value && setIsFirst(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // =========================>
  // ## formatting to currency
  // =========================>
  const formatCurrency = (value: string) => {
    let negative = false;

    if (min && Number(value) < min) value = String(min);
    if (max && Number(value) > max) value = String(max);

    if (value.at(0) == '-') {
      value.substring(1);
      negative = true;
    }
    let number_string = value.replace(/[^,\d]/g, '').toString(),
      split = number_string.split(','),
      remaining = split[0].length % 3,
      newVal = split[0].substr(0, remaining),
      block = split[0].substr(remaining).match(/\d{3}/gi);

    if (block) {
      let separator = remaining ? '.' : '';
      newVal += separator + block.join('.');
    }

    newVal = split[1] != undefined ? newVal + ',' + split[1] : newVal;

    return (negative ? '-' : '') + newVal;
  };

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
            className={`
              ${styles.input}
              ${isInvalid && styles.input__error}
              ${inputField[size || 'md']}
              ${leftIcon && inputPadding['left'][size || 'md']}
              ${inputPadding['right'][size || 'md']}
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
              setInputValue(formatCurrency(e.target.value));

              setIsFirst(false);
              !errorMessage && setIsInvalid('');
              onChange?.(Number(e.target.value.replace(/[$.]+/g, '')));
            }}
            autoComplete={autocomplete == false ? 'off' : ''}
          />

          {leftIcon && (
            <FontAwesomeIcon
              className={`
                ${styles.input__icon}
                ${inputIcon['left'][size || 'md']}
                ${
                  isFocus
                    ? 'text-slate-500'
                    : isInvalid
                    ? 'text-danger'
                    : 'text-slate-400'
                }
                ${disabled && 'opacity-60'}
              `}
              icon={leftIcon}
            />
          )}

          {/* {rightIcon && (
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
          )} */}
          {/* <label
            htmlFor={`input_${name}`}
            className={`
                cursor-pointer
                ${inputIcon['right'][size || 'md']}
                ${styles.input__icon}
                ${disabled && 'pointer-events-none opacity-50'}
            `}
          >
            <div className="flex flex-col">
              <FontAwesomeIcon
                className={`
                  text-gray-400 hover:text-primary -mb-1
                `}
                icon={faSortUp}
                onClick={() => setInputValue(Number(inputValue) + 1)}
              />
              <FontAwesomeIcon
                className={`
                  text-gray-400 hover:text-primary -mt-1
              `}
                icon={faSortDown}
                onClick={() => setInputValue(Number(inputValue) - 1)}
              />
            </div>
          </label> */}
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
