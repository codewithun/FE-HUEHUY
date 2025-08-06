import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import {
  InputCheckboxComponent,
  InputDateComponent,
  SelectComponent,
} from '../input';
import { filterColumnProps } from './filter.props';

export default function FilterColumnComponent({
  columnLabel,
  type,
  options,
  value,
  onChange,
}: filterColumnProps) {
  const [show, setShow] = useState(false);

  return (
    <>
      <div
        className={`
              cursor-pointer 
            `}
        onClick={() => setShow(!show)}
      >
        <FontAwesomeIcon
          icon={faFilter}
          className={`
          ${
            value &&
            ((Array.isArray(value) && value.length) || !Array.isArray(value))
              ? 'text-primary'
              : 'text-slate-400'
          }
        `}
        />
      </div>

      <OutsideClickHandler
        onOutsideClick={() => {
          setShow(false);
        }}
      >
        <div
          className={`
                absolute -bottom-2 z-10 w-72 translate-y-full right-0 p-4 bg-white rounded-lg shadow
                ${!show && 'scale-y-0'}
              `}
        >
          <div className="flex justify-between mb-3">
            <label className="text-sm">Filter dengan {columnLabel}</label>
            <div
              className="text-sm text-warning cursor-pointer"
              onClick={() => onChange?.([])}
            >
              Reset
            </div>
          </div>

          {type == 'checkbox' && (
            <InputCheckboxComponent
              name={`filter-${columnLabel}`}
              value={Array.isArray(value) ? value : []}
              options={options}
              onChange={(e) => onChange?.(Array.isArray(e) ? e : [])}
              vertical
            />
          )}

          {(type == 'select' || type == 'multiple-select') && (
            <SelectComponent
              name={`filter-${columnLabel}`}
              value={value}
              options={options}
              onChange={onChange}
              multiple={type == 'multiple-select'}
            />
          )}

          {(type == 'date' || type == 'range-date') && (
            <InputDateComponent
              name={`filter-${columnLabel}`}
              value={
                type == 'date'
                  ? String(value)
                  : Array()
                      .concat(value)
                      .map((val) => String(val))
              }
              onChange={(e) =>
                onChange?.(
                  type == 'date'
                    ? e.toString()
                    : Array()
                        .concat(value)
                        .map((val) => val.toString())
                )
              }
              range={type == 'range-date'}
            />
          )}
        </div>
      </OutsideClickHandler>
    </>
  );
}
