import React from 'react';

export function RupiahFormatComponent({ amount }: { amount: number }) {
  return (
    <>
      {new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
      })
        .format(amount)
        .split(',')
        ?.at(0)}
    </>
  );
}
