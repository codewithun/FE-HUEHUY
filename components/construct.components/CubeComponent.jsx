import React from 'react';

export default function CubeComponent({ size, color }) {
  return (
    <div style={{ height: size * 2 }}>
      <div
        className={`relative`}
        style={{
          width: size,
          height: size,
        }}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
            background: color,
            transform: 'rotate(-45deg) skew(15deg, 15deg)',
          }}
          className="border border-slate-300 rounded-[10%]"
        ></div>
        <div
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
            background: color,
            transform: 'rotate(15deg) skew(15deg, 15deg) translate(-50%, 100%)',
          }}
          className="border border-slate-300 rounded-[10%]"
        ></div>
        <div
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
            background: color,
            transform:
              'rotate(-15deg) skew(-15deg, -15deg) translate(50%, 100%)',
          }}
          className="border border-slate-300 rounded-[10%]"
        ></div>
      </div>
    </div>
  );
}
