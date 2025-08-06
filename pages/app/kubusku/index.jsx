/* eslint-disable @next/next/no-img-element */
import React from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';
import { IconButtonComponent } from '../../../components/base.components';
import { faArrowLeftLong, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useGet } from '../../../helpers';
import Link from 'next/link';
import { useRouter } from 'next/router';
// import CubeComponent from '../../../components/construct.components/CubeComponent';

export default function Kubusku() {
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, codeData, data] = useGet({
    path: `cubes`,
  });

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary h-10"></div>
        <div className="bg-background h-screen overflow-y-auto scroll_control w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
          <div className="flex justify-between items-center gap-2 p-2 sticky top-0 z-30 bg-white bg-opacity-40 backdrop-blur-sm border-b ">
            <div className="px-2">
              <IconButtonComponent
                icon={faArrowLeftLong}
                variant="simple"
                size="lg"
                onClick={() => router.back()}
              />
            </div>
            <div className="font-semibold w-full text-lg">Kubusku</div>
          </div>

          <div className="mt-2 px-2 flex flex-col gap-4">
            {data?.data?.length ? (
              data?.data?.map((item, key) => {
                return (
                  <Link href={`/app/${item?.code}`} key={key}>
                    <div className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] relative bg-white bg-opacity-40 backdrop-blur-sm items-center">
                      <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-400 flex justify-center items-center">
                        <img
                          src={item?.ads?.at(0)?.picture_source}
                          height={700}
                          width={700}
                          alt=""
                        />
                      </div>
                      <div className="col-span-3">
                        <div className="mb-2 flex gap-2 limit__line__1">
                          {item?.status === 'active' ? (
                            <span className="uppercase font-medium text-green-600 py-1 px-2.5 rounded-md text-sm bg-green-100">
                              Aktif
                            </span>
                          ) : (
                            <span className="uppercase font-medium text-red-600 py-1 px-2.5 rounded-md text-sm bg-red-100">
                              Tidak Aktif
                            </span>
                          )}{' '}
                          #{item?.code}
                        </div>
                        <p className="font-semibold">
                          {item?.ads?.at(0)?.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 limit__line__1">
                          Sisa{' '}
                          {item?.ads?.at(0)?.is_daily_grab
                            ? `${
                                item?.ads?.at(0)?.max_grab -
                                (item?.ads?.at(0)?.total_grab || 0)
                              } promo / hari`
                            : `${
                                item?.ads?.at(0)?.max_grab -
                                (item?.ads?.at(0)?.total_grab || 0)
                              } promo`}
                        </p>
                      </div>
                      {/* <div className="absolute top-5 left-0 bg-white bg-opacity-50 backdrop-blur-md min-h-[20px] py-1 pl-2 pr-3 rounded-r-full flex gap-2 items-center">
                        <CubeComponent
                          size={9}
                          color={`${item?.cube_type?.color}`}
                        />
                        <p className="text-xs">{item?.cube_type?.code}</p>
                      </div> */}
                    </div>
                  </Link>
                );
              })
            ) : (
              <>
                <div className="text-center py-4">Belum punya kubus</div>
              </>
            )}
          </div>
        </div>

        <div className="fixed bottom-24 right-7 z-40">
          <Link href={`/app/kubusku/buat-kubus`}>
            <IconButtonComponent
              icon={faPlus}
              size="xl"
              className="shadow-md shadow-slate-300"
            />
          </Link>
        </div>
        <BottomBarComponent active={'user'} />
      </div>
    </>
  );
}
