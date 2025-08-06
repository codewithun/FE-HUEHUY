import Image from 'next/image';
import React from 'react';

export type CardComponentProps = {
  title: string;
  content?: any;
  image?: string;
};

export default function CardComponent({
  title,
  content,
  image,
}: CardComponentProps) {
  return (
    <>
      <div className="block rounded-lg bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:bg-neutral-700">
        {image && (
          <div className="rounded-t-lg aspect-[4/3]">
            <Image src={image} width={300} height={400} alt="" />
          </div>
        )}

        <div className="p-6">
          <h5 className="mb-2 text-xl font-medium leading-tight text-slate-800 dark:text-slate-50">
            {title}
          </h5>
          <p className="mb-4 text-base text-slate-600 dark:text-slate-200">
            {content}
          </p>
        </div>
      </div>
    </>
  );
}
