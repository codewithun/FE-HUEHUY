import React, { useEffect, useState } from 'react';

import moment from 'moment';
import Calendar from 'react-calendar';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { inputDateProps } from './props/input-date.props';
import { useValidationHelper } from '../../../helpers';
import styles from './input.module.css';
import {
  inputContainer,
  inputField,
  inputIcon,
  inputLabel,
  inputPadding,
} from './input.decorate';

export function InputDateComponent({
  name,
  range,
  disabled,
  placeholder,
  onChange,
  value,
  leftIcon,
  error,
  label,
  validations,
  size,
  min,
  max,
  defaultView,
  register,
  customFocus,
}: inputDateProps) {
  const [inputValue, setInputValue] = useState<Date | Date[] | ''>('');
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
    if (customFocus) {
      customFocus(isFocus);
    }
  }, [customFocus, isFocus]);

  useEffect(() => {
    register?.(name, validations);
  }, [register, name, validations]);

  // =========================>
  // ## invalid handler
  // =========================>
  useEffect(() => {
    setIsInvalid(errorMessage || error || '');
  }, [error, errorMessage]);

  useEffect(() => {
    if (value) {
      if (range && Array.isArray(value)) {
        setInputValue([new Date(value[0]), new Date(value[1])]);
      } else {
        if (typeof value == 'string') {
          let date = value.split('-');
          setInputValue(
            new Date(
              parseInt(date[0]),
              parseInt(date[1]) - 1,
              parseInt(date[2])
            )
          );
        }
      }
    } else {
      setInputValue('');
    }
  }, [value, range]);

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

        <input
          type="hidden"
          name={name}
          value={
            inputValue
              ? !range && !Array.isArray(inputValue)
                ? moment(inputValue).locale('id').format('DD-MM-YYYY')
                : Array.isArray(inputValue)
                ? moment(inputValue[0]).locale('id').format('DD-MM-YYYY') +
                  '|' +
                  moment(inputValue[1]).locale('id').format('DD-MM-YYYY')
                : ''
              : ''
          }
        />

        <div className="relative">
          <input
            readOnly={true}
            id={'input_' + name}
            placeholder={placeholder || ''}
            value={
              inputValue
                ? !range && !Array.isArray(inputValue)
                  ? moment(inputValue).locale('id').format('DD MMMM YYYY')
                  : Array.isArray(inputValue)
                  ? moment(inputValue[0]).locale('id').format('DD MMMM YYYY') +
                    ' - ' +
                    moment(inputValue[1]).locale('id').format('DD MMMM YYYY')
                  : ''
                : ''
            }
            className={`
              ${styles.input}
              ${isInvalid && styles.input__error}
              ${inputField[size || 'md']}
              ${leftIcon && inputPadding['left'][size || 'md']}
              ${inputPadding['right'][size || 'md']}
            `}
            name={''}
            disabled={disabled}
            onFocus={() => {
              setIsFocus(true);
            }}
            autoComplete="off"
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

          <label
            htmlFor={`input_${name}`}
            className={`
                cursor-pointer
                ${inputIcon['right'][size || 'md']}
                ${styles.input__icon}
            `}
          >
            <FontAwesomeIcon
              className={`
                ${
                  isFocus
                    ? 'text-primary'
                    : isInvalid
                    ? 'text-danger'
                    : 'text-slate-400'
                }
                ${disabled && 'opacity-60'}
              `}
              icon={faCalendarDay}
            />
          </label>

          {!disabled && isFocus && (
            <>
              <div
                className="fixed top-0 left-0 z-30 w-full h-full bg-black opacity-30"
                onClick={() => setIsFocus(false)}
              ></div>

              <div
                className={`
                  absolute z-40 w-full min-w-[280px] max-w-[400px] p-5 mr-5 bg-white border-2 rounded-lg shadow-lg pb-20
                `}
              >
                <Calendar
                  onChange={(e: Date | Date[]) => {
                    setIsFirst(false);
                    setInputValue(e);
                    onChange?.(
                      e
                        ? !range && !Array.isArray(e)
                          ? moment(e).locale('id').format('YYYY-MM-DD')
                          : Array.isArray(e)
                          ? moment(e[0]).locale('id').format('YYYY-MM-DD') +
                            '|' +
                            moment(e[1]).locale('id').format('YYYY-MM-DD')
                          : ''
                        : ''
                    );
                    setTimeout(() => setIsFocus(false), 100);
                    setIsInvalid('');
                  }}
                  minDate={min}
                  maxDate={max}
                  value={
                    Array.isArray(inputValue)
                      ? [inputValue[0], inputValue[1]]
                      : inputValue || null
                  }
                  defaultView={defaultView}
                  selectRange={range}
                />
              </div>
            </>
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
