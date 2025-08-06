import React, { useEffect } from 'react';
import { modalConfirmProps } from './modal.props';
import styles from './modal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '../button';
import {
  modalConfirmContainer,
  modalConfirmIcon,
  modalConfirmIconContainer,
  modalConfirmTitle,
} from './modal.decorate';

export function ModalConfirmComponent({
  title,
  icon,
  show,
  onClose,
  children,
  tip,
  paint,
  onSubmit,
  submitButton,
}: modalConfirmProps) {
  useEffect(() => {
    if (show) {
      document.getElementsByTagName('body')[0].style.overflow = 'hidden';
    } else {
      document.getElementsByTagName('body')[0].style.removeProperty('overflow');
    }
  }, [show]);

  return (
    <>
      <div className="hidden lg:block">
        <div
          className={` 
            ${styles.modal__background}
            ${show ? 'opacity-30' : 'scale-0 opacity-0'}
          `}
          onClick={() => onClose()}
        ></div>

        <div
          className={`
            ${modalConfirmContainer[paint || 'warning']}
            ${styles.modal__confirm}
            ${
              show
                ? 'top-[1rem] md:top-[15vh] opacity-1'
                : '-top-[110vh] opacity-0'
            }
        `}
        >
          <div className="p-4 flex flex-col items-center">
            <div
              className={`
              my-4 w-12 h-12 flex justify-center items-center rounded-full shadow-md
              ${modalConfirmIconContainer[paint || 'warning']}
            `}
            >
              <FontAwesomeIcon
                icon={icon || faQuestion}
                className={`
                text-xl
                ${modalConfirmIcon[paint || 'warning']}
              `}
              />
            </div>

            <div className="py-4 text-center">
              <div
                className={`
                text-lg font-semibold
                ${modalConfirmTitle[paint || 'warning']}
              `}
              >
                {title}
              </div>
              <div className="mt-1">{tip}</div>
            </div>

            {show && children}

            <div className="flex justify-center gap-4">
              <ButtonComponent
                label="Batal"
                variant="simple"
                onClick={() => onClose()}
                customPaint={{
                  color: 'slate-500',
                }}
              />
              <ButtonComponent
                {...submitButton}
                label={submitButton?.label || 'Ya'}
                paint={submitButton?.paint || paint || 'warning'}
                onClick={onSubmit}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="block lg:hidden">
        <div
          className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-screen ${
            show ? 'z-50' : '-z-10'
          }`}
        >
          <div
            className={`bg-gray-900 pt-5 absolute top-0 backdrop-blur-sm z-40 left-0 w-full ${
              show ? 'opacity-100 bg-opacity-80 h-[100vh]' : 'opacity-0 h-0'
            }  overflow-hidden`}
            onClick={() => onClose()}
          ></div>

          <div
            className={`container bg-background overflow-y-auto absolute z-50 rounded-t-2xl overflow-hidden`}
            style={{
              bottom: show ? 0 : '-100vh',
              height: '210px',
            }}
          >
            <div className="bg-background py-4 flex flex-col items-center">
              <div
                className={`
              my-4 w-12 h-12 flex justify-center items-center rounded-full shadow-md
              ${modalConfirmIconContainer[paint || 'warning']}
            `}
              >
                <FontAwesomeIcon
                  icon={icon || faQuestion}
                  className={`
                text-xl
                ${modalConfirmIcon[paint || 'warning']}
              `}
                />
              </div>
              {title && (
                <div className="text-center">
                  <h1 className="font-medium text-lg text-gray-500">{title}</h1>
                </div>
              )}

              {/* <div className="absolute left-0 top-0">
                <button
                  onClick={() => onClose()}
                  className="block text__secondary py-5 px-6 text-xl"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
              </div> */}
            </div>

            <div className="flex justify-center gap-4 px-4 mt-4">
              <ButtonComponent
                label="Batal"
                variant="simple"
                onClick={() => onClose()}
                customPaint={{
                  color: 'slate-500',
                }}
                block
                size="lg"
              />
              <ButtonComponent
                {...submitButton}
                label={submitButton?.label || 'Ya'}
                paint={submitButton?.paint || paint || 'warning'}
                onClick={onSubmit}
                block
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
