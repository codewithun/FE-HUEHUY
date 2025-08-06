import { useEffect, useState } from 'react';
import { checkboxProps } from './props/checkbox.props';
import styles from './input.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

export function CheckboxComponent({
  label,
  name,
  color,
  onChange,
  checked,
  value,
  disabled,
  size,
  error,
}: checkboxProps) {
  const [isInvalid, setIsInvalid] = useState('');

  // =========================>
  // ## invalid handler
  // =========================>
  useEffect(() => {
    setIsInvalid(error || '');
  }, [error]);

  return (
    <>
      <input
        type="checkbox"
        className="hidden"
        id={'checkbox_' + name}
        name={name}
        onChange={onChange}
        checked={checked}
        value={value}
        disabled={disabled}
      />

      <label
        htmlFor={'checkbox_' + name}
        className={`
          flex gap-2 items-center cursor-pointer
          ${disabled && 'pointer-events-none opacity-60'}
        `}
      >
        <div
          className={`
            flex justify-center items-center rounded-md border-2 w-6 h-6
            ${
              checked
                ? `border-light-${color || 'primary'} bg-${
                    color || 'primary'
                  } text-white`
                : 'border-slate-300 text-slate-300'
            }
          `}
        >
          {checked ? (
            <FontAwesomeIcon icon={faCheck} className="text-sm" />
          ) : (
            ''
          )}
        </div>
        <div
          className={`
            whitespace-nowrap
            ${checked && 'font-semibold'}
            ${size == 'lg' ? '' : size == 'sm' ? 'text-xs' : 'text-sm'}
          `}
        >
          {label}
        </div>
      </label>
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
    </>
  );
}
