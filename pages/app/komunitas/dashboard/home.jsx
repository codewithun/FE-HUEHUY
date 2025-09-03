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

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Demo data - in real app this would come from API based on community ID
  const [communityData, setCommunityData] = useState(null);

  useEffect(() => {
    if (communityId) {
      // Simulate API call to get community data based on ID
      const getCommunityData = (id) => {
        const allCommunities = {
          1: {
            id: 1,
            name: 'dbotanica Bandung',
            description:
              'Mall perbelanjaan standar dengan beragam toko pakaian, plus tempat makan kasual & bioskop. Terletak di daerah pusat wisata Kota Bandung, hanya beberapa ratus meter dari pintu tol Pasteur',
            members: 1234,
            category: 'Shopping',
            location: 'Kota Bandung',
            isOwner: false,
            isAdmin: true,
            isJoined: true,
            privacy: 'public',
            activePromos: 8,
            totalEvents: 3,
            unreadMessages: 5,
            isVerified: true,
            avatar: '/api/placeholder/50/50'
          },
          2: {
            id: 2,
            name: 'Sunscape Event Organizer',
            description:
              'Sunscape Event Organizer adalah penyelenggara acara profesional yang berfokus pada event-event berkualitas tinggi',
            members: 856,
            category: 'Event',
            location: 'Bandung',
            isOwner: true,
            isAdmin: true,
            isJoined: true,
            privacy: 'private',
            activePromos: 12,
            totalEvents: 5,
            unreadMessages: 3,
            isVerified: false,
            avatar: '/api/placeholder/50/50'
          },
          3: {
            id: 3,
            name: 'Kuliner Bandung Selatan',
            description:
              'Komunitas pecinta kuliner area Bandung Selatan dan sekitarnya. Berbagi rekomendasi tempat makan enak dan murah',
            members: 2341,
            category: 'Kuliner',
            location: 'Bandung Selatan',
            isOwner: false,
            isAdmin: false,
            isJoined: true,
            privacy: 'public',
            activePromos: 15,
            totalEvents: 2,
            unreadMessages: 8,
            isVerified: true,
            avatar: '/api/placeholder/50/50'
          },
          4: {
            id: 4,
            name: 'Otomotif Enthusiast',
            description:
              'Komunitas penggemar otomotif, modifikasi, dan spare part. Sharing tips perawatan kendaraan',
            members: 892,
            category: 'Otomotif',
            location: 'Bandung',
            isOwner: false,
            isAdmin: true,
            isJoined: true,
            privacy: 'public',
            activePromos: 6,
            totalEvents: 1,
            unreadMessages: 2,
            isVerified: false,
            avatar: '/api/placeholder/50/50'
          },
          5: {
            id: 5,
            name: 'Fashion & Style Bandung',
            description:
              'Komunitas fashion, style, dan shopping outfit terkini. Berbagi tips berpakaian dan trend fashion',
            members: 1567,
            category: 'Fashion',
            location: 'Bandung',
            isOwner: false,
            isAdmin: false,
            isJoined: true,
            privacy: 'public',
            activePromos: 22,
            totalEvents: 4,
            unreadMessages: 12,
            isVerified: true,
            avatar: '/api/placeholder/50/50'
          }
        };
        return allCommunities[parseInt(id)] || allCommunities[1]; // fallback to default
      };

      setCommunityData(getCommunityData(communityId));
    }
  }, [communityId]);

  // Upcoming Events Data - dynamic based on community
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    if (communityData) {
      fetchCommunityEvents();
    }
  }, [communityData]);

  // Format date to be more readable
  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Handle various date formats
      let date;
      
      // If it's already a valid date string like "4 Sep 2025"
      if (dateString.includes(' ') && !dateString.includes('T')) {
        return dateString;
      }
      
      // Try parsing as ISO date or other formats
      date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        // Try alternative parsing for formats like "2025-09-04"
        const parts = dateString.split('-');
        if (parts.length === 3) {
          date = new Date(parts[0], parts[1] - 1, parts[2]);
        }
      }
      
      // If still invalid, return original string cleaned up
      if (isNaN(date.getTime())) {
        return dateString.replace(/T.*/, '').replace(/-/g, '/');
      }
      
      const options = { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      };
      return date.toLocaleDateString('id-ID', options);
    } catch (error) {
      // If date parsing fails, try to clean up the original string
      return dateString.replace(/T.*/, '').replace(/-/g, '/');
    }
  };

  // Format time to be cleaner
  const formatEventTime = (timeString) => {
    if (!timeString) return '';
    
    // If it's already in HH:MM format, return as is
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    
    // If it's a range like "10:00 - 17:00", return as is
    if (timeString.includes(' - ')) {
      return timeString;
    }
    
    // If it contains "Invalid", return empty string
    if (timeString.toLowerCase().includes('invalid')) {
      return '';
    }
    
    try {
      // Try parsing time with various formats
      if (timeString.includes(':')) {
        const timeParts = timeString.split(':');
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0]);
          const minutes = parseInt(timeParts[1]);
          if (!isNaN(hours) && !isNaN(minutes)) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        }
      }
      
      const time = new Date(`2000-01-01T${timeString}`);
      if (!isNaN(time.getTime())) {
        return time.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      }
      
      return timeString;
    } catch (error) {
      return timeString;
    }
  };

  const fetchCommunityEvents = async () => {
    try {
      setLoadingEvents(true);
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      
      // Try multiple possible endpoints
      const possibleEndpoints = [
        `${apiUrl}/events?community_id=${communityData.id}`,
        `${apiUrl}/admin/events?community_id=${communityData.id}`,
        `${apiUrl}/communities/${communityData.id}/events`,
        `${apiUrl}/events/community/${communityData.id}`
      ];
      
      let response = null;
      let usedEndpoint = '';
      
      // Try each endpoint until one works
      for (const endpoint of possibleEndpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });
          
          if (response.ok) {
            usedEndpoint = endpoint;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (!response || !response.ok) {
        setUpcomingEvents([]);
        return;
      }

      const result = await response.json();
      
      let events = [];
      
      // Handle different response structures
      if (Array.isArray(result)) {
        events = result;
      } else if (Array.isArray(result.data)) {
        events = result.data;
      } else if (result.events && Array.isArray(result.events)) {
        events = result.events;
      }
      
      // Filter events by community_id if endpoint returns all events
      if (usedEndpoint.includes('?community_id=') === false) {
        events = events.filter(event => 
          event.community_id && event.community_id.toString() === communityData.id.toString()
        );
      }
      
      // Transform backend data to match frontend structure
      const transformedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        category: event.category || communityData.name,
        image: event.image ? (
          event.image.startsWith('http') 
            ? event.image 
            : `${apiUrl.replace('/api', '')}/storage/${event.image}`
        ) : '/images/event/default-event.jpg',
        date: formatEventDate(event.date),
        time: formatEventTime(event.time),
        location: event.location,
        participants: event.participants || 0
      }));

      setUpcomingEvents(transformedEvents);
      
    } catch (error) {
      setUpcomingEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Generate demo events as fallback
  const generateDemoEvents = (community) => [
    {
      id: 1,
      title: `Kids Drawing Competition - ${community.name}`,
      category: community.name,
      image: '/images/event/kids-drawing.jpg',
      date: '15 Agustus 2025',
      time: '10:00 - 17:00',
      location: community.location,
      participants: 45
    },
    {
      id: 2,
      title: 'Fashion Show & Beauty Contest',
      category: community.name,
      image: '/images/event/fashion-show.jpg',
      date: '20 Agustus 2025',
      time: '19:00 - 22:00',
      location: community.location,
      participants: 120
    },
    {
      id: 3,
      title: 'Shopping Festival Weekend',
      category: community.name,
      image: '/images/event/shopping-festival.jpg',
      date: '25 Agustus 2025',
      time: '10:00 - 22:00',
      location: community.location,
      participants: 500
    }
  ];

  // Promo Categories Data - dynamic based on community
  const [promoCategories, setPromoCategories] = useState([]);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  // baseUrl = apiUrl tanpa trailing `/api`, tanpa trailing slash
  const baseUrl = (apiUrl || '')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');

  // ---- URL helpers (fix utama di sini) ----
  const isAbsoluteUrl = (u) =>
    typeof u === 'string' && /^https?:\/\//i.test(u);

  const isPlaceholder = (u) =>
    typeof u === 'string' && u.startsWith('/api/placeholder');

  /**
   * Build final image URL (robust):
   * - absolute: pakai apa adanya
   * - placeholder: pakai apa adanya
   * - relatif: normalisasi dulu → mapping ke "storage/..." bila perlu → gabungkan ke baseUrl (apiUrl tanpa /api)
   */
  const buildImageUrl = (raw) => {
    const fallback = '/api/placeholder/150/120';
    if (typeof raw !== 'string') return fallback;

    let url = raw.trim();
    if (!url) return fallback;

    // 1) Sudah absolute? langsung pakai
    if (isAbsoluteUrl(url)) return url;

    // 2) Placeholder? biarkan
    if (isPlaceholder(url)) return url;

    // 3) Normalisasi path relatif dari backend
    //    - backend sering kirim "promos/xxx.webp" → seharusnya "storage/promos/xxx.webp"
    //    - kalau backend kirim "api/storage/xxx" → jadikan "storage/xxx"
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

  // Add back generatePromos used as a final fallback
  const generatePromos = (community) => {
    const promosByCategory = {
      // Hijau tua untuk Shopping
      Shopping: [
        {
          id: 1,
          title: 'Promo Makanan & Minuman',
          subtitle: 'Diskon Special untuk Foodie!',
          promos: [
            {
              id: 1,
              title: 'Chicken Star - Ayam Crispy Spesial',
              image: '/images/promo/chicken-package.jpg',
              label: 'Food Promo',
              discount: '20%',
              description:
                'Ayam crispy dengan bumbu rahasia dan nasi hangat'
            },
            {
              id: 2,
              title: 'Bubble Tea House - Minuman Segar',
              image: '/images/promo/bubble-tea-discount.jpg',
              label: 'Drink Promo',
              discount: '15%',
              description:
                'Bubble tea dengan berbagai rasa dan topping'
            },
            {
              id: 3,
              title: 'Pizza Hut - Pizza Family',
              image: '/images/promo/pizza-medium-deal.jpg',
              label: 'Family Deal',
              discount: '30%',
              description:
                'Pizza besar dengan topping lengkap untuk keluarga'
            },
            {
              id: 4,
              title: 'Premium Coffee Experience',
              image: '/images/promo/brown-sugar-coffee.jpg',
              label: 'Premium',
              discount: '10%',
              description:
                'Kopi berkualitas tinggi dengan cita rasa otentik'
            }
          ]
        }
      ],
      Event: [
        {
          id: 1,
          title: 'Food & Beverage Packages',
          subtitle: 'Paket F&B untuk Event Anda!',
          promos: [
            {
              id: 1,
              title: 'Bubble Tea House - Event Package',
              image: '/images/promo/bubble-tea-discount.jpg',
              label: 'Event Package',
              discount: '25%',
              description:
                'Paket bubble tea untuk acara corporate dan private'
            },
            {
              id: 2,
              title: 'Corporate Lunch Package',
              image: '/images/promo/burger-combo-flash.jpg',
              label: 'Corporate',
              discount: '20%',
              description:
                'Paket makan siang untuk meeting dan seminar'
            },
            {
              id: 3,
              title: 'Premium Coffee Catering',
              image: '/images/promo/brown-sugar-coffee.jpg',
              label: 'Catering',
              discount: '30%',
              description:
                'Layanan kopi premium untuk event khusus'
            }
          ]
        }
      ],
      Kuliner: [
        {
          id: 1,
          title: 'Promo Makanan & Minuman',
          subtitle: 'Diskon Special untuk Foodie!',
          promos: [
            {
              id: 1,
              title: 'Chicken Star - Ayam Crispy Spesial',
              image: '/images/promo/chicken-package.jpg',
              label: 'Food Promo',
              discount: '20%',
              description:
                'Ayam crispy dengan bumbu rahasia dan nasi hangat'
            },
            {
              id: 2,
              title: 'Bubble Tea House - Minuman Segar',
              image: '/images/promo/bubble-tea-discount.jpg',
              label: 'Drink Promo',
              discount: '15%',
              description:
                'Bubble tea dengan berbagai rasa dan topping'
            },
            {
              id: 3,
              title: 'Pizza Hut - Pizza Family',
              image: '/images/promo/pizza-medium-deal.jpg',
              label: 'Family Deal',
              discount: '30%',
              description:
                'Pizza besar dengan topping lengkap untuk keluarga'
            },
            {
              id: 4,
              title: 'Premium Coffee Experience',
              image: '/images/promo/brown-sugar-coffee.jpg',
              label: 'Premium',
              discount: '10%',
              description:
                'Kopi berkualitas tinggi dengan cita rasa otentik'
            }
          ]
        }
      ],
      Otomotif: [
        {
          id: 1,
          title: 'Spare Part & Service',
          subtitle: 'Promo Perawatan Kendaraan!',
          promos: [
            {
              id: 1,
              title: 'Service Motor Complete Package',
              image: '/images/promo/chicken-package.jpg',
              label: 'Service',
              discount: '30%',
              description:
                'Paket service lengkap untuk motor kesayangan'
            },
            {
              id: 2,
              title: 'Oil Change Premium Package',
              image: '/images/promo/beef-sausage-chicken.jpg',
              label: 'Maintenance',
              discount: '20%',
              description:
                'Ganti oli premium dengan filter berkualitas'
            }
          ]
        }
      ],
      Fashion: [
        {
          id: 1,
          title: 'Fashion Sale',
          subtitle: 'Koleksi Terbaru dengan Harga Terbaik!',
          promos: [
            {
              id: 1,
              title: 'Summer Collection 2025',
              image: '/images/promo/burger-combo-flash.jpg',
              label: 'Fashion',
              discount: '40%',
              description:
                'Koleksi pakaian musim panas terbaru dan trendy'
            },
            {
              id: 2,
              title: 'Shoes & Accessories Sale',
              image: '/images/promo/pizza-medium-deal.jpg',
              label: 'Accessories',
              discount: '35%',
              description:
                'Sepatu dan aksesoris dengan kualitas premium'
            },
            {
              id: 3,
              title: 'Casual Wear Collection',
              image: '/images/promo/brown-sugar-coffee.jpg',
              label: 'Casual',
              discount: '25%',
              description:
                'Pakaian kasual untuk gaya hidup aktif'
            }
          ]
        }
      ]
    };
    return (
      promosByCategory[community?.category] || [
        {
          id: 1,
          title: 'Promo Komunitas',
          subtitle: `${community.name} - Promo Tersedia`,
          promos: [
            {
              id: 1,
              title: 'Welcome Bonus',
              image: '/api/placeholder/150/120',
              label: 'Special',
              discount: '10%'
            }
          ]
        }
      ]
    );
  };

  useEffect(() => {
    if (!communityData) return;

    const normalizePromos = (arr = []) => {
      return (Array.isArray(arr) ? arr : []).map((p) => {
        const raw =
          p.image_url ??
          p.image ??
          p.image_path ?? // biarkan apa adanya (bisa "promos/xxx.webp" atau "storage/xxx.webp"), helper yang akan normalkan
          '/api/placeholder/150/120';

        const image = buildImageUrl(raw);

        return {
          id: p.id ?? p.promo_id ?? Math.random(),
          title: p.title ?? p.name ?? 'Promo',
          image,
          label: p.label ?? p.tag ?? 'Promo',
          discount:
            typeof p.discount === 'number'
              ? `${p.discount}%`
              : p.discount ?? p.discount_text ?? '',
          description: p.description ?? p.subtitle ?? ''
        };
      });
    };

    const convertCategoriesToWidgets = (cats = []) =>
      cats.map((c) => ({
        id: c.id ?? Math.random(),
        title: c.title ?? c.name ?? 'Kategori',
        subtitle: c.description ?? '',
        promos: normalizePromos(c.promos ?? [])
      }));

    const getAuthHeaders = () => {
      try {
        const encryptedToken = Cookies.get(token_cookie_name);
        const token = encryptedToken ? Decrypt(encryptedToken) : '';
        return token
          ? {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
          : { 'Content-Type': 'application/json' };
      } catch (e) {
        return { 'Content-Type': 'application/json' };
      }
    };

    const fetchPromoWidgetsOrCategories = async () => {
      // 1) Coba categories dulu
      try {
        const res = await fetch(
          `${apiUrl}/communities/${communityData.id}/categories`,
          {
            headers: getAuthHeaders()
          }
        );
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          const data = Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json)
              ? json
              : [];
          if (Array.isArray(data) && data.length > 0) {
            setPromoCategories(convertCategoriesToWidgets(data));
            return;
          }
        }
      } catch {
        // ignore & fallback
      }

      // 2) Jika tidak ada kategori, baru promos
      try {
        const res = await fetch(
          `${apiUrl}/communities/${communityData.id}/promos`,
          {
            headers: getAuthHeaders()
          }
        );
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          const data = Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json)
              ? json
              : [];
          if (Array.isArray(data) && data.length > 0) {
            setPromoCategories([
              {
                id: `assigned-${communityData.id}`,
                title: 'Promo Komunitas',
                subtitle: `${communityData.name} - Promo Tersedia`,
                promos: normalizePromos(data)
              }
            ]);
            return;
          }
        }
      } catch {
        // ignore & fallback
      }

      // 3) Fallback demo
      setPromoCategories(generatePromos(communityData));
    };

    fetchPromoWidgetsOrCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityData, apiUrl, baseUrl]);

  // Function to get gradient based on community category
  function getCommunityGradient(category) {
    const gradients = {
      // Hijau tua untuk Shopping
      Shopping: 'bg-gradient-to-br from-green-700 to-green-900',
      Event: 'bg-gradient-to-br from-blue-500 to-blue-700',
      Kuliner: 'bg-gradient-to-br from-orange-500 to-orange-700',
      Otomotif: 'bg-gradient-to-br from-gray-600 to-gray-800',
      Fashion: 'bg-gradient-to-br from-pink-500 to-pink-700',
      Hobi: 'bg-gradient-to-br from-green-500 to-green-700',
      Bisnis: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
      Kesehatan: 'bg-gradient-to-br from-red-500 to-red-700',
      Teknologi: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
      Travel: 'bg-gradient-to-br from-yellow-500 to-yellow-700'
    };
    return gradients[category] || 'bg-gradient-to-br from-red-400 to-red-600';
  }

  if (!isClient || !communityData) {
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

  return (
    <>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
