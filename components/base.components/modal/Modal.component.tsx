import { useEffect, useRef } from 'react';
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
  const prevBodyOverflow = useRef<string | null>(null);
  const prevHtmlOverflow = useRef<string | null>(null);

  useEffect(() => {
    const bodyEl = document.getElementsByTagName('body')[0];
    const htmlEl = document.documentElement;

    if (show) {
      // save previous values to be restored later
      prevBodyOverflow.current = bodyEl.style.overflow || '';
      prevHtmlOverflow.current = htmlEl.style.overflow || '';

      bodyEl.style.overflow = 'hidden';
      htmlEl.style.overflow = 'hidden';
    } else {
      // restore previous values
      if (prevBodyOverflow.current !== null) bodyEl.style.overflow = prevBodyOverflow.current;
      else bodyEl.style.removeProperty('overflow');

      if (prevHtmlOverflow.current !== null) htmlEl.style.overflow = prevHtmlOverflow.current;
      else htmlEl.style.removeProperty('overflow');
    }

    // cleanup on unmount to ensure scrolling is restored even if closed during navigation
    return () => {
      const b = document.getElementsByTagName('body')[0];
      const h = document.documentElement;
      if (prevBodyOverflow.current !== null) b.style.overflow = prevBodyOverflow.current;
      else b.style.removeProperty('overflow');
      if (prevHtmlOverflow.current !== null) h.style.overflow = prevHtmlOverflow.current;
      else h.style.removeProperty('overflow');
    };
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
