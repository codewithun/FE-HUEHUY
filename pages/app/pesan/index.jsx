/* eslint-disable @next/next/no-img-element */
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import React from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';
import { useGet } from '../../../helpers';
import moment from 'moment';

export default function Pesan() {
  // ambil semua chat room dari backend universal endpoint
  const [loading, code, dataChats] = useGet({
    path: `chat-rooms`, // endpoint Laravel: ChatController::chatRooms
  });

  // helper waktu
  const formatTime = (t) => {
    if (!t) return '';
    return moment(t).fromNow(); // ex: "2 jam lalu"
  };

  return (
    <div className="lg:mx-auto lg:relative lg:max-w-md">
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-4 rounded-b-2xl">
        <div className="flex justify-between max-w-md mx-auto">
          <h2 className="text-white font-semibold text-lg">Pesan</h2>
        </div>
      </div>

      {/* Body */}
      <div className="bg-background min-h-screen w-full relative z-20 pb-28 pt-4">
        <div className="px-4 mt-4">
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center text-slate-500 py-10">Memuat pesan...</div>
            ) : dataChats?.data?.length ? (
              dataChats.data.map((item, key) => {
                const partner = item.partner || {};
                const last = item.last_message || '(belum ada pesan)';
                const time = item.created_at ? formatTime(item.created_at) : '';

                return (
                  <Link
                    href={`/app/pesan/${item.id}?targetName=${encodeURIComponent(partner.name || 'Pengguna')}`}
                    key={key}
                    className="block"
                  >
                    <div className="grid grid-cols-6 gap-3 p-3 shadow-sm rounded-[15px] bg-white hover:scale-[1.02] transition-all">
                      {/* Avatar */}
                      <div className="w-full aspect-square overflow-hidden rounded-full bg-slate-200 flex justify-center items-center">
                        {partner.picture ? (
                          <img
                            src={partner.picture}
                            alt={partner.name || 'User'}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUserCircle} className="text-3xl text-slate-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="col-span-5 flex flex-col justify-center">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-slate-800 truncate">
                            {partner.name || 'Pengguna'}
                          </p>
                          {time && (
                            <p className="text-xs text-slate-400 whitespace-nowrap ml-2">
                              {time}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 truncate mt-1">
                          {last}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="py-4 text-slate-500 text-center">
                Belum ada pesan...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <BottomBarComponent active={'notification'} />
    </div>
  );
}
