/* eslint-disable no-console */
import {
  faCalendar,
  faClock,
  faMapMarkerAlt,
  faUsers
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
  
  // Tambahkan state yang hilang
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [promoCategories, setPromoCategories] = useState([]);
  
  // Tambahkan refresh trigger untuk real-time update
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  // Fetch events and promos
  useEffect(() => {
    const fetchEventsAndPromos = async () => {
      if (!communityId) return;

      // Prepare base URL & auth header (sesuaikan dengan promo.jsx)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const baseUrl = (apiUrl || '')
        .replace(/\/api\/?$/, '')
        .replace(/\/+$/, '');

      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      // Helper functions (sama dengan promo.jsx)
      const isAbsoluteUrl = (u) =>
        typeof u === 'string' && /^https?:\/\//i.test(u);

      const isPlaceholder = (u) =>
        typeof u === 'string' && u.startsWith('/api/placeholder');

      const buildImageUrl = (raw) => {
        const fallback = '/api/placeholder/180/130';
        if (typeof raw !== 'string') return fallback;

        let url = raw.trim();
        if (!url) return fallback;

        // 1) Sudah absolute? langsung pakai
        if (isAbsoluteUrl(url)) return url;

        // 2) Placeholder? biarkan
        if (isPlaceholder(url)) return url;

        // 3) Normalisasi path relatif dari backend
        let path = url.replace(/^\/+/, '');                   // buang leading slash
        path = path.replace(/^api\/storage\//, 'storage/');   // api/storage → storage

        // Jika bukan diawali "storage/", tetapi diawali folder konten seperti "promos/", "uploads/", arahkan ke storage
        if (/^(promos|uploads|images|files)\//i.test(path)) {
          path = `storage/${path}`;
        }

        // 4) Gabungkan dengan baseUrl (tanpa /api, tanpa trailing slash)
        const finalUrl = `${baseUrl}/${path}`;

        // 5) Validasi akhir
        return /^https?:\/\//i.test(finalUrl) ? finalUrl : fallback;
      };

      const normalizePromos = (arr = []) => {
        return (Array.isArray(arr) ? arr : []).map(p => {
          const raw = p.image_url ?? p.image ?? p.image_path ?? '/api/placeholder/180/130';
          return {
            id: p.id ?? p.promo_id ?? Math.random().toString(36).slice(2,9),
            title: p.title ?? p.name ?? p.label ?? 'Promo',
            description: p.description ?? p.subtitle ?? null,
            image: buildImageUrl(raw),
            label: p.label ?? 'Promo',
            discount: p.discount ?? p.discount_percentage ?? null,
            location: p.location ?? p.community?.location ?? null
          };
        });
      };

      try {
        setLoadingEvents(true);

        // Fetch upcoming events (best-effort, keep empty on fail)
        try {
          const evRes = await fetch(`${apiBase}/api/communities/${communityId}/events`, { headers });
          if (evRes.ok) {
            const evJson = await evRes.json().catch(() => null);
            const evList = Array.isArray(evJson?.data) ? evJson.data : Array.isArray(evJson) ? evJson : [];
            setUpcomingEvents(Array.isArray(evList) ? evList : []);
          } else {
            setUpcomingEvents([]);
          }
        } catch (e) {
          setUpcomingEvents([]);
        }

        // Fetch promos for community (sesuaikan dengan promo.jsx untuk real-time update)
        try {
          // Tambahkan cache busting untuk memastikan data terbaru
          const timestamp = Date.now();
          
          // Langsung fetch promo endpoint seperti di promo.jsx
          const promoRes = await fetch(`${apiUrl}/communities/${communityId}/promos?_t=${timestamp}`, { headers });
          
          if (promoRes.ok) {
            const promoJson = await promoRes.json().catch(() => null);
            const promoList = Array.isArray(promoJson?.data) ? promoJson.data : Array.isArray(promoJson) ? promoJson : [];
            
            // Buat kategori tunggal dengan data terbaru
            setPromoCategories([
              {
                id: 'promo-terkini',
                title: 'Promo Terkini',
                subtitle: 'Promo terbaru dari komunitas',
                promos: normalizePromos(promoList),
              },
            ]);
          } else {
            // Coba endpoint promo-categories sebagai fallback
            const pcRes = await fetch(`${apiUrl}/communities/${communityId}/promo-categories?_t=${timestamp}`, { headers });
            if (pcRes.ok) {
              const pcJson = await pcRes.json().catch(() => null);
              const pcList = Array.isArray(pcJson?.data) ? pcJson.data : Array.isArray(pcJson) ? pcJson : [];
              
              if (pcList.length > 0) {
                const normalizedCategories = pcList.map((cat) => {
                  const rawPromos = Array.isArray(cat.promos) ? cat.promos : (cat.items || []);
                  return {
                    id: cat.id ?? `pc-${cat.title ?? Math.random().toString(36).slice(2,8)}`,
                    title: cat.title ?? cat.name ?? 'Promo',
                    subtitle: cat.subtitle ?? cat.description ?? '',
                    promos: normalizePromos(rawPromos),
                  };
                });
                setPromoCategories(normalizedCategories);
              } else {
                setPromoCategories([]);
              }
            } else {
              setPromoCategories([]);
            }
          }
        } catch (e) {
          console.error('Error fetching promos:', e);
          setPromoCategories([]);
        }
      } catch (err) {
        console.error('Error fetching events/promos:', err);
        setUpcomingEvents([]);
        setPromoCategories([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEventsAndPromos();
  }, [communityId, refreshTrigger]);

  // Auto-refresh saat focus & route change untuk data terbaru
  useEffect(() => {
    const handleFocus = () => setRefreshTrigger((p) => p + 1);
    const handleRouteChange = () => setRefreshTrigger((p) => p + 1);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setRefreshTrigger((p) => p + 1);
      }
    };

    window.addEventListener('focus', handleFocus);
    router.events.on('routeChangeComplete', handleRouteChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      router.events.off('routeChangeComplete', handleRouteChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router.events]);

  // Tambahkan interval refresh untuk memastikan data selalu terbaru
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger((p) => p + 1);
    }, 30000); // Refresh setiap 30 detik

    return () => clearInterval(interval);
  }, []);

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
              {/* Upcoming Events Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Upcoming Event
                    </h2>
                    <p className="text-sm text-slate-600">Event komunitas terbaru</p>
                  </div>
                  <button
                    onClick={() => router.push(`/app/komunitas/event/community/${communityData.id}`)}
                    className="text-primary text-sm font-semibold hover:underline"
                  >
                    Lihat Semua
                  </button>
                </div>

                {/* Loading State */}
                {loadingEvents ? (
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 bg-gray-200 animate-pulse rounded-2xl"
                        style={{ width: '320px', height: '240px' }}
                      />
                    ))}
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  /* Horizontal Scroll Container for Events */
                  <div className="overflow-x-auto scrollbar-hide">
                    <div
                      className="flex gap-4 pb-2"
                      style={{ width: 'max-content' }}
                    >
                      {upcomingEvents.slice(0, 5).map((event) => (
                        <div
                          key={event.id}
                          className="relative rounded-2xl overflow-hidden shadow-neuro hover:scale-[1.01] transition-all duration-300 flex-shrink-0"
                          style={{ width: '320px' }}
                        >
                          <div className="relative h-48">
                            {/* Background Image */}
                            <Image
                              src={event.image}
                              alt={event.title}
                              fill
                              className="object-cover"
                            />

                            {/* Dark overlay untuk readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>

                            {/* Community Name Badge - Kiri Atas */}
                            <div className="absolute top-3 left-3">
                              <span className="bg-white bg-opacity-90 text-slate-900 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                                {event.category}
                              </span>
                            </div>

                            {/* Event Status Badge - Kanan Atas */}
                            <div className="absolute top-3 right-3">
                              <span className="bg-green-500 bg-opacity-90 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                                UPCOMING
                              </span>
                            </div>

                            {/* Event Info - Bagian Bawah */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                              <h4 className="text-lg font-bold mb-2 leading-tight drop-shadow-lg line-clamp-2">
                                {event.title}
                              </h4>
                              <div className="space-y-1 text-sm text-white text-opacity-90">
                                <div className="flex items-center gap-2">
                                  <FontAwesomeIcon
                                    icon={faCalendar}
                                    className="text-xs"
                                  />
                                  <span className="drop-shadow-lg">
                                    {event.date}
                                  </span>
                                  <FontAwesomeIcon
                                    icon={faClock}
                                    className="text-xs ml-2"
                                  />
                                  <span className="drop-shadow-lg">
                                    {event.time}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FontAwesomeIcon
                                    icon={faMapMarkerAlt}
                                    className="text-xs"
                                  />
                                  <span className="drop-shadow-lg line-clamp-1">
                                    {event.location}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FontAwesomeIcon
                                    icon={faUsers}
                                    className="text-xs"
                                  />
                                  <span className="drop-shadow-lg">
                                    {event.participants} peserta
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="text-center text-sm text-slate-600 py-6">
                    Belum ada event di komunitas ini.
                  </div>
                )}
              </div>

              {/* Promo Categories */}
              {promoCategories.map((category) => (
                <div key={category.id} className="mb-6">
                  <div className="bg-primary rounded-t-2xl p-4 text-white shadow-neuro">
                    <h3 className="text-lg font-bold drop-shadow-neuro">
                      {category.title}
                    </h3>
                    <p className="text-white text-opacity-90 text-sm drop-shadow-neuro">
                      {category.subtitle}
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-b-2xl p-4 shadow-neuro">
                    {Array.isArray(category.promos) &&
                      category.promos.length > 0 ? (
                      <div className="overflow-x-auto scrollbar-hide">
                        <div
                          className="flex gap-4 pb-2"
                          style={{ width: 'max-content' }}
                        >
                          {category.promos.map((promo) => (
                            <div
                              key={promo.id}
                              onClick={() =>
                                router.push({
                                  pathname: `/app/komunitas/promo/${promo.id}`,
                                  query: { communityId: communityData.id }
                                })
                              }
                              className="bg-white rounded-xl overflow-hidden shadow-neuro-in hover:scale-[1.02] transition-all duration-300 flex-shrink-0 cursor-pointer"
                              style={{ width: '180px' }}
                            >
                              <div className="relative h-36 overflow-hidden">
                                <Image
                                  src={
                                    promo.image ||
                                    '/api/placeholder/180/130'
                                  }
                                  alt={promo.title}
                                  width={180}
                                  height={130}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-3">
                                <h4 className="font-semibold text-sm text-slate-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                                  {promo.title}
                                </h4>
                                {promo.description && (
                                  <p className="text-xs text-slate-600 mb-2 line-clamp-2 min-h-[2rem]">
                                    {promo.description}
                                  </p>
                                )}
                                <div className="flex flex-col gap-2">
                                  <span className="text-xs bg-primary bg-opacity-20 text-primary px-2 py-1 rounded text-center">
                                    {promo.label || 'Promo'}
                                  </span>
                                  {promo.discount && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold text-center">
                                      {promo.discount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-sm text-slate-600 py-6">
                        Belum ada promo pada kategori ini.
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
