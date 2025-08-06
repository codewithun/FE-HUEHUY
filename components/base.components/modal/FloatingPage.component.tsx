import React, { useEffect } from 'react';
import { floatingPageProps } from './modal.props';
import styles from './modal.module.css';
import { IconButtonComponent } from '../button';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { floatingPage, floatingPageContainer } from './modal.decorate';

export function FloatingPageComponent({
  title,
  show,
  onClose,
  size,
  children,
  tip,
  className,
}: floatingPageProps) {
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
          fixed top-0 bg-white
          ${styles.floating__page}
          ${floatingPageContainer[size || 'md']}
          ${floatingPage[show ? 'show' : 'close']}
          ${className}
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

        <div className="max-h-[calc(100vh-60px)] overflow-y-auto scroll_control h-full">
          {show && children}
        </div>
      </div>
    </>
  );
}
