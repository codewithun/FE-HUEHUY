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
          className={`h-full bg-white shadow-sm py-4 px-6 rounded-lg flex justify-between gap-4 items-center ${
            loading && 'skeleton__loading'
          }`}
        >
          <div>
            <div className="flex-row md:flex gap-4 items-center">
              <p
                className={`text-${color || 'gray'}-500 text-${
                  valSize || '2xl'
                } font-bold mb-1`}
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
            <p className={`text-sm text-${color || 'gray'}-400`}>{label}</p>
          </div>
          <div>
            <FontAwesomeIcon
              icon={icon}
              className={`text-2xl ${color || 'text-secondary'} opacity-50`}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
