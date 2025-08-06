import React from 'react';
// import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import NoSsr from '../NoSSR';
import dynamic from 'next/dynamic';
const BarcodeScannerComponent = dynamic(
  () => import('react-qr-barcode-scanner'),
  { ssr: false }
);

export function ScannerComponent({ onChange, show }) {
  return (
    <>
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl">
        {show && (
          <NoSsr>
            <BarcodeScannerComponent
              width={500}
              height={500}
              onUpdate={(err, result) => {
                if (result) onChange?.(result.text);
              }}
            />
          </NoSsr>
        )}
        <div className="absolute rounded-xl top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[85%] h-[85%] border-4 border__primary z-30 shadow-[0_0_100px_100px_rgba(0,0,0,0.45)]"></div>
      </div>
    </>
  );
}
