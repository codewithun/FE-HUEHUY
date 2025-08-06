import React from 'react';

export type BoxCardProps = {
  title: string;
  content: any;
};

export function BoxCardComponent({ title, content }: BoxCardProps) {
  return (
    <>
      <div className="px-4 py-3 rounded-xl shadow bg-white">
        <p className="text-xl font-bold">{content}</p>
        <p className="text-sm">{title}</p>
      </div>
    </>
  );
}
