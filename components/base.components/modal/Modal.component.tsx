import { useEffect } from 'react';
import { modalProps } from './modal.props';
import styles from './modal.module.css';
import { IconButtonComponent } from '../button';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { modalContainer } from './modal.decorate';

export function ModalComponent({
  title,
  show,
  onClose,
  width,
  children,
  tip,
  footer,
}: modalProps) {
  useEffect(() => {
    if (show) {
      document.getElementsByTagName('body')[0].style.overflow = 'hidden';
    } else {
      document.getElementsByTagName('body')[0].style.removeProperty('overflow');
    }
  }, [show]);

  return (
    <>
      <div
        className={` 
            ${styles.modal__background}
            ${show ? 'opacity-30' : 'scale-0 opacity-0'}
          `}
        onClick={() => onClose()}
      ></div>

      <div
        className={`
            ${styles.modal}
            ${
              show
                ? 'top-[1rem] md:top-[15vh] opacity-1'
                : '-top-[110vh] opacity-0'
            }
            ${modalContainer[width || 'md']}
        `}
      >
        <div
          className={`
            ${styles.modal__title__container}
          `}
        >
          <div>
            <h6 className="text-lg font-semibold text-gray-600">{title}</h6>
            <p className="text-sm text-gray-400 leading-4 mt-1">{tip}</p>
          </div>

          <IconButtonComponent
            icon={faTimes}
            variant="simple"
            paint="danger"
            onClick={() => onClose()}
          />
        </div>

        <div
          className={`
            scroll_control
            ${styles.modal__container}
          `}
        >
          {show && children}
        </div>

        {footer && (
          <div
            className={`
              ${styles.modal__footer}
            `}
          >
            {show && footer}
          </div>
        )}
      </div>
    </>
  );
}
