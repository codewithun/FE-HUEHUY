import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { iconButtonProps } from './button.props';
import {
  buttonVariant,
  buttonRadius,
  iconButtonContainer,
  buttonIcon,
} from './button.decorate';
import styles from './button.module.css';

export function IconButtonComponent({
  type,
  variant,
  paint,
  rounded,
  className,
  disabled,
  size,
  onClick,
  icon,
  loading,
  customPaint,
  tips,
}: iconButtonProps) {
  return (
    <>
      <button
        type={type || 'button'}
        className={` 
          ${styles.button}
          ${
            !customPaint &&
            buttonVariant[variant || 'solid'][paint || 'primary']
          }
          ${iconButtonContainer[size || 'md']}
          ${rounded ? 'rounded-full' : buttonRadius[size || 'md']}
          ${className || ''}
          ${customPaint?.color && `text-${customPaint.color}`}
          ${customPaint?.bg && `bg-${customPaint.bg}`}
          ${customPaint?.border && `border border-${customPaint.border}`}
        `}
        disabled={disabled || loading}
        onClick={onClick}
        title={tips}
      >
        {loading ? (
          <>
            <div
              className={`
                  ${styles.button__loading}
                  ${
                    size == 'sm'
                      ? 'w-3 h-3'
                      : size == 'lg'
                      ? 'w-5 h-5'
                      : size == 'xl'
                      ? 'w-8 h-8'
                      : 'w-4 h-4'
                  }
              `}
            ></div>
          </>
        ) : (
          <FontAwesomeIcon
            icon={icon}
            className={`
              ${
                !customPaint &&
                buttonIcon[variant || 'solid'][paint || 'primary']
              }
              ${customPaint?.color && `text-${customPaint.color}`}
              ${
                size == 'xs'
                  ? 'text-xs'
                  : size == 'sm'
                  ? 'text-sm mb-0.5'
                  : size == 'lg'
                  ? 'text-xl mb-0.5'
                  : size == 'xl'
                  ? 'text-2xl mb-0.5'
                  : 'text-base mb-0.5'
              }
            `}
          />
        )}
      </button>
    </>
  );
}
