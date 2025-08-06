/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import { useGet } from '../../helpers';
import { DateFormatComponent } from '../../components/base.components';

export default function Save() {
  const [type, setType] = useState('hunter');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingNotifications, codeNotifications, dataNotifications] = useGet({
    path: `notification?type=${type}`,
  });

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary w-full px-4 pt-4 pb-16">
          <h2 className="text-white font-semibold text-lg">Notifikasi</h2>
          <p className="text-slate-300 text-sm mt-1">
            Lihat pembaruan dan aktifitas kamu disini...
          </p>
        </div>

        <div className="bg-background min-h-screen w-full relative z-20 pb-28 pt-4">
          <div className="-mt-16 grid grid-cols-2 gap-3">
            <div
              className={`text-center py-3 font-semibold rounded-t-xl cursor-pointer ${
                type == 'hunter' ? 'bg-background' : 'text-gray-300'
              }`}
              onClick={() => setType('hunter')}
            >
              Hunter
            </div>
            <div
              className={`text-center py-3 font-semibold rounded-t-xl cursor-pointer ${
                type == 'merchant' ? 'bg-background' : 'text-gray-300'
              }`}
              onClick={() => setType('merchant')}
            >
              Merchant
            </div>
          </div>

          <div className="px-4 mt-6">
            <div className="flex flex-col gap-3">
              {dataNotifications?.data?.at(0) ? (
                <>
                  {dataNotifications?.data?.map((item, key) => {
                    return (
                      <div
                        className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] relative"
                        key={key}
                      >
                        <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-400 flex justify-center items-center">
                          <img
                            src={item?.grab?.ad?.picture_source}
                            height={700}
                            width={700}
                            alt=""
                          />
                        </div>
                        <div className="col-span-3">
                          <p className="font-semibold">
                            {item?.grab?.ad?.title}
                          </p>
                          <p className="text-sm text-slate-600 my-1">
                            {item?.message}
                          </p>
                          <p className="text-slate-600 text-xs">
                            <DateFormatComponent date={item?.created_at} />
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="py-4 text-slate-500 text-center">
                  Belum ada notifikasi...
                </div>
              )}
            </div>
          </div>
        </div>

        <BottomBarComponent active={'notification'} />
      </div>
    </>
  );
}
