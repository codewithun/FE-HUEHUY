import React, { useEffect, useState } from 'react';
import { InputComponent } from '../../base.components';

function InputHexColor({
  name,
  placeholder,
  label,
  values,
  setValues,
  errors,
}) {
  const [crurentHex, setCrurentHex] = useState('#ffffff');
  const [onFocus, setOnFocus] = useState(false);

  useEffect(() => {
    if (values.length) {
      setCrurentHex(values.filter((i) => i.name == name)?.at(0)?.value);
      setOnFocus(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-4">
        <InputComponent
          name={name}
          label={label}
          onChange={(e) => {
            setCrurentHex(e);
            setValues([
              ...values.filter((i) => i.name != name),
              { name: name, value: e },
            ]);
          }}
          placeholder={placeholder || 'Ex:#01544C'}
          value={onFocus ? crurentHex : ''}
          error={errors.filter((i) => i.name == name)?.at(0)?.error}
        />
      </div>
      <div
        className="col-span-1 h-12 mt-5 rounded-lg border border-gray-500 shadow-sm overflow-hidden"
        style={{ backgroundColor: crurentHex }}
      >
        <input
          className="-translate-x-1 -translate-y-2 w-[calc(100%+10px)] h-[calc(100%+20px)]"
          type="color"
          onChange={(e) => {
            setCrurentHex(e.target.value);
            setValues([
              ...values.filter((i) => i.name != name),
              { name: name, value: e.target.value },
            ]);
          }}
          value={crurentHex}
          onFocus={() => setOnFocus(true)}
        />
      </div>
    </div>
  );
}

export default InputHexColor;
