import React, { useEffect, useState } from 'react';
import { get } from '../../../helpers';
import { CheckboxComponent } from './Checkbox.component';
import { inputContainer, inputField, inputLabel } from './input.decorate';
import styles from './input.module.css';
import { inputCheckboxProps } from './props/input-checkbox.props';

export function InputCheckboxComponent({
  name,
  label,
  size,
  disabled,
  options,
  vertical,
  value,
  onChange,
  register,
  validations,
  serverOptionControl,
  customOptions,
}: inputCheckboxProps) {
  const [inputValue, setInputValue] = useState<string[] | number[]>([]);
  const [dataOptions, setDataOptions] = useState<inputCheckboxProps[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      const mutateOptions = await get(serverOptionControl || {});
      if (mutateOptions?.status == 200) {
        customOptions
          ? setDataOptions([customOptions, ...mutateOptions.data])
          : setDataOptions(mutateOptions.data);
        setLoading(false);
      }
    };

    if (serverOptionControl?.path || serverOptionControl?.url) {
      fetchOptions();
    } else {
      !options && setDataOptions([]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverOptionControl?.path, serverOptionControl?.url]);

  useEffect(() => {
    register?.(name, validations);
  }, [register, name, validations]);

  useEffect(() => {
    if (value) {
      setInputValue(value);
    } else {
      setInputValue([]);
    }
  }, [value]);
  let dummy = vertical ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [1, 2, 3];
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
              w-full flex gap-3 -ml-2
             
              ${vertical && `flex-col flex-wrap p-2 ${vertical}`}
            `}
          >
            {loading &&
              dummy.map((_, key) => {
                return (
                  <>
                    <div
                      key={key}
                      className="w-1/3 h-6 skeleton__loading rounded-lg"
                    ></div>
                  </>
                );
              })}
            {options &&
              options?.map((option, key) => {
                const checked = Array()
                  .concat(inputValue)
                  .find((val) => val == option.value);
                return (
                  <CheckboxComponent
                    key={key}
                    label={option.label}
                    name={`option[${option.value}]#${name}`}
                    checked={!!checked}
                    disabled={disabled}
                    size={size}
                    onChange={() => {
                      let newVal: string[] | number[] = [];
                      if (checked) {
                        newVal = Array()
                          .concat(inputValue)
                          .filter((val) => val != option.value);
                      } else {
                        newVal = [
                          ...Array()
                            .concat(inputValue)
                            .filter((val) => val != option.value),
                          option.value,
                        ];
                      }

                      setInputValue(newVal);
                      onChange?.(newVal);
                    }}
                  />
                );
              })}
            {dataOptions &&
              dataOptions?.map((option, key) => {
                const checked = Array()
                  .concat(inputValue)
                  .find((val) => val == option.value);
                return (
                  <CheckboxComponent
                    key={key}
                    label={option.label!}
                    name={`option[${option.value}]#${name}`}
                    checked={!!checked}
                    disabled={disabled}
                    size={size}
                    onChange={() => {
                      let newVal: string[] | number[] = [];
                      if (checked) {
                        newVal = Array()
                          .concat(inputValue)
                          .filter((val) => val != option.value);
                      } else {
                        newVal = [
                          ...Array()
                            .concat(inputValue)
                            .filter((val) => val != option.value),
                          option.value,
                        ];
                      }

                      setInputValue(newVal);
                      onChange?.(newVal);
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
