import {
    faCalendar,
    faClock
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CommunityBottomBar from './CommunityBottomBar';
import Cookies from "js-cookie";
import { token_cookie_name } from "../../../../helpers";
import { Decrypt } from "../../../../helpers/encryption.helpers";

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
                        description: 'Mall perbelanjaan standar dengan beragam toko pakaian, plus tempat makan kasual & bioskop. Terletak di daerah pusat wisata Kota Bandung, hanya beberapa ratus meter dari pintu tol Pasteur',
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
                        description: 'Sunscape Event Organizer adalah penyelenggara acara profesional yang berfokus pada event-event berkualitas tinggi',
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
                        description: 'Komunitas pecinta kuliner area Bandung Selatan dan sekitarnya. Berbagi rekomendasi tempat makan enak dan murah',
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
                        description: 'Komunitas penggemar otomotif, modifikasi, dan spare part. Sharing tips perawatan kendaraan',
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
                        description: 'Komunitas fashion, style, dan shopping outfit terkini. Berbagi tips berpakaian dan trend fashion',
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

    useEffect(() => {
        if (communityData) {
            // Generate events based on community type
            const getEventsForCommunity = (community) => [
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
                },
                {
                    id: 4,
                    title: `Grand Opening Celebration - ${community.name}`,
                    category: community.name,
                    image: '/images/event/grand-opening.jpg',
                    date: '18 Agustus 2025',
                    time: '16:00 - 21:00',
                    location: community.location,
                    participants: 200
                },
                {
                    id: 5,
                    title: 'Music Festival 2025',
                    category: community.name,
                    image: '/images/event/music-festival.jpg',
                    date: '22 Agustus 2025',
                    time: '18:00 - 24:00',
                    location: community.location,
                    participants: 1000
                },
                {
                    id: 6,
                    title: `Festival Kuliner ${community.location}`,
                    category: community.name,
                    image: '/images/event/kuliner-festival.jpg',
                    date: '22 Agustus 2025',
                    time: '17:00 - 23:00',
                    location: community.location,
                    participants: 150
                },
                {
                    id: 7,
                    title: `Car Meet Up ${community.name}`,
                    category: community.name,
                    image: '/images/event/car-meetup.jpg',
                    date: '25 Agustus 2025',
                    time: '08:00 - 12:00',
                    location: community.location,
                    participants: 80
                },
                {
                    id: 8,
                    title: `Fashion Week ${community.location}`,
                    category: community.name,
                    image: '/images/event/fashion-week.jpg',
                    date: '28 Agustus 2025',
                    time: '19:00 - 22:00',
                    location: community.location,
                    participants: 300
                }
            ];
            setUpcomingEvents(getEventsForCommunity(communityData));
        }
    }, [communityData]);

    // Promo Categories Data - dynamic based on community
    const [promoCategories, setPromoCategories] = useState([]);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const baseUrl = apiUrl.replace(/\/api$/, ''); // remove trailing /api for images

    // Add back generatePromos used as a final fallback
    const generatePromos = (community) => {
        const promosByCategory = {
            'Shopping': [
                {
                    id: 1,
                    title: 'Fast Food Promo',
                    subtitle: 'Nikmati Burger & Chicken Terbaik!',
                    promos: [
                        {
                            id: 1,
                            title: "McDonald's - Burger Combo Flash Sale",
                            image: '/images/promo/burger-combo-flash.jpg',
                            label: 'Flash Sale',
                            discount: '30%',
                            description: 'Paket burger kombo dengan kentang dan minuman'
                        },
                        {
                            id: 2,
                            title: 'Chicken Star - Paket Ayam Special',
                            image: '/images/promo/chicken-package.jpg',
                            label: 'Special Deal',
                            discount: '25%',
                            description: 'Ayam crispy dengan nasi dan saus pilihan'
                        },
                        {
                            id: 3,
                            title: 'Premium Beef Sausage Package',
                            image: '/images/promo/beef-sausage-chicken.jpg',
                            label: 'Premium',
                            discount: '20%',
                            description: 'Sosis beef premium dengan ayam panggang'
                        }
                    ]
                },
                {
                    id: 2,
                    title: 'Pizza & Coffee',
                    subtitle: 'Promo Pizza dan Minuman Favorit!',
                    promos: [
                        {
                            id: 4,
                            title: 'Pizza Hut - Medium Pizza Deal',
                            image: '/images/promo/pizza-medium-deal.jpg',
                            label: 'Pizza Deal',
                            discount: '35%',
                            description: 'Pizza medium dengan topping pilihan dan minuman'
                        },
                        {
                            id: 5,
                            title: 'Brown Sugar Coffee Special',
                            image: '/images/promo/brown-sugar-coffee.jpg',
                            label: 'Coffee Promo',
                            discount: '15%',
                            description: 'Kopi brown sugar dengan topping premium'
                        }
                    ]
                }
            ],
            'Event': [
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
                            description: 'Paket bubble tea untuk acara corporate dan private'
                        },
                        {
                            id: 2,
                            title: 'Corporate Lunch Package',
                            image: '/images/promo/burger-combo-flash.jpg',
                            label: 'Corporate',
                            discount: '20%',
                            description: 'Paket makan siang untuk meeting dan seminar'
                        },
                        {
                            id: 3,
                            title: 'Premium Coffee Catering',
                            image: '/images/promo/brown-sugar-coffee.jpg',
                            label: 'Catering',
                            discount: '30%',
                            description: 'Layanan kopi premium untuk event khusus'
                        }
                    ]
                }
            ],
            'Kuliner': [
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
                            description: 'Ayam crispy dengan bumbu rahasia dan nasi hangat'
                        },
                        {
                            id: 2,
                            title: 'Bubble Tea House - Minuman Segar',
                            image: '/images/promo/bubble-tea-discount.jpg',
                            label: 'Drink Promo',
                            discount: '15%',
                            description: 'Bubble tea dengan berbagai rasa dan topping'
                        },
                        {
                            id: 3,
                            title: 'Pizza Hut - Pizza Family',
                            image: '/images/promo/pizza-medium-deal.jpg',
                            label: 'Family Deal',
                            discount: '30%',
                            description: 'Pizza besar dengan topping lengkap untuk keluarga'
                        },
                        {
                            id: 4,
                            title: 'Premium Coffee Experience',
                            image: '/images/promo/brown-sugar-coffee.jpg',
                            label: 'Premium',
                            discount: '10%',
                            description: 'Kopi berkualitas tinggi dengan cita rasa otentik'
                        }
                    ]
                }
            ],
            'Otomotif': [
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
                            description: 'Paket service lengkap untuk motor kesayangan'
                        },
                        {
                            id: 2,
                            title: 'Oil Change Premium Package',
                            image: '/images/promo/beef-sausage-chicken.jpg',
                            label: 'Maintenance',
                            discount: '20%',
                            description: 'Ganti oli premium dengan filter berkualitas'
                        }
                    ]
                }
            ],
            'Fashion': [
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
                            description: 'Koleksi pakaian musim panas terbaru dan trendy'
                        },
                        {
                            id: 2,
                            title: 'Shoes & Accessories Sale',
                            image: '/images/promo/pizza-medium-deal.jpg',
                            label: 'Accessories',
                            discount: '35%',
                            description: 'Sepatu dan aksesoris dengan kualitas premium'
                        },
                        {
                            id: 3,
                            title: 'Casual Wear Collection',
                            image: '/images/promo/brown-sugar-coffee.jpg',
                            label: 'Casual',
                            discount: '25%',
                            description: 'Pakaian kasual untuk gaya hidup aktif'
                        }
                    ]
                }
            ]
        };
        return promosByCategory[community?.category] || [
            {
                id: 1,
                title: 'Promo Komunitas',
                subtitle: 'Promo Eksklusif untuk Member!',
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
        ];
    };

    useEffect(() => {
        if (!communityData) return;

        const normalizePromos = (arr = []) => {
            return (Array.isArray(arr) ? arr : []).map((p) => {
                const raw =
                    p.image_url ||
                    p.image ||
                    (p.image_path ? `${baseUrl}/storage/${p.image_path}` : "/api/placeholder/150/120");

                let image = raw;
                if (typeof image === "string" && image) {
                    const isAbsolute = /^https?:\/\//i.test(image);
                    if (!isAbsolute) {
                        const cleaned = image.replace(/^\/+/, '');

                        if (/^api\/placeholder/i.test(cleaned)) {
                            image = `/${cleaned}`;
                        }
                        else if (/^api\//i.test(cleaned)) {
                            const withoutApi = cleaned.replace(/^api\/+/i, '');
                            if (/^(storage|promos|uploads)/i.test(withoutApi)) {
                                if (withoutApi.startsWith('promos/')) {
                                    image = `${baseUrl}/storage/${withoutApi}`;
                                } else {
                                    image = `${baseUrl}/${withoutApi}`;
                                }
                            } else {
                                image = `/${cleaned}`;
                            }
                        }
                        else if (/^(promos\/|storage\/|uploads\/)/i.test(cleaned)) {
                            if (cleaned.startsWith('promos/')) {
                                image = `${baseUrl}/storage/${cleaned}`;
                            } else {
                                image = `${baseUrl}/${cleaned}`;
                            }
                        }
                        else {
                            image = `/${cleaned}`;
                        }
                    }
                }

                return {
                    id: p.id ?? p.promo_id ?? Math.random(),
                    title: p.title ?? p.name ?? "Promo",
                    image,
                    label: p.label ?? p.tag ?? "Promo",
                    discount:
                        typeof p.discount === "number"
                            ? `${p.discount}%`
                            : p.discount ?? p.discount_text ?? "",
                    description: p.description ?? p.subtitle ?? "",
                };
            });
         };

        const convertCategoriesToWidgets = (cats = []) =>
            cats.map((c) => ({
                id: c.id ?? Math.random(),
                title: c.title ?? c.name ?? "Kategori",
                subtitle: c.description ?? "",
                promos: normalizePromos(c.promos ?? []),
            }));

        const getAuthHeaders = () => {
            try {
                const encryptedToken = Cookies.get(token_cookie_name);
                const token = encryptedToken ? Decrypt(encryptedToken) : "";
                return token
                    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
                    : { "Content-Type": "application/json" };
            } catch (e) {
                return { "Content-Type": "application/json" };
            }
        };

        const fetchPromoWidgetsOrCategories = async () => {
            // 1) Coba categories dulu
            try {
                const res = await fetch(`${apiUrl}/communities/${communityData.id}/categories`, {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const json = await res.json().catch(() => ({}));
                    const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
                    if (Array.isArray(data) && data.length > 0) {
                        setPromoCategories(convertCategoriesToWidgets(data));
                        return;
                    }
                } else {
                    //                  console.log('categories status', res.status);
                }
            } catch (err) {
                // ignore and fallback
            }

            // 2) Jika tidak ada kategori, baru promos
            try {
                const res = await fetch(`${apiUrl}/communities/${communityData.id}/promos`, {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const json = await res.json().catch(() => ({}));
                    const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
                    if (Array.isArray(data) && data.length > 0) {
                        setPromoCategories([{
                            id: `assigned-${communityData.id}`,
                            title: 'Promo Komunitas',
                            subtitle: `${communityData.name} - Promo Tersedia`,
                            promos: normalizePromos(data)
                        }]);
                        return;
                    }
                } else {
                    // console.log('promos status', res.status);
                }
            } catch (err) {
                // ignore and fallback
            }

            // 3) Fallback demo
            setPromoCategories(generatePromos(communityData));
        };

        fetchPromoWidgetsOrCategories();
    }, [communityData, apiUrl]);

    // Function to get gradient based on community category
    function getCommunityGradient(category) {
        const gradients = {
            // Hijau tua untuk Shopping
            'Shopping': 'bg-gradient-to-br from-green-700 to-green-900',
            'Event': 'bg-gradient-to-br from-blue-500 to-blue-700',
            'Kuliner': 'bg-gradient-to-br from-orange-500 to-orange-700',
            'Otomotif': 'bg-gradient-to-br from-gray-600 to-gray-800',
            'Fashion': 'bg-gradient-to-br from-pink-500 to-pink-700',
            'Hobi': 'bg-gradient-to-br from-green-500 to-green-700',
            'Bisnis': 'bg-gradient-to-br from-indigo-500 to-indigo-700',
            'Kesehatan': 'bg-gradient-to-br from-red-500 to-red-700',
            'Teknologi': 'bg-gradient-to-br from-cyan-500 to-cyan-700',
            'Travel': 'bg-gradient-to-br from-yellow-500 to-yellow-700'
        };
        return gradients[category] || 'bg-gradient-to-br from-red-400 to-red-600';
    };

    if (!isClient || !communityData) {
        return (
            <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
                <div className="container mx-auto relative z-10 pb-28">
                    <div className="w-full bg-primary h-32 flex items-center justify-center rounded-b-[40px] shadow-neuro">
                        <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                            <p className="mt-2 text-sm drop-shadow-neuro">Loading komunitas...</p>
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
                                {/* Header Banner */}
            <div className={`w-full relative overflow-hidden ${getCommunityGradient(communityData.category)} rounded-b-[40px] shadow-neuro`}>
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
                                    Selamat Datang Di Komunitas<br />
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
                                        <h2 className="text-lg font-bold text-slate-900">Upcoming Event</h2>
                                        <p className="text-sm text-slate-600">Upcoming Event</p>
                                    </div>
                                </div>
                                
                                {/* Horizontal Scroll Container for Events */}
                                <div className="overflow-x-auto scrollbar-hide">
                                    <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                                        {upcomingEvents.map((event) => (
                                            <div 
                                                key={event.id} 
                                                onClick={() => router.push(`/app/komunitas/event/${event.id}`)}
                                                className="relative rounded-2xl overflow-hidden shadow-neuro hover:scale-[1.01] transition-all duration-300 flex-shrink-0 cursor-pointer" 
                                                style={{ width: '280px' }}
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
                                                    
                                                    {/* View More Button - Kanan Atas */}
                                                    <button className="absolute top-3 right-3 bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold border border-white border-opacity-30 shadow-neuro-in">
                                                        view more
                                                    </button>
                                                    
                                                    {/* Event Info - Bagian Bawah */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                                        <h3 className="text-lg font-bold mb-2 tracking-wider drop-shadow-lg">
                                                            UPCOMING
                                                        </h3>
                                                        <h4 className="text-lg font-bold mb-3 leading-tight drop-shadow-lg line-clamp-2">
                                                            {event.title}
                                                        </h4>
                                                        <div className="flex items-center gap-4 text-sm text-white text-opacity-90">
                                                            <div className="flex items-center gap-1">
                                                                <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                                                                <span className="drop-shadow-lg">{event.date}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <FontAwesomeIcon icon={faClock} className="text-xs" />
                                                                <span className="drop-shadow-lg">{event.time}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Promo Categories */}
                            {promoCategories.map((category) => (
                                <div key={category.id} className="mb-6">
                                    <div className="bg-primary rounded-t-2xl p-4 text-white shadow-neuro">
                                        <h3 className="text-lg font-bold drop-shadow-neuro">{category.title}</h3>
                                        <p className="text-white text-opacity-90 text-sm drop-shadow-neuro">{category.subtitle}</p>
                                    </div>

                                    <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-b-2xl p-4 shadow-neuro">
                                        {Array.isArray(category.promos) && category.promos.length > 0 ? (
                                            <div className="overflow-x-auto scrollbar-hide">
                                                <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                                                    {category.promos.map((promo) => (
                                                        <div 
                                                            key={promo.id} 
                                                            onClick={() =>
                                                                router.push({        pathname: `/app/komunitas/promo/${promo.id}`,
                                                                        query: { communityId: communityData.id }
                                                                    })
                                                                }
                                                            className="bg-white rounded-xl overflow-hidden shadow-neuro-in hover:scale-[1.02] transition-all duration-300 flex-shrink-0 cursor-pointer" 
                                                            style={{ width: '180px' }}
                                                        >
                                                            <div className="relative h-36 overflow-hidden">
                                                                <Image 
                                                                    src={promo.image || '/api/placeholder/180/130'}
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

                <CommunityBottomBar active={'community'} communityId={communityData.id} />
            </div>
        </>
    );
}
