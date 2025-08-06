import { useEffect, useState } from 'react';
import { radioProps } from './props/radio.props';
import styles from './input.module.css';

export function RadioComponent({
  label,
  name,
  color,
  onChange,
  onClick,
  checked,
  value,
  disabled,
  size,
  error,
}: radioProps) {
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
        id={'radio_' + name}
        name={name}
        onChange={onChange}
        checked={checked}
        value={value}
        disabled={disabled}
      />

      <label
        htmlFor={'radio_' + name}
        className={`
          flex gap-2 items-center cursor-pointer
          ${disabled && 'pointer-events-none opacity-60'}
        `}
        onClick={() => onClick?.()}
      >
        <div
          className={`
            flex justify-center items-center rounded-full w-5 h-5
            active:outline
            ${
              checked
                ? ` border-[5px] outline-light-${color || 'primary'} border-${
                    color || 'primary'
                  } text-white`
                : 'border-slate-300 text-slate-300  border-2'
            }
          `}
        ></div>
        <div
          className={`
            text-sm mt-1 whitespace-nowrap
            ${checked && 'font-semibold'}
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
