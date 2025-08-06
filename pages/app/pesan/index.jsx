/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';
import { useGet } from '../../../helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faGlobe } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function Pesan() {
  const [type, setType] = useState('hunter');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, code, dataChats] = useGet({
    path: `chat-rooms?type=${type}`,
  });

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary w-full px-4 pt-4 pb-16">
          <div className="flex justify-between">
            <h2 className="text-white font-semibold text-lg">Pesan</h2>
            <Link href="/app/notifikasi">
              <div className="px-2">
                <FontAwesomeIcon icon={faBell} className="text-white" />
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-background min-h-screen w-full  relative z-20 pb-28 pt-4">
          <div className="-mt-16 grid grid-cols-3 gap-3">
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
            <div
              className={`text-center py-3 font-semibold rounded-t-xl cursor-pointer ${
                type == 'world' ? 'bg-background' : 'text-gray-300'
              }`}
              onClick={() => setType('world')}
            >
              Dunia
            </div>
          </div>
          <div className="px-4 mt-4">
            <div className="flex flex-col gap-3">
              {dataChats?.data?.at(0) ? (
                <>
                  {dataChats?.data?.map((item, key) => {
                    return (
                      <Link href={`/app/pesan/${item.id}`} key={key}>
                        <div className="grid grid-cols-6 gap-3 p-3 shadow-sm rounded-[15px] relative">
                          <div className="w-full aspect-square overflow-hidden rounded-full bg-slate-300 flex justify-center items-center">
                            {type != 'world' ? (
                              <img
                                src={
                                  type == 'hunter'
                                    ? item?.user_merchant?.picture_source ||
                                      '/avatar.jpg'
                                    : item?.user_hunter?.picture_source ||
                                      '/avatar.jpg'
                                }
                                height={700}
                                width={700}
                                alt=""
                              />
                            ) : (
                              <div
                                className={`w-full h-full bg-[${item?.world?.name}] flex items-center justify-center`}
                              >
                                <FontAwesomeIcon
                                  icon={faGlobe}
                                  className="opacity-20 text-3xl"
                                />
                              </div>
                            )}
                          </div>
                          <div className="col-span-5">
                            <p className="font-semibold">
                              {type == 'hunter'
                                ? item?.user_merchant?.name
                                : type == 'merchant'
                                ? item?.user_hunter?.name
                                : item?.world?.name}
                            </p>
                            <p className="text-sm text-slate-600 my-1">
                              {item?.last_chat?.grab?.code
                                ? 'Grab: ' + item?.last_chat?.grab?.code
                                : item?.last_chat?.cube?.code
                                ? 'Kubus: ' + item?.last_chat?.cube?.code
                                : item?.last_chat?.message ||
                                  '(belum ada pesan)'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </>
              ) : (
                <div className="py-4 text-slate-500 text-center">
                  Belum ada pesan...
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
