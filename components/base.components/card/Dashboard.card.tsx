import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import React from 'react';

export type DashboardCardProps = {
  label: string;
  value: string;
  icon: any;
  linkPath?: string;
  loading?: boolean;
  color?: string;
  rightContent?: any;
};

export function DashboardCardComponent({
  label,
  value,
  icon,
  loading,
  color,
  rightContent,
  linkPath,
}: DashboardCardProps) {
  return (
    <>
      <Link href={linkPath || ''}>
        <div
          className={`bg-white shadow-sm py-4 px-6 rounded-lg flex justify-between gap-4 items-center ${
            loading && 'skeleton__loading'
          }`}
        >
          <div>
            <div className="flex gap-4 items-center">
              <p
                className={`text-${
                  color || 'gray'
                }-500 text-2xl font-bold mb-1`}
              >
                {value}
              </p>
              {rightContent && <div>{rightContent}</div>}
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
    </>
  );
}
