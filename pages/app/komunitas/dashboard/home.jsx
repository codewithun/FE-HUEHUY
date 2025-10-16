/* eslint-disable no-console */
import {
  faGift
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';
import CommunityBottomBar from './CommunityBottomBar';


export default function CommunityDashboard({ communityId }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [communityData, setCommunityData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tambah state untuk widget komunitas (type=information)
  const [widgetData, setWidgetData] = useState([]);
  // Fetch widget komunitas (type=information)
  useEffect(() => {
    const fetchWidgetData = async () => {
      if (!communityId) return;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const apiBase = baseUrl.replace(/\/api\/?$/, '');
        const encryptedToken = Cookies.get(token_cookie_name);
        const token = encryptedToken ? Decrypt(encryptedToken) : '';
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
        // Sama seperti promo.jsx, endpoint admin/dynamic-content
        const res = await fetch(`${apiBase}/api/admin/dynamic-content?type=information&community_id=${communityId}`,
          { headers }
        );
        if (res.ok) {
          const json = await res.json();
          const widgets = Array.isArray(json?.data) ? json.data : [];
          // Filter hanya widget aktif
          setWidgetData(widgets.filter(w => w.is_active));
        } else {
          setWidgetData([]);
        }
      } catch {
        setWidgetData([]);
      }
    };
    fetchWidgetData();
  }, [communityId]);

  // ======== UI TOKENS (BIAR KONSISTEN) ========
  const COLORS = {
    olive: '#5a6e1d',
    oliveSoft: 'rgba(90,110,29,0.1)',
    oliveBorder: '#cdd0b3',
    textDark: '#2B3A55',
  };

  // Komponen renderer widget sederhana (bisa diupgrade sesuai kebutuhan)
  function WidgetRenderer({ widget }) {
    const { source_type, size, dynamic_content_cubes, name } = widget;

    if (source_type === 'cube' && Array.isArray(dynamic_content_cubes) && dynamic_content_cubes.length > 0) {
      // layout logic handled inline per size case
      return (
        <div className="mb-6">
          {/* Header Widget */}
          <div className="mb-2">
            <h2 className="text-lg font-bold text-slate-900">{name}</h2>
            {widget.description && (
              <p className="text-sm text-slate-600 mt-[1px]">{widget.description}</p>
            )}
          </div>


          {/* Konten Scrollable */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {dynamic_content_cubes.map((cubeData, index) => {
              const cube = cubeData?.cube;
              if (!cube) return null;
              const ad = cube.ads?.[0];
              const category = cube.category || ad?.category || 'Informasi';

              const imageUrl =
                ad?.image_1 ||
                ad?.image ||
                ad?.picture_source ||
                cube.image ||
                '/default-avatar.png';

              const title = ad?.title || cube.label || 'Promo';
              const merchant = ad?.merchant || communityData?.name || 'Merchant';
              const description = ad?.description || '';

              /** --- Layout spesifik tiap size --- **/
              if (size === 'XL-Ads') {
                return (
                  <div
                    key={cube?.id || index}
                    className="relative rounded-[18px] overflow-hidden border shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
                    style={{
                      minWidth: 320,
                      maxWidth: 360,
                      borderColor: '#d8d8d8',
                      background: '#fffaf0',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      if (ad?.id)
                        router.push(
                          `/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`
                        );
                    }}
                  >
                    {/* Gambar */}
                    <div className="relative w-full h-[290px] bg-white flex items-center justify-center">
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-contain p-2"
                      />
                      <div className="absolute top-3 left-3 bg-white/70 text-[#5a6e1d] text-[11px] font-semibold px-3 py-[3px] rounded-full shadow-sm">
                        {merchant}
                      </div>
                    </div>

                    {/* Overlay bawah warna hijau */}
                    <div className="absolute bottom-0 left-0 right-0 backdrop-blur-sm p-4"
                      style={{ background: 'rgba(90,110,29,0.9)', borderTop: `1px solid ${COLORS.oliveBorder}` }}>
                      <h3 className="text-[15px] font-bold text-white leading-snug mb-2 line-clamp-1">
                        {title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="bg-white/30 text-white text-[11px] font-semibold px-3 py-[3px] rounded-md border border-white/40">
                          {category}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (size === 'XL') {
                return (
                  <div
                    key={cube.id || index}
                    className="rounded-[16px] overflow-hidden border border-[#d8d8d8] bg-[#fffaf0] shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
                    style={{
                      minWidth: 320,
                      maxWidth: 360,
                      cursor: 'pointer'
                    }}
                    onClick={() =>
                      router.push(
                        `/app/komunitas/promo/detail_promo?promoId=${ad?.id}&communityId=${communityData?.id}`
                      )
                    }
                  >
                    {/* Gambar di atas */}
                    <div className="relative w-full h-[180px] bg-white flex items-center justify-center">
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-contain p-2"
                      />
                      {/* Merchant Badge */}
                      <div className="absolute top-3 left-3 bg-white/80 text-[#5a6e1d] text-[11px] font-semibold px-3 py-[3px] rounded-full shadow-sm">
                        {merchant}
                      </div>
                    </div>

                    {/* Konten bawah */}
                    <div className="p-4 bg-[#5a6e1d]/5 border-t border-[#cdd0b3]">
                      <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-1 line-clamp-2">
                        {title}
                      </h3>
                      <p className="text-[13px] text-slate-700 line-clamp-2 mb-3">
                        {description || 'Temukan berbagai keseruan menarik di komunitas ini!'}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="bg-[#e0e4c9] text-[#3f4820] text-[11px] font-semibold px-3 py-[3px] rounded-md">
                          {cube.category || 'Informasi'}
                        </span>
                        <FontAwesomeIcon
                          icon={faGift}
                          className="text-[#3f4820] text-[14px] opacity-80"
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              if (size === 'L') {
                return (
                  <div
                    key={cube.id || index}
                    className="flex items-center rounded-[14px] overflow-hidden border border-[#d8d8d8] bg-[#5a6e1d]/10 shadow-md flex-shrink-0 hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
                    style={{
                      minWidth: 280,
                      maxWidth: 320,
                      height: 130,
                      cursor: 'pointer'
                    }}
                    onClick={() =>
                      router.push(
                        `/app/komunitas/promo/detail_promo?promoId=${ad?.id}&communityId=${communityData?.id}`
                      )
                    }
                  >
                    {/* Gambar kiri */}
                    <div className="relative w-[40%] h-full bg-white flex items-center justify-center overflow-hidden">
                      <div className="w-[90%] h-[90%] relative">
                        <Image
                          src={imageUrl}
                          alt={title}
                          fill
                          className="object-contain rounded-[10px]"
                        />
                      </div>
                    </div>

                    {/* Konten kanan */}
                    <div className="flex-1 h-full p-3 flex flex-col justify-between bg-[#5a6e1d]/5 border-l border-[#cdd0b3]">
                      <div>
                        <h3 className="text-[15px] font-bold text-slate-900 line-clamp-2 leading-snug mb-1">
                          {title}
                        </h3>
                        <p className="text-[13px] text-slate-700 line-clamp-2">
                          {description || 'Welcome to Huehuy!'}
                        </p>
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        <span className="bg-[#e0e4c9] text-[#3f4820] text-[11px] font-semibold px-3 py-[3px] rounded-md">
                          {cube.category || 'Advertising'}
                        </span>
                        <FontAwesomeIcon
                          icon={faGift}
                          className="text-[#3f4820] text-[13px] opacity-80"
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              // === Widget S / M ===
              if (size === 'S' || size === 'M') {
                const isM = size === 'M';
                return (
                  <div
                    key={cube.id || index}
                    className="flex flex-col rounded-[12px] overflow-hidden border border-[#d8d8d8] bg-[#5a6e1d]/10 shadow-sm flex-shrink-0 hover:scale-[1.02] transition-all duration-300"
                    style={{
                      minWidth: isM ? 180 : 140,
                      maxWidth: isM ? 200 : 160,
                      cursor: 'pointer'
                    }}
                    onClick={() =>
                      router.push(
                        `/app/komunitas/promo/detail_promo?promoId=${ad?.id}&communityId=${communityData?.id}`
                      )
                    }
                  >
                    {/* Gambar */}
                    <div
                      className="relative w-full bg-white flex items-center justify-center overflow-hidden"
                      style={{ height: isM ? 150 : 120 }}
                    >
                      <div className="w-[90%] h-[90%] relative">
                        <Image
                          src={imageUrl}
                          alt={title}
                          fill
                          className="object-contain rounded-[8px]"
                        />
                      </div>
                    </div>

                    {/* Konten bawah */}
                    <div className="p-2 bg-[#5a6e1d]/5 border-t border-[#cdd0b3]">
                      <h3
                        className={`${isM ? 'text-[14px]' : 'text-[13px]'
                          } font-bold text-slate-900 line-clamp-2 mb-0.5`}
                      >
                        {title}
                      </h3>
                      <p
                        className={`${isM ? 'text-[12px]' : 'text-[11px]'
                          } text-slate-700 line-clamp-1`}
                      >
                        {description || 'Welcome to Huehuy!'}
                      </p>

                      <div className="mt-1 flex items-center justify-between">
                        <span className="bg-[#e0e4c9] text-[#3f4820] text-[10px] font-semibold px-2 py-[2px] rounded-md">
                          {cube.category || 'Advertising'}
                        </span>
                        <FontAwesomeIcon
                          icon={faGift}
                          className="text-[#3f4820] text-[11px] opacity-80"
                        />
                      </div>
                    </div>
                  </div>
                );
              }

            })}
          </div>
        </div>
      );
    }

    return null;
  }



  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch community data from API
  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!communityId) return;

      try {
        setLoading(true);
        const encryptedToken = Cookies.get(token_cookie_name);
        const token = encryptedToken ? Decrypt(encryptedToken) : '';

        // Handle API URL properly - remove /api if it exists, then add it back
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const apiUrl = baseUrl.replace(/\/api\/?$/, '');

        const response = await fetch(`${apiUrl}/api/communities/${communityId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (response.ok) {
          const result = await response.json();
          const community = result.data || result;

          // Use API response directly, no dummy/default values
          setCommunityData({
            id: community.id,
            name: community.name,
            description: community.description ?? null,
            members: community.members ?? 0,
            category: community.category ?? null,
            location: community.location ?? null,
            privacy: community.privacy ?? null,
            isVerified: community.isVerified ?? community.is_verified ?? null,
            avatar: community.logo ?? null,
          });
        } else {
          // No dummy fallback — set null so UI shows "not found" or handle accordingly
          setCommunityData(null);
        }
      } catch (error) {
        // On error, don't inject dummy data — set null
        setCommunityData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [communityId]);

  // Note: promo fetching removed from this screen to keep component focused.

  // Function untuk menentukan gradient berdasarkan kategori
  const getCommunityGradient = (category) => {
    const gradients = {
      'Shopping': 'bg-gradient-to-r from-blue-500 to-blue-600',
      'Event': 'bg-gradient-to-r from-purple-500 to-purple-600',
      'Kuliner': 'bg-gradient-to-r from-orange-500 to-orange-600',
      'Otomotif': 'bg-gradient-to-r from-gray-600 to-gray-700',
      'Fashion': 'bg-gradient-to-r from-pink-500 to-pink-600',
      'default': 'bg-gradient-to-r from-green-500 to-green-600'
    };
    return gradients[category] || gradients.default;
  };

  // Loading state
  if (!isClient || loading) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="w-full bg-primary h-32 flex items-center justify-center rounded-b-[40px] shadow-neuro">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="mt-2 text-sm drop-shadow-neuro">
                Loading komunitas...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!communityData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="w-full bg-primary h-32 flex items-center justify-center rounded-b-[40px] shadow-neuro">
            <div className="text-white text-center">
              <p className="mt-2 text-sm drop-shadow-neuro">
                Komunitas tidak ditemukan
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rest of your component remains the same...
  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
        <div className="container mx-auto relative z-10 pb-28">
          {/* Header Banner */}
          <div
            className={`w-full relative overflow-hidden ${getCommunityGradient(
              communityData.category
            )} rounded-b-[40px] shadow-neuro`}
          >
            {/* Background decoration */}
            <div className="absolute inset-0">
              <div className="absolute top-4 right-4 w-16 h-16 bg-white rounded-full opacity-10"></div>
              <div className="absolute bottom-8 left-8 w-12 h-12 bg-white rounded-full opacity-10"></div>
              <div className="absolute top-12 left-1/4 w-8 h-8 bg-white rounded-full opacity-10"></div>
            </div>

            <div className="relative px-6 py-6 text-white">
              {/* Welcome Message */}
              <div className="mb-6">
                <h1 className="text-xl font-bold mb-2 drop-shadow-neuro">
                  Selamat Datang Di Komunitas
                  <br />
                  {`"${communityData.name}"`}
                </h1>
                {/* Tampilkan deskripsi dari database */}
                <p className="text-white text-opacity-90 text-sm leading-relaxed drop-shadow-neuro">
                  {communityData.description}
                </p>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20">
            <div className="px-4 pt-6">
              {/* Widget Komunitas Section (type=information) */}
              {widgetData.length > 0 && (
                <div className="mb-6">
                  {widgetData.map(widget => (
                    <WidgetRenderer key={widget.id} widget={widget} />
                  ))}
                </div>
              )}

              {/* Upcoming Events removed - not used */}


            </div>
          </div>
        </div>

        <CommunityBottomBar
          active={'community'}
          communityId={communityData.id}
        />
      </div>
    </>
  );
}
