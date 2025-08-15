import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import React from 'react';

export default function DashboardCard({
  label,
  value,
  icon,
  loading,
  color,
  valSize,
  rightContent,
  bottomContent,
  linkPath,
  disable,
}) {
  return (
    <div className={disable ? 'pointer-events-none' : ''}>
      <Link href={linkPath || ''}>
        <div
          className={`h-full bg-white shadow-md py-6 px-7 rounded-xl flex justify-between gap-6 items-center transition-all duration-150 hover:shadow-lg hover:-translate-y-1.5 cursor-pointer ${
            loading && 'skeleton__loading'
          }`}
        >
          <div>
            <div className="flex-row md:flex gap-4 items-center">
              <p
                className={`text-${color || 'gray'}-700 text-${
                  valSize || '3xl'
                } font-extrabold mb-1 tracking-wide`}
              >
                {value}
              </p>
              {bottomContent && (
                <div className="block md:hidden">{bottomContent}</div>
              )}
              {rightContent && (
                <div className="hidden md:block">{rightContent}</div>
              )}
            </div>
            <p className={`text-sm text-${color || 'gray'}-400 font-semibold tracking-wide`}>{label}</p>
          </div>
          <div>
            <FontAwesomeIcon
              icon={icon}
              className={`text-3xl ${color ? `text-${color}-400` : 'text-secondary'} opacity-70 drop-shadow-sm`}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
