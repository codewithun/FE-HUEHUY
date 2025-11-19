/* eslint-disable @next/next/no-img-element */
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import React, { useCallback, useMemo, useState } from 'react';
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
  const initialTab = (query.tab === 'tenant' || query.tab === 'community') ? String(query.tab) : 'community';
  const [activeTab, setActiveTab] = useState(initialTab);

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
  console.log('🔍 Chat List Debug:', {
    loading,
    rawResponse: dataChats,
    queryString: qs.toString(),
    finalUrl: `chat-rooms${qs.toString() ? `?${qs.toString()}` : ''}`,
    itemCount: Array.isArray(dataChats?.data) ? dataChats.data.length : 0
  });

  // fallback filter di FE jika backend belum update (optional)
  const list = useMemo(() => (
    Array.isArray(dataChats?.data)
      ? dataChats.data.filter((item) => (partnerId ? String(item?.partner?.id) === String(partnerId) : true))
      : []
  ), [dataChats, partnerId]);

  // Heuristics to split chats
  const isCommunityChat = useCallback((room) => {
    // Prefer explicit context_type from backend
    if (room?.context_type === 'community') return true;
    if (room?.community_id) return true;
    // Fallback legacy heuristic
    const p = room?.partner || {};
    const role = String(p?.role || p?.type || '').toLowerCase();
    return role === 'admin';
  }, []);

  const isTenantChat = useCallback((room) => {
    // Corporate / tenant chats
    if (room?.context_type === 'corporate') return true;
    if (room?.corporate_id) return true;
    const p = room?.partner || {};
    const role = String(p?.role || p?.type || '').toLowerCase();
    if (p?.is_manager_tenant === true || role === 'manager' || role === 'tenant') return true;
    // If neither community nor corporate markers, treat as tenant/direct
    return !isCommunityChat(room);
  }, [isCommunityChat]);

  const { communityList, tenantList, unreadCommunity, unreadTenant } = useMemo(() => {
    const c = [];
    const t = [];
    let uc = 0;
    let ut = 0;
    list.forEach((room) => {
      const isCommunity = isCommunityChat(room);
      const isTenant = isTenantChat(room);

      // Debug logging for each room classification
      // eslint-disable-next-line no-console
      console.log(`📊 Chat ${room.id} classification:`, {
        room_id: room.id,
        partner: room.partner?.name,
        context_type: room.context_type,
        community_id: room.community_id,
        corporate_id: room.corporate_id,
        isCommunity,
        isTenant,
        final_category: isCommunity ? 'community' : 'tenant'
      });

      if (isCommunity) {
        c.push(room);
        uc += Number(room?.unread_count || 0);
      } else {
        // Default to tenant for anything not explicitly community
        t.push(room);
        ut += Number(room?.unread_count || 0);
      }
    });

    // eslint-disable-next-line no-console
    console.log(`📈 Final classification: Community=${c.length}, Tenant=${t.length}`);
    return { communityList: c, tenantList: t, unreadCommunity: uc, unreadTenant: ut };
  }, [list, isTenantChat, isCommunityChat]);

  const formatTime = (t) => (t ? moment(t).fromNow() : '');

  return (
    <div className="lg:mx-auto lg:relative lg:max-w-md">
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-4 rounded-b-2xl">
        <div className="flex justify-between max-w-md mx-auto">
          <h2 className="text-white font-semibold text-lg">Pesan</h2>
        </div>
        {/* Tabs */}
        <div className="mt-3 flex gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('community')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${activeTab === 'community' ? 'bg-white text-primary' : 'bg-primary-600/30 text-white/90'
              }`}
          >
            Chat Komunitas {unreadCommunity > 0 ? `(${unreadCommunity > 99 ? '99+' : unreadCommunity})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tenant')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${activeTab === 'tenant' ? 'bg-white text-primary' : 'bg-primary-600/30 text-white/90'
              }`}
          >
            Chat Tenant {unreadTenant > 0 ? `(${unreadTenant > 99 ? '99+' : unreadTenant})` : ''}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="bg-background min-h-screen w-full relative z-20 pb-28 pt-4">
        <div className="px-4 mt-4">
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center text-slate-500 py-10">Memuat pesan...</div>
            ) : (activeTab === 'tenant' ? tenantList : communityList).length ? (
              (activeTab === 'tenant' ? tenantList : communityList).map((item, key) => {
                const partner = item.partner || {};
                const rawLast = item.last_message || '(belum ada pesan)';
                let last = rawLast;
                if (typeof rawLast === 'string' && rawLast.trim().startsWith('{')) {
                  try {
                    const parsed = JSON.parse(rawLast);
                    if (parsed && parsed.type === 'product_card') {
                      last = parsed.title ? `Produk: ${parsed.title}` : 'Produk';
                    }
                  } catch { }
                }
                const time = item.created_at ? formatTime(item.created_at) : '';

                // unread_count dikirim dari backend (>=0)
                const unreadCount = Number(item.unread_count || 0);
                // Chat dianggap "read" jika tidak ada pesan belum dibaca
                // Tampilkan sebagai buram/grayscale hanya jika sudah dibaca
                const isRead = unreadCount === 0;

                return (
                  <Link
                    href={`/app/pesan/${item.id}?targetName=${encodeURIComponent(partner.name || 'Pengguna')}${item.community_id ? `&communityId=${item.community_id}` : ''}${item.corporate_id ? `&corporateId=${item.corporate_id}` : ''}${activeTab === 'tenant' ? '&isTenant=1' : ''}`}
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
                {activeTab === 'tenant' ? 'Belum ada chat tenant...' : 'Belum ada chat komunitas...'}
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