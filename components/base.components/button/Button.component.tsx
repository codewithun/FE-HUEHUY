// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { buttonProps } from './button.props';
import {
  buttonVariant,
  buttonContainer,
  buttonRadius,
  buttonIcon,
} from './button.decorate';
import styles from './button.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function ButtonComponent({
  type,
  label,
  variant,
  paint,
  rounded,
  block,
  className,
  disabled,
  size,
  onClick,
  icon,
  loading,
  customPaint,
}: buttonProps) {
  return (
    <>
      <button
        type={type || 'button'}
        className={` 
          ${styles.button}
          ${buttonVariant[variant || 'solid'][paint || 'primary']}
          ${buttonContainer[size || 'md']}
          ${rounded ? 'rounded-full' : buttonRadius[size || 'md']}
          ${block && 'w-full justify-center'}
          ${customPaint?.color && `text-${customPaint.color}`}
          ${customPaint?.bg && `bg-${customPaint.bg}`}
          ${customPaint?.border && `border-${customPaint.border}`}
          ${className}
        `}
        disabled={disabled || loading}
        onClick={onClick}
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
                      : 'w-4 h-4'
                  }
              `}
            ></div>
          </>
        ) : (
          <>
            {icon && (
              <FontAwesomeIcon
                icon={icon}
                className={`
                  ${
                    !customPaint &&
                    buttonIcon[variant || 'solid'][paint || 'primary']
                  }
                  ${
                    size == 'xs'
                      ? 'text-xs'
                      : size == 'sm'
                      ? 'text-sm mb-0.5'
                      : size == 'lg'
                      ? 'text-xl mb-0.5'
                      : size == '2xl'
                      ? 'text-2xl mb-0.5 mr-1'
                      : 'text-base mb-0.5'
                  }
                `}
              />
            )}
          </>
        )}
        {label}
      </button>
    </>
  );
}
