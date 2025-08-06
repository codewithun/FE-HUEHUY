/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import React from 'react';
import { useGet } from '../../../helpers';

export default function MenuCubePage({ menu }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingCubes, codeCubes, dataCubes] = useGet({
    path: menu.source_type == 'cube' ? `menu-cube/${menu.id}` : 'shuffle-ads',
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
                <Link href={`/app/${item?.cube?.code}`} key={key}>
                  <div className="relative snap-center w-[330px] shadow-sm bg-white bg-opacity-40 backdrop-blur-sm rounded-[14px] overflow-hidden p-3">
                    <div className="aspect-[6/3] bg-slate-400 rounded-[14px] overflow-hidden brightness-90">
                      {item?.cube?.link_information ? (
                        <>
                          <iframe
                            width="320"
                            height="170"
                            src={item?.cube?.link_information}
                            title="YouTube video player"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerpolicy="strict-origin-when-cross-origin"
                            allowfullscreen
                          ></iframe>
                        </>
                      ) : (
                        <img
                          src={item?.picture_source}
                          height={1200}
                          width={600}
                          alt=""
                        />
                      )}
                    </div>
                    <div className="px-1">
                      <p className="font-semibold mt-2 limit__line__1">
                        {item?.title}
                      </p>
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-slate-600 text-xs my-1 limit__line__2">
                          {item?.cube?.address}
                          {item?.cube?.is_information && (
                            <p className="text-primary bg-green-200 text-sm whitespace-nowrap px-1 rounded-md mt-1">
                              Informasi
                            </p>
                          )}
                        </p>

                        {(item?.total_remaining || item?.max_grab) && (
                          <p className="text-danger bg-red-200 text-sm whitespace-nowrap px-1 rounded-md mt-1">
                            Sisa {item?.total_remaining || item?.max_grab}
                          </p>
                        )}
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
            {dataCubes?.data?.map((ad, ad_key) => {
              return (
                <Link href={`/app/${ad?.cube?.code}`} key={ad_key}>
                  <div className="relative">
                    <div className="aspect-[4/3] bg-slate-400 rounded-[20px] overflow-hidden brightness-90">
                      <img
                        src={ad?.picture_source}
                        height={1200}
                        width={600}
                        alt=""
                      />
                    </div>
                    <div className="absolute bottom-4 w-full px-4">
                      <div className="bg-white bg-opacity-50 backdrop-blur-md min-h-[60px] rounded-[15px]">
                        <div className="px-6 p-4">
                          <p className="font-semibold">{ad?.title}</p>
                          <div className="flex justify-between gap-2">
                            <p className="text-slate-600 text-sm font-medium my-1 limit__line__1">
                              {ad?.cube?.address}
                              {ad?.cube?.is_information && (
                                <p className="text-primary bg-green-200 text-sm whitespace-nowrap px-1 rounded-md mt-1">
                                  Informasi
                                </p>
                              )}
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
