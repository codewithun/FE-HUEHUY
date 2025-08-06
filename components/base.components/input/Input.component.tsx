import React, { useEffect, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { inputProps } from './props/input.props';
import {
  inputContainer,
  inputField,
  inputIcon,
  inputLabel,
  inputPadding,
  inputSuggest,
  inputSuggestContainer,
  inputTip,
} from './input.decorate';
import styles from './input.module.css';
import { useValidationHelper } from '../../../helpers';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export function InputComponent({
  type,
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
  suggestions,
  autocomplete,
  leftIcon,
  rightIcon,
  validations,
  tip,
  onlyAlphabet,
  autoUppercase,
  register,
  autoFocus,
}: inputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocus, setIsFocus] = useState(false);
  const [isInvalid, setIsInvalid] = useState('');
  const [isFirst, setIsFirst] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [dataSuggestions, setDataSuggestions] = useState<string[] | undefined>(
    []
  );
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    string[] | undefined
  >([]);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
  useEffect(() => {
    setDataSuggestions(suggestions);
  }, [suggestions]);

  const filterSuggestion = (e: any) => {
    if (dataSuggestions?.length) {
      let filteredSuggestion = [];

      if (e.target.value) {
        filteredSuggestion = dataSuggestions
          .filter(
            (suggestion) =>
              suggestion.toLowerCase().indexOf(e.target.value.toLowerCase()) >
              -1
          )
          .slice(0, 10);
      } else {
        filteredSuggestion = dataSuggestions.slice(0, 10);
      }

      setActiveSuggestion(-1);
      setFilteredSuggestions(filteredSuggestion);
      setShowSuggestions(true);
    }
  };

  const onKeyDownSuggestion = (e: any) => {
    if (dataSuggestions?.length) {
      if (e.keyCode === 13) {
        let resultValue = filteredSuggestions?.at(activeSuggestion);
        setActiveSuggestion(-1);
        setFilteredSuggestions([]);
        setShowSuggestions(false);
        setInputValue(resultValue ? resultValue : inputValue);
        if (onChange) {
          onChange(resultValue ? resultValue : inputValue);
        }
        e.preventDefault();
      } else if (e.keyCode === 38) {
        if (activeSuggestion === 0) {
          return;
        }

        setActiveSuggestion(activeSuggestion - 1);
      } else if (e.keyCode === 40) {
        if (activeSuggestion + 1 >= (filteredSuggestions?.length || 0)) {
          return;
        }

        setActiveSuggestion(activeSuggestion + 1);
      }
    }
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
            type={
              type == 'password'
                ? showPassword
                  ? 'text'
                  : 'password'
                : type || 'text'
            }
            className={`
              ${styles.input}
              ${isInvalid && styles.input__error}
              ${inputField[size || 'md']}
              ${leftIcon && inputPadding['left'][size || 'md']}
              ${rightIcon && inputPadding['right'][size || 'md']}
            `}
            placeholder={placeholder}
            id={`input_${name}`}
            name={name}
            disabled={disabled}
            value={inputValue}
            onFocus={(e) => {
              setIsFocus(true);
              onFocus?.();
              dataSuggestions?.length && filterSuggestion(e);
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
              dataSuggestions?.length && filterSuggestion(e);
            }}
            onKeyDown={(e) => {
              dataSuggestions?.length && onKeyDownSuggestion(e);
            }}
            autoComplete={
              autocomplete == false || dataSuggestions?.length ? 'off' : ''
            }
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

          {type == 'password' && (
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
                cursor-pointer
              `}
              icon={showPassword ? faEyeSlash : faEye}
              onClick={() => setShowPassword(!showPassword)}
            />
          )}
        </div>

        {!!dataSuggestions?.length &&
          showSuggestions &&
          !!filteredSuggestions?.length && (
            <div>
              <ul
                className={`
                  ${inputSuggestContainer[size || 'md']} 
                  ${isFocus ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}
                  ${styles.input__suggest__container}
                `}
              >
                {filteredSuggestions.map((suggestion, key) => {
                  return (
                    <li
                      className={`
                        cursor-pointer hover:bg-light-primary
                        ${inputSuggest[size || 'md']} 
                        ${
                          key == activeSuggestion &&
                          'bg-light-primary text-primary'
                        }
                      `}
                      key={suggestion}
                      onMouseDown={() => {
                        setTimeout(() => setIsFocus(true), 110);
                      }}
                      onMouseUp={() => {
                        setActiveSuggestion(key);
                        setFilteredSuggestions([]);
                        setShowSuggestions(false);
                        setInputValue(filteredSuggestions[key] || inputValue);
                        onChange?.(filteredSuggestions[key] || inputValue);
                        setTimeout(() => setIsFocus(false), 120);
                      }}
                    >
                      {suggestion}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

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
