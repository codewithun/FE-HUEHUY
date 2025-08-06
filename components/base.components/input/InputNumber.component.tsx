import React, { useEffect, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
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

export function InputNumberComponent({
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
  maxLength,
  precision,
  negative,
  register,
  autoFocus,
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
    setInputValue(value || '');
    value && setIsFirst(false);
  }, [value]);

  useEffect(() => {
    const val = String(inputValue).split('');
    let newVal: '' | number = '';

    val.map((w) => {
      if (/[0-9]/.test(w)) newVal += w;
      if (w === '-' && negative) newVal += w;
      if (w === '.' && precision) newVal += w;
    });

    if (newVal != '') {
      const cekPrecision = String(newVal).toString().split('.');
      if (precision && cekPrecision[1]?.length > precision)
        newVal = Number(
          cekPrecision[0] + '.' + cekPrecision[1].slice(0, precision)
        );
      if (min && Number(newVal) < min) newVal = min;
      if (max && newVal > max) newVal = max;
      if (maxLength) newVal = Number(newVal?.toString().slice(0, maxLength));
    }

    if (newVal != inputValue) {
      setInputValue(newVal);
      onChange?.(Number(newVal));
    }
  }, [inputValue, max, maxLength, min, negative, onChange, precision]);

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
              const value = e.target.value;
              if (/^-?[0-9]*[.]?([0-9])*$/.test(value) || value === '')
                setInputValue(value);

              setIsFirst(false);
              !errorMessage && setIsInvalid('');
              onChange?.(Number(e.target.value));
            }}
            autoComplete={autocomplete == false ? 'off' : ''}
            autoFocus={autoFocus}
          />

          {leftIcon && (
            <FontAwesomeIcon
              className={`
                ${styles.input__icon}
                ${inputIcon['left'][size || 'md']}
                ${
                  isFocus
                    ? 'text-primary'
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
          <label
            htmlFor={`input_${name}`}
            className={`
                cursor-pointer
                ${inputIcon['right'][size || 'md']}
                ${styles.input__icon}
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
          </label>
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
