import React from 'react';

export type ProgressComponent = {
  amount: number;
  showProgress?: boolean;
  paint?: string;
};

export default function ProgressComponent({
  amount,
  showProgress,
  paint,
}: ProgressComponent) {
  return (
    <>
      <div className="w-full bg-neutral-200 dark:bg-neutral-600">
        <div
          className={`${paint} p-0.5 text-center text-xs font-medium leading-none text-primary-100`}
          style={{ width: `${amount}%` }}
        >
          {showProgress && `${amount}%`}
        </div>
      </div>
    </>
  );
}
