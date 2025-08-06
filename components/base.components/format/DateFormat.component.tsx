import moment from 'moment';
import React from 'react';
import 'moment/locale/id';

export function DateFormatComponent({
  date,
  format,
}: {
  date: Date;
  format?: string;
}) {
  return (
    <>
      {moment(date)
        .locale('id')
        .format(format ? format : 'DD MMM YYYY')}
    </>
  );
}
