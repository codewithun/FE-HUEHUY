import React, { useEffect, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
import { get, useLazySearch, useValidationHelper } from '../../../helpers';
import { selectOptionProps, selectProps } from './props/select.props';
import {
  faCheckCircle,
  faChevronDown,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { standIn } from '../../../helpers/standIn.helpers';

export function SelectComponent({
  name,
  label,
  placeholder,
  disabled,
  value,
  options,
  onChange,
  onFocus,
  onBlur,
  error,
  size,
  leftIcon,
  validations,
  tip,
  searchable,
  multiple,
  register,
  searchServer,
  serverOptionControl,
  autoFocus,
  tempOptions,
}: selectProps) {
  const [inputShowValue, setInputShowValue] = useState('');
  const [inputValue, setInputValue] = useState<
    string | string[] | number | number[]
  >('');
  const [isFocus, setIsFocus] = useState(false);
  const [isInvalid, setIsInvalid] = useState('');
  const [isFirst, setIsFirst] = useState(true);
  const [keydown, setKeydown] = useState(false);
  const [loadingOption, setLoadingOption] = useState(false);

  const [dataOptions, setDataOptions] = useState<selectOptionProps[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<selectOptionProps[]>(
    []
  );
  const [activeOption, setActiveOption] = useState(0);
  const [showOption, setShowOption] = useState(false);

  const [useTemp, setUseTemp] = useState(true);

  // const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [keywordSearch] = useLazySearch(keyword);

  // if (serverOptionControl?.path || serverOptionControl?.url) {
  //   // eslint-disable-next-line react-hooks/rules-of-hooks
  //   const [loading, code, data] = useGet(serverOptionControl);

  //   console.log(data);
  // }

  useEffect(() => {
    tempOptions && tempOptions.length && searchServer
      ? setDataOptions(tempOptions)
      : setUseTemp(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempOptions, options]);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOption(true);
      const cacheData = await standIn.get(
        serverOptionControl?.cacheName || `option_${serverOptionControl?.path}`
      );

      if (cacheData) {
        // If cache already stores normalized options, use as-is
        setDataOptions(cacheData);
        setLoadingOption(false);
      } else {
        const mutateOptions =
          serverOptionControl?.path != null &&
          (await get(serverOptionControl || {}));
        const raw = mutateOptions?.data;
        const payload = Array.isArray(raw?.data) ? raw.data : raw;
        const mapped = serverOptionControl?.mapOptions
          ? serverOptionControl.mapOptions(payload)
          : Array.isArray(payload)
            ? payload.map((item: any) => ({
                label: item?.label ?? item?.name ?? String(item?.id ?? ''),
                value:
                  item?.value ?? item?.id ?? item?.code ?? item?.key ?? item,
              }))
            : [];
        setDataOptions(mapped);
        setShowOption(true);
        standIn.set({
          key:
            serverOptionControl?.cacheName ||
            `option_${serverOptionControl?.path}`,
          data: mapped,
          expired: 5,
        });
        setLoadingOption(false);
      }
    };

    if (!searchServer) {
      if (serverOptionControl?.path || serverOptionControl?.url) {
        fetchOptions();
      } else {
        !options && setDataOptions([]);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverOptionControl?.path, serverOptionControl?.url]);

  // =========================>
  // ## BETA server search
  // =========================>
  useEffect(() => {
    const fetchOptions = async () => {
      let serverControl = {
        ...serverOptionControl,
        params: {
          search: keywordSearch,
        },
      };
      setShowOption(false);
      // setLoadingOption(true);
      const mutateOptions = await get(serverControl || {});
      if (mutateOptions.status == '200') {
        setIsInvalid('');
      }
      const raw = mutateOptions?.data;
      const payload = Array.isArray(raw?.data) ? raw.data : raw;
      let newOptions: selectOptionProps[] = serverOptionControl?.mapOptions
        ? serverOptionControl.mapOptions(payload)
        : Array.isArray(payload)
        ? payload.map((item: any) => ({
            label: item?.label ?? item?.name ?? String(item?.id ?? ''),
            value: item?.value ?? item?.id ?? item?.code ?? item?.key ?? item,
          }))
        : [];
      if (newOptions.length > 0) {
        setDataOptions(newOptions);
        setShowOption(true);
        setFilteredOptions(newOptions);
      } else {
        // setDataOptions([]);
        // setShowOption(false);
        // setFilteredOptions([]);
      }

      // setLoadingOption(false);
    };

    if (searchServer) {
      if (serverOptionControl?.path || serverOptionControl?.url) {
        fetchOptions();
      } else {
        !options && setDataOptions([]);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordSearch, serverOptionControl?.path, serverOptionControl?.url]);
  // useEffect(() => {
  //   if (keywordSearch) {
  //     setSearch?.(keywordSearch);
  //   } else {
  //     setSearch?.('');
  //   }

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [keywordSearch]);

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
  // ## Invalid handler
  // =========================>
  useEffect(() => {
    setIsInvalid(errorMessage || error || '');
  }, [error, errorMessage]);

  // =========================>
  // ## Change value handler
  // =========================>
  useEffect(() => {
    if (value) {
      setInputValue(value);
      Array.isArray(dataOptions) &&
        setInputShowValue(
          dataOptions?.find((option) => option.value == value)?.label || ''
        );
      setIsFirst(false);
    } else {
      setInputValue('');
      setInputShowValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, dataOptions]);

  // =========================>
  // ## Option handler
  // =========================>
  useEffect(() => {
    setDataOptions(options);
  }, [options]);

  // =========================>
  // ## Options handler
  // =========================>
  const filterOption = (e: any) => {
    if (dataOptions?.length) {
      let newFilteredOptions: selectOptionProps[] = [];

      if (searchable && !searchServer) {
        if (e.target.value) {
          newFilteredOptions = dataOptions
            .filter(
              (Option) =>
                Option.label
                  ?.toLowerCase()
                  .indexOf(e.target.value.toLowerCase()) > -1
            )
            .slice(0, 10);
        } else {
          newFilteredOptions = dataOptions.slice(0, 10);
        }
      } else {
        newFilteredOptions = dataOptions;
      }

      setActiveOption(-1);
      setFilteredOptions(newFilteredOptions);
      setShowOption(true);
    }
  };

  const onKeyDownOption = (e: any) => {
    if (dataOptions?.length) {
      if (e.keyCode === 13) {
        let resultValue = filteredOptions?.at(activeOption);
        setActiveOption(-1);
        setFilteredOptions([]);
        setShowOption(false);
        if (!multiple) {
          setInputShowValue(resultValue?.label || inputShowValue);
          setInputValue(resultValue?.value || inputShowValue);
          searchServer && setKeyword(resultValue?.label || keyword);
        } else {
          if (resultValue?.value) {
            searchable
              ? setInputShowValue(resultValue.label)
              : searchable && setInputShowValue('');

            searchServer && setKeyword(resultValue.label);

            const values: string[] = Array.isArray(inputValue)
              ? Array()
                  .concat(inputValue)
                  ?.filter((val: string | number) => val != resultValue?.value)
              : [];

            if (values.find((val) => val == resultValue?.value)) {
              setInputValue(values);
            } else {
              setInputValue([...Array().concat(values), resultValue.value]);
            }
          }
        }
        e.preventDefault();
      } else if (e.keyCode === 38) {
        if (activeOption === 0) return;
        setActiveOption(activeOption - 1);
      } else if (e.keyCode === 40) {
        if (activeOption + 1 >= (filteredOptions?.length || 0)) return;
        setActiveOption(activeOption + 1);
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
        {label && (
          <label
            htmlFor={`select_${name}`}
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
        )}
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
        <input
          type="hidden"
          value={
            !multiple
              ? String(inputValue)
              : JSON.stringify(Array().concat(inputValue))
          }
          name={name}
        />
        <div className="relative overflow-hidden">
          {loadingOption ? (
            <div className="w-full h-9 skeleton__loading"></div>
          ) : (
            <input
              type={'text'}
              className={`
              ${styles.input}
              ${isInvalid && styles.input__error}
              ${inputField[size || 'md']}
              ${inputPadding['right'][size || 'md']}
              ${leftIcon && inputPadding['left'][size || 'md']}
            `}
              readOnly={!searchable}
              placeholder={
                !inputValue || (Array.isArray(inputValue) && !inputValue.length)
                  ? placeholder
                  : ''
              }
              id={`select_${name}`}
              disabled={
                disabled ||
                (!autoFocus && (loadingOption || !dataOptions?.length))
              }
              value={
                useTemp && tempOptions
                  ? tempOptions.at(0)?.label
                  : searchServer
                  ? keyword
                  : inputShowValue
              }
              onFocus={(e) => {
                setUseTemp(false);
                setIsFocus(true);
                onFocus?.();
                dataOptions?.length && filterOption(e);
                searchable && e.target.select();
              }}
              onBlur={(e) => {
                setUseTemp(false);
                const value = e.target.value;
                const valueOption = dataOptions?.find(
                  (option) =>
                    option.label?.toLowerCase() == value?.toLowerCase()
                );

                if (!keydown) {
                  if (!multiple) {
                    setTimeout(() => {
                      if (valueOption?.value) {
                        setInputShowValue(valueOption.label);
                        setInputValue(valueOption.value);
                        searchServer && setKeyword(valueOption.label);
                        onChange?.(valueOption.value, valueOption);
                      } else {
                        setInputShowValue('');
                        searchServer && setKeyword('');
                        setInputValue('');
                        onChange?.('');
                      }
                    }, 140);
                  } else {
                    // For multiple select, do NOT clear values on blur.
                    // Just clear the input display/keyword, keep current selections.
                    setInputShowValue('');
                    searchServer && setKeyword('');
                  }
                }

                setTimeout(() => {
                  setIsFocus(false);
                }, 100);
                onBlur?.();
              }}
              onChange={(e) => {
                setUseTemp(false);
                searchable && setInputShowValue(e.target.value);
                searchServer && setKeyword(e.target.value);
                setIsFirst(false);
                !errorMessage && setIsInvalid('');
                // onChange?.(e.target.value);
                dataOptions?.length && filterOption(e);
              }}
              onKeyDown={(e) => {
                dataOptions?.length && onKeyDownOption(e);
              }}
              autoComplete="off"
              autoFocus={autoFocus}
            />
          )}

          {(!searchable || (searchable && !isFocus)) && (
            <div
              className={`
                absolute top-1/2 -translate-y-1/2 overflow-x-auto py-1.5
                ${leftIcon ? 'ml-[2.5rem]' : 'ml-2'}
                ${styles.input_scroll}
              `}
              style={{
                maxWidth: `calc(100% - ${leftIcon ? '5.2rem' : '3.2rem'})`,
              }}
            >
              <div
                className={`
                  ${styles.input_values_container}
                `}
              >
                {multiple &&
                  typeof inputValue != 'string' &&
                  Array()
                    .concat(inputValue)
                    ?.map((item, key) => {
                      return (
                        <div
                          key={key}
                          className={`
                          ${size == 'sm' ? 'text-xs' : 'text-sm'}
                          ${styles.input_values_item}
                        `}
                        >
                          <span className="">
                            {
                              dataOptions?.find(
                                (option) => option.value == item
                              )?.label
                            }
                          </span>
                          <FontAwesomeIcon
                            icon={faTimes}
                            className={`
                            ${styles.input_values_delete}
                          `}
                            onClick={() => {
                              const values = Array().concat(inputValue);
                              let index = values.findIndex(
                                (val: string | number) => val == item
                              );
                              setInputValue(
                                values.filter((_, val) => val != index)
                              );
                              onChange?.(
                                values.filter((_, val) => val != index)
                              );
                              if (
                                !values.filter((_, val) => val != index)?.length
                              ) {
                                setInputShowValue('');
                                searchServer && setKeyword('');
                                onChange?.('');
                              }
                            }}
                          />
                        </div>
                      );
                    })}
              </div>
            </div>
          )}

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
            htmlFor={`select_${name}`}
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
              icon={faChevronDown}
            />
          </label>
        </div>

        {!!dataOptions?.length && showOption && !!filteredOptions?.length && (
          <div>
            <ul
              className={`
                  scroll_control
                  ${inputSuggestContainer[size || 'md']} 
                  ${isFocus ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}
                  ${styles.input__suggest__container}
                `}
            >
              {filteredOptions.map((option, key) => {
                const selected =
                  !!(
                    (typeof inputValue == 'string' ||
                      typeof inputValue == 'number') &&
                    inputValue == option.value
                  ) ||
                  (Array.isArray(inputValue) &&
                    Array()
                      .concat(inputValue)
                      .find((val: string | number) => val == option.value));
                return (
                  <li
                    className={`
                        cursor-pointer hover:bg-light-primary
                        ${inputSuggest[size || 'md']} 
                        ${
                          (key == activeOption || selected) &&
                          'bg-light-primary text-primary'
                        }
                      `}
                    key={key}
                    onMouseDown={() => {
                      setKeydown(true);
                      setTimeout(() => setIsFocus(true), 110);
                    }}
                    onMouseUp={() => {
                      setKeydown(false);
                      setActiveOption(key);
                      setFilteredOptions([]);
                      setShowOption(false);
                      if (!multiple) {
                        setInputShowValue(option.label);
                        searchServer && setKeyword(option.label);
                        setInputValue(option.value);
                        onChange?.(option.value, option);
                      } else {
                        const values: string[] | number[] = Array.isArray(
                          inputValue
                        )
                          ? Array()
                              .concat(inputValue)
                              .filter((val) => val != option.value)
                          : [];
                        setInputShowValue('');
                        searchServer && setKeyword('');
                        if (
                          Array.isArray(inputValue) &&
                          Array()
                            .concat(inputValue)
                            .find((val) => val == option.value)
                        ) {
                          setInputValue(values);
                          onChange?.(values);
                        } else {
                          setInputValue([
                            ...Array().concat(values),
                            option.value,
                          ]);
                          onChange?.([...Array().concat(values), option.value]);
                        }
                      }
                      setTimeout(() => setIsFocus(false), 120);
                    }}
                  >
                    {selected && (
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="mr-2 text-sm"
                      />
                    )}
                    {option.label}
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
