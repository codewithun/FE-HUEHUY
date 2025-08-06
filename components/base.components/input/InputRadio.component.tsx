import React, { useEffect, useState } from 'react';
import { RadioComponent } from './Radio.component';
import { inputContainer, inputField, inputLabel } from './input.decorate';
import styles from './input.module.css';
import { inputRadioProps } from './props/input-radio.props';

export function InputRadioComponent({
  name,
  label,
  size,
  disabled,
  options,
  vertical,
  value,
  onChange,
  validations,
  register,
}: inputRadioProps) {
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    register?.(name, validations);
  }, [register, name, validations]);

  useEffect(() => {
    if (value) {
      setInputValue(value);
    } else {
      setInputValue('');
    }
  }, [value]);

  return (
    <>
      <div
        className={`
          ${inputContainer}
        `}
      >
        <label
          htmlFor={`input_${name}`}
          className={`
            select-none
            ${inputLabel[size || 'md']}
            ${disabled && 'opacity-60'}
          `}
        >
          {label}
        </label>

        <div
          className={`
            overflow-auto
            ${styles.input}
            ${inputField['md']}
            ${styles.input_scroll}
            ${disabled && 'opacity-60'}
          `}
        >
          <div
            className={`
              w-full flex gap-3
              ${vertical && 'flex-col'}
            `}
          >
            {options?.map((option, key) => {
              return (
                <RadioComponent
                  key={key}
                  label={option.label}
                  name={'option_' + name + '_' + option.value}
                  checked={inputValue == option.value}
                  disabled={disabled}
                  onChange={() => {
                    if (inputValue == option.value) {
                      setInputValue('');
                      onChange?.('');
                    } else {
                      setInputValue(option.value);
                      onChange?.(option.value);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
