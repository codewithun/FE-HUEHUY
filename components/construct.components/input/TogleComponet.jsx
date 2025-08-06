import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';

const ToggleComponent = ({
  label,
  name,
  color,
  onChange,
  checked,
  disabled,
  size,
  error,
}) => {
  const [isInvalid, setIsInvalid] = useState('');

  useEffect(() => {
    setIsInvalid(error || '');
  }, [error]);

  return (
    <>
      <input
        type="checkbox"
        className="hidden"
        id={`toggle_${name}`}
        name={name}
        onChange={onChange}
        checked={checked}
        disabled={disabled}
      />

      <label
        htmlFor={`toggle_${name}`}
        className={`
          flex gap-2 items-center cursor-pointer
          ${disabled && 'pointer-events-none opacity-60'}
        `}
      >
        <FontAwesomeIcon
          icon={checked ? faToggleOn : faToggleOff}
          className={` text-5xl ${
            checked ? `text-${color || 'primary'}` : 'text-slate-400'
          }`}
          size="5x"
        />
        <div
          className={`
            whitespace-nowrap
            ${checked && 'font-semibold'}
            ${size === 'lg' ? '' : size === 'sm' ? 'text-xs' : 'text-sm'}
          `}
        >
          {label}
        </div>
      </label>

      {isInvalid && (
        <small
          className={`
              overflow-x-hidden
              text-xs
            `}
        >
          {isInvalid}
        </small>
      )}
    </>
  );
};

export default ToggleComponent;
