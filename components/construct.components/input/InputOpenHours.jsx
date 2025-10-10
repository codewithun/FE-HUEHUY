import React from 'react';
import { CheckboxComponent, InputTimeComponent } from '../../base.components';

const InputOpenHours = ({ values, setValues, errors }) => {
  const days = ['Senin','Selasa','Rabu','Kamis',"Jum'at",'Sabtu','Minggu'];

  const get = (name) => values.find(v => v.name === name)?.value;
  const put = (pairs) => {
    const names = pairs.map(p => p.name);
    setValues([
      ...values.filter(v => !names.includes(v.name)),
      ...pairs
    ]);
  };

  return (
    <div>
      {/* HEADER: hapus kolom checkbox kiri */}
      <div className="grid grid-cols-12 gap-3 my-2">
        <div className="col-span-3 font-bold pl-12">Hari</div>
        <div className="col-span-3 font-bold">Buka</div>
        <div className="col-span-3 font-bold">Tutup</div>
        <div className="w-full flex col-span-3 font-bold">
          <p className="w-14 mr-4">24 jam</p>
          <p className="w-fit">Libur</p>
        </div>
      </div>

      {days.map((day, key) => {
        const isClosed  = !!get(`data[${key}][is_closed]`);
        const is24Hour  = !!get(`data[${key}][is_24hour]`);
        const disabled  = isClosed || is24Hour;

        return (
          <div key={day+key} className="grid grid-cols-12 gap-2 space-y-1">
            {/* Kolom kiri DIHAPUS; geser nama hari ke col-span-3 */}
            <div className="col-span-3 pl-12">{day}</div>

            <div className="col-span-3">
              <InputTimeComponent
                name={`data[${key}][open]`}
                onChange={(e) =>
                  put([
                    { name: `data[${key}][day]`,  value: day },
                    { name: `data[${key}][open]`, value: e  },
                  ])
                }
                value={get(`data[${key}][open]`) || ''}
                error={errors?.find(i => i.name === `data[${key}][open]`)?.error}
                disabled={disabled}
              />
            </div>

            <div className="col-span-3">
              <InputTimeComponent
                name={`data[${key}][close]`}
                onChange={(e) => put([{ name: `data[${key}][close]`, value: e }])}
                value={get(`data[${key}][close]`) || ''}
                error={errors?.find(i => i.name === `data[${key}][close]`)?.error}
                disabled={disabled}
              />
            </div>

            {/* Kolom kanan: 24 jam & Libur saja */}
            <div className="w-full flex col-span-3 p-3">
              <div className="w-14 mr-4">
                <CheckboxComponent
                  name={`data[${key}][is_24hour]`}
                  onChange={() => {
                    const next = !is24Hour ? 1 : 0;
                    // jika 24 jam diaktifkan: set jam default & matikan libur
                    if (next) {
                      put([
                        { name: `data[${key}][is_24hour]`, value: 1 },
                        { name: `data[${key}][is_closed]`, value: 0 },
                        { name: `data[${key}][open]`,      value: '00:00' },
                        { name: `data[${key}][close]`,     value: '23:59' },
                      ]);
                    } else {
                      put([{ name: `data[${key}][is_24hour]`, value: 0 }]);
                    }
                  }}
                  checked={is24Hour}
                  className="accent-green-600"
                />
              </div>

              <CheckboxComponent
                name={`data[${key}][is_closed]`}
                onChange={() => {
                  const next = !isClosed ? 1 : 0;
                  // jika libur diaktifkan: kosongkan jam & matikan 24 jam
                  if (next) {
                    put([
                      { name: `data[${key}][is_closed]`,  value: 1 },
                      { name: `data[${key}][is_24hour]`, value: 0 },
                      { name: `data[${key}][open]`,      value: '' },
                      { name: `data[${key}][close]`,     value: '' },
                    ]);
                  } else {
                    put([{ name: `data[${key}][is_closed]`, value: 0 }]);
                  }
                }}
                checked={isClosed}
                className="accent-green-600"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InputOpenHours;
