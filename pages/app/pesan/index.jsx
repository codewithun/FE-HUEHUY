/* eslint-disable @next/next/no-img-element */
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import React from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';
import { useGet } from '../../../helpers';
import moment from 'moment';
import { useRouter } from 'next/router';
import { resolveUserImageUrl } from '../../../helpers/image.helpers';

export default function Pesan() {
  const { query } = useRouter();
  const partnerId = query.partner_id;
  const communityId = query.community_id;
  const corporateId = query.corporate_id;

  // build query string untuk filter backend
  const qs = new URLSearchParams();
  if (partnerId) qs.set('partner_id', partnerId);
  if (communityId) qs.set('community_id', communityId);
  if (corporateId) qs.set('corporate_id', corporateId);
  // Tampilkan juga chat yang belum dibalas lawan bicara
  qs.set('replied_only', '0');

  // ambil chat room (terfilter jika query ada)
  const [loading, , dataChats] = useGet({
    path: `chat-rooms${qs.toString() ? `?${qs.toString()}` : ''}`, // endpoint Laravel: ChatController::chatRooms
  });

  // Debug: lihat response dari API untuk diagnosis
  // eslint-disable-next-line no-console
  console.log('DEBUG Chat List:', {
    loading,
    rawResponse: dataChats,
    queryString: qs.toString(),
    finalUrl: `chat-rooms${qs.toString() ? `?${qs.toString()}` : ''}`
  });

  // fallback filter di FE jika backend belum update (optional)
  const list = Array.isArray(dataChats?.data)
    ? dataChats.data.filter((item) =>
      partnerId ? String(item?.partner?.id) === String(partnerId) : true
    )
    : [];

  const formatTime = (t) => (t ? moment(t).fromNow() : '');

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
            ) : list.length ? (
              list.map((item, key) => {
                const partner = item.partner || {};
                const last = item.last_message || '(belum ada pesan)';
                const time = item.created_at ? formatTime(item.created_at) : '';

                // unread_count dikirim dari backend (>=0)
                const unreadCount = Number(item.unread_count || 0);
                // Chat dianggap "read" jika tidak ada pesan belum dibaca
                // Tampilkan sebagai buram/grayscale hanya jika sudah dibaca
                const isRead = unreadCount === 0;

                return (
                  <Link
                    href={`/app/pesan/${item.id}?targetName=${encodeURIComponent(partner.name || 'Pengguna')}`}
                    key={key}
                    className="block"
                  >
                    <div
                      className={
                        `relative grid grid-cols-6 gap-3 p-3 shadow-sm rounded-[15px] bg-white hover:scale-[1.02] transition-all ` +
                        (isRead ? 'opacity-60 filter grayscale' : '')
                      }
                    >
                      {/* unread badge */}
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 z-50 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}

                      {/* Avatar */}
                      <div className={"w-full aspect-square overflow-hidden rounded-full bg-slate-200 flex justify-center items-center " + (isRead ? 'filter grayscale' : '')}>
                        {partner.picture ? (
                          <img
                            src={resolveUserImageUrl({ picture_source: partner.picture }) || '/avatar.jpg'}
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
                          <p className={`font-semibold truncate ${isRead ? 'text-slate-500' : 'text-slate-800'}`}>
                            {partner.name || 'Pengguna'}
                          </p>
                          {time && (
                            <p className="text-xs text-slate-400 whitespace-nowrap ml-2">
                              {time}
                            </p>
                          )}
                        </div>
                        <p className={`text-sm truncate mt-1 ${isRead ? 'text-slate-500' : 'text-slate-600'}`}>
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