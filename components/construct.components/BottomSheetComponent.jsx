import React from 'react';

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function BottomSheetComponent({
  show,
  children,
  onClose,
  buttonRight,
  title,
  height,
}) {
  return (
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
          height: height ? height : '100vh',
        }}
      >
        <div className="bg-background shadow-sm py-5">
          {title && (
            <div className="text-center">
              <h1 className="font-medium text-lg text-gray-500">{title}</h1>
            </div>
          )}

          <div className="absolute left-0 top-0">
            <button
              onClick={() => onClose()}
              className="block text__secondary py-5 px-6 text-xl"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          </div>

          <div className="absolute right-0 top-0">{buttonRight}</div>
        </div>

        {children}
      </div>
    </div>
  );
}
