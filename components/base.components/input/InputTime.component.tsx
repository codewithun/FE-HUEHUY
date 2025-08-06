import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronUp,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { inputTimeProps } from './props/input-time.props';
import { useValidationHelper } from '../../../helpers';
import styles from './input.module.css';
import {
  inputContainer,
  inputField,
  inputIcon,
  inputLabel,
  inputPadding,
} from './input.decorate';
import moment from 'moment';

export function InputTimeComponent({
  name,
  disabled,
  placeholder,
  onChange,
  value,
  leftIcon,
  error,
  label,
  validations,
  size,
  // min,
  // max,
  withSecond,
  register,
  autoFocus,
  setNow,
}: inputTimeProps) {
  const [inputValue, setInputValue] = useState<string>('');
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

  useEffect(() => {
    if (value) {
      setInputValue(value);
      setIsFirst(false);
    } else {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    if (isFocus && setNow) {
      setInputValue(moment().format('HH') + ':00:00');
      setIsFirst(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirst]);

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

        <input type="hidden" name={name} value={inputValue} />

        <div className="relative">
          <input
            readOnly={true}
            id={'input_' + name}
            placeholder={placeholder || ''}
            value={inputValue}
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
              icon={faClock}
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
                  absolute z-40 right-0 w-max py-2 px-4 mt-2 bg-white border-2 rounded-lg shadow-lg 
                `}
              >
                <div className="flex gap-4 items-center">
                  <InputNumberTimeComponent
                    defaultTime={
                      inputValue.split(':')[0]
                        ? Number(inputValue.split(':')[0])
                        : undefined
                    }
                    onChange={(e) => {
                      const splitValue = inputValue.split(':');
                      const newValue = `${e}:${splitValue[1] || '00'}:${
                        splitValue[2] || '00'
                      }`;

                      setIsFirst(false);
                      setInputValue(newValue);
                      onChange?.(newValue);
                    }}
                  />
                  <div className="text-xl font-bold">:</div>
                  <InputNumberTimeComponent
                    max={60}
                    onChange={(e) => {
                      const splitValue = inputValue.split(':');
                      const newValue = `${splitValue[0] || '00'}:${e}:${
                        splitValue[2] || '00'
                      }`;

                      setIsFirst(false);
                      setInputValue(newValue);
                      onChange?.(newValue);
                    }}
                  />
                  {withSecond && (
                    <>
                      <div className="text-xl font-bold">:</div>
                      <InputNumberTimeComponent
                        max={60}
                        onChange={(e) => {
                          const splitValue = inputValue.split(':');
                          const newValue = `${splitValue[0] || '00'}:${
                            splitValue[1] || '00'
                          }:${e}`;

                          setIsFirst(false);
                          setInputValue(newValue);
                          onChange?.(newValue);
                        }}
                      />
                    </>
                  )}
                </div>
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

export function InputNumberTimeComponent({
  max,
  onChange,
  defaultTime,
}: {
  max?: number;
  onChange?: (value: string) => any;
  defaultTime?: number;
}) {
  const [time, setTime] = useState('00');
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    if (time) {
      let newTime = time;

      if (Number(time) > (max || 24)) newTime = '00';
      if (Number(time) < 0) newTime = max ? String(max).padStart(2, '0') : '24';

      setTime(newTime);
      onChange?.(newTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, max]);

  useEffect(() => {
    if (defaultTime) {
      let newTime = String(defaultTime);

      if (Number(time) > (max || 24)) newTime = '00';
      if (Number(time) < 0) newTime = max ? String(max).padStart(2, '0') : '24';

      setTime(newTime.padStart(2, '0'));
    } else {
      setTime('00');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTime, max]);

  return (
    <div className="w-14 flex flex-col items-center">
      <div
        className="cursor-pointer"
        onClick={() => setTime(String(Number(time) + 1).padStart(2, '0'))}
      >
        <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
      </div>
      <input
        type="text"
        className={`text-2xl ${
          isInvalid ? 'bg-red-100' : 'bg-background'
        } font-semibold text-center w-full p-2 rounded-md`}
        value={time}
        onChange={(e) => {
          if (/^[0-9\b]+$/.test(e.target.value) || e.target.value == '') {
            setTime(e.target.value);
            setIsInvalid(e.target.value.length > 3);
          }
          // setTime(e.target.value.slice(0, 2));
        }}
        onBlur={() => {
          if (!isInvalid) {
            setTime(time.padStart(2, '0'));
          }
        }}
        onKeyDown={(e) => {
          if (e.keyCode === 38) {
            setTime(String(Number(time) + 1).padStart(2, '0'));
          } else if (e.keyCode === 40) {
            setTime(String(Number(time) - 1).padStart(2, '0'));
          }
        }}
      />
      <div className="cursor-pointer">
        <FontAwesomeIcon
          icon={faChevronDown}
          className="text-sm"
          onClick={() => setTime(String(Number(time) - 1).padStart(2, '0'))}
        />
      </div>
    </div>
  );
}
