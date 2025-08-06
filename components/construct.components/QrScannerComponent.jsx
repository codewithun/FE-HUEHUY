/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import NoSSR from '../base.components/NoSSR';

export default function QrScannerComponent({ onScan }) {
  const [on, setOn] = useState(true);
  const [result, setResult] = useState('No result');

  return (
    <div className="relative w-full aspect-square overflow-hidden">
      <NoSSR>
        {on && (
          <>
            <QrReader
              scanDelay={200}
              onResult={(result, error) => {
                if (!!result) {
                  setResult(result?.text);
                  if (onScan) {
                    onScan(result?.text);
                  }
                }

                if (!!error) {
                  setResult(JSON.stringify(error));
                }
              }}
              constraints={{ facingMode: 'environment' }}
              containerStyle={{
                width: '140%',
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />

            <div className="absolute rounded-[15px] top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[85%] h-[85%] border-4 border__primary z-30 shadow-[0_0_100px_100px_rgba(0,0,0,0.45)]"></div>
          </>
        )}
      </NoSSR>
    </div>
  );
}
