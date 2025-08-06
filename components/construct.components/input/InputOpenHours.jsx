import React from 'react';
import { CheckboxComponent, InputTimeComponent } from '../../base.components';

const InputOpenHours = ({ values, setValues, errors }) => {
  const days = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    "Jum'at",
    'Sabtu',
    'Minggu',
  ];
  return (
    <div>
      <div className="grid grid-cols-12 gap-3 my-2">
        <div className="col-span-1"></div>
        <div className="col-span-2 font-bold">Hari</div>
        <div className="col-span-3 font-bold">Buka</div>
        <div className="col-span-3 font-bold">Tutup</div>
        <div className="w-full flex col-span-3 font-bold">
          <p className="w-14 mr-4">24 jam</p>
          <p className="w-fit">Libur</p>
        </div>
      </div>
      {days.map((day, key) => {
        let setDisable =
          values.find((val) => val.name == `data[${key}][is_closed]`)?.value ||
          values.find((val) => val.name == `data[${key}][is_24hour]`)?.value;

        return (
          <div key={day + key} className="grid grid-cols-12 gap-2 space-y-1">
            <div className="col-span-1">
              <CheckboxComponent
                name={`data[${key}][is_closed]`}
                onChange={() =>
                  setValues([
                    ...values.filter(
                      (i) =>
                        i.name != `data[${key}][is_closed]` &&
                        i.name != `data[${key}][is_24hour]` &&
                        i.name != `data[${key}][open]` &&
                        i.name != `data[${key}][close]`
                    ),
                    {
                      name: `data[${key}][is_closed]`,
                      value: !values?.find(
                        (i) => i.name == `data[${key}][is_closed]`
                      )?.value,
                    },
                  ])
                }
                checked={
                  values?.find((i) => i.name == `data[${key}][is_closed]`)
                    ?.value
                }
              />
            </div>
            <div className="col-span-2">{day}</div>

            <div className="col-span-3">
              <InputTimeComponent
                name={`data[${key}][open]`}
                onChange={(e) => {
                  setValues([
                    ...values.filter(
                      (i) =>
                        i.name != `data[${key}][day]` &&
                        i.name != `data[${key}][open]`
                    ),
                    {
                      name: `data[${key}][day]`,
                      value: day,
                    },
                    {
                      name: `data[${key}][open]`,
                      value: e,
                    },
                  ]);
                }}
                value={
                  values?.find((i) => i.name == `data[${key}][open]`)?.value ||
                  ''
                }
                error={
                  errors?.find((i) => i.name == `data[${key}][open]`)?.error
                }
                disabled={setDisable}
              />
            </div>
            <div className="col-span-3">
              <InputTimeComponent
                name={`data[${key}][close]`}
                onChange={(e) => {
                  setValues([
                    ...values.filter((i) => i.name != `data[${key}][close]`),
                    {
                      name: `data[${key}][close]`,
                      value: e,
                    },
                  ]);
                }}
                value={
                  values?.find((i) => i.name == `data[${key}][close]`)?.value ||
                  ''
                }
                error={
                  errors?.find((i) => i.name == `data[${key}][close]`)?.error
                }
                disabled={setDisable}
              />
            </div>
            <div className="w-full flex col-span-3 p-3">
              <div className="w-14 mr-4">
                <CheckboxComponent
                  name={`data[${key}][is_24hour]`}
                  onChange={() =>
                    setValues([
                      ...values.filter(
                        (i) =>
                          i.name != `data[${key}][is_24hour]` &&
                          i.name != `data[${key}][is_closed]` &&
                          i.name != `data[${key}][open]` &&
                          i.name != `data[${key}][close]`
                      ),
                      {
                        name: `data[${key}][is_24hour]`,
                        value: !values?.find(
                          (i) => i.name == `data[${key}][is_24hour]`
                        )?.value
                          ? 1
                          : 0,
                      },
                    ])
                  }
                  checked={
                    values?.find((i) => i.name == `data[${key}][is_24hour]`)
                      ?.value
                  }
                />
              </div>
              <CheckboxComponent
                name={`data[${key}][is_closed]`}
                onChange={() =>
                  setValues([
                    ...values.filter(
                      (i) =>
                        i.name != `data[${key}][is_closed]` &&
                        i.name != `data[${key}][is_24hour]` &&
                        i.name != `data[${key}][open]` &&
                        i.name != `data[${key}][close]`
                    ),
                    {
                      name: `data[${key}][is_closed]`,
                      value: !values?.find(
                        (i) => i.name == `data[${key}][is_closed]`
                      )?.value
                        ? 1
                        : 0,
                    },
                  ])
                }
                checked={
                  values?.find((i) => i.name == `data[${key}][is_closed]`)
                    ?.value
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default InputOpenHours;
