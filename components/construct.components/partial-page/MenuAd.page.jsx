/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import React from 'react';
import { useGet } from '../../../helpers';

export default function MenuAdPage({ menu }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingCubes, codeCubes, dataCubes] = useGet({
    path: 'huehuy-ads',
  });

  return (
    <>
      <div className="px-4 mt-8">
        <div className="flex justify-between items-center gap-2">
          <div>
            <p className="font-semibold">{menu.name}</p>
            <p className="text-xs text-slate-500">{menu.description}</p>
          </div>
        </div>
      </div>
      {menu.content_type == 'vertical' ? (
        <div className="w-full px-4 pb-2 overflow-x-auto relative scroll__hidden snap-mandatory snap-x mt-2">
          <div className="flex flex-nowrap gap-4 w-max">
            {dataCubes?.data?.map((item, key) => {
              return (
                <Link href={`/app/ad/${item?.id}`} key={key}>
                  <div className="relative">
                    <div className="max-w-[330px] aspect-[4/3] bg-slate-400 rounded-[20px] overflow-hidden brightness-90">
                      <img
                        src={item?.picture_source}
                        height={1200}
                        width={600}
                        alt=""
                      />
                    </div>
                    <div className="absolute bottom-4 w-full px-4">
                      <div className="bg-white bg-opacity-50 backdrop-blur-md min-h-[60px] rounded-[15px]">
                        <div className="px-6 p-4">
                          <p className="font-semibold">{item?.title}</p>
                          <div className="flex justify-between gap-2">
                            <p className="text-slate-600 text-sm font-medium my-1 limit__line__1">
                              <p className="text-primary bg-yellow-100 text-sm whitespace-nowrap px-1 rounded-md mt-1">
                                Iklan Huehuy
                              </p>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 mt-4 px-4">
            {dataCubes?.data?.map((item, key) => {
              return (
                <Link href={`/app/ad/${item?.id}`} key={key}>
                  <div className="relative">
                    <div className="aspect-[4/3] bg-slate-400 rounded-[20px] overflow-hidden brightness-90">
                      <img
                        src={item?.picture_source}
                        height={1200}
                        width={600}
                        alt=""
                      />
                    </div>
                    <div className="absolute bottom-4 w-full px-4">
                      <div className="bg-white bg-opacity-50 backdrop-blur-md min-h-[60px] rounded-[15px]">
                        <div className="px-6 p-4">
                          <p className="font-semibold">{item?.title}</p>
                          <div className="flex justify-between gap-2">
                            <p className="text-slate-600 text-sm font-medium my-1 limit__line__1">
                              <p className="text-primary bg-yellow-100 text-sm whitespace-nowrap px-1 rounded-md mt-1">
                                Iklan Huehuy
                              </p>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
